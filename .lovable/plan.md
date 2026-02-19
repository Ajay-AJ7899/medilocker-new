

# Separate Doctor and Patient Dashboards

## What You're Asking For
- Doctor login should only show: **Dashboard**, **Patients** (search + add records), and **Profile**
- No Insurance, QR Code, Health Score, or AI Chat for doctors
- Patient dashboard stays exactly the same
- Doctor should be able to update/add records for patients by their ID

## Current State
The code already has most of this implemented:
- The navbar (`TopNavbar.tsx`) already defines separate link sets for doctors vs patients
- `Dashboard.tsx` already renders `DoctorDashboard` for doctors
- `Patients.tsx` already handles patient search and record adding with file uploads

However, there's no **route protection** -- a doctor could manually navigate to `/insurance`, `/qr-code`, etc. and still see those pages.

## Changes Needed

### 1. Add Route Protection for Role-Based Pages
- Wrap patient-only routes (`/insurance`, `/qr-code`, `/health-score`, `/chatbot`, `/records`) with a role check so doctors get redirected to `/dashboard` if they try to access them
- Wrap doctor-only routes (`/patients`) so patients can't access them

### 2. Clean Up Old Doctor Panel
- Remove the unused `DoctorPanel.tsx` file since it's been replaced by `Patients.tsx` and `DoctorDashboard.tsx`
- Remove the `/doctor-panel` route from `App.tsx`
- Remove the `DoctorPanel` import

### 3. Ensure Doctor Dashboard Is Lightweight
- The `DoctorDashboard.tsx` already shows: records count, quick actions (Search Patient, Add Record), and recent records -- this stays as-is
- The `Patients.tsx` page already has: patient search by code, details tab, add record tab with file uploads -- this stays as-is

## Technical Details

**Files to modify:**
- `src/App.tsx` -- Remove `/doctor-panel` route, add a simple role-guard wrapper component for patient-only and doctor-only routes
- `src/pages/DoctorPanel.tsx` -- Delete this file (no longer used)

**New component to create:**
- `src/components/RoleGuard.tsx` -- A small wrapper that checks `hasRole()` and redirects unauthorized users to `/dashboard`

**Route structure after changes:**

| Route | Patient | Doctor | Admin |
|-------|---------|--------|-------|
| `/dashboard` | Patient Dashboard | Doctor Dashboard | Admin Dashboard |
| `/records` | Yes | No (redirect) | Yes |
| `/insurance` | Yes | No (redirect) | Yes |
| `/qr-code` | Yes | No (redirect) | No |
| `/health-score` | Yes | No (redirect) | No |
| `/chatbot` | Yes | No (redirect) | No |
| `/patients` | No (redirect) | Yes | No |
| `/profile` | Yes | Yes | Yes |

This ensures a clean separation where doctors only see and access what they need.
