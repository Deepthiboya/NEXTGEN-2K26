import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Supabase config
const SUPABASE_URL = 'https://jkqxisgkngxqlwuojuul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXhpc2drbmd4cWx3dW9qdXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTMxODgsImV4cCI6MjA3NDU2OTE4OH0.88ga7OV0KRK44PlAdo3tOZzxARHdSYNBZqp1AIj43vY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------- Globals ----------------
const statusEl = document.getElementById("status");
let deptPieChart, eventBarChart;
let previousSection = "dashboard";

// ---------------- Helpers ----------------
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function paginate(array, page_size, page_number) {
  return array.slice((page_number - 1) * page_size, page_number * page_size);
}

// ---------------- Render table with pagination ----------------
function renderTableWithPagination(container, data, columns, pageSize = 10) {
  let currentPage = 1;

  function paginate(array, page_size, page_number) {
    return array.slice((page_number - 1) * page_size, page_number * page_size);
  }

  function renderPage(page) {
    currentPage = page;
    const paginatedData = paginate(data, pageSize, page);

    // Render table
    container.innerHTML = `
      <table style="width:100%; border-collapse:collapse;">
        <thead style="background:#f0f0f0;">
          <tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${paginatedData.map(r => `<tr>${columns.map(c => `<td>${r[c.key] || '—'}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    `;

    // Render pagination
    const totalPages = Math.ceil(data.length / pageSize);
    if (totalPages > 1) {
      const pagination = document.createElement("div");
      pagination.className = "pagination";

      // Prev button
      const prevBtn = document.createElement("div");
      prevBtn.textContent = "⟨ Prev";
      prevBtn.className = "page-btn";
      if (page === 1) prevBtn.style.pointerEvents = "none";
      prevBtn.onclick = () => { if(page > 1) renderPage(page - 1); };
      pagination.appendChild(prevBtn);

      // Page numbers
      for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement("div");
        pageBtn.textContent = i;
        pageBtn.className = "page-btn" + (i === page ? " active" : "");
        pageBtn.onclick = () => renderPage(i);
        pagination.appendChild(pageBtn);
      }

      // Next button
      const nextBtn = document.createElement("div");
      nextBtn.textContent = "Next ⟩";
      nextBtn.className = "page-btn";
      if (page === totalPages) nextBtn.style.pointerEvents = "none";
      nextBtn.onclick = () => { if(page < totalPages) renderPage(page + 1); };
      pagination.appendChild(nextBtn);

      container.appendChild(pagination);
    }
  }

  renderPage(currentPage);
}


// ---------------- Menu ----------------
window.show = function(id, menuId) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".menu li").forEach(m => m.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.getElementById(menuId).classList.add("active");
};

// ---------------- Open tables ----------------
function openTableInTablesSection(title, data, columns, fromSectionId) {
  const tablesSection = document.getElementById("tables");
  const container = document.getElementById("table-container");
  previousSection = fromSectionId || "dashboard";

  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  tablesSection.classList.add("active");
  document.getElementById("tables-title").textContent = title;

  renderTableWithPagination(container, data, columns, 10);
  tablesSection.scrollIntoView({ behavior: "smooth" });
}

// ---------------- Back & CSV ----------------
document.getElementById("tables-back").addEventListener("click", () => {
  show(previousSection, "menu-" + previousSection);
});

document.getElementById("export-visible-csv").addEventListener("click", () => {
  const container = document.getElementById("table-container");
  const table = container.querySelector("table");
  if (!table) return alert("No table found.");

  let csv = [];
  const headers = Array.from(table.querySelectorAll("thead th")).map(th => `"${th.textContent}"`);
  csv.push(headers.join(","));
  table.querySelectorAll("tbody tr").forEach(tr => {
    const row = Array.from(tr.querySelectorAll("td")).map(td => `"${td.textContent}"`);
    csv.push(row.join(","));
  });

  const blob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = document.getElementById("tables-title").textContent.replace(/\s+/g, '_') + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ---------------- Load Dashboard ----------------
async function loadDashboard() {
  statusEl.textContent = "Loading dashboard...";
  try {
    const { data: registrations } = await supabase.from("registrations").select("*");
    const { data: convenors } = await supabase.from("convenors").select("*");
    const { data: coordinators } = await supabase.from("coordinators").select("*");

    renderRegistrationStats(registrations);
    renderDepartments(registrations);
    renderAllEvents(registrations);
    renderConvenors(convenors);
    renderCoordinators(coordinators);
    renderAmounts(registrations);

    statusEl.textContent = "Loaded successfully ✅";
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error loading dashboard: " + err.message;
  }
}

// ---------------- Registration Stats ----------------
function renderRegistrationStats(registrations) {
  const total = registrations.length;
  const pending = registrations.filter(r => r.status === "pending").length;
  const paid = registrations.filter(r => r.status === "paid").length;
  const totalAmount = registrations.reduce((sum, r) => sum + (Number(r.fee) || 0), 0);

  document.getElementById("totalRegs").textContent = total;
  document.getElementById("pendingRegs").textContent = pending;
  document.getElementById("paidRegs").textContent = paid;
  document.getElementById("totalAmount").textContent = "₹" + totalAmount;

  // Dashboard cards
  const cards = [
    {id:"totalRegs", title:"All Registrations", filter:null},
    {id:"pendingRegs", title:"Pending Registrations", filter:r=>r.status==="pending"},
    {id:"paidRegs", title:"Paid Registrations", filter:r=>r.status==="paid"},
    {id:"totalAmount", title:"All Registrations with Fee", filter:null} // No View button
  ];

  cards.forEach(cardInfo => {
    const cardEl = document.querySelector(`.big#${cardInfo.id}`)?.closest(".card");
    if(!cardEl) return;

    // Only attach for cards that have button
    const btn = cardEl.querySelector(".view-btn");
    if(!btn) return;

    btn.onclick = () => {
      let dataList = registrations;
      if(cardInfo.filter) dataList = registrations.filter(cardInfo.filter);

      if(dataList.length === 0){
        alert("No registrations to display");
        return;
      }

      // Open table
      openTableInTablesSection(
        cardInfo.title,
        dataList,
        [
          {label:"Name", key:"name"},
          {label:"Email", key:"email"},
          {label:"Phone", key:"phone"},
          {label:"Student ID", key:"student_id"},
          {label:"Department", key:"department"},
          {label:"Event", key:"event"},
          {label:"Status", key:"status"},
          {label:"Fee (₹)", key:"fee"}
        ],
        "dashboard"
      );
    };
  });
}


// ---------------- Departments ----------------
function renderDepartments(registrations) {
  const container = document.getElementById("departments-grid");
  container.innerHTML = "";

  const branches = ["CSE", "CSM", "CAD", "CIVIL", "MECH", "ECE", "EEE"];
  branches.forEach(branch => {
    const branchRegs = registrations.filter(r => r.department === branch);
    const card = document.createElement("div");
    card.className = "mini-card";

    const viewBtnHTML = branchRegs.length > 0 ? `<button class="view-btn">View More</button>` : "";
    card.innerHTML = `<h4>${branch}</h4><p>${branchRegs.length} Registrations</p>${viewBtnHTML}`;

    const btn = card.querySelector(".view-btn");
    if (btn) {
      btn.onclick = () => openTableInTablesSection(`${branch} Registrations`, branchRegs, [
        { label: "Name", key: "name" },
        { label: "Email", key: "email" },
        { label: "Phone", key: "phone" },
        { label: "Student ID", key: "student_id" },
        { label: "Event", key: "event" },
        { label: "Status", key: "status" },
        { label: "Fee (₹)", key: "fee" }
      ], "departments");
    }

    container.appendChild(card);
  });
}

// ---------------- Events ----------------
function renderAllEvents(registrations) {
  const container = document.getElementById("events-grid");
  container.innerHTML = "";

  const eventsMap = {};
  registrations.forEach(r => {
    const evt = r.event || '—';
    if (!eventsMap[evt]) eventsMap[evt] = [];
    eventsMap[evt].push(r);
  });

  Object.entries(eventsMap).forEach(([eventName, regs]) => {
    const card = document.createElement("div");
    card.className = "mini-card";
    card.innerHTML = `<h4>${eventName}</h4><p>${regs.length} Registrations</p><button class="view-btn">View More</button>`;

    const btn = card.querySelector(".view-btn");
    btn.onclick = () => openTableInTablesSection(`${eventName} Registrations`, regs, [
      { label: "Department", key: "department" },
      { label: "Name", key: "name" },
      { label: "Email", key: "email" },
      { label: "Status", key: "status" },
      { label: "Fee", key: "fee" }
    ], "events-section");

    container.appendChild(card);
  });
}

// ---------------- Convenors & Coordinators ----------------
// ---------- Render Convenors ----------
document.addEventListener("DOMContentLoaded", () => {
  // ---------------- Convenor Section ----------------
  const convenorForm = document.getElementById("convenor-form");
  const convenorList = document.getElementById("convenor-list");
  const convenorError = document.getElementById("convenor-error");

  // Render Convenors
  async function loadConvenors() {
    const { data, error } = await supabase.from("convenors").select();
    if (error) return console.error(error);
    convenorList.innerHTML = "";
    data.forEach(c => {
      const div = document.createElement("div");
      div.className = "card-mini";
      div.innerHTML = `
        <strong>${c.name}</strong><br>
        Email: ${c.email}<br>
        Phone: ${c.phone || '—'}<br>
        Year: ${c.year || '—'}<br>
        Serial: ${c.serial}<br>
        <button class="delete-btn" data-serial="${c.serial}">Delete</button>
      `;
      convenorList.appendChild(div);
    });
  }

  window.renderConvenors = loadConvenors; // ← make global

  // Add Convenor
  convenorForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const serial = form.serial.value.trim();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const year = form.year.value.trim();

    if (!serial || !name || !email) {
      convenorError.innerText = "Serial, Name and Email are required!";
      return;
    }

    try {
      const { error } = await supabase.from("convenors").insert([{ serial, name, email, phone, year }]);
      if (error) throw error;
      form.reset();
      convenorError.innerText = "";
      loadConvenors();
      alert("Convenor added successfully!");
    } catch (err) {
      console.error(err);
      convenorError.innerText = "Failed to add convenor.";
    }
  });

  // Delegated delete listener for Convenors
  convenorList.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("delete-btn")) return;
    const serial = e.target.dataset.serial;
    if (!confirm(`Are you sure you want to delete convenor ${serial}?`)) return;
    try {
      const { error } = await supabase.from("convenors").delete().eq("serial", serial);
      if (error) throw error;
      e.target.closest(".card-mini").remove();
      alert("Convenor deleted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to delete convenor.");
    }
  });

  loadConvenors();

  // ---------------- Coordinator Section ----------------
const coordinatorForm = document.getElementById("coordinator-form");
const coordinatorBody = document.getElementById("coordinator-body");

// Render Coordinators
async function loadCoordinators() {
  const { data, error } = await supabase.from("coordinators").select();
  if (error) return console.error(error);

  coordinatorBody.innerHTML = "";
  data.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.serial || '—'}</td>
      <td>${c.name || '—'}</td>
      <td>${c.email || '—'}</td>
      <td>${c.department || '—'}</td>
      <td>${c.phone || '—'}</td>
      <td>${c.year || '—'}</td>
      <td><button class="delete-btn" data-serial="${c.serial}">Delete</button></td>
    `;
    coordinatorBody.appendChild(tr);
  });
}

window.renderCoordinators = loadCoordinators; // make global

// Add Coordinator
coordinatorForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const serial = form.serial.value.trim();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const department = form.department.value.trim();
  const phone = form.phone.value.trim();
  const year = form.year.value.trim();

  if (!serial || !name || !email || !department) {
    alert("Serial, Name, Email, and Department are required!");
    return;
  }

  try {
    const { error } = await supabase.from("coordinators").insert([{
      serial, 
      name, 
      email, 
      department,
      phone, 
      year
    }]);
    if (error) throw error;

    form.reset();
    loadCoordinators();
    alert("Coordinator added successfully!");
  } catch (err) {
    console.error("Failed to add coordinator:", err);
    alert("Failed to add coordinator.");
  }
});

// Delegated delete listener
coordinatorBody.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("delete-btn")) return;
  const serial = e.target.dataset.serial;
  if (!confirm(`Are you sure you want to delete coordinator ${serial}?`)) return;

  try {
    const { error } = await supabase.from("coordinators").delete().eq("serial", serial);
    if (error) throw error;
    e.target.closest("tr").remove();
    alert("Coordinator deleted successfully!");
  } catch (err) {
    console.error("Failed to delete coordinator:", err);
    alert("Failed to delete coordinator.");
  }
});

loadCoordinators();
});


// ---------------- Department Colors ----------------
const deptColors = {
  CSM: '#FF6384', CSE: '#36A2EB', ECE: '#FFCE56',
  EEE: '#4BC0C0', MECH: '#9966FF', CIVIL: '#FF9F40', CAD: '#8AFF33'
};

// ---------------- Amounts ----------------
function renderAmounts(registrations) {
  const totalFee = registrations.reduce((sum, r) => sum + (Number(r.fee) || 0), 0);
  document.getElementById('total-fee').textContent = `Total Fee: ₹${totalFee}`;

  const deptMap = {};
  registrations.forEach(r => { if (r.status === 'paid') deptMap[r.department] = (deptMap[r.department] || 0) + Number(r.fee || 0); });

  const ctxPie = document.getElementById('deptPieChart')?.getContext('2d');
  if (ctxPie) {
    if (deptPieChart) deptPieChart.destroy();
    deptPieChart = new Chart(ctxPie, {
      type: 'pie',
      data: { labels: Object.keys(deptMap), datasets: [{ data: Object.values(deptMap), backgroundColor: Object.keys(deptMap).map(d => deptColors[d] || '#CCCCCC') }] },
      options: { responsive: false, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Collected Fee per Department' } } }
    });
  }

  // Bar Chart
  const eventMap = {};
  registrations.forEach(r => { if (r.status === 'paid') { const key = `${r.event}::${r.department}`; eventMap[key] = (eventMap[key] || 0) + Number(r.fee || 0); } });
  const eventLabels = [...new Set(registrations.map(r => r.event))];
  const datasets = Object.entries(eventMap).map(([key, value]) => {
    const [evt, dept] = key.split('::');
    return { label: dept, data: eventLabels.map(l => l === evt ? value : 0), backgroundColor: deptColors[dept] || '#CCCCCC' };
  });

  const ctxBar = document.getElementById('eventBarChart')?.getContext('2d');
  if (ctxBar) {
    if (eventBarChart) eventBarChart.destroy();
    eventBarChart = new Chart(ctxBar, {
      type: 'bar',
      data: { labels: eventLabels, datasets },
      options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Collected Fee per Event (stacked by Dept)' }, legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }
    });
  }

  // Render amounts table
  const amountsData = registrations.map(r => ({
    department: r.department || '—',
    event: r.event || '—',
    total: Number(r.fee) || 0,
    paid: r.status === 'paid' ? Number(r.fee) : 0,
    pending: r.status === 'pending' ? Number(r.fee) : 0
  }));

  const container = document.getElementById("amounts-container");
  if (!container) return;

  if (amountsData.length === 0) {
    container.innerHTML = "<p style='text-align:center; padding:10px;'>No data available</p>";
    return;
  }

  renderTableWithPagination(container, amountsData, [
    { label: "Department", key: "department" },
    { label: "Event", key: "event" },
    { label: "Pending Amount", key: "pending" },
    { label: "Paid Amount", key: "paid" },
    { label: "Total Fee", key: "total" }
  ], 10);
}

// ---------------- Coordinator Form ----------------

// ---------------- Sidebar Logout Button ----------------

function wireLogout() {
  const logoutBtn = document.getElementById("logout");
  if (!logoutBtn) return console.warn("Logout button not found");

  logoutBtn.addEventListener("click", async () => {
    try {
      await supabase.auth.signOut(); // Optional: only if you use Supabase auth
      window.location.href = "/nextgen/index.html"; // redirect to login
    } catch (err) {
      console.error("Logout failed:", err);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
 // Logout button
const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    // Optional: clear any session info here
    alert("Logging out...");
    // Redirect to login page (adjust path if needed)
    window.location.href = "../login.html"; // <- change path if login.html is elsewhere
  });
} else {
  console.warn("Logout button not found");
}
});



// ---------------- Refresh Button ----------------
document.getElementById("refresh-all").addEventListener("click", () => {
  statusEl.textContent = "Refreshing...";
  loadDashboard();
});

// ---------------- Initialize ----------------
loadDashboard();