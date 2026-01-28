import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, status, Depends, Body
from fastapi.security import OAuth2PasswordRequestForm
from ..database import user_collection
from ..schemas.user_dto import UserCreate, UserOut
from ..auth.security import hash_password, verify_password, create_access_token

router = APIRouter()
load_dotenv()

@router.post("/register", response_model=UserOut)
async def register(user_data: UserCreate):
    existing_user = await user_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Użytkownik o tym emailu już istnieje")
    
    user_dict = user_data.model_dump()
    user_dict["hashed_password"] = hash_password(user_dict.pop("password"))
    user_dict["is_active"] = True
    user_dict["role"] = "patient"

    new_user = await user_collection.insert_one(user_dict)

    created_user = await user_collection.find_one({"_id": new_user.inserted_id})
    return created_user

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await user_collection.find_one({"email": form_data.username})

    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Niepoprawny email lub hasło"
        )
    
    is_active_status = user.get("is_active", True)
    
    token = create_access_token(data={
        "sub": str(user["_id"]),
        "role": user["role"],
        "is_active": is_active_status
    })

    return {
        "access_token": token, 
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }

@router.post("/setup-admin-secret", response_model=UserOut, include_in_schema=False)
async def setup_admin_secret(user_data: UserCreate, x_admin_key: str = Body(...)):
    if x_admin_key != os.getenv("ADMIN_KEY", "moje-tajne-haslo-123"):
        raise HTTPException(status_code=403, detail="Niepoprawny klucz instalacyjny")

    existing_user = await user_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Admin o tym emailu już istnieje")

    user_dict = user_data.model_dump()
    user_dict["hashed_password"] = hash_password(user_dict.pop("password"))
    user_dict["is_active"] = True
    user_dict["role"] = "admin"  

    new_user = await user_collection.insert_one(user_dict)
    return await user_collection.find_one({"_id": new_user.inserted_id})