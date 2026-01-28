import bcrypt
from datetime import datetime, timedelta
from jose import jwt
import os
from dotenv import load_dotenv

load_dotenv()

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_byte_enc = plain_password.encode('utf-8')
        hashed_password_enc = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_byte_enc, hashed_password_enc)
    except Exception:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
    to_encode.update({"exp": expire})
    
    return jwt.encode(
        to_encode, 
        os.getenv("SECRET_KEY"), 
        algorithm=os.getenv("ALGORITHM")
    )