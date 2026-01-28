from pydantic import BaseModel, EmailStr, Field, field_validator
from ..models.helper import PyObjectId

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=3)
    role: str = "patient"

    @field_validator("password")
    def password_must_have_number(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError("Hasło musi zawierać co najmniej jedną cyfrę")
        return v
    
class UserOut(BaseModel):
    id: PyObjectId = Field(alias="_id")
    email: EmailStr
    full_name: str
    role: str
    is_active: bool

    class Config:
        json_encoders = {PyObjectId: str}
        populate_by_name = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class DoctorUpdate(BaseModel):
    full_name: str
    email: EmailStr