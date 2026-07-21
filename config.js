// ============================================================
// SITE CONFIG — edit the values below to match your setup.
// ============================================================

// 1. Supabase project details (Settings > API in your Supabase dashboard)
const SUPABASE_URL = "https://gxdhyhppesbhqvdndrdl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__DXrehwyYREufF8mQF-Ikg_RA4Tbov5";

// 2. The 3 courts you offer. id must be a number, name is what customers see.
const COURTS = [
  { id: 1, name: "Court 1" },
  { id: 2, name: "Court 2" },
  { id: 3, name: "Court 3" },
];

// 3. Operating hours — one row per bookable hour slot, 24h "HH:MM" format.
//    Add or remove lines to change your hours. Each slot is 1 hour long.
const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

// 4. Price per hour, per court (in PHP).
const PRICE_PER_HOUR = 150;

// 5. Payment details shown to the customer.
const PAYMENT_INFO = {
  gcashName: "Juan Dela Cruz",
  gcashNumber: "0917 123 4567",
  gcashQrImage: "assets/gcash-qr.png", // replace this file with your real GCash QR image
  bankName: "BDO",
  bankAccountName: "Juan Dela Cruz",
  bankAccountNumber: "0012 3456 7890",
};

// 6. Admin dashboard password (client-side only — see README security note).
const ADMIN_PASSWORD = "changeme123";

// 7. How many hours a "pending" booking gets held before you may release it
//    manually if no proof of payment / confirmation ever comes in. Informational only.
const PENDING_HOLD_HOURS = 2;
