from pydantic import BaseModel, Field
from .helper import PyObjectId
from datetime import datetime
from typing import Optional, List

class AppointmentModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    doctor_id: PyObjectId
    patient_id: Optional[PyObjectId] = None
    start_time: datetime
    status: str = "available" # available | booked | completed

class AppointmentUpdate(BaseModel):
    doctor_id: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None

class BreakTime(BaseModel):
    start: datetime
    end: datetime

class BulkScheduleCreate(BaseModel):
    doctor_id: str
    start_time: datetime
    end_time: datetime
    interval_minutes: int = Field(15, ge=5, le=120)
    breaks: List[BreakTime] = Field(default_factory=list)
