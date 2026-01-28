from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import init_db
from .routes import auth, appointments, doctors, users, admin

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:4200'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.on_event("startup")
async def startup_enevt():
    print("Inicjalizacja połączenia z MongoDB ...")
    await init_db()
    print("Baza danych gotowa")

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

app.include_router(
    appointments.router,
    prefix="/appointment",
    tags=["Appointments"]
)

app.include_router(
    doctors.router,
    prefix="/doctor",
    tags=["Doctors"]
)

app.include_router(
    users.router,
    prefix="/user",
    tags=["Users"]
)

app.include_router(
    admin.router,
    prefix="/admin",
    tags=["Admin"]
)

@app.get("/")
def read_root():
    return {"message": "System reerwacji wizyt - API działa!"}