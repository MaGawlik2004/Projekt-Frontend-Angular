from pydantic import BaseModel, Field
from datetime import datetime
from typing import List
from ..models.helper import PyObjectId

class MedicalHistoryCreate(BaseModel):
    patient_id: PyObjectId
    appointment_id: PyObjectId
    diagnosis: str = Field(..., min_length=3)
    
    recommendations: List[str] = Field(default_factory=list)
    
    treatment_notes: str

class MedicalHistoryOut(BaseModel):
    id: PyObjectId = Field(alias="_id")
    patient_id: PyObjectId
    doctor_id: PyObjectId
    diagnosis: str
    recommendations: List[str]
    treatment_notes: str
    date: datetime

    class Config:
        json_encoders = {PyObjectId: str}
        populate_by_name = True