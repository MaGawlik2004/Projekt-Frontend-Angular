from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

client = AsyncIOMotorClient(os.getenv("MONGO_DETAILS"))
database = client.medical_app

user_collection = database.get_collection("users")
appointment_collection = database.get_collection("appointments")
medical_history_collection = database.get_collection("medical_histories")

async def init_db():
    await user_collection.create_index("email", unique=True)
    await appointment_collection.create_index([("doctor_id", 1), ("start_time", 1)])