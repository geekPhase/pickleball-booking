# Court Reserve — Pickleball Court Booking

A simple, free website where customers pick a court + time slot, see live
availability, submit their details, pay by GCash/bank transfer, and upload
proof of payment. You confirm each booking from a private admin page.

No sign-up needed for customers. No paid hosting. No monthly server bill.

---

## 1. How it works

- **index.html** — the public booking page. Customers pick a date, click
  open (yellow) slots on the schedule, fill in their name/contact/email,
  see the GCash QR + bank details, upload a payment screenshot, and submit.
- **admin.html** — a password-gated page for you. Shows all bookings for a
  date, lets you Confirm or Cancel each one with one click.
- Data lives in a free **Supabase** project (a hosted Postgres database +
  file storage), so both pages always show the same live schedule.

---

## 2. Set up Supabase (free) — do this once

1. Go to [supabase.com](https://supabase.com), sign up, and create a new
   project (pick any name/region, set a database password and save it
   somewhere).
2. Once the project is ready, open the **SQL Editor** (left sidebar) →
   **New query**. Paste in the entire contents of `supabase-setup.sql`
   (included in this folder) and click **Run**. This creates the
   `bookings` table and the `payment-proofs` storage bucket.
3. Go to **Settings → API**. Copy:
   - **Project URL**
   - **anon public** key
4. Open `config.js` in this folder and paste them in:
   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```

That's your whole backend — free tier covers a small pickleball business
comfortably (500MB database, 1GB file storage, 50,000 monthly active
users).

---

## 3. Customize `config.js`

Open `config.js` and edit:
- `COURTS` — names of your 3 courts
- `TIME_SLOTS` — your operating hours (one entry per bookable hour)
- `PRICE_PER_HOUR` — your rate
- `PAYMENT_INFO` — your GCash name/number and bank details
- `ADMIN_PASSWORD` — change this from the default!

Then replace `assets/gcash-qr.png` with your real GCash QR code image
(same filename, or update `gcashQrImage` in config.js to match).

---

## 4. Put it on GitHub

1. Create a new repository on GitHub (e.g. `pickleball-booking`).
2. Upload all the files in this folder to that repository (drag-and-drop
   on GitHub's web UI works fine, or use `git push` if you're comfortable
   with git).

## 5. Publish for free with GitHub Pages

1. In your repository, go to **Settings → Pages**.
2. Under "Build and deployment", set **Source** to "Deploy from a branch".
3. Set **Branch** to `main` (or `master`) and folder to `/ (root)`. Save.
4. Wait about a minute, then refresh the page — GitHub will show your live
   URL, something like:
   `https://your-username.github.io/pickleball-booking/`
5. Share that link with customers. Your admin page is at:
   `https://your-username.github.io/pickleball-booking/admin.html`

Any time you edit a file and push it to GitHub, the live site updates
automatically within a minute or two.

---

## 6. Day-to-day use

- A customer books → the slot turns amber ("Pending") on the schedule
  immediately for everyone.
- You open `admin.html`, log in, check the uploaded proof of payment, and
  click **Confirm** (slot turns green) or **Cancel** (slot opens back up)
  for the whole reservation at once, even if they booked several hours.
- If a customer never pays, just leave it pending or cancel it after a
  couple of hours to free up the slot for others.

---

## 7. Security note (please read)

This is a static, no-server site, so the admin password is only a soft
gate on the *page* — it's a beginner-friendly setup, not bank-grade
security. Someone technical enough to inspect the site's network traffic
could theoretically call the database directly to confirm/cancel a
booking without the password. In practice this is low-risk for a small
local booking site (worst case is a prank cancellation, which you'd
notice), but avoid storing anything sensitive beyond name/contact/email,
and don't reuse `ADMIN_PASSWORD` anywhere important. If you ever want
real authentication, Supabase has a free Auth system we can wire in later.

---

## 8. Common tweaks

- **Change slot length from 1 hour** → this version books by the hour;
  ask me if you want 30-minute or 2-hour blocks instead.
- **Add a 4th court** → add one line to the `COURTS` array in `config.js`.
- **Different hours per day** (e.g. shorter hours on Sundays) → possible,
  just ask and we'll extend `TIME_SLOTS` logic.
