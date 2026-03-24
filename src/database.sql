CREATE TABLE Medicine (
    medicineID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    price REAL -- Use REAL for decimal values in SQLite
);


CREATE TABLE Pharmacy (
    pharmacyID INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    number TEXT,
    licensenumber TEXT,
    latitude REAL,
    longitude REAL
);


CREATE TABLE Pharmacist (
    workerID INTEGER PRIMARY KEY AUTOINCREMENT,
    pharmacyID INTEGER,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    licenceID TEXT,
    FOREIGN KEY (pharmacyID) REFERENCES Pharmacy(pharmacyID)
);


CREATE TABLE Inventory (
    inventoryID INTEGER PRIMARY KEY AUTOINCREMENT,
    pharmacyID INTEGER,
    medicineID INTEGER,
    status TEXT,
    lastupdated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmacyID) REFERENCES Pharmacy(pharmacyID) ON DELETE CASCADE,
    FOREIGN KEY (medicineID) REFERENCES Medicine(medicineID) ON DELETE CASCADE
);