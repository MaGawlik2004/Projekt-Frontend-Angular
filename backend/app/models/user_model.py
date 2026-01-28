from pydantic import BaseModel, Field
from .helper import PyObjectId

class UserModel(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: str
    hashed_password: str
    role: str # user | doctor | admin
    full_name: str
    is_active: bool = True