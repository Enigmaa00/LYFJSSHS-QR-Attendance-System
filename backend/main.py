from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://lyfjsshs-qr-attendance-system.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "QR Attendance System API is running"}

class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class ScanRequest(BaseModel):
    qrcode: str

class Student(BaseModel):
    qrcode: str
    name: str
    grade: str
    parent: str = "--"

class Parent(BaseModel):
    parent_name: str
    student_name: str
    contact: str
    email: str = "--"

class Message(BaseModel):
    recipient: str
    message: str

class Settings(BaseModel):
    school_name: str
    academic_year: str
    auto_sms_notify: bool

members_db = [
    {"id": 1, "name": "Admin User", "email": "admin@school.edu", "password": "admin123", "role": "Administrator"}
]

students_db = []
parents_db = []
messages_db = []
attendance_logs = []

system_settings = {
    "school_name": "Luis Y. Ferrer South Senior High School",
    "academic_year": "2025-2026",
    "auto_sms_notify": True
}

@app.post("/api/auth/signup")
def signup(payload: SignupRequest):
    if any(m["email"] == payload.email for m in members_db):
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    new_member = {
        "id": len(members_db) + 1,
        "name": payload.name,
        "email": payload.email,
        "password": payload.password,
        "role": "Administrator"
    }
    members_db.append(new_member)
    return {"success": True, "email": new_member["email"]}

@app.post("/api/auth/login")
def login(payload: LoginRequest):
    member = next((m for m in members_db if m["email"] == payload.email and m["password"] == payload.password), None)
    if member:
        return {"success": True, "token": "mock-jwt-token-12345", "email": member["email"]}
    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.get("/api/attendance/logs")
def get_logs():
    return attendance_logs

@app.post("/api/attendance/scan")
def scan_qrcode(payload: ScanRequest):
    today = datetime.now().strftime("%Y-%m-%d")
    current_time = datetime.now().strftime("%I:%M %p")
    
    existing = next((l for l in attendance_logs if l["qrcode"] == payload.qrcode and l["log_date"] == today), None)
    
    if existing:
        if existing["departure_time"] == "--":
            existing["departure_time"] = current_time
            existing["departure_status"] = "Departed"
            return {"qrcode": payload.qrcode, "departure_status": "Departed"}
        else:
            return {"qrcode": payload.qrcode, "departure_status": "Already Completed"}
    else:
        new_log = {
            "id": len(attendance_logs) + 1,
            "qrcode": payload.qrcode,
            "log_date": today,
            "arrival_time": current_time,
            "arrival_status": "On-Time",
            "departure_time": "--",
            "departure_status": "--"
        }
        attendance_logs.append(new_log)
        return {"qrcode": payload.qrcode, "departure_status": "--"}

@app.delete("/api/attendance/logs/clear")
def clear_logs():
    attendance_logs.clear()
    return {"success": True}

@app.get("/api/attendance/ratio")
def get_attendance_ratio():
    total_entries = len(attendance_logs)
    total_exits = sum(1 for l in attendance_logs if l["departure_status"] != "--")
    currently_on_campus = total_entries - total_exits
    
    on_campus_percentage = round((currently_on_campus / total_entries) * 100) if total_entries > 0 else 0
    departed_percentage = round((total_exits / total_entries) * 100) if total_entries > 0 else 0
    
    return {
        "total_entries": total_entries,
        "total_exits": total_exits,
        "currently_on_campus": currently_on_campus,
        "on_campus_percentage": on_campus_percentage,
        "departed_percentage": departed_percentage
    }

@app.get("/api/students")
def get_students():
    return students_db

@app.post("/api/students")
def add_student(payload: Student):
    new_s = payload.dict()
    new_s["id"] = len(students_db) + 1
    students_db.append(new_s)
    return {"success": True}

@app.delete("/api/students/clear")
def clear_students():
    students_db.clear()
    return {"success": True}

@app.get("/api/parents")
def get_parents():
    return parents_db

@app.post("/api/parents")
def add_parent(payload: Parent):
    new_p = payload.dict()
    new_p["id"] = len(parents_db) + 1
    parents_db.append(new_p)
    return {"success": True}

@app.delete("/api/parents/clear")
def clear_parents():
    parents_db.clear()
    return {"success": True}

@app.get("/api/messages")
def get_messages():
    return messages_db

@app.post("/api/messages")
def send_message(payload: Message):
    new_m = {
        "id": len(messages_db) + 1,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "recipient": payload.recipient,
        "message": payload.message
    }
    messages_db.append(new_m)
    return {"success": True}

@app.get("/api/members")
def get_members():
    return members_db

@app.get("/api/settings")
def get_settings():
    return system_settings

@app.put("/api/settings")
def update_settings(payload: Settings):
    global system_settings
    system_settings = payload.dict()
    return {"success": True}