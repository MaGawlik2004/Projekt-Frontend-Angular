from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from typing import List
from datetime import datetime, timedelta
from ..models.user_model import UserModel
from ..database import appointment_collection, user_collection
from ..auth.deps import get_current_user
from ..models.appointment_model import BulkScheduleCreate, AppointmentUpdate
from ..schemas.user_dto import UserCreate, UserOut, DoctorUpdate
from ..auth.security import hash_password
from ..models.auth_model import AdminPasswordReset

router = APIRouter()

def clean_mongo_doc(doc):
    if not doc: return doc
    new_doc = doc.copy()
    if "_id" in new_doc:
        new_doc["id"] = str(new_doc["_id"])
        del new_doc["_id"]
    for key, value in new_doc.items():
        if isinstance(value, ObjectId):
            new_doc[key] = str(value)
    return new_doc

@router.get("/all-doctors-full", response_model=List[UserModel])
async def get_all_doctors_full(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Brak uprawnień administratora")
    
    doctors_cursor = user_collection.find({"role": "doctor"})
    doctors = await doctors_cursor.to_list(length=100)
    return doctors

@router.post("/generate-bulk-schedule")
async def generate_bulk_schedule(data: BulkScheduleCreate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Tylko administrator może generować grafik")

    doctor = await user_collection.find_one({"_id": ObjectId(data.doctor_id), "role": "doctor"})
    if not doctor:
        raise HTTPException(status_code=404, detail="Nie znaleziono lekarza o podanym ID")
    
    doctor_oid = ObjectId(data.doctor_id)

    gen_start = data.start_time.replace(tzinfo=None)
    gen_end = data.end_time.replace(tzinfo=None)

    formatted_breaks = [
        {"start": b.start.replace(tzinfo=None), "end": b.end.replace(tzinfo=None)}
        for b in data.breaks
    ]

    existing_appointments = await appointment_collection.find({
        "doctor_id": doctor_oid,
        "start_time": {"$lt": gen_end},
        "end_time": {"$gt": gen_start}
    }).to_list(None)

    new_slots = []
    current_slot_start = gen_start

    while current_slot_start + timedelta(minutes=data.interval_minutes) <= gen_end:
        slot_end = current_slot_start + timedelta(minutes=data.interval_minutes)

        is_during_break = any(
            current_slot_start < b["end"] and slot_end > b["start"]
            for b in formatted_breaks
        )

        has_collision = any(
            appt["start_time"].replace(tzinfo=None) < slot_end and 
            appt["end_time"].replace(tzinfo=None) > current_slot_start
            for appt in existing_appointments
        )

        if not is_during_break and not has_collision:
            new_slots.append({
                "doctor_id": doctor_oid,
                "start_time": current_slot_start,
                "end_time": slot_end,
                "status": "available",
                "patient_id": None,
                "created_at": datetime.utcnow()
            })
        
        current_slot_start = slot_end
    
    if not new_slots:
        raise HTTPException(status_code=400, detail="Nie wygenerowano nowych slotów. Wszytskie terminy kolidują z przerwami lub istniejącym grafikiem")
    
    result = await appointment_collection.insert_many(new_slots)

    return {
        "message": f"Wygenerowano {len(result.inserted_ids)} slotów dla {doctor['full_name']}",
        "count": len(result.inserted_ids)
    }
    
@router.patch("/appointment/{appointment_id}")
async def update_appointment(appointment_id: str, update_data: AppointmentUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Brak uprawnień admina")

    if not ObjectId.is_valid(appointment_id):
        raise HTTPException(status_code=400, detail="Niepoprawny format ID wizyty")
    
    current_appt = await appointment_collection.find_one({"_id": ObjectId(appointment_id)})
    if not current_appt:
        raise HTTPException(status_code=404, detail="Wizyta nie istnieje")

    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}

    new_doctor_id = ObjectId(update_dict["doctor_id"]) if "doctor_id"in update_dict else current_appt["doctor_id"]
    new_start = update_dict["start_time"] if "start_time" in update_dict else current_appt["start_time"]
    new_end = update_dict["end_time"] if "end_time" in update_dict else current_appt["end_time"]
    
    new_start = new_start.replace(tzinfo=None)
    new_end = new_end.replace(tzinfo=None)

    if "doctor_id" in update_dict or "start_time" in update_dict or "end_time" in update_dict:
        collision_query = {
            "_id": {"$ne": ObjectId(appointment_id)},
            "doctor_id": new_doctor_id,
            "start_time": {"$lt": new_end},
            "end_time": {"$gt": new_start}
        }
        
        collision = await appointment_collection.find_one(collision_query)
        if collision:
            raise HTTPException(
                status_code=400, 
                detail=f"Kolizja! Lekarz ma już inną wizytę w tym czasie ({collision['start_time'].strftime('%H:%M')} - {collision['end_time'].strftime('%H:%M')})"
            )
        
    if "doctor_id" in update_dict:
        update_dict["doctor_id"] = new_doctor_id

    updated_result = await appointment_collection.find_one_and_update(
        {"_id": ObjectId(appointment_id)},
        {"$set": update_dict},
        return_document=True
    )
        
    return clean_mongo_doc(updated_result)

@router.delete("/appointment/{appointment_id}")
async def delete_appointment(appointment_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Brak uprawnień admina")
    
    result = await appointment_collection.delete_one({"_id": ObjectId(appointment_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Nie znaleziono wizyty do usunięcia")
    
    return {"message": "Wizyta została pomyślnie usunięta"}

@router.post("/register-doctor", response_model=UserOut)
async def register_doctor(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tylko administrator może rejestrować lekarzy"
        )
    
    existing_user = await user_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Użytkownik o tym emailu już istnieje")
    
    user_dict = user_data.model_dump()
    user_dict["hashed_password"] = hash_password(user_dict.pop("password"))
    user_dict["is_active"] = True
    user_dict["role"] = "doctor"

    new_user = await user_collection.insert_one(user_dict)
    created_user = await user_collection.find_one({"_id": new_user.inserted_id})
    return created_user

@router.get("/doctor/{doctor_id}", response_model=UserModel)
async def get_doctor_by_id(doctor_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień administratora"
        )
    
    try:
        obj_id = ObjectId(doctor_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Nieprawiodłowy format ID")
    
    doctor = await user_collection.find_one({"_id": obj_id, "role": "doctor"})

    if not doctor:
        raise HTTPException(status_code=404, detail="Nie znaleziono lekarza o podanym ID")
    
    return doctor

@router.get("/doctor/{doctor_id}/appointments")
async def get_doctor_schedule_by_id(doctor_id: str):
    try: 
        if not ObjectId.is_valid(doctor_id):
            raise HTTPException(status_code=400, detail="Niepoprawne ID lekarza")

        query = {"doctor_id": ObjectId(doctor_id)}
        schedule = await appointment_collection.find(query).sort("start_time", 1).to_list(1000)
        return [clean_mongo_doc(doc) for doc in schedule]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Błąd podczas pobierania wizyt: {str(e)}")
    
@router.post("/admin-reset-password")
async def admin_reset_password(data: AdminPasswordReset, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tylko administrator może resetować hasła")
    
    if not ObjectId.is_valid(data.user_id):
        raise HTTPException(status_code=400, detail="Niepoprawny format ID użytkownika")
    
    user = await user_collection.find_one({"_id": ObjectId(data.user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Użytkownik nie istnieje")
    
    new_hashed_password = hash_password(data.new_password)

    await user_collection.update_one(
        {"_id": ObjectId(data.user_id)},
        {"$set": {"hashed_password": new_hashed_password}}
    )

    return {"message": f"Hasło dla użytkownika {user['email']} został pomyślnei zmienione"}

@router.patch("/doctor/{doctor_id}/toggle-activity")
async def toggle_doctor_activity(doctor_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Brak uprawnień administratora")
    
    doctor = await user_collection.find_one({"_id": ObjectId(doctor_id)})
    new_status = not doctor.get("is_active", True)
    await user_collection.update_one(
        {"_id": ObjectId(doctor_id)},
        {"$set": {"is_active": new_status}}
    )

    return {"message": "Status zmieniony", "is_active": new_status}

@router.put("/doctor/{doctor_id}")
async def update_doctor(doctor_id: str, update_data: DoctorUpdate, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Brak uprawnień administratora")
    
    if not ObjectId.is_valid(doctor_id):
        raise HTTPException(status_code=400, detail="Niepoprawny format ID")
    
    user_in_db = await user_collection.find_one({"_id": ObjectId(doctor_id)})
    
    if not user_in_db:
        raise HTTPException(status_code=404, detail="Użytkownik o podanym ID nie istnieje")
    
    if user_in_db.get("role") != "doctor":
        raise HTTPException(status_code=400, detail=f"Ten użytkownik nie jest lekarzem (rola: {user_in_db.get('role')})")

    if update_data.email != user_in_db["email"]:
        existing_email = await user_collection.find_one({"email": update_data.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="Ten email jest już zajęty")
        
    await user_collection.update_one(
        {"_id": ObjectId(doctor_id)},
        {"$set": {
            "full_name": update_data.full_name,
            "email": update_data.email
        }}
    )

    return {"message": "Dane lekarza zostały zaktualizowane"}