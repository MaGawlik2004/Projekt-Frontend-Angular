from pydantic import BaseModel, EmailStr , Field

class AdminPasswordReset(BaseModel):
    user_id: str
    new_password: str = Field(..., min_length=8)