# I-Miti — Medicine Locator App

I-Miti helps people in Burundi find pharmacies that stock a specific medicine. A user searches by medicine name and their location, and the app returns a list of nearby pharmacies that have it available, sorted by distance, with Google Maps directions.

Pharmacies register on the platform and manage their own medicine inventory through a dedicated dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Using the App](#using-the-app)
- [Deploying to Render](#deploying-to-render)
- [API Reference](#api-reference)

---

## Features

- Search for a medicine by name and get a distance-sorted list of pharmacies that stock it
- Google Maps directions link for each result
- Pharmacy registration (gated by an administrator-issued verification password)
- Pharmacy login via licence certificate number
- Pharmacy stock dashboard: add medicines, update prices, toggle availability status
- Bilingual interface: English and Kirundi

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3, FastAPI, Uvicorn |
| Database | SQLite 3 (built-in, no installation needed) |
| Frontend | Vanilla HTML5, CSS3, JavaScript (ES6) |
| Hosting | Render |

---

## Project Structure

```
I-Miti/
├── render.yaml              # Render deployment configuration
├── requirements.txt         # Python dependencies
└── src/
    ├── api.py               # FastAPI application — all routes and business logic
    ├── database.sql         # SQL schema (auto-applied on first run)
    ├── database.sqlite3     # SQLite database file (created automatically)
    ├── css/
    │   ├── styles.css       # Global / landing page styles
    │   ├── search.css       # Search page styles
    │   ├── login.css        # Login page styles
    │   ├── register.css     # Registration page styles
    │   └── pharmacy.css     # Stock dashboard styles
    ├── hmtl/                # HTML pages (served as static files)
    │   ├── index.html       # Landing page
    │   ├── search.html      # Medicine search page
    │   ├── phalogin.html    # Pharmacy login page
    │   ├── pharegister.html # Pharmacy registration page
    │   └── pharmacy.html    # Pharmacy stock dashboard
    └── scripts/
        ├── translations.js  # i18n system (English / Kirundi)
        ├── script.js        # Landing page logic (registration modal)
        ├── search.js        # Search page logic
        ├── login.js         # Login page logic
        ├── register.js      # Registration page logic
        └── pharmacy.js      # Stock dashboard logic
```

---

## Prerequisites

Make sure you have the following installed before starting:

1. **Python 3.10 or higher**
   - Check: `python --version` or `python3 --version`
   - Download: https://www.python.org/downloads/

2. **pip** (comes with Python)
   - Check: `pip --version`

3. **Git**
   - Check: `git --version`
   - Download: https://git-scm.com/

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/I-Miti.git
cd I-Miti
```


### 2. Create and activate a virtual environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` appear at the start of your terminal prompt.

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

This installs FastAPI and Uvicorn. That's all that's needed — SQLite is built into Python.

### 4. Set environment variables (optional for local dev)

The app has sensible defaults for local development so this step is optional. If you want to customise them, see the [Environment Variables](#environment-variables) section.

---

## Environment Variables

| Variable | Default (dev only) | Description |
|----------|--------------------|-------------|
| `REGISTRATION_PASSWORD` | `I-Miti2024Verify` | The password pharmacies must enter to access the registration form. Change this before deploying. |
| `REGISTRATION_TOKEN_SECRET` | `dev-only-change-me` | Secret key used to sign the short-lived registration token. Use a long random string in production. |
| `REGISTRATION_TOKEN_TTL_SECONDS` | `900` | How long (in seconds) the registration token stays valid after the password is verified. Default is 15 minutes. |
| `PORT` | `8000` | The port the server listens on. Set automatically by Render. |

**To set variables locally:**

**Windows (Command Prompt):**
```cmd
set REGISTRATION_PASSWORD=your-password-here
set REGISTRATION_TOKEN_SECRET=your-secret-here
```

**Windows (PowerShell):**
```powershell
$env:REGISTRATION_PASSWORD="your-password-here"
$env:REGISTRATION_TOKEN_SECRET="your-secret-here"
```

**macOS / Linux:**
```bash
export REGISTRATION_PASSWORD="your-password-here"
export REGISTRATION_TOKEN_SECRET="your-secret-here"
```

---

## Running the App

From the root of the repository, run:

```bash
uvicorn src.api:app --reload
```

- `--reload` automatically restarts the server when you change a file. Remove it in production.
- The server starts at **http://127.0.0.1:8000**

Open that URL in your browser. The landing page will load.

> **Note:** The database file (`src/database.sqlite3`) is created automatically the first time you run the app if it does not already exist. You do not need to run any database setup commands manually.

---

## Using the App

### As a member of the public (searching for medicine)

1. Open the app in your browser
2. Click **"Search for Medicines"**
3. Enter the medicine name, your latitude, and your longitude
4. Results show pharmacies that have the medicine in stock, sorted by distance
5. Click **"Get Directions"** to open Google Maps

> **Finding your coordinates:** Open Google Maps, right-click your location, and the latitude/longitude will appear at the top of the context menu.

---

### As a pharmacy (registering for the first time)

Registration is gated. You must first contact the administrator to receive a verification password.

1. Email **l.sentore@alustudent.com** with your pharmacy licence and certificate
2. You will receive a verification password by email
3. On the I-Miti landing page, click **"Pharmacy Register"** in the navigation
4. Enter the verification password in the modal that appears
5. You will be redirected to the registration form
6. Fill in your pharmacy name, address, phone number, licence certificate number, and GPS coordinates
7. Click **Register**
8. You will be redirected to the login page

> **Important:** Your licence certificate number is your login credential. Keep it safe.

---

### As a pharmacy (logging in and managing stock)

1. Click **"Pharmacy Login"** in the navigation
2. Enter your licence certificate number
3. You will be redirected to your stock dashboard
4. To **add a medicine**: fill in the medicine name, category, and price, then click **"Update Stock"**
5. To **view and edit existing stock**: click **"View Current Stock"**
   - Change the price or status in the table row
   - Click **"Update"** on that row to save changes
   - Status options: Available, Out of Stock, Discontinued
6. Click **"Logout"** when done

---

## Deploying to Render

### 1. Push the code to GitHub

Make sure your latest code is pushed:

```bash
git add .
git commit -m "ready for deployment"
git push
```

### 2. Create a Render account

Sign up at https://render.com if you don't have an account.

### 3. Create a new Web Service

1. In the Render dashboard, click **New → Web Service**
2. Connect your GitHub account and select the **I-Miti** repository
3. Render will detect `render.yaml` and pre-fill the settings
4. Verify the following fields:
   - **Runtime:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn src.api:app --host 0.0.0.0 --port $PORT`

### 4. Set environment variables in Render

In the Render dashboard, go to your service → **Environment** tab and add:

| Key | Value |
|-----|-------|
| `REGISTRATION_PASSWORD` | A password you choose and will share with pharmacies |
| `REGISTRATION_TOKEN_SECRET` | A long random string — generate one with `python -c "import secrets; print(secrets.token_hex(32))"` |

> Do **not** put these values in your code or commit them to GitHub.

### 5. Deploy

Click **Deploy**. Render will install dependencies and start the server. Once the deploy shows as **Live**, your app is accessible at the URL Render assigns (e.g. `https://i-miti.onrender.com`).

### Important: SQLite on Render free tier

Render's free tier uses **ephemeral disk storage**. This means the `database.sqlite3` file is wiped every time the service redeploys or restarts. For a demo or development deployment this is acceptable. For a production deployment with real pharmacy data, you should migrate to a hosted database such as Render's free PostgreSQL service.

---

## API Reference

All endpoints are prefixed with the server base URL (e.g. `http://127.0.0.1:8000` locally).

### Public endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/search_medicine?medicine=&latitude=&longitude=` | Search for pharmacies stocking a medicine, sorted by distance |
| `POST` | `/verify_registration_password` | Verify the registration password and receive a short-lived token |
| `POST` | `/register_pharmacy` | Register a new pharmacy (requires valid token in body) |
| `POST` | `/login_pharmacy` | Log in with a licence certificate number |

### Inventory endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/inventory/{pharmacy_id}` | Get full inventory for a pharmacy |
| `POST` | `/add_medicine_to_inventory` | Add a new medicine to a pharmacy's inventory |
| `PUT` | `/medicines/{medicine_id}` | Update a medicine's name, category, or price |
| `PUT` | `/inventories/{inventory_id}` | Update an inventory item's status |

### CRUD endpoints (full REST)

| Resource | Endpoints available |
|----------|-------------------|
| `/medicines` | `GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` |
| `/pharmacies` | `GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` |
| `/pharmacists` | `GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` |
| `/inventories` | `GET`, `POST`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}` |

Interactive API documentation (auto-generated by FastAPI) is available at:
- **Swagger UI:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`

---

## License

This project was developed as part of an academic project at the African Leadership University (ALU).
Contact: l.sentore@alustudent.com
