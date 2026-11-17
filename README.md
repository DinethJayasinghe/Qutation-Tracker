# 🌟 Subodhi Quotation Lifecycle & Business Tracker (MERN Stack)

A full-stack enterprise **MERN** application created for **Subodhi Institute of Integral Education** to track quotations, manage strict admin authorization workflows before client delivery, log customer-requested adjustments against original versions, track business conversion outcomes (Won vs. Lost), and convert uploaded employee Excel files into visually appealing branded PDF quotations.

---

## 🏛️ Institute & Branding Details

- **Institute**: Subodhi Institute of Integral Education
- **Address**: Wewala, Piliyandala, Sri Lanka
- **General Phone**: `011-2614317` / `011-2613705`
- **Resource Facilitator**: `011-2613705`

---

## 🔐 System Access & Credentials

The system has been purged of all test accounts. It operates with a single root **Super Administrator** account matching your MongoDB Atlas credentials:

### 👑 Super Administrator (Root Account)
- **Username**: `QTracker` *(or `qtracker`)*
- **Password**: `tracker123`
- **Role**: `superadmin`
- **Authority**: Full root control across the entire platform.

---

## 👥 Creating Users with Admin or Employee Access

Log in with `QTracker` / `tracker123` and click **"Manage Staff"** in the top navigation bar to create any user accounts you need:

1. **Select Role**:
   - **Administrator Access**: Creates Admin accounts (e.g., Directors, Coordinators) who can authorize/reject quotations, view financial KPI metrics, and manage users.
   - **Employee / Staff Access**: Creates Employee accounts who can create quotations and upload Excel files (financial dashboards and authorization actions are hidden).
2. **Enter Details**: Name, Username, Password, Phone, Email, and Designation.
3. **Register**: The new user can immediately log in from the login page.

---

## 🚀 Key Features

### 1. 🛡️ Mandatory Admin Authorization Workflow
- Before any quotation can be officially transmitted to a customer, it must undergo **Admin Authorization**.
- **Admin Review Desk**: Review quotation line items, discounts, and margins.
- **One-Click Sign-off**: Admin stamps approval with digital authorization notes.
- **Revision / Rejection**: Admin can send the quote back to the employee with feedback for modification.
- Attempting to send an unauthorized quote to a client is blocked with validation warnings.

### 2. 🔄 Adjustment & Revision Tracker (Original vs. Adjusted)
- When a client negotiates or asks for changes:
  - Preserves the **Original Quotation Snapshot (Version 1.0)**.
  - Automatically records **Revision history (v2.0, v3.0, etc.)** with timestamps, reason for adjustment, and who negotiated it.
  - **Visual Diff Comparison Modal**: Side-by-side view comparing original quantities, prices, and totals against revised figures, showing the net savings or variance.

### 3. 🎯 Business Conversion Tracker (Won vs. Lost)
- Tracks whether a quotation finalized as real business:
  - **🎉 Converted into Business (Won Deal)**: Records the final agreed revenue, closing date, and customer acceptance/MOU feedback.
  - **❌ Did Not Convert (Lost Deal)**: Logs specific reasons (budget limits, competitor venue, date conflict, cancellation).
- Real-time **Conversion Rate %**, total won revenue, and lost revenue metrics on the Admin KPI dashboard (hidden from employees).

### 4. 📊 Excel-to-PDF Engine with Official Subodhi Logo & Contacts
- **Excel Dropzone**: Upload any `.xlsx` or `.xls` spreadsheet quotation.
- The server automatically extracts client info, line items, quantities, and rates.
- Automatically generates an executive-styled **Subodhi PDF** with logo and contact information.

---

## ⚡ How to Run

### Production Launch (Single Port: 5000)
Run in terminal or double-click `start-app.bat`:
```bash
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your web browser.
