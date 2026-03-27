# Initializing the endpoints for my API using FastAPI. It will be fetching from the database initialized in database.sqlite3 and will be used to display the data on the frontend.
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import sqlite3
import os
from typing import List, Optional
from pathlib import Path
import time
import hmac
import hashlib
import base64

app = FastAPI()

# Resolve file paths relative to this module so running uvicorn from
# different working directories doesn't break static mounts or create
# multiple database.sqlite3 files.
BASE_DIR = Path(__file__).resolve().parent  # .../src
DB_PATH = BASE_DIR / "database.sqlite3"
SQL_PATH = BASE_DIR / "database.sql"
SCRIPTS_DIR = BASE_DIR / "scripts"
CSS_DIR = BASE_DIR / "css"
HTML_DIR = BASE_DIR / "hmtl"

# Registration verification (simple signed token)
REGISTRATION_PASSWORD = os.environ.get("REGISTRATION_PASSWORD", "I-Miti2024Verify")
REGISTRATION_TOKEN_TTL_SECONDS = int(os.environ.get("REGISTRATION_TOKEN_TTL_SECONDS", "900"))  # 15 minutes
REGISTRATION_TOKEN_SECRET = os.environ.get("REGISTRATION_TOKEN_SECRET", "dev-only-change-me")

def _issue_registration_token() -> str:
    ts = str(int(time.time()))
    sig = hmac.new(
        REGISTRATION_TOKEN_SECRET.encode("utf-8"),
        ts.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    raw = f"{ts}.{sig}".encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8")

def _verify_registration_token(token: str) -> bool:
    try:
        raw = base64.urlsafe_b64decode(token.encode("utf-8")).decode("utf-8")
        ts, sig = raw.split(".", 1)
        ts_int = int(ts)
        if int(time.time()) - ts_int > REGISTRATION_TOKEN_TTL_SECONDS:
            return False
        expected = hmac.new(
            REGISTRATION_TOKEN_SECRET.encode("utf-8"),
            ts.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, sig)
    except Exception:
        return False

# CORS (allow frontend to call the API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False, timeout=30)
    conn.row_factory = sqlite3.Row
    return conn

# Initialize database if not exists
def init_db():
    if not DB_PATH.exists():
        conn = sqlite3.connect(str(DB_PATH), check_same_thread=False, timeout=30)
        with open(SQL_PATH, "r", encoding="utf-8") as f:
            sql = f.read()
        conn.executescript(sql)
        conn.commit()
        conn.close()

# Call init_db on startup
init_db()

# Pydantic models
class Medicine(BaseModel):
    medicineID: Optional[int] = None
    name: str
    category: Optional[str] = None
    price: float

class Pharmacy(BaseModel):
    pharmacyID: Optional[int] = None
    name: str
    address: Optional[str] = None
    number: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Pharmacist(BaseModel):
    workerID: Optional[int] = None
    pharmacyID: int
    username: str
    password: str
    licenceID: Optional[str] = None

class Inventory(BaseModel):
    inventoryID: Optional[int] = None
    pharmacyID: int
    medicineID: int
    status: str

# Medicine endpoints
@app.get("/medicines", response_model=List[Medicine])
def get_medicines():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT medicineID, name, category, price FROM Medicine")
    rows = cursor.fetchall()
    conn.close()
    return [
        Medicine(
            medicineID=row['medicineID'],
            name=row['name'],
            category=row['category'],
            price=row['price'],
        )
        for row in rows
    ]

@app.get("/medicines/{medicine_id}", response_model=Medicine)
def get_medicine(medicine_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT medicineID, name, category, price FROM Medicine WHERE medicineID = ?", (medicine_id,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return Medicine(
        medicineID=row['medicineID'],
        name=row['name'],
        category=row['category'],
        price=row['price'],
    )

@app.post("/medicines", response_model=Medicine)
def create_medicine(medicine: Medicine):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO Medicine (name, category, price) VALUES (?, ?, ?)",
        (medicine.name, medicine.category, medicine.price),
    )
    medicine_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return Medicine(
        medicineID=medicine_id,
        name=medicine.name,
        category=medicine.category,
        price=medicine.price,
    )

@app.put("/medicines/{medicine_id}", response_model=Medicine)
def update_medicine(medicine_id: int, medicine: Medicine):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE Medicine SET name = ?, category = ?, price = ? WHERE medicineID = ?",
        (medicine.name, medicine.category, medicine.price, medicine_id),
    )
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")
    conn.commit()
    conn.close()
    return Medicine(
        medicineID=medicine_id,
        name=medicine.name,
        category=medicine.category,
        price=medicine.price,
    )

@app.delete("/medicines/{medicine_id}")
def delete_medicine(medicine_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Medicine WHERE medicineID = ?", (medicine_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Medicine not found")
    conn.commit()
    conn.close()
    return {"message": "Medicine deleted"}

# Pharmacy endpoints
@app.get("/pharmacies", response_model=List[Pharmacy])
def get_pharmacies():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT pharmacyID, name, address, number, latitude, longitude FROM Pharmacy")
    rows = cursor.fetchall()
    conn.close()
    return [
        Pharmacy(
            pharmacyID=row['pharmacyID'],
            name=row['name'],
            address=row['address'],
            number=row['number'],
            latitude=row['latitude'],
            longitude=row['longitude'],
        )
        for row in rows
    ]

@app.get("/pharmacies/{pharmacy_id}", response_model=Pharmacy)
def get_pharmacy(pharmacy_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT pharmacyID, name, address, number, latitude, longitude FROM Pharmacy WHERE pharmacyID = ?", (pharmacy_id,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    return Pharmacy(
        pharmacyID=row['pharmacyID'],
        name=row['name'],
        address=row['address'],
        number=row['number'],
        latitude=row['latitude'],
        longitude=row['longitude'],
    )

@app.post("/pharmacies", response_model=Pharmacy)
def create_pharmacy(pharmacy: Pharmacy):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO Pharmacy (name, address, number, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
        (pharmacy.name, pharmacy.address, pharmacy.number, pharmacy.latitude, pharmacy.longitude),
    )
    pharmacy_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return Pharmacy(
        pharmacyID=pharmacy_id,
        name=pharmacy.name,
        address=pharmacy.address,
        number=pharmacy.number,
        latitude=pharmacy.latitude,
        longitude=pharmacy.longitude,
    )

class PharmacyRegistration(BaseModel):
    name: str
    address: str
    number: str
    licenceID: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    verificationToken: str

@app.post("/verify_registration_password")
def verify_registration_password(data: dict):
    password = data.get('password', '').strip()
    if password == REGISTRATION_PASSWORD:
        token = _issue_registration_token()
        return {"verified": True, "token": token, "message": "Password verified successfully"}
    else:
        return {"verified": False, "message": "Incorrect password"}

@app.post("/register_pharmacy")
def register_pharmacy(registration: PharmacyRegistration):
    if not _verify_registration_token(registration.verificationToken):
        raise HTTPException(status_code=403, detail="Registration verification required or expired")

    # Create the pharmacy record
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO Pharmacy (name, address, number, latitude, longitude) VALUES (?, ?, ?, ?, ?)",
        (registration.name, registration.address, registration.number, registration.latitude, registration.longitude),
    )
    pharmacy_id = cursor.lastrowid

    # Optionally create a pharmacist linked to this pharmacy if licenceID was provided
    pharmacist = None
    if registration.licenceID:
        cursor.execute(
            "INSERT INTO Pharmacist (pharmacyID, username, password, licenceID) VALUES (?, ?, ?, ?)",
            (pharmacy_id, registration.number, registration.licenceID, registration.licenceID),
        )
        pharmacist_id = cursor.lastrowid
        pharmacist = {
            "workerID": pharmacist_id,
            "pharmacyID": pharmacy_id,
            "username": registration.number,
            "password": registration.licenceID,
            "licenceID": registration.licenceID,
        }

    conn.commit()
    conn.close()

    return {
        "pharmacy": {
            "pharmacyID": pharmacy_id,
            "name": registration.name,
            "address": registration.address,
            "number": registration.number,
            "latitude": registration.latitude,
            "longitude": registration.longitude,
        },
        "pharmacist": pharmacist,
    }

@app.post("/login_pharmacy")
def login_pharmacy(credential: dict):
    cert = (credential.get('certificate') or "").strip()
    if not cert:
        raise HTTPException(status_code=400, detail='License certificate is required')

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT workerID, pharmacyID, username, licenceID FROM Pharmacist WHERE licenceID = ?", (cert,))
    row = cursor.fetchone()
    conn.close()

    if row is None:
        raise HTTPException(status_code=401, detail='Invalid license certificate number')

    return {
        'workerID': row['workerID'],
        'pharmacyID': row['pharmacyID'],
        'username': row['username'],
        'licenceID': row['licenceID'],
        'message': 'Login successful'
    }

@app.put("/pharmacies/{pharmacy_id}", response_model=Pharmacy)
def update_pharmacy(pharmacy_id: int, pharmacy: Pharmacy):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE Pharmacy SET name = ?, address = ?, number = ?, latitude = ?, longitude = ? WHERE pharmacyID = ?",
        (pharmacy.name, pharmacy.address, pharmacy.number, pharmacy.latitude, pharmacy.longitude, pharmacy_id),
    )
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    conn.commit()
    conn.close()
    return Pharmacy(
        pharmacyID=pharmacy_id,
        name=pharmacy.name,
        address=pharmacy.address,
        number=pharmacy.number,
        latitude=pharmacy.latitude,
        longitude=pharmacy.longitude,
    )

@app.delete("/pharmacies/{pharmacy_id}")
def delete_pharmacy(pharmacy_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Pharmacy WHERE pharmacyID = ?", (pharmacy_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    conn.commit()
    conn.close()
    return {"message": "Pharmacy deleted"}

# Pharmacist endpoints
@app.get("/pharmacists", response_model=List[Pharmacist])
def get_pharmacists():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT workerID, pharmacyID, username, password, licenceID FROM Pharmacist")
    rows = cursor.fetchall()
    conn.close()
    return [
        Pharmacist(
            workerID=row['workerID'],
            pharmacyID=row['pharmacyID'],
            username=row['username'],
            password=row['password'],
            licenceID=row['licenceID'],
        )
        for row in rows
    ]

@app.get("/pharmacists/{worker_id}", response_model=Pharmacist)
def get_pharmacist(worker_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT workerID, pharmacyID, username, password, licenceID FROM Pharmacist WHERE workerID = ?", (worker_id,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Pharmacist not found")
    return Pharmacist(
        workerID=row['workerID'],
        pharmacyID=row['pharmacyID'],
        username=row['username'],
        password=row['password'],
        licenceID=row['licenceID'],
    )

@app.post("/pharmacists", response_model=Pharmacist)
def create_pharmacist(pharmacist: Pharmacist):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO Pharmacist (pharmacyID, username, password, licenceID) VALUES (?, ?, ?, ?)",
        (pharmacist.pharmacyID, pharmacist.username, pharmacist.password, pharmacist.licenceID),
    )
    worker_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return Pharmacist(
        workerID=worker_id,
        pharmacyID=pharmacist.pharmacyID,
        username=pharmacist.username,
        password=pharmacist.password,
        licenceID=pharmacist.licenceID,
    )

@app.put("/pharmacists/{worker_id}", response_model=Pharmacist)
def update_pharmacist(worker_id: int, pharmacist: Pharmacist):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE Pharmacist SET pharmacyID = ?, username = ?, password = ?, licenceID = ? WHERE workerID = ?",
        (pharmacist.pharmacyID, pharmacist.username, pharmacist.password, pharmacist.licenceID, worker_id),
    )
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Pharmacist not found")
    conn.commit()
    conn.close()
    return Pharmacist(
        workerID=worker_id,
        pharmacyID=pharmacist.pharmacyID,
        username=pharmacist.username,
        password=pharmacist.password,
        licenceID=pharmacist.licenceID,
    )

@app.delete("/pharmacists/{worker_id}")
def delete_pharmacist(worker_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Pharmacist WHERE workerID = ?", (worker_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Pharmacist not found")
    conn.commit()
    conn.close()
    return {"message": "Pharmacist deleted"}

# Inventory endpoints
@app.get("/inventories", response_model=List[Inventory])
def get_inventories():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT inventoryID, pharmacyID, medicineID, status FROM Inventory")
    rows = cursor.fetchall()
    conn.close()
    return [
        Inventory(
            inventoryID=row['inventoryID'],
            pharmacyID=row['pharmacyID'],
            medicineID=row['medicineID'],
            status=row['status'],
        )
        for row in rows
    ]

@app.get("/inventories/{inventory_id}", response_model=Inventory)
def get_inventory(inventory_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT inventoryID, pharmacyID, medicineID, status FROM Inventory WHERE inventoryID = ?", (inventory_id,))
    row = cursor.fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=404, detail="Inventory not found")
    return Inventory(
        inventoryID=row['inventoryID'],
        pharmacyID=row['pharmacyID'],
        medicineID=row['medicineID'],
        status=row['status'],
    )

@app.post("/inventories", response_model=Inventory)
def create_inventory(inventory: Inventory):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO Inventory (pharmacyID, medicineID, status) VALUES (?, ?, ?)",
        (inventory.pharmacyID, inventory.medicineID, inventory.status),
    )
    inventory_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return Inventory(
        inventoryID=inventory_id,
        pharmacyID=inventory.pharmacyID,
        medicineID=inventory.medicineID,
        status=inventory.status,
    )

@app.put("/inventories/{inventory_id}", response_model=Inventory)
def update_inventory(inventory_id: int, inventory: Inventory):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE Inventory SET pharmacyID = ?, medicineID = ?, status = ? WHERE inventoryID = ?",
        (inventory.pharmacyID, inventory.medicineID, inventory.status, inventory_id),
    )
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Inventory not found")
    conn.commit()
    conn.close()
    return Inventory(
        inventoryID=inventory_id,
        pharmacyID=inventory.pharmacyID,
        medicineID=inventory.medicineID,
        status=inventory.status,
    )

@app.delete("/inventories/{inventory_id}")
def delete_inventory(inventory_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM Inventory WHERE inventoryID = ?", (inventory_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Inventory not found")
    conn.commit()
    conn.close()
    return {"message": "Inventory deleted"}

@app.post("/add_medicine_to_inventory")
def add_medicine_to_inventory(medicine_data: dict):
    name = medicine_data.get('name')
    category = medicine_data.get('category')
    price = medicine_data.get('price')
    pharmacy_id = medicine_data.get('pharmacyID')

    if not name or not category or price is None or not pharmacy_id:
        raise HTTPException(status_code=400, detail="Missing required fields")

    conn = get_db()
    cursor = conn.cursor()

    # First, add the medicine to Medicine table
    cursor.execute(
        "INSERT INTO Medicine (name, category, price) VALUES (?, ?, ?)",
        (name, category, price)
    )
    medicine_id = cursor.lastrowid

    # Then, add to inventory
    cursor.execute(
        "INSERT INTO Inventory (pharmacyID, medicineID, status) VALUES (?, ?, ?)",
        (pharmacy_id, medicine_id, 'available')
    )
    inventory_id = cursor.lastrowid

    conn.commit()
    conn.close()

    return {
        "medicineID": medicine_id,
        "inventoryID": inventory_id,
        "message": "Medicine added to inventory successfully"
    }

import math

# ... existing code ...

@app.get("/inventory/{pharmacy_id}")
def get_pharmacy_inventory(pharmacy_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT i.inventoryID, i.pharmacyID, i.medicineID, i.status, i.lastupdated,
               m.name as medicineName, m.category, m.price
        FROM Inventory i
        JOIN Medicine m ON i.medicineID = m.medicineID
        WHERE i.pharmacyID = ?
        ORDER BY i.lastupdated DESC
    """, (pharmacy_id,))
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "inventoryID": row['inventoryID'],
            "pharmacyID": row['pharmacyID'],
            "medicineID": row['medicineID'],
            "status": row['status'],
            "lastupdated": row['lastupdated'],
            "medicineName": row['medicineName'],
            "category": row['category'],
            "price": row['price']
        }
        for row in rows
    ]

# Search for medicine and return pharmacies with distance calculation
@app.get("/search_medicine")
def search_medicine(medicine: str, latitude: float, longitude: float):
    conn = get_db()
    cursor = conn.cursor()

    # Find all pharmacies that have the medicine in stock
    cursor.execute("""
        SELECT DISTINCT p.pharmacyID, p.name, p.address, p.number, p.latitude, p.longitude
        FROM Pharmacy p
        JOIN Inventory i ON p.pharmacyID = i.pharmacyID
        JOIN Medicine m ON i.medicineID = m.medicineID
        WHERE LOWER(m.name) LIKE LOWER(?)
        AND i.status = 'available'
        AND p.latitude IS NOT NULL
        AND p.longitude IS NOT NULL
    """, (f'%{medicine}%',))

    pharmacy_rows = cursor.fetchall()
    conn.close()

    # Calculate distance for each pharmacy and sort by distance
    pharmacies_with_distance = []
    for row in pharmacy_rows:
        pharmacy_lat = row['latitude']
        pharmacy_lon = row['longitude']

        # Calculate distance using Haversine formula
        R = 6371  # Earth's radius in kilometers

        lat1_rad = math.radians(latitude)
        lon1_rad = math.radians(longitude)
        lat2_rad = math.radians(pharmacy_lat)
        lon2_rad = math.radians(pharmacy_lon)

        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad

        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

        distance = R * c

        pharmacies_with_distance.append({
            "pharmacyID": row['pharmacyID'],
            "name": row['name'],
            "address": row['address'],
            "number": row['number'],
            "latitude": pharmacy_lat,
            "longitude": pharmacy_lon,
            "distance": distance
        })

    # Sort by distance (closest first)
    pharmacies_with_distance.sort(key=lambda x: x['distance'])

    return pharmacies_with_distance

# Serve static files
# Mount scripts BEFORE the main directory so /scripts/* is available
app.mount("/scripts", StaticFiles(directory=str(SCRIPTS_DIR)), name="scripts")
app.mount("/css", StaticFiles(directory=str(CSS_DIR)), name="css")
# Serve frontend files (HTML/CSS/JS) from the "hmtl" directory
# MUST be mounted LAST so API routes are processed first
app.mount("/", StaticFiles(directory=str(HTML_DIR), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

