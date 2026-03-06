

# Arogya UI Transformation Plan

## 1. Rename: MediLocker → Arogya

Replace all "MediLocker" / "medilocker" / "MedChain" references across the entire codebase:

**Files to update:**
- `index.html` — title, meta tags
- `src/pages/Landing.tsx` — logo, welcome badge
- `src/pages/Login.tsx` — title, auth message
- `src/pages/Onboarding.tsx` — step description
- `src/pages/Records.tsx` — PDF generation text
- `src/pages/QRCode.tsx` — references
- `src/pages/ScanQR.tsx` — error messages
- `src/components/layout/TopNavbar.tsx` — logo text
- `src/components/layout/AppSidebar.tsx` — logo text
- `src/contexts/AuthContext.tsx` — localStorage keys (`arogya_active_role`)
- `src/lib/generatePredictionPDF.ts` — PDF header
- `supabase/functions/health-chat/index.ts` — system prompt ("Arogya AI")
- `supabase/functions/metamask-auth/index.ts` — sign message, email domain (`@wallet.arogya.app`)

---

## 2. Dark Theme + Bold Colorful UI (BioAge-inspired)

Transform the entire color system to a dark theme with vibrant accents, inspired by the uploaded reference image (deep dark purple/navy background, cyan/teal glowing accents).

**`src/index.css`** — Complete CSS variable overhaul:
- `--background`: Deep navy/dark (`230 25% 7%`)
- `--foreground`: Light white (`230 15% 92%`)
- `--card`: Dark card surface (`230 20% 11%`)
- `--primary`: Vibrant purple-blue (`250 85% 65%`)
- `--accent`: Bright cyan/teal (`172 80% 55%`)
- `--muted`: Dark muted (`230 15% 18%`)
- `--border`: Subtle dark borders (`230 15% 18%`)
- `--sidebar-*`: Dark sidebar variants
- Update glass utilities for dark glass effect
- Add new glow/neon animation utilities
- Add particle-like dot pattern on dark background
- Card-glow gets cyan/purple glow on hover

**`tailwind.config.ts`** — Add new keyframes:
- `glow-pulse` — subtle pulsing glow effect
- `float` — gentle floating animation

**`src/components/layout/AppLayout.tsx`** — Dark gradient background
**`src/components/layout/TopNavbar.tsx`** — Dark glass navbar with glowing logo
**`src/pages/Landing.tsx`** — Dark hero with glowing accents, matching BioAge aesthetic
**`src/pages/Dashboard.tsx`** — Dark stat cards with neon borders

---

## 3. Medical Imaging Sections in Records (Patient Side)

Enhance `src/pages/Records.tsx` to add dedicated imaging upload sections:

**New imaging categories** added to the upload dialog:
- X-Ray, CT Scan, MRI, Ultrasound (as a new "scan_type" field when category is relevant)

**Upload dialog redesign:**
- Add a "Scan Type" selector (X-Ray / CT / MRI / Ultrasound / None) that appears as visual icon cards
- Drag-and-drop file upload area with preview thumbnails
- Support multiple file uploads per record

**Records list enhancement:**
- Show scan type badge on imaging records (with distinct icons: a bone icon for X-Ray, brain for MRI, etc.)
- Thumbnail preview for image attachments

**AI Analysis integration:**
- After uploading an imaging file, call a new edge function `analyze-scan` that uses Gemini to analyze the image description/metadata
- Display AI reasoning in a collapsible card below the record
- Flag urgent findings with a red "URGENT" badge

---

## 4. Urgent Case Flagging

**Database migration:** Add `is_urgent` boolean column to `medical_records` table (default false) and `ai_analysis` text column.

**Patient Records page:**
- After AI analysis, if findings suggest urgency, auto-flag the record
- Urgent records show a pulsing red badge and are pinned to top
- Manual toggle for patients to mark records as urgent

**Doctor Patients page:**
- Urgent records from patients show with priority indicator
- Sort urgent records first

---

## 5. Doctor Panel — Imaging Upload in Patients Page

Enhance `src/pages/Patients.tsx` "Add Record" tab:

- Add the same scan type selector (X-Ray / CT / MRI / Ultrasound)
- Visual icon-card selection for scan types
- Multiple file upload with previews
- AI analysis trigger button after upload
- Urgent flag toggle

---

## 6. New Edge Function: `analyze-scan`

**`supabase/functions/analyze-scan/index.ts`:**
- Accepts: `recordTitle`, `category`, `scanType`, `description`, `patientContext`
- Uses `google/gemini-3-flash-preview` via Lovable AI Gateway
- Returns: `{ analysis: string, isUrgent: boolean, urgencyReason: string | null }`
- System prompt instructs model to analyze medical context and flag urgency
- Stores analysis result back in `medical_records.metadata` or new `ai_analysis` column

---

## Technical Summary

**Files to create:**
- `supabase/functions/analyze-scan/index.ts`

**Files to modify:**
- `index.html`
- `src/index.css`
- `tailwind.config.ts`
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/TopNavbar.tsx`
- `src/components/layout/AppSidebar.tsx`
- `src/pages/Landing.tsx`
- `src/pages/Login.tsx`
- `src/pages/Onboarding.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Records.tsx`
- `src/pages/Patients.tsx`
- `src/pages/QRCode.tsx`
- `src/pages/ScanQR.tsx`
- `src/contexts/AuthContext.tsx`
- `src/lib/generatePredictionPDF.ts`
- `supabase/functions/health-chat/index.ts`
- `supabase/functions/metamask-auth/index.ts`

**Database migration:**
- Add `is_urgent` (boolean, default false) and `ai_analysis` (text, nullable) columns to `medical_records`

**No new npm dependencies needed** — uses existing framer-motion, lucide-react, Tailwind.

