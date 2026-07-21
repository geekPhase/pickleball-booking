const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- Auth gate (client-side only — see README security note) ----
document.getElementById("login-btn").addEventListener("click", () => {
  const entered = document.getElementById("admin-pass").value;
  if (entered === ADMIN_PASSWORD) {
    sessionStorage.setItem("cr_admin_ok", "1");
    showDashboard();
  } else {
    document.getElementById("login-error").textContent = "Incorrect password.";
  }
});

function showDashboard() {
  document.getElementById("login-gate").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById("filter-date").value = today;
  loadRows();
}

if (sessionStorage.getItem("cr_admin_ok") === "1") {
  showDashboard();
}

// ---- Data ----
function formatTime(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

async function loadRows() {
  const date = document.getElementById("filter-date").value;
  const status = document.getElementById("filter-status").value;

  let query = sb.from("bookings").select("*").order("start_time", { ascending: true });
  if (date) query = query.eq("booking_date", date);
  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return;
  }
  renderGrouped(data);
}

function renderGrouped(rows) {
  // group rows sharing a group_id into one line, so admin confirms/cancels
  // an entire multi-hour reservation with a single click
  const groups = {};
  rows.forEach((r) => {
    if (!groups[r.group_id]) groups[r.group_id] = [];
    groups[r.group_id].push(r);
  });

  const tbody = document.getElementById("admin-rows");
  tbody.innerHTML = "";

  Object.values(groups).forEach((group) => {
    const first = group[0];
    const courtName = COURTS.find((c) => c.id === first.court_id)?.name || `Court ${first.court_id}`;
    const times = group.map((r) => r.start_time.slice(0, 5)).sort();
    const timeLabel = times.map(formatTime).join(", ");
    const total = PRICE_PER_HOUR * group.length;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${first.customer_name}</td>
      <td>${first.contact_number}<br><span style="color:var(--ink-soft)">${first.email}</span></td>
      <td>${courtName}</td>
      <td>${first.booking_date}</td>
      <td>${timeLabel}</td>
      <td>₱${total}</td>
      <td>${first.proof_url ? `<a href="${first.proof_url}" target="_blank">View</a>` : "—"}</td>
      <td><span class="status-pill ${first.status}">${first.status}</span></td>
      <td class="admin-actions">
        ${first.status !== "confirmed" ? `<button class="confirm" data-group="${first.group_id}">Confirm</button>` : ""}
        ${first.status !== "cancelled" ? `<button class="cancel" data-group="${first.group_id}">Cancel</button>` : ""}
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button.confirm").forEach((btn) =>
    btn.addEventListener("click", () => updateGroupStatus(btn.dataset.group, "confirmed"))
  );
  tbody.querySelectorAll("button.cancel").forEach((btn) =>
    btn.addEventListener("click", () => updateGroupStatus(btn.dataset.group, "cancelled"))
  );
}

async function updateGroupStatus(groupId, status) {
  const { error } = await sb.from("bookings").update({ status }).eq("group_id", groupId);
  if (error) {
    alert("Could not update booking. Please try again.");
    console.error(error);
    return;
  }
  loadRows();
}

document.getElementById("filter-date").addEventListener("change", loadRows);
document.getElementById("filter-status").addEventListener("change", loadRows);

// ---- Realtime refresh ----
sb.channel("public:bookings:admin")
  .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
    if (document.getElementById("dashboard").style.display !== "none") loadRows();
  })
  .subscribe();
