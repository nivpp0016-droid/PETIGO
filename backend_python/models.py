from typing import Optional, List
from pydantic import BaseModel, Field

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class CreateBoxRequest(BaseModel):
    boxCode: str

class GenerateOtpRequest(BaseModel):
    boxId: int

class VerifyOtpRequest(BaseModel):
    otp: str
    boxId: Optional[int] = None
    boxCode: Optional[str] = None

class DeviceStatusRequest(BaseModel):
    doorStatus: str
    lockStatus: str
    parcelStatus: str
