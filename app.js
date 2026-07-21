const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- State ----
let selectedDate = todayStr();
let selectedCourt = null;          // court id currently being selected on
let selectedSlots = new Set();     // start_time strings, e.g. "18:00"
let bookingsForDate = [];          // rows from supabase for selectedDate

// ---- Helpers ----
function todayStr() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function isPastSlot(dateStr, hhmm) {
  const now = new Date();
  const slotDateTime = new Date(`${dateStr}T${hhmm}:00`);
  return slotDateTime < now;
}

function findBooking(courtId, hhmm) {
  return bookingsForDate.find(
    (b) => b.court_id === courtId && b.start_time.slice(0, 5) === hhmm && b.status !== "cancelled"
  );
}

// ---- Data loading ----
async function loadBookings() {
  const { data, error } = await sb
    .from("bookings")
    .select("*")
    .eq("booking_date", selectedDate);

  if (error) {
    document.getElementById("loading-msg").textContent = "Could not load schedule. Please refresh.";
    console.error(error);
    return;
  }
  bookingsForDate = data;
  renderGrid();
}

// ---- Rendering ----
function renderGrid() {
  const grid = document.getElementById("schedule-grid");
  const loadingMsg = document.getElementById("loading-msg");
  loadingMsg.style.display = "none";
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = `90px repeat(${COURTS.length}, 1fr)`;
  grid.innerHTML = "";

  // header row
  grid.insertAdjacentHTML("beforeend", `<div class="grid-head"></div>`);
  COURTS.forEach((c) => {
    grid.insertAdjacentHTML("beforeend", `<div class="grid-head">${c.name}</div>`);
  });

  TIME_SLOTS.forEach((slot) => {
    grid.insertAdjacentHTML(
      "beforeend",
      `<div class="time-label">${formatTime(slot)}</div>`
    );

    COURTS.forEach((court) => {
      const booking = findBooking(court.id, slot);
      const past = isPastSlot(selectedDate, slot);
      const isSelected = selectedCourt === court.id && selectedSlots.has(slot);

      let cls = "slot-cell available";
      let note = "";

      if (past) {
        cls = "slot-cell past";
      } else if (booking && booking.status === "confirmed") {
        cls = "slot-cell confirmed";
        note = "Booked";
      } else if (booking && booking.status === "pending") {
        cls = "slot-cell pending";
        note = "Pending";
      } else if (isSelected) {
        cls = "slot-cell selected";
      }

      const cell = document.createElement("div");
      cell.className = cls;
      cell.dataset.court = court.id;
      cell.dataset.slot = slot;
      if (note) cell.innerHTML = `<span class="cell-note">${note}</span>`;

      if (cls.includes("available") || cls.includes("selected")) {
        cell.addEventListener("click", () => toggleSlot(court.id, slot));
      }

      grid.appendChild(cell);
    });
  });

  updateSelectionBar();
}

function toggleSlot(courtId, slot) {
  // switching courts clears any prior selection — one court per booking
  if (selectedCourt !== null && selectedCourt !== courtId) {
    selectedSlots.clear();
  }
  selectedCourt = courtId;

  if (selectedSlots.has(slot)) {
    selectedSlots.delete(slot);
    if (selectedSlots.size === 0) selectedCourt = null;
  } else {
    selectedSlots.add(slot);
  }
  renderGrid();
}

function updateSelectionBar() {
  const bar = document.getElementById("selection-bar");
  const summary = document.getElementById("selection-summary");
  const bookBtn = document.getElementById("book-selected-btn");

  if (selectedSlots.size === 0) {
    bar.style.display = "none";
    return;
  }
  bar.style.display = "flex";
  const courtName = COURTS.find((c) => c.id === selectedCourt).name;
  const sorted = [...selectedSlots].sort();
  const total = PRICE_PER_HOUR * selectedSlots.size;
  summary.innerHTML = `<strong>${courtName}</strong> · ${sorted.map(formatTime).join(", ")} · ₱${total}`;
  bookBtn.disabled = false;
}

document.getElementById("clear-selection-btn").addEventListener("click", () => {
  selectedSlots.clear();
  selectedCourt = null;
  renderGrid();
});

document.getElementById("date-picker").addEventListener("change", (e) => {
  selectedDate = e.target.value;
  selectedSlots.clear();
  selectedCourt = null;
  loadBookings();
});

// ---- Booking modal flow ----
let currentGroupId = null;

document.getElementById("book-selected-btn").addEventListener("click", openBookingModal);

function openBookingModal() {
  const courtName = COURTS.find((c) => c.id === selectedCourt).name;
  const sorted = [...selectedSlots].sort();
  const total = PRICE_PER_HOUR * selectedSlots.size;

  document.getElementById("modal-booking-summary").innerHTML =
    `${courtName} on ${selectedDate}<br>${sorted.map(formatTime).join(", ")}<br>Total: ₱${total}`;

  document.getElementById("step-details").style.display = "block";
  document.getElementById("step-payment").style.display = "none";
  document.getElementById("step-success").style.display = "none";
  document.getElementById("modal-step-title").textContent = "Your details";
  document.getElementById("details-error").textContent = "";
  document.getElementById("booking-modal-overlay").classList.remove("hidden");
}

document.getElementById("cancel-booking-btn").addEventListener("click", closeModal);
document.getElementById("close-success-btn").addEventListener("click", () => {
  closeModal();
  selectedSlots.clear();
  selectedCourt = null;
  loadBookings();
});

function closeModal() {
  document.getElementById("booking-modal-overlay").classList.add("hidden");
}

document.getElementById("to-payment-btn").addEventListener("click", () => {
  const name = document.getElementById("cust-name").value.trim();
  const contact = document.getElementById("cust-contact").value.trim();
  const email = document.getElementById("cust-email").value.trim();
  const errEl = document.getElementById("details-error");

  if (!name || !contact || !email) {
    errEl.textContent = "Please fill in all fields.";
    return;
  }
  if (!email.includes("@")) {
    errEl.textContent = "Please enter a valid email address.";
    return;
  }
  errEl.textContent = "";

  // fill payment step
  document.getElementById("gcash-qr-img").src = PAYMENT_INFO.gcashQrImage;
  document.getElementById("gcash-name").textContent = PAYMENT_INFO.gcashName;
  document.getElementById("gcash-number").textContent = PAYMENT_INFO.gcashNumber;
  document.getElementById("bank-name").textContent = PAYMENT_INFO.bankName;
  document.getElementById("bank-account-name").textContent = PAYMENT_INFO.bankAccountName;
  document.getElementById("bank-account-number").textContent = PAYMENT_INFO.bankAccountNumber;

  document.getElementById("step-details").style.display = "none";
  document.getElementById("step-payment").style.display = "block";
  document.getElementById("modal-step-title").textContent = "Pay & upload proof";
});

document.getElementById("back-to-details-btn").addEventListener("click", () => {
  document.getElementById("step-payment").style.display = "none";
  document.getElementById("step-details").style.display = "block";
  document.getElementById("modal-step-title").textContent = "Your details";
});

document.getElementById("submit-booking-btn").addEventListener("click", submitBooking);

async function submitBooking() {
  const statusEl = document.getElementById("payment-status");
  const fileInput = document.getElementById("proof-upload");
  const submitBtn = document.getElementById("submit-booking-btn");
  const file = fileInput.files[0];

  if (!file) {
    statusEl.className = "status-msg error";
    statusEl.textContent = "Please upload a screenshot of your payment first.";
    return;
  }

  submitBtn.disabled = true;
  statusEl.className = "status-msg";
  statusEl.textContent = "Uploading proof of payment…";

  currentGroupId = crypto.randomUUID();
  const filePath = `${currentGroupId}/${file.name}`;

  const { error: uploadError } = await sb.storage
    .from("payment-proofs")
    .upload(filePath, file);

  if (uploadError) {
    statusEl.className = "status-msg error";
    statusEl.textContent = "Upload failed. Please try again.";
    submitBtn.disabled = false;
    console.error(uploadError);
    return;
  }

  const { data: urlData } = sb.storage.from("payment-proofs").getPublicUrl(filePath);
  const proofUrl = urlData.publicUrl;

  const name = document.getElementById("cust-name").value.trim();
  const contact = document.getElementById("cust-contact").value.trim();
  const email = document.getElementById("cust-email").value.trim();

  const rows = [...selectedSlots].map((slot) => ({
    group_id: currentGroupId,
    court_id: selectedCourt,
    booking_date: selectedDate,
    start_time: slot,
    customer_name: name,
    contact_number: contact,
    email: email,
    proof_url: proofUrl,
    status: "pending",
  }));

  statusEl.textContent = "Saving your booking…";
  const { error: insertError } = await sb.from("bookings").insert(rows);

  submitBtn.disabled = false;

  if (insertError) {
    if (insertError.code === "23505") {
      statusEl.className = "status-msg error";
      statusEl.textContent = "Sorry — one of those slots was just booked by someone else. Please close this and pick another time.";
    } else {
      statusEl.className = "status-msg error";
      statusEl.textContent = "Something went wrong saving your booking. Please try again.";
      console.error(insertError);
    }
    return;
  }

  document.getElementById("step-payment").style.display = "none";
  document.getElementById("step-success").style.display = "block";
  document.getElementById("modal-step-title").textContent = "Submitted!";
}

// ---- Realtime: refresh grid when anyone books/confirms/cancels ----
sb.channel("public:bookings")
  .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
    loadBookings();
  })
  .subscribe();

// ---- Init ----
document.getElementById("date-picker").value = selectedDate;
document.getElementById("date-picker").min = todayStr();
loadBookings();
