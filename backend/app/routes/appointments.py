from fastapi import APIRouter
from typing import List
from ..database import appointment_collection
from ..schemas.appointment_dto import AppointmentOut

router = APIRouter()

@router.get("/available", response_model=List[AppointmentOut])
async def get_available_appointments():
    cursor = appointment_collection.find({}).sort("start_time", 1)
    return await cursor.to_list(length=100)