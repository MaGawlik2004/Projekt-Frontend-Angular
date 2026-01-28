from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from datetime import datetime
from ..database import appointment_collection, medical_history_collection, user_collection
from ..schemas.appointment_dto import AppointmentCreate, AppointmentOut
from ..schemas.medical_history_dto import MedicalHistoryCreate, MedicalHistoryOut
from ..auth.deps import get_current_user

router = APIRouter()

def clean_mongo_doc(doc):
    if not doc:
        return doc
    new_doc = doc.copy()
    if "_id" in new_doc:
        new_doc["id"] = str(new_doc["_id"])
    for key, value in new_doc.items():
        if isinstance(value, ObjectId):
            new_doc[key] = str(value)
        elif isinstance(value, dict):
            new_doc[key] = clean_mongo_doc(value)
    return new_doc

@router.get("/my-schedule")
async def get_doctor_schedule(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Brak dostępu")
    
    query = {"doctor_id": ObjectId(current_user["_id"])}
    schedule = await appointment_collection.find(query).sort("start_time", 1).to_list(500)
    return [clean_mongo_doc(doc) for doc in schedule]

@router.get("/patient-history/{patient_id}")
async def get_patient_history(patient_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Tylko lekarz może przeglądac historię pacjentów")
    
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=400, detail="Niepoprane ID pacjenta")
    
    history = await medical_history_collection.find({"patient_id": patient_id}).sort("date", -1).to_list(100)

    return [clean_mongo_doc(doc) for doc in history]

@router.post("/add-history", response_model=MedicalHistoryOut)
async def add_medical_history(
    data: MedicalHistoryCreate,
    current_user: dict = Depends(get_current_user)
): 
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Tylko lekarz może dodwać wpisy")
    
    appointment = await appointment_collection.find_one({"_id": ObjectId(data.appointment_id)})
    if not appointment or str(appointment["doctor_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=404, detail="Wizyta nie znaleziona lub nie należy do Ciebie")

    history_doc = data.model_dump()
    history_doc["doctor_id"] = ObjectId(current_user["_id"])
    history_doc["date"] = datetime.utcnow()

    new_history = await medical_history_collection.insert_one(history_doc)
    saved_history = await medical_history_collection.find_one({"_id": new_history.inserted_id})
    await appointment_collection.update_one(
        {"_id": ObjectId(data.appointment_id)},
        {"$set": {"status": "completed"}}
    )

    return clean_mongo_doc(saved_history)

@router.get("/appointment-detail/{appointment_id}")
async def get_appointment_detail(appointment_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "doctor":
        raise HTTPException(status_code=403, detail="Brak uprawnień")
    
    appt = await appointment_collection.find_one({"_id": ObjectId(appointment_id)})
    if not appt:
        raise HTTPException(status_code=404, detail="Nie znaleziono wizyty")
    
    patient = await user_collection.find_one({"_id": appt["patient_id"]})

    result = clean_mongo_doc(appt)
    if patient:
        result["patient_data"] = {
            "full_name": patient.get("full_name"),
            "email": patient.get("email")
        }

    return result