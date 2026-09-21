# Saint Patrick's Academy - Student Portal Documentation

This document outlines the architecture, features, and recent upgrades made to the Saint Patrick's Academy Student Portal Single Page Application (SPA).

## 🚀 Key Features Implemented

### 1. AWS-Style 2-Step Verification
The login flow has been entirely revamped to mimic high-security platforms like AWS and Google:
* **Step 1 (ID Verification):** The password field is completely hidden initially. Students enter their Student ID, which automatically checks the Google Sheet database (after 800ms of typing).
* **Step 2 (Password Verification):** If the ID exists, the name is displayed with a green checkmark, the ID field is locked, and the Password field gracefully slides onto the screen. 
* **Back Button:** A "Not you? Change ID" link is provided so students can quickly reset the form if they made a typo.
* **Smart Name Handling:** If an Admin or Staff account logs in (which lack a "Full Name" in the spreadsheet), the system gracefully falls back to displaying "Welcome, User!" instead of breaking.

### 2. Bulletproof PWA & Auto-Updater
The website is a fully installable Progressive Web App (PWA), meaning students can install it on their phones like a native app.
* **Network-First Caching:** The Service Worker (`sw.js`) is configured to always pull the freshest code from the internet first, ensuring no student is ever stuck on an outdated, broken offline cache.
* **Bulletproof Auto-Update:** If a developer pushes a new update, the Service Worker silently downloads it in the background. The exact second it activates, it sends a command to the browser to forcefully and seamlessly refresh the page, instantly applying the new update for the user.

### 3. Anti-Bug & Execution Locks
* **Autofill Interference Prevention:** Chrome's password manager often tries to inject saved emails into hidden username fields when the user reaches the password step. The code now has "execution locks" (`isVerifying`, `isCheckingId`) and strict Step-2 guards to completely ignore these phantom inputs.
* **Concurrent Request Throttling:** Rapidly hitting "Enter" while the system is already verifying the password will no longer crash the Google Apps Script backend.

### 4. UI/UX Polish
* **Glassmorphism Design:** Modern translucent backgrounds with blur filters over a dynamic background image.
* **Intelligent Layouts:** The "About" section dynamically hides the main headline to prevent overlapping text on smaller screens.
* **Sweet Alerts:** Integration of SweetAlert2 for beautiful, modern popups instead of ugly default browser alerts.

## 🛠️ Architecture

### Frontend
* **HTML/CSS/JS:** Pure Vanilla JavaScript to keep the application incredibly lightweight and fast.
* **Hosting:** Deployed instantly and globally via Vercel.

### Backend (Google Apps Script)
The backend leverages a Google Spreadsheet as a live database, accessed via a deployed Google Apps Script (Web App).
* **`verifyId` Action:** Scans Column F for the Student ID and returns the corresponding name in Column B.
* **`login` Action:** Scans both Column F (ID) and Column J (Password). If both match, it returns all student data (Role, Balance, LRN, etc.) as a JSON object, which the frontend saves to `localStorage` for dashboard access.

## 📝 Maintenance Notes
* **Updating the Service Worker:** Whenever pushing a major caching change, increment the `CACHE_NAME` version in `sw.js` (e.g., `spa-portal-v3` -> `spa-portal-v4`) to trigger the auto-updater.
* **Spreadsheet Columns:** The Google Apps Script relies on exact column indices. Do not rearrange the columns in the database spreadsheet without also updating the `rows[i][x]` index arrays in the `Code.gs` script.
