from pydantic import BaseModel, Field
from .helper import PyObjectId
from datetime import datetime

class MedicalHistoryModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    patient_id: PyObjectId
    doctor_id: PyObjectId
    diagnosis: str
    treatment_notes: str
    date: datetime = Field(default_factory=datetime.utcnow)