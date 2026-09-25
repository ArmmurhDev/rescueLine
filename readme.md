# 🚨 RescueLine — Emergency Response & Incident Reporting Platform

[![PHP Version](https://img.shields.io/badge/PHP-8.1%2B-777BB4?style=flat&logo=php&logoColor=white)](https://php.net)
[![Database](https://img.shields.io/badge/Database-MySQL%20%2F%20MariaDB-4479A1?style=flat&logo=mysql&logoColor=white)](https://mysql.com)
[![Gateway](https://img.shields.io/badge/Gateway-Africa's%20Talking-FF6F00?style=flat)](https://africastalking.com)
[![Frontend](https://img.shields.io/badge/UI-Vanilla%20CSS%20%26%20JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org)
[![Security](https://img.shields.io/badge/Security-CSRF%20%7C%20Rate%20Limit%20%7C%20Bcrypt-008751?style=flat)](https://owasp.org)

**RescueLine** is a modern, full-stack emergency response coordination platform designed for qrapid incident reporting and swift field team dispatch. It bridges low-tech telecommunication channels (USSD `*384#` & SMS) used by citizens with real-time web consoles used by emergency dispatchers, field respondents, and system administrators.

---

## 📑 Table of Contents
1. [Key Features & Capabilities](#-key-features--capabilities)
2. [System Architecture](#-system-architecture)
3. [Prerequisites & System Requirements](#-prerequisites--system-requirements)
4. [Step-by-Step Installation & Setup](#-step-by-step-installation--setup)
5. [Default User Accounts & Credentials](#-default-user-accounts--credentials)
6. [Africa's Talking Simulator Connection Guide](#-africas-talking-simulator-connection-guide)
7. [Directory Structure](#-directory-structure)
8. [Database Schema & API Endpoints](#-database-schema--api-endpoints)
9. [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## ⚡ Key Features & Capabilities

### 1. 📞 Multi-Channel Incident Reporting
* **USSD Reporting (`*384*384911#`)**: Accessible on any mobile phone without an internet connection. Citizens can report emergencies (Fire, Medical, Accidents, Security, Flood) by following simple interactive prompts.
* **Web Portal Reporting**: Direct web submission with automatic geolocation tagging and landmark identification.
* **Automated SMS Dispatch**: Real-time SMS confirmations to reporters with tracking IDs, and instant dispatch alerts to emergency respondents.

### 2. 🛡️ Administrator Command Console (`/admin`)
* **Real-time Incident Monitoring**: Live feed of incoming emergency reports with severity indicators, status badges, and search filters.
* **Personnel Management**: Manage field respondents, coverage states, duty statuses, and dispatch assignments.
* **Emergency Categories**: Add, edit, or toggle emergency categories and default priority ratings.
* **Audit Timeline & History**: Comprehensive event logs capturing every state change, note, and assignment.

### 3. 🚑 Field Respondent Console (`/respondant`)
* **Live Incident Feed**: Real-time incoming reports that appear instantly without requiring page reload.
* **Active Response Tracking**: One-click accept and resolve workflow with automated response time calculation.
* **Duty Status Toggle**: Online / Offline readiness toggling with database synchronization.
* **Citizen Privacy Protection**: Automatic phone number masking (`0803*****789`) across reporting feeds.

---

## 🏗️ System Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │           Citizen Mobile Phone               │
                       │     (USSD *384*384911# / SMS Channel)        │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │          Africa's Talking Gateway            │
                       │         (Cloud / Sandbox Simulator)          │
                       └──────────────────────┬───────────────────────┘
                                              │ Webhook (POST)
                                              ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                         RescueLine Server (XAMPP / PHP)                          │
 │                                                                                  │
 │  ┌──────────────────────┐   ┌───────────────────────┐   ┌──────────────────────┐ │
 │  │    /ussd/index.php   │   │     /sms/send_sms.php │   │      /api/*.php      │ │
 │  │    (USSD Engine)     │   │   (SMS Dispatcher)    │   │     (REST API)       │ │
 │  └──────────┬───────────┘   └───────────┬───────────┘   └──────────┬───────────┘ │
 │             │                           │                          │             │
 │             ▼                           ▼                          ▼             │
 │  ┌─────────────────────────────────────────────────────────────────────────────┐ │
 │  │                     MySQL Database (RescueLine)                             │ │
 │  │  • reports  • users  • categories  • states  • lgas  • report_timeline      │ │
 │  └─────────────────────────────────────────────────────────────────────────────┘ │
 │                                         ▲                                        │
 │                                         │                                        │
 │               ┌─────────────────────────┴─────────────────────────┐              │
 │               │                                                   │              │
 │  ┌────────────┴─────────────┐                       ┌─────────────┴────────────┐ │
 │  │    /admin Console        │                       │    /respondant Console   │ │
 │  │  (System Administrator)  │                       │   (Field Emergency Team) │ │
 │  └──────────────────────────┘                       └──────────────────────────┘ │
 └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites & System Requirements

Ensure you have the following installed on your host machine:

| Requirement | Supported Version | Notes |
| :--- | :--- | :--- |
| **PHP** | `8.1.x`, `8.2.x`, `8.3.x` | Required extensions: `pdo_mysql`, `curl`, `mbstring`, `json`, `session`, `openssl` |
| **Web Server** | Apache 2.4+ (XAMPP / WAMP) | `mod_rewrite` enabled |
| **Database** | MySQL 5.7+ / MariaDB 10.4+ | `utf8mb4` encoding support |
| **Tunnel Tool** | `cloudflared` or `ngrok` | For exposing local USSD/SMS webhook to Africa's Talking |
| **Gateway Account** | Africa's Talking Sandbox | Free developer account ([africastalking.com](https://africastalking.com)) |

---

## 🚀 Step-by-Step Installation & Setup

### Step 1: Clone or Place Project in Web Root
Place the project directory inside your local web server root:
```bash
# For XAMPP on Windows:
C:\xampp\htdocs\RescueLine
```

### Step 2: Start Apache and MySQL
1. Open the **XAMPP Control Panel**.
2. Start both **Apache** and **MySQL**.

### Step 3: Configure Environment Variables (`.env`)
RescueLine comes with an automated `.env` loader and auto-migration system. Check the `.env` file in the project root:

```env
# Application Environment
APP_NAME=RescueLine
APP_ENV=development
APP_DEBUG=true
APP_URL=http://localhost/RescueLine
APP_TIMEZONE=Africa/Lagos

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=RescueLine
DB_USER=root
DB_PASSWORD=
DB_CHARSET=utf8mb4

# Africa's Talking Gateway Credentials
SMS_PROVIDER=africastalking
SMS_API_URL=https://api.africastalking.com/version1/messaging
SMS_USERNAME=sandbox
SMS_API_KEY=your_africas_talking_api_key_here
SMS_SENDER_ID=RescueLine

# USSD Channel Configuration
USSD_SERVICE_CODE=*384*384911#
```

### Step 4: Database Auto-Initialization
RescueLine includes a schema synchronization engine (`inc/schema.php`). Upon accessing any page:
1. It automatically creates the `RescueLine` database if it does not exist.
2. It generates all tables (`users`, `reports`, `categories`, `states`, `lgas`, `report_timeline`, `sms_logs`, `audit_logs`).
3. It seeds initial emergency categories, states, local government areas, and default administrator & respondent accounts.

---

## 🔐 Default User Accounts & Credentials

| Role | Portal URL | Email / Username | Default Password |
| :--- | :--- | :--- | :--- |
| **System Admin** | `http://localhost/RescueLine/auth/login.php` | `admin@rescueline.ng` | `Admin@2026!` |
| **Emergency Respondent** | `http://localhost/RescueLine/auth/login.php` | `musa@rescueline.ng` | `Respondent@2026!` |
| **Field Respondent** | `http://localhost/RescueLine/auth/login.php` | `ibrahim@rescueline.ng` | `Respondent@2026!` |

---

## 📱 Africa's Talking Simulator Connection Guide

Follow this step-by-step guide to connect RescueLine's local USSD & SMS engine with Africa's Talking Sandbox Simulator.

### 1. Create an Africa's Talking Developer Account
1. Visit [https://africastalking.com/](https://africastalking.com/) and click **Sign Up** (or Log In).
2. Go to your **Sandbox Dashboard** at [https://account.africastalking.com/apps/sandbox](https://account.africastalking.com/apps/sandbox).

### 2. Generate an API Key
1. In the Sandbox Dashboard sidebar, navigate to **Settings** &rarr; **API Key**.
2. Enter your account password and click **Generate**.
3. Copy the generated key and paste it into your `.env` file:
   ```env
   SMS_USERNAME=sandbox
   SMS_API_KEY=atsk_your_generated_api_key_here
   ```

### 3. Create a USSD Channel
1. In the sidebar, click **USSD** &rarr; **Service Codes**.
2. Click **Create Channel**.
3. Select your desired channel format (e.g., `*384*384911#` or `*384*911#`).

### 4. Create a Public Tunnel to Localhost
Since Africa's Talking operates in the cloud, it must send HTTP POST requests to your local computer via a secure public tunnel.

#### Option A: Using Cloudflare Tunnel (Recommended)
```powershell
# Run Cloudflare Quick Tunnel on port 80:
.\cloudflared.exe tunnel --url http://localhost:80
```
*Cloudflare will generate a public URL such as `https://example-random-subdomain.trycloudflare.com`.*

#### Option B: Using Ngrok
```powershell
# Run Ngrok on port 80:
ngrok http 80
```
*Ngrok will generate a public URL such as `https://abc1234.ngrok-free.app`.*

### 5. Configure the USSD Webhook URL on Africa's Talking
1. In the Africa's Talking Dashboard, go to **USSD** &rarr; **Service Codes**.
2. Click on your configured service code (e.g. `*384*384911#`).
3. In the **Callback URL** field, enter your public tunnel URL pointing to RescueLine's USSD endpoint:
   ```text
   https://<your-public-tunnel-domain>/RescueLine/ussd/index.php
   ```
4. Click **Save Changes**.

---

### 6. Launch the Web Simulator & Test Live USSD
1. Open the Africa's Talking Web Simulator in your browser:
   👉 **[https://simulator.africastalking.com:1517/](https://simulator.africastalking.com:1517/)**
2. Enter any test phone number in international format (e.g., `+2348031234567`).
3. Click **Connect**.
4. In the virtual mobile phone keypad, dial your service code:
   ```text
   *384*384911#
   ```
5. Press the **Call / Send** button.

```
┌──────────────────────────────────────────────┐
│            USSD SIMULATOR SCREEN             │
├──────────────────────────────────────────────┤
│  RescueLine Emergency Response               │
│  Select emergency type:                      │
│  1. Fire Outbreak                            │
│  2. Medical Emergency                        │
│  3. Road Accident                            │
│  4. Security / Crime                         │
│  5. Flood Disaster                           │
│  6. Other Emergency                          │
│                                              │
│  [ Input: 1 ]                   [ Send ]     │
└──────────────────────────────────────────────┘
```

6. Follow the prompts:
   - **Step 1**: Select emergency type (e.g., `1` for Fire).
   - **Step 2**: Select your State (e.g., `1` for Kaduna).
   - **Step 3**: Select your Local Government Area (e.g., `1` for Kaduna South).
   - **Step 4**: Type your address / nearest landmark (e.g., `Central Market, Road 4`).
   - **Step 5**: Type a brief description of the incident (e.g., `Shops on fire near main gate`).
   - **Step 6**: Confirm submission (`1. Confirm & Dispatch Emergency`).

7. **Immediate Live Verification**:
   - The USSD screen returns your unique Incident Reference ID (e.g., `RL-20260925-C535F`).
   - The report drops into the **Admin Console** ([`admin/report.php`](http://localhost/RescueLine/admin/report.php)) and **Respondent Console** ([`respondant/incorming-report.php`](http://localhost/RescueLine/respondant/incorming-report.php)) in real time without refreshing the page.
   - An SMS confirmation is automatically recorded in `sms_logs` and dispatched.

---

## 📁 Directory Structure

```
RescueLine/
├── admin/                     # System Administrator Console
│   ├── index.php              # Admin Dashboard & Incident Overview
│   ├── report.php             # Emergency Reports Management Feed
│   ├── respondents.php        # Emergency Response Personnel Management
│   └── categories.php         # Incident Category Configuration
├── respondant/                # Field Response Team Console
│   ├── dashboard.php          # Respondent Dashboard & Duty Status Toggle
│   ├── incorming-report.php   # Real-Time Incoming Emergency Feed
│   ├── active-responses.php   # Assigned & Ongoing Incidents
│   └── response-history.php   # Resolved Incident History Logs
├── api/                       # Real-Time JSON REST APIs
│   ├── reports.php            # Reports CRUD, Cascading Filters & CSV Export
│   ├── respondents.php        # Respondent Accounts & Status Toggles
│   ├── categories.php         # Categories Live Operations
│   ├── dashboard.php          # Dashboard Real-Time Feeds & Duty Sync
│   └── auth.php               # Login, Authentication & Session Endpoints
├── ussd/                      # Africa's Talking USSD Webhook Handler
│   ├── index.php              # Webhook Receiver (POST / GET)
│   └── handler.php            # Multi-Step USSD State Machine & Session Engine
├── sms/                       # SMS Dispatch & Notification Services
│   ├── send_sms.php           # Africa's Talking API & Gateway Integration
│   └── sms_templates.php      # Incident Confirmation & Dispatch SMS Templates
├── inc/                       # Core Configuration & Components
│   ├── config.php             # Environment loader & Database PDO Wrapper
│   ├── schema.php             # Database Auto-Migration & Table Initializer
│   ├── admin_header.php       # Shared Admin Navigation & Topbar
│   ├── sidebar_admin.php      # Admin Sidebar Component
│   ├── sidebar.php            # Respondent Sidebar Component
│   └── session.php            # Authentication & Role Authorization Guards
├── assets/                    # Static Assets (CSS, JS, Images)
│   ├── css/                   # Vanilla Modern Stylesheets
│   └── js/                    # Real-time Fetch & UI Logic
├── .env                       # Environment & Gateway Configuration
├── readme.md                  # Project Documentation & Simulator Guide
└── requirement.txt            # System & Software Dependencies
```

---

## 🗄️ Database Schema & Key Tables

* **`reports`**: Stores all incoming incidents (ID, reference code, category, location, state, LGA, landmark, reporter contact, status, assigned respondent, timestamps).
* **`users`**: Manages user accounts for administrators, dispatchers, and field respondents (name, email, phone, role, duty status, password hash).
* **`categories`**: Emergency classifications (Fire, Medical, Accident, etc.) with icons, colors, and priority settings.
* **`report_timeline`**: Audit log recording status transitions (`pending` &rarr; `responding` &rarr; `resolved`) and dispatcher notes.
* **`sms_logs`**: Logs all outgoing and incoming SMS notifications with gateway message references and delivery statuses.
* **`states` & `lgas`**: Nigerian geographical coverage database mapping states to local government areas.

---

## ❓ Troubleshooting & FAQs

### 1. USSD Simulator shows "Application error"
* **Cause**: Africa's Talking cannot reach your local server.
* **Fix**: Verify that your Cloudflare Tunnel or Ngrok process is running and that the Callback URL in Africa's Talking exactly matches `https://<tunnel-domain>/RescueLine/ussd/index.php`.

### 2. SMS fails with "cURL error 60: SSL certificate problem"
* **Cause**: Local PHP cURL missing `cacert.pem`.
* **Fix**: Download `cacert.pem` from [curl.se/ca](https://curl.se/ca/cacert.pem), add `curl.cainfo="C:\xampp\php\extras\ssl\cacert.pem"` in `php.ini`, and restart Apache.

### 3. Incoming reports don't appear in real time
* **Cause**: Database connection issue or table polling interval.
* **Fix**: Ensure your MySQL service is active. The respondent console automatically polls `/api/dashboard.php?action=incoming` every 3 seconds to fetch new incident rows.

---

## 📄 License
RescueLine is developed for humanitarian, emergency dispatch, and public safety coordination. All rights reserved.
