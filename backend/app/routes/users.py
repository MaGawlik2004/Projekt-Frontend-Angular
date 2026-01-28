from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timedelta
from ..database import appointment_collection, medical_history_collection, user_collection
from ..schemas.user_dto import UserOut
from ..schemas.appointment_dto import AppointmentOut, AppointmentDetails
from ..schemas.medical_history_dto import MedicalHistoryOut
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

@router.get("/doctors", response_model=List[UserOut])
async def get_all_doctors():
    doctors = await user_collection.find({"role": "doctor", "is_active": True}).to_list(100)
    return doctors

@router.get("/my-appointments")
async def get_my_appointments(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "patient":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Ten endpoint jest przeznaczony wyłącznie dla pacjentów")
    query = {"patient_id": ObjectId(current_user["_id"])}
    appointments = await appointment_collection.find(query).sort("start_time", -1).to_list(100)

    results = []
    for appt in appointments:
        appt_data = clean_mongo_doc(appt)

        history = await medical_history_collection.find_one({"appointment_id": str(appt["_id"])})
        if history:
            appt_data["medical_history"] = clean_mongo_doc(history)
        else:
            appt_data["medical_history"] = None
        
        results.append(appt_data)
    
    return results

@router.patch("/cancel-appointment/{appointment_id}")
async def cancel_appointment(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    appt = await appointment_collection.find_one({"_id": ObjectId(appointment_id)})
    
    if not appt:
        raise HTTPException(status_code=404, detail="Nie znaleziono wizyty")
    
    if str(appt.get("patient_id")) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="To nie jest Twoja wizyta")
    
    now = datetime.utcnow()
    appointment_time = appt["start_time"]

    if appointment_time < now + timedelta(days=1):
        raise HTTPException(status_code=400, detail="Wizytę można odwołać najpóźniej na 24 godziny przed jej rozpoczęciem")
    
    await appointment_collection.update_one(
        {"_id": ObjectId(appointment_id)},
        {
            "$set": {
                "status": "available",
                "patient_id": None,
                "details": None
            }
        }
    )

    return {"message": "Wizyta została pomyślnie odwołana"}

@router.patch("/book/{appointment_id}", response_model=AppointmentOut)
async def book_visit(appointment_id: str, details: AppointmentDetails, current_user: dict = Depends(get_current_user)): 
    if current_user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Tylko pacjent może rezerwować wizyty")
    
    update_data = {
        "patient_id": ObjectId(current_user["_id"]),
        "status": "booked",
        "details": details.model_dump()
    }

    updated = await appointment_collection.find_one_and_update(
        {"_id": ObjectId(appointment_id), "status": "available"},
        {"$set": update_data},
        return_document=True
    )

    if not updated:
        raise HTTPException(status_code=400, detail="Wizyta już zajęta lub nie istnieje")
    return updated

@router.get("/my-medical-history", response_model=List[MedicalHistoryOut])
async def get_my_full_medical_history(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "patient":
        raise HTTPException(status_code=403, detail="Tylko pacjent może rezerwować wizyty")
    
    history = await medical_history_collection.find(
        {"patient_id": str(current_user.get("_id"))}
    ).sort("date", -1).to_list(100)

    return [clean_mongo_doc(doc) for doc in history]

