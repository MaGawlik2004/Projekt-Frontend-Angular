from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from ..models.helper import PyObjectId

class AppointmentDetails(BaseModel):
    reason_for_visit: str = Field(..., min_length=5)
    previous_treatment: bool = False
    additional_notes: Optional[str] = None

class AppointmentCreate(BaseModel):
    doctor_id: PyObjectId
    start_time: datetime
    details: AppointmentDetails

class AppointmentOut(BaseModel):
    id: PyObjectId = Field(alias="_id")
    doctor_id: PyObjectId
    patient_id: Optional[PyObjectId] = None
    start_time: datetime
    status: str
    details: Optional[AppointmentDetails] = None

    class Config:
        json_encoders = {PyObjectId: str}
        populate_by_name = True