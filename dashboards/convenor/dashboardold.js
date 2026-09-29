// convenor/dashboard.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// ---------- CONFIG ----------
const SUPABASE_URL = 'https://jkqxisgkngxqlwuojuul.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXhpc2drbmd4cWx3dW9qdXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTMxODgsImV4cCI6MjA3NDU2OTE4OH0.88ga7OV0KRK44PlAdo3tOZzxARHdSYNBZqp1AIj43vY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- DEBUG ----------
const debug = true;
const log = (...args) => { if (debug) console.log('[convenor]', ...args); };
const warn = (...args) => { if (debug) console.warn('[convenor]', ...args); };

// ---------- HELPERS ----------
function $(id) { return document.getElementById(id); }
function setStatus(msg) { const s = $('status'); if (s) s.textContent = msg || ''; }
function escapeHtml(s) { if (s === null || s === undefined) return ''; return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// --- Amounts Table Pagination ---
window.amountsPerPage = 10;        // number of rows per page
window.amountsCurrentPage = 1;     // current page
window.amountsTotalPages = 1;      // will be computed dynamically

function paginateAmounts(data, page, pageSize) {
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageData = data.slice(startIdx, endIdx);
  return { pageData };
}

function renderAmountsPagination(totalPages) {
  const container = document.getElementById('amounts-pagination');
  if (!container) return;
  container.innerHTML = '';
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Prev';
  prevBtn.disabled = window.amountsCurrentPage === 1;
  prevBtn.onclick = () => {
    if (window.amountsCurrentPage > 1) {
      window.amountsCurrentPage--;
      renderAmountsTable(window.registrationData || [], window.amountsCurrentPage, window.amountsPerPage);
    }
  };

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = window.amountsCurrentPage === totalPages;
  nextBtn.onclick = () => {
    if (window.amountsCurrentPage < totalPages) {
      window.amountsCurrentPage++;
      renderAmountsTable(window.registrationData || [], window.amountsCurrentPage, window.amountsPerPage);
    }
  };

  const pageInfo = document.createElement('span');
  pageInfo.textContent = ` Page ${window.amountsCurrentPage} of ${totalPages} `;

  container.appendChild(prevBtn);
  container.appendChild(pageInfo);
  container.appendChild(nextBtn);
}


//paginations
let registrationsCurrentPage = 1;
const registrationsRowsPerPage = 10;
// expose show for inline onclicks
function show(sectionId, menuId) {
  try {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const sec = sectionId ? $(sectionId) : null;
    if (sec) sec.classList.add('active');
    document.querySelectorAll('.menu li').forEach(li => li.classList.remove('active'));
    if (menuId) {
      const mi = $(menuId);
      if (mi) mi.classList.add('active');
    }
if (sectionId === 'dashboard') {
      if (window.chartDailyDept?.resize) window.chartDailyDept.resize();
      if (window.chartDailyEvent?.resize) window.chartDailyEvent.resize();
      if (window.chartDailyDeptEvent?.resize) window.chartDailyDeptEvent.resize();
    }

  } catch (err) { console.warn('show err', err); }
}
window.show = show;

// ---------- SIDEBAR & LOGOUT ----------
function wireSidebarClicks() {
  try {
    const menu = document.querySelector('.menu');
    if (!menu) return;
    menu.addEventListener('click', (ev) => {
      const a = ev.target.closest('a');
      const li = ev.target.closest('li');
      const id = li?.id || (a?.parentElement?.id) || null;
      if (!id) return;
      ev.preventDefault();
      const mapping = {
        'menu-dashboard': 'dashboard',
        'menu-coordinators': 'coordinators',
        'menu-departments': 'departments',
        'menu-events': 'events',
        'menu-tables': 'tables',
        'menu-amounts': 'amounts'
      };
      if (!mapping[id]) return;
      show(mapping[id], id);
    });
    log('sidebar wired');
  } catch (err) { console.warn(err); }
}

function wireLogout() {
  try {
    const logoutEl = $('logout');
    if (!logoutEl) return;
    logoutEl.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await supabase.auth.signOut(); } catch (err) { console.warn('signOut err', err); }
      window.location.href = 'https://www.srit.ac.in/nextgen';
    });
    log('logout wired');
  } catch (err) { console.warn('wireLogout err', err); }
}

// ---------- DELEGATED HANDLERS ----------
function attachDelegatedHandlers() {
  // Remove any existing click listeners by cloning the document body
  // This is a more reliable way to prevent duplicate listeners
  const existingHandler = document.querySelector('[data-handler-attached]');
  if (existingHandler) return; // Already attached
  
  // Add a marker to indicate handlers are attached
  document.body.setAttribute('data-handler-attached', 'true');
  
  // delegated delete (coordinators / departments)
  document.addEventListener('click', async (ev) => {
    const del = ev.target.closest && ev.target.closest('.btn-delete');
    if (del) {
      ev.preventDefault();
      ev.stopPropagation(); // Prevent multiple event firing
      const table = del.dataset.table;
      const id = del.dataset.id;
      const name = del.dataset.name;
      const email = del.dataset.email;
      
      if (!confirm('Are you sure you want to delete?')) return;
      del.disabled = true;
      
      try {
        if (table === 'coordinators') {
          if (id) { 
            const { error } = await supabase.from('coordinators').delete().eq('id', id); 
            if (error) throw error; 
          } else if (email) { 
            const { error } = await supabase.from('coordinators').delete().eq('email', email); 
            if (error) throw error; 
          }
        } else if (table === 'departments') {
          if (id) {
            const { error } = await supabase.from('departments').delete().eq('id', id); 
            if (error) throw error; 
          } else if (name) { 
            const { error } = await supabase.from('departments').delete().eq('name', name); 
            if (error) throw error; 
          }
        }
    // load data
setStatus('Loading data...');
await loadDashboardData();


// ------------------- HEADCOUNT -------------------
// Example using async fetch (assuming you have an API endpoint that returns registrations_flat)
(async () => {
  try {
    const res = await fetch('/api/registrations_flat'); // your endpoint
    const registrations = await res.json(); // array of registration rows

    let totalCount = 0;

    registrations.forEach((reg, i) => {
      let count = 0;

      // Main participant
      if (reg.name && reg.name.trim() && reg.name.toLowerCase() !== 'null') count++;

      // Team members & leader
      ['teammember1','teammember2','name'].forEach(k => {
        if (reg[k] && reg[k].trim() && reg[k].toLowerCase() !== 'null') count++;
      });

      totalCount += count;

      console.log(`Registration #${i + 1}: counted members = ${count}`);
    });

    console.log('👥 Total headcount:', totalCount);
    const totalEl = document.getElementById('totalHeadCount');
    if (totalEl) totalEl.textContent = totalCount;

  } catch (err) {
    console.error('Error fetching registrations_flat:', err);
  }
})();


      } catch (err) {
        console.error('delete err', err);
        alert('Delete failed — see console');
        del.disabled = false;
      }
      return;
    }

    // Event view button
    const viewEv = ev.target.closest && ev.target.closest('.btn-view-event');
    if (viewEv) {
      ev.preventDefault();
      const eventName = viewEv.dataset.event;
      if (!eventName) return;
      // show dept cards for this event
      showEventDept(eventName);
      // switch to events section (event details are within events section)
      show('events', 'menu-events');
      return;
    }

    // Dept view inside event (navigates to tables)
    const viewDept = ev.target.closest && ev.target.closest('.btn-view-dept');
    if (viewDept) {
      ev.preventDefault();
      const eventName = viewDept.dataset.event;
      const dept = viewDept.dataset.dept;
      // Coming from Events -> Dept, so Back should go to Events
      window.tablesBackTarget = 'events';
      showRegistrations({ event: eventName, department: dept, title: `${eventName} — ${dept}` });
      return;
    }

    // Back from tables
    if (ev.target.closest && ev.target.closest('#tables-back')) {
      ev.preventDefault();
      const target = window.tablesBackTarget || 'events';
      if (target === 'dashboard') {
        show('dashboard', 'menu-dashboard');
      } else if (target === 'events') {
        show('events', 'menu-events');
        const ed = $('eventDetails'); if (ed) ed.innerHTML = '';
      } else {
        // default safe fallback
        show('events', 'menu-events');
      }
      return;
    }

    // Export visible CSV
    if (ev.target.closest && ev.target.closest('#export-visible-csv')) {
      ev.preventDefault();
      exportVisibleCSV();
      return;
    }
    // Total Amount "View More" button
    if (ev.target.closest && ev.target.closest('#view-more-amounts')) {
      ev.preventDefault();
      // Switch to Amounts section
      show('amounts', 'menu-amounts');
      return;
    }

  });
}

// ---------- RENDERERS ----------
function renderCoordinators(list) {
  const out = $('coordinator-cards');
  if (!out) return;
  out.innerHTML = '';
  list.forEach(c => {
    const card = document.createElement('div');
    card.className = 'person-card';
    card.innerHTML = `
      <h4>${escapeHtml(c.name)} </h4>
      <p><strong>Dept:</strong> ${escapeHtml(c.department || '—')}</p>
      <p><strong>Email:</strong> ${escapeHtml(c.email || '—')}</p>
      <p><strong>Phone:</strong> ${escapeHtml(c.phone || '—')}</p>
      <p><strong>Year:</strong> ${escapeHtml(c.year || '—')}</p>
      <div class="actions">
        <button class="btn-delete" data-table="coordinators" data-id="${escapeHtml(c.id || '')}" data-email="${escapeHtml(c.email || '')}">Delete</button>
      </div>
    `;
    out.appendChild(card);
  });
  const totalEl = $('total-coordinators'); if (totalEl) totalEl.textContent = String(list.length || 0);
}

// function renderDepartments(list) {
//   const tbody = $('departments-body');
//   if (!tbody) return;
//   tbody.innerHTML = '';
//   list.forEach(d => {
//     const eventsVal = Array.isArray(d.events) ? d.events : (typeof d.events === 'string' ? d.events.split(',').map(s => s.trim()).filter(Boolean) : []);
//     const tr = document.createElement('tr');
//     tr.dataset.name = d.name;
//     tr.innerHTML = `<td>${escapeHtml(d.name)}</td>
//                     <td>${escapeHtml(eventsVal.join(', '))}</td>
//                     <td><button class="btn-delete" data-table="departments" data-name="${escapeHtml(d.name)}">Delete</button></td>`;
//     tbody.appendChild(tr);
//   });
//   const totalEl = $('total-departments'); if (totalEl) totalEl.textContent = String(list.length || 0);
// }

function renderDepartments(departments) {
  const tbody = document.getElementById('departments-body');
  tbody.innerHTML = '';

  departments.forEach(dept => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${dept.name}</td>
      <td>${(dept.events || []).join(', ')}</td>
      <td>
        <button class="btn-edit" data-id="${dept.id}">Edit</button>
        <button class="btn-delete" data-table="departments" data-name="${dept.name}" data-id="${dept.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // attach event listeners for edit/delete
  tbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.dataset.id;
      handleEditDepartment(id);
    });
  });

  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.target.dataset.id;
      handleDeleteDepartment(id);
    });
  });
}

function renderEventsGrid(eventsSet) {
  // eventsSet: Set or array of event names
  const container = $('all-events-list');
  if (!container) return;
  container.innerHTML = '';
  Array.from(eventsSet).sort().forEach(ev => {
    const card = document.createElement('div');
    card.className = 'event-card';
    const safe = escapeHtml(ev);
    card.innerHTML = `<h4>${safe}</h4><p class="small-note">Click view to see department breakdown & registrations</p>
      <button class="btn-view-event" data-event="${safe}">View</button>`;
    container.appendChild(card);
  });
}

// amounts view: table + populate chart container (chart handled separately)
function renderAmountsAndEvents(registrations, departments) {
  // compute totals per dept and event set
  const totals = {};
  const events = new Set();
  (registrations || []).forEach(r => {
    const dept = (r.department || 'Unknown') + '';
    const ev = (r.event || 'Unknown') + '';
    const fee = Number(r.fee) || 0;
    if (!totals[dept]) totals[dept] = { total: 0, events: {} };
    totals[dept].total += fee;
    totals[dept].events[ev] = (totals[dept].events[ev] || 0) + fee;
    events.add(ev);
  });
  (departments || []).forEach(d => {
    const eventsVal = Array.isArray(d.events) ? d.events : (typeof d.events === 'string' ? d.events.split(',').map(s => s.trim()).filter(Boolean) : []);
    eventsVal.forEach(ev => events.add(ev));
  });

  // Compute summary counts
  const totalRegs = registrations.length;
  const pendingRegs = registrations.filter(r => r.status === 'pending').length;
  const paidRegs = registrations.filter(r => r.status === 'paid').length;
  const totalHeadCount = new Set(registrations.map(r => r.email)).size;

  // Update total fee display
  const totalFee = (registrations || []).reduce((s, r) => s + (Number(r.fee) || 0), 0);
  const totalFeeEl = $('total-fee');
  if (totalFeeEl) {
    totalFeeEl.textContent = `Total Fee: ₹${totalFee.toLocaleString('en-IN')}`;
  }

  // Build amounts table into the #amountsTableContainer (safe — your HTML has this element)
  try {
    const container = $('amounts-container');
    if (container) {
      // Add summary section at the top
      let html = `
        <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
          <h3 style="margin: 0 0 10px 0;">Summary</h3>
          <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <div><strong>Total Registrations:</strong> ${totalRegs}</div>
            <div><strong>Pending:</strong> ${pendingRegs}</div>
            <div><strong>Paid:</strong> ${paidRegs}</div>
            <div><strong>Head Count:</strong> ${totalHeadCount}</div>
          </div>
        </div>
        <table><thead><tr><th>Department / Event</th><th>Total (₹)</th></tr></thead><tbody>`;
      // sort departments alphabetically to keep UI stable
      Object.keys(totals).sort().forEach(dept => {
        const deptData = totals[dept];
        html += `<tr><td><strong>${escapeHtml(dept)}</strong></td><td><strong>₹${escapeHtml(String(deptData.total || 0))}</strong></td></tr>`;
        // events under dept
        Object.keys(deptData.events).sort().forEach(ev => {
          html += `<tr><td class="indent">↳ ${escapeHtml(ev)}</td><td>₹${escapeHtml(String(deptData.events[ev] || 0))}</td></tr>`;
        });
      });
      // If there were depts with no registrations, optionally show them (from departments list)
      const deptNamesFromDB = (departments || []).map(d => d.name).filter(Boolean);
      deptNamesFromDB.sort().forEach(dname => {
        if (!totals[dname]) {
          html += `<tr><td><strong>${escapeHtml(dname)}</strong></td><td><strong>₹0</strong></td></tr>`;
        }
      });
      html += '</tbody></table>';
      container.innerHTML = html;
    }
  } catch (err) {
    console.warn('renderAmountsAndEvents table build err', err);
  }

  // render event cards
  renderEventsGrid(events);

  // update totals card if present
  const totalAmountEl = $('total-amount');
  if (totalAmountEl) {
    const sum = (registrations || [])
  .filter(r => r.status === 'paid')
  .reduce((s, r) => s + (Number(r.fee) || 0), 0);

    totalAmountEl.textContent = '₹' + String(sum || 0);
  }
}

// ---------- LOADING DATA ----------
async function loadDashboardData() {
  try {
    setStatus('Loading data...');
    log('loadDashboardData');

    // coordinators
    let coordinators = [];
    try { const { data, error } = await supabase.from('coordinators').select('*').order('name', { ascending: true }); if (error) { warn('coordinators fetch err', error); coordinators = []; } else coordinators = data || []; } catch (err) { warn('coordinators threw', err); coordinators = []; }
    renderCoordinators(coordinators);

    // departments
    let departments = [];
    try { const { data, error } = await supabase.from('departments').select('*').order('name', { ascending: true }); if (error) { warn('departments fetch err', error); departments = []; } else departments = data || []; } catch (err) { warn('departments threw', err); departments = []; }
    renderDepartments(departments);

    // registrations: get full fields needed
let registrations = [];
try {
  const { data, error } = await supabase
    .from('registrations')
    .select('id,name,email,phone,student_id,department,event,fee,utr_number,status,created_at,college')
    .order('created_at', { ascending: false });

  if (error) {
    warn('registrations fetch err', error);
    registrations = [];
  } else {
    registrations = (data || []).map(r => ({
      ...r,
      college: r.college || '—'
    }));
  }
} catch (err) {
  warn('registrations threw', err);
  registrations = [];
}


    // save global
    window.registrationData = registrations;
window.departmentsData = departments;

populateEventFilterOptions();


    // Render department cards with registration counts
    renderDepartmentsCards(departments);
    
    // Create events set from registrations and departments
    const events = new Set();
    (registrations || []).forEach(r => {
      const ev = (r.event || 'Unknown') + '';
      events.add(ev);
    });
    (departments || []).forEach(d => {
      const eventsVal = Array.isArray(d.events) ? d.events : (typeof d.events === 'string' ? d.events.split(',').map(s => s.trim()).filter(Boolean) : []);
      eventsVal.forEach(ev => events.add(ev));
    });
    
    // render events
    renderEventsGrid(events);
    
    // Update dashboard cards
    const total = registrations.length;
    const pending = registrations.filter(r => r.status === 'pending').length;
    const paid = registrations.filter(r => r.status === 'paid').length;
    const totalEl = $('totalRegs'); if (totalEl) totalEl.textContent = total;
    const pendingEl = $('pendingRegs'); if (pendingEl) pendingEl.textContent = pending;
    const paidEl = $('paidRegs'); if (paidEl) paidEl.textContent = paid;
    
    // Update total amount
    const totalAmount = registrations.filter(r => r.status === 'paid').reduce((sum, r) => sum + (Number(r.fee) || 0), 0);
    const amountEl = $('totalAmount'); if (amountEl) amountEl.textContent = `₹${totalAmount.toLocaleString('en-IN')}`;

    // Update total head count (unique participants based on email)
    const totalHeadCount = new Set(registrations.map(r => r.email)).size;
    const headEl = $('totalHeadCount'); if (headEl) headEl.textContent = totalHeadCount;

    // render new charts for amounts section
    renderDeptPieChart(registrations);
    renderEventBarChart(registrations);
    renderAmountsTable(registrations);

    renderDailyCharts();

    attachDelegatedHandlers(); // ensure delegated handlers active
    installExportCSV();

    setStatus('');
    log('loadDashboardData done — regs', registrations.length);
  } catch (err) {
    console.error('loadDashboardData err', err);
    setStatus('Error loading data — see console');
  }
}

// ---------- FORMS ----------
function wireForms() {
  // add coordinator
  const coordinatorForm = $('coordinator-form');
  if (coordinatorForm) {
    // Remove any existing event listeners to prevent duplicates
    coordinatorForm.replaceWith(coordinatorForm.cloneNode(true));
    const newCoordinatorForm = $('coordinator-form');
    
    newCoordinatorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const f = e.target;
      const submitBtn = f.querySelector('button[type="submit"]');
      
      // Prevent multiple submissions
      if (submitBtn && submitBtn.disabled) return;
      
      const serial = (f.elements['serial']?.value || '').trim();
      const name = (f.elements['name']?.value || '').trim();
      const email = (f.elements['email']?.value || '').trim().toLowerCase();
      const department = (f.elements['department']?.value || '').trim();
      const phone = (f.elements['phone']?.value || '').trim();
      const year = (f.elements['year']?.value || '').trim();
      
      // Basic validation
      if (!name) {
        alert('Please enter a name');
        return;
      }
      if (!email) {
        alert('Please enter an email address');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
      }
      if (!department) {
        alert('Please enter a department');
        return;
      }
      
      if (submitBtn) submitBtn.disabled = true;
      
      try {
        const { error } = await supabase.from('coordinators').insert([{ serial, name, email, department, phone, year }]);
        if (error) throw error;
        try { await supabase.from('profiles').upsert([{ email, role: 'dept_coordinator' }], { onConflict: ['email'] }); } catch (e) { warn('profiles upsert failed', e); }
        f.reset();
        await loadDashboardData();
        alert('Coordinator added successfully!');
      } catch (err) {
        console.error('add coordinator err', err);
        alert('Add failed — see console');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // add department
  // const departmentForm = $('department-form');
  // if (departmentForm) departmentForm.addEventListener('submit', async (e) => {
  //   e.preventDefault();
  //   const f = e.target;
  //   const dept = (f.elements['dept']?.value || '').trim();
  //   const events = (f.elements['events']?.value || '').split(',').map(s => s.trim()).filter(Boolean);
  //   try {
  //     const { error } = await supabase.from('departments').insert([{ name: dept, events }]);
  //     if (error) throw error;
  //     f.reset();
  //     await loadDashboardData();
  //   } catch (err) { console.error('add department err', err); alert('Add department failed — see console'); }
  // });

  document.getElementById('department-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  const deptName = form.dept.value.trim();
  const eventsList = form.events.value.split(',').map(ev => ev.trim()).filter(Boolean);

  const editingId = form.dataset.editing;

  try {
    if (editingId) {
      // UPDATE existing department
      const { error } = await supabase
        .from('departments')
        .update({ name: deptName, events: eventsList })
        .eq('id', editingId);

      if (error) throw error;
      alert('Department updated successfully');
      delete form.dataset.editing;
      form.querySelector('button[type="submit"]').textContent = "Add Department";
      form.reset();
      loadDashboardData(); // reload to reflect changes
    } else {
      // ADD new department
      const { error } = await supabase
        .from('departments')
        .insert([{ name: deptName, events: eventsList }]);

      if (error) throw error;
      alert('Department added successfully');
      form.reset();
      loadDashboardData();
    }
  } catch (error) {
    console.error('Department form error:', error);
    alert('Error — see console');
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

  // filter in tables
  const filterStatus = $('filterStatus');
  if (filterStatus) filterStatus.addEventListener('change', () => {
    // re-render table based on lastFilter
    if (window.lastTableRequest) showRegistrations(window.lastTableRequest);
  });
  // Event filter
const filterEvent = $('filterEvent');
if (filterEvent) filterEvent.addEventListener('change', () => {
  registrationsCurrentPage = 1; // reset page on filter change
  if (window.lastTableRequest) showRegistrations(window.lastTableRequest);
});

}

// ---------- EXPORTS ----------
async function exportRegistrationsCSV() {
  try {
    setStatus('Preparing CSV...');
    const { data, error } = await supabase.from('registrations').select('*');
    if (error) throw error;
    const rows = data || [];
    if (!rows.length) { alert('No registrations to export'); setStatus(''); return; }
    const columns = ['id', 'name', 'student_id', 'email', 'phone', 'department', 'year', 'event', 'fee', 'utr_number', 'status', 'created_at'];
    const csvRows = [columns.join(',')];
    rows.forEach(r => {
      const vals = columns.map(col => `"${String(r[col] ?? '').replace(/"/g, '""')}"`);
      csvRows.push(vals.join(','));
    });
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.download = `registrations-${now}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setStatus('');
  } catch (err) {
    console.error('export err', err);
    alert('Export failed — see console');
    setStatus('');
  }
}

async function exportVisibleCSV() {
  try {
    const rows = window.lastRenderedTableRows || [];
    if (!rows.length) { alert('No visible rows to export'); return; }
    const columns = ['name', 'email', 'phone', 'student_id', 'department', 'event', 'fee', 'status', 'created_at'];
    const csvRows = [columns.join(',')];
    rows.forEach(r => {
      const vals = columns.map(col => `"${String(r[col] ?? '').replace(/"/g, '""')}"`);
      csvRows.push(vals.join(','));
    });
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    const now = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.download = `visible-registrations-${now}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  } catch (err) {
    console.error('export visible err', err);
    alert('Export failed — see console');
  }
}

// install export button to amounts section
function installExportCSV() { const btn = $('export-csv'); if (!btn) { /* we already install earlier in other flows */ } const vbtn = $('export-visible-csv'); if (vbtn) vbtn.addEventListener('click', exportVisibleCSV); }

// ---------- REGISTRATION STATS ----------
async function loadRegistrationStats() {
  try {
    const { data, error } = await supabase.from('registrations').select('id,name,email,phone,student_id,department,event,fee,status,created_at');
    if (error) { warn('loadRegistrationStats err', error); return; }
    const regs = data || [];
    window.registrationData = regs; // global store

    const total = regs.length;
    const pending = regs.filter(r => r.status === 'pending').length;
    const paid = regs.filter(r => r.status === 'paid').length;

    const totalEl = $('totalRegs'); if (totalEl) totalEl.textContent = total;
    const pendingEl = $('pendingRegs'); if (pendingEl) pendingEl.textContent = pending;
    const paidEl = $('paidRegs'); if (paidEl) paidEl.textContent = paid;

    // Total Head Count (unique emails)
    const uniqueMembers = new Set(regs.map(r => r.email)).size;
    const headEl = $('totalHeadCount');
    if (headEl) headEl.textContent = uniqueMembers;
  } catch (err) { console.error('loadRegistrationStats threw', err); }
  updateDashboardCards();
}

// show dept breakdown from dashboard cards
function showDeptBreakdown(type) {
  const data = window.registrationData || [];
  let filtered = [];
  if (type === 'pending') filtered = data.filter(r => r.status === 'pending');
  else if (type === 'paid') filtered = data.filter(r => r.status === 'paid');
  else filtered = data;

  const counts = {};
  filtered.forEach(r => counts[r.department] = (counts[r.department] || 0) + 1);

  // Build a fresh table block
  const wrap = document.createElement('div');
  wrap.id = 'deptBreakdown';
  wrap.className = 'card card-block';
  wrap.innerHTML = `
    <div class="header" style="justify-content: space-between; align-items: center;">
      <h3 id="deptBreakdownTitle">Department-wise (${type === 'paid' ? 'Paid' : type === 'pending' ? 'Pending' : 'Total'})</h3>
      <button class="close-btn" id="close-dept-breakdown">Close</button>
    </div>
    <table>
      <thead>
        <tr>
          <th>Department</th>
          <th id="deptBreakdownValueTitle">Count</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody id="deptTable"></tbody>
    </table>
  `;

  // Remove any previous injected block
  const old = document.getElementById('deptBreakdown');
  if (old && old.parentElement) old.parentElement.removeChild(old);

  // Inject before graphs using the anchor
  const anchor = document.getElementById('dashboardTablesAnchor');
 if (anchor) {
  anchor.insertAdjacentElement('beforeend', wrap);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
  // Fill rows
  const tbody = wrap.querySelector('#deptTable');
  Object.entries(counts).forEach(([dept, cnt]) => {
    const tr = document.createElement('tr');
    const tdDept = document.createElement('td');
    tdDept.textContent = dept || '—';
    const tdCnt = document.createElement('td');
    tdCnt.textContent = String(cnt);
    const tdAction = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'view-btn';
    btn.textContent = 'View';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.tablesBackTarget = 'dashboard';
      // Hide block when navigating to Tables
      const block = document.getElementById('deptBreakdown');
      if (block) block.remove();
      showRegistrations({ department: dept, title: dept });
    });
    tdAction.appendChild(btn);
    tr.appendChild(tdDept);
    tr.appendChild(tdCnt);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  });

  // Close button
  wrap.querySelector('#close-dept-breakdown')?.addEventListener('click', () => {
    const block = document.getElementById('deptBreakdown');
    if (block) block.remove();
  });
}
window.showDeptBreakdown = showDeptBreakdown;


function closeDeptBreakdown() { const block = $('deptBreakdown'); if (block) { block.style.display = 'none'; block.classList.remove('active'); } }
window.closeDeptBreakdown = closeDeptBreakdown;

// ---------- EVENTS -> DEPTS -> REGISTRATIONS FLOW ----------

// show all members (from dashboard head count)
function showMembers(type) {
  const all = window.registrationData || [];
  // Filter to unique emails for head count
  const uniqueEmails = new Set();
  const uniqueRows = [];
  all.forEach(r => {
    if (!uniqueEmails.has(r.email)) {
      uniqueEmails.add(r.email);
      uniqueRows.push(r);
    }
  });
  showRegistrations({ customRows: uniqueRows, showAll: true, title: 'Unique Registrations (Head Count)' });
  window.tablesBackTarget = 'dashboard';
}

// show department cards for an event (in events section)
function showEventDept(eventName) {
  const regs = window.registrationData || [];
  const counts = {};
  regs.forEach(r => { if (r.event === eventName) counts[r.department] = (counts[r.department] || 0) + 1; });
  const container = $('eventDetails'); if (!container) return;
  let html = `<h3>${escapeHtml(eventName)} — Department-wise</h3><div class="dept-grid">`;
  Object.entries(counts).forEach(([dept, cnt]) => {
    html += `<div class="dept-card"><h4>${escapeHtml(dept)}</h4><p class="small-note">${cnt} registrations</p>
      <button class="btn-view-dept" data-event="${escapeHtml(eventName)}" data-dept="${escapeHtml(dept)}">View</button></div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}
window.showEventDept = showEventDept;

// show registrations — navigates to Tables section and renders table
// options: { event, department, title }
// function showRegistrations(options = {}){
//   const { event, department, title } = options;
//   const all = window.registrationData || [];
//   const filterStatus = $('filterStatus')?.value || 'all';

//   const rows = all.filter(r => {
//     if (event && r.event !== event) return false;
//     if (department && r.department !== department) return false;
//     if (filterStatus === 'pending' && r.status !== 'pending') return false;
//     if (filterStatus === 'paid' && r.status !== 'paid') return false;
//     return true;
//   });

//   // save last request for re-render when filter changes
//   window.lastTableRequest = options;
//   window.lastRenderedTableRows = rows;

//   // render title
//   const titleEl = $('tables-title'); if (titleEl) titleEl.textContent = title || (event ? `Registrations — ${event}` : (department ? `Registrations — ${department}` : 'Registrations'));

//   // fill table
//   const tbody = $('registrations-body'); if (!tbody) return;
//   tbody.innerHTML = '';
//   rows.forEach(r => {
//     const tr = document.createElement('tr');
//     tr.innerHTML = `<td>${escapeHtml(r.name||'—')}</td>
//       <td>${escapeHtml(r.email||'—')}</td>
//       <td>${escapeHtml(r.phone||'—')}</td>
//       <td>${escapeHtml(r.student_id||'—')}</td>
//       <td>${escapeHtml(r.department||'—')}</td>
//       <td>₹${escapeHtml(String(r.fee||0))}</td>
//       <td>${escapeHtml(r.status||'—')}</td>`;
//     tbody.appendChild(tr);
//   });

// switch to tables section
// ensure the Back button target is set: if not set already, default to 'events' (safe)
//   if (!window.tablesBackTarget) window.tablesBackTarget = 'events';
//   show('tables','menu-tables');
// }

function showRegistrations(options = {}) {
  const { event, department, title, showAll, customRows } = options;
  const all = customRows || window.registrationData || [];
  const filterStatus = $('filterStatus')?.value || 'all';
const filterEventSel = $('filterEvent')?.value || 'all';
  // Reset pagination if context or filters changed (only if not showAll)
  if (!showAll && (!window.lastTableRequest ||
      window.lastTableRequest.event !== event ||
      window.lastTableRequest.department !== department ||
      window._lastFilterStatus !== filterStatus ||
      window._lastFilterEvent !== filterEventSel)) {
    registrationsCurrentPage = 1;
  }
// Filter rows
 let rows = all.filter(r => {
    if (event && r.event !== event) return false;
    if (department && r.department !== department) return false;
    if (filterStatus === 'pending' && r.status !== 'pending') return false;
    if (filterStatus === 'paid' && r.status !== 'paid') return false;
    if (filterEventSel !== 'all' && r.event !== filterEventSel) return false;
    return true;
  });
  // Save current filters for next comparison
    window.lastTableRequest = options;
  window._lastFilterStatus = filterStatus;
  window._lastFilterEvent = filterEventSel;

  let pageRows;
  if (showAll) {
    pageRows = rows; // show all rows
  } else {
    // Pagination logic
    const totalPages = Math.ceil(rows.length / registrationsRowsPerPage);
    if (registrationsCurrentPage > totalPages) registrationsCurrentPage = totalPages || 1;
    const startIdx = (registrationsCurrentPage - 1) * registrationsRowsPerPage;
    const endIdx = startIdx + registrationsRowsPerPage;
    pageRows = rows.slice(startIdx, endIdx);
  }

  window.lastTableRequest = options;
  window.lastRenderedTableRows = pageRows;

  // Render title
  const titleEl = $('tables-title');
  if (titleEl) titleEl.textContent = title || (event ? `Registrations — ${event}` : (department ? `Registrations — ${department}` : 'Registrations'));

  // Fill table
  const tbody = $('registrations-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  pageRows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${escapeHtml(r.name || '—')}</td>
      <td>${escapeHtml(r.email || '—')}</td>
      <td>${escapeHtml(r.phone || '—')}</td>
      <td>${escapeHtml(r.student_id || '—')}</td>
      <td>${escapeHtml(r.college || '—')}</td>
      <td>${escapeHtml(r.department || '—')}</td>
      <td>${escapeHtml(r.event || '—')}</td>
      <td>₹${escapeHtml(String(r.fee || 0))}</td>
      <td>${escapeHtml(r.status || '—')}</td>`;
    tbody.appendChild(tr);
  });

  // Pagination controls only if not showAll
  if (!showAll) {
    const totalPages = Math.ceil(rows.length / registrationsRowsPerPage);
    renderRegistrationsPagination(totalPages);
  }

  if (!window.tablesBackTarget) window.tablesBackTarget = 'events';
  show('tables', 'menu-tables');
}
// ---------- AMOUNTS CHARTS ----------
let amountsChart = null;
let deptPieChart = null;
let eventBarChart = null;

// Department colors for charts
const deptColors = {
  CSM: '#FF6384',
  CSE: '#36A2EB', 
  ECE: '#FFCE56',
  EEE: '#4BC0C0',
  MECH: '#9966FF',
  CIVIL: '#FF9F40',
  CAD: '#8AFF33'
};
function renderAmountsChart(registrations) {
  try {
    // prepare last 14 days (labels) and sums
    const days = 14;
    const now = new Date();
    const dateKeys = [];
    for (let i = days - 1; i >= 0; --i) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dateKeys.push(key);
    }
    const sums = dateKeys.map(k => 0);
    (registrations || []).forEach(r => {
      const created = r.created_at ? String(r.created_at).slice(0, 10) : null;
      if (!created) return;
      const idx = dateKeys.indexOf(created);
      if (idx >= 0) sums[idx] += Number(r.fee) || 0;
    });
    // build chart
    const ctx = $('amountsChart')?.getContext?.('2d');
    if (!ctx) return;
    if (amountsChart) { amountsChart.destroy(); amountsChart = null; }
    amountsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dateKeys,
        datasets: [{ label: 'Fees (₹)', data: sums }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } }
      }
    });
  } catch (err) { console.warn('renderAmountsChart err', err); }
}

// Render pie chart for department-wise collected fees
function renderDeptPieChart(registrations) {
  try {
    const deptMap = {};
    (registrations || []).forEach(r => {
      if (r.status === 'paid') {
        deptMap[r.department] = (deptMap[r.department] || 0) + Number(r.fee || 0);
      }
    });
    
    const deptLabels = Object.keys(deptMap);
    const deptData = Object.values(deptMap);
    
    if (deptLabels.length === 0) return; // No data to show
    
    const ctx = $('deptPieChart')?.getContext?.('2d');
    if (!ctx) return;
    
    if (deptPieChart) { 
      deptPieChart.destroy(); 
      deptPieChart = null; 
    }
    
    deptPieChart = new Chart(ctx, {
      type: 'pie',
      data: { 
        labels: deptLabels, 
        datasets: [{ 
          data: deptData, 
          backgroundColor: deptLabels.map(l => deptColors[l] || '#CCCCCC'),
          borderWidth: 2,
          borderColor: '#fff'
        }] 
      },
      options: { 
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          title: {
            display: true,
            text: 'Collected Fee per Department',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  } catch (err) { console.warn('renderDeptPieChart err', err); }
}

// Render bar chart for event-wise collected fees
function renderEventBarChart(registrations) {
  try {
    const eventMap = {};
    (registrations || []).forEach(r => {
      if (r.status === 'paid') {
        const key = `${r.event}::${r.department}`;
        eventMap[key] = (eventMap[key] || 0) + Number(r.fee || 0);
      }
    });
    
    const eventLabels = [...new Set((registrations || []).map(r => r.event).filter(Boolean))];
    if (eventLabels.length === 0) return; // No data to show
    
    const datasets = Object.entries(eventMap).map(([key, value]) => {
      const [evt, dept] = key.split('::');
      return { 
        label: dept, 
        data: eventLabels.map(l => l === evt ? value : 0), 
        backgroundColor: deptColors[dept] || '#CCCCCC' 
      };
    });
    
    const ctx = $('eventBarChart')?.getContext?.('2d');
    if (!ctx) return;
    
    if (eventBarChart) { 
      eventBarChart.destroy(); 
      eventBarChart = null; 
    }
    
    eventBarChart = new Chart(ctx, {
      type: 'bar',
      data: { 
        labels: eventLabels, 
        datasets 
      },
      options: { 
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          title: {
            display: true,
            text: 'Collected Fee per Event (stacked by Dept)',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        },
        scales: { 
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true }
        }
      }
    });
  } catch (err) { console.warn('renderEventBarChart err', err); }
}

console.log(window.registrationData);


// Render amounts table with detailed breakdown (Department × Event × College)
function renderAmountsTable(registrations, page = 1, pageSize = 10) {
  try {
    const amountsData = (registrations || []).map(r => ({
      department: r.department || '—',
      event: r.event || '—',
      college: r.college || '—',      // ✅ Added College
      total: Number(r.fee) || 0,
      paid: r.status === 'paid' ? Number(r.fee) : 0,
      pending: r.status === 'paid' ? 0 : Number(r.fee)
    }));

    // Compute summary counts
    const totalRegs = registrations.length;
    const pendingRegs = registrations.filter(r => r.status === 'pending').length;
    const paidRegs = registrations.filter(r => r.status === 'paid').length;
    const totalHeadCount = new Set(registrations.map(r => r.email)).size;

    const container = $('amounts-container');
    if (!container) return;

    if (amountsData.length === 0) {
      container.innerHTML = "<p style='text-align:center; padding:20px; color:#666;'>No data available</p>";
      return;
    }

    // Paginate data
    const { pageData } = paginateAmounts(amountsData, page, pageSize);

    // Build table with summary at top
    let html = `
      <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
        <h3 style="margin: 0 0 10px 0;">Summary</h3>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div><strong>Total Registrations:</strong> ${totalRegs}</div>
          <div><strong>Pending:</strong> ${pendingRegs}</div>
          <div><strong>Paid:</strong> ${paidRegs}</div>
          <div><strong>Head Count:</strong> ${totalHeadCount}</div>
        </div>
      </div>
      <table style="width:100%; border-collapse:collapse; margin-top:15px;">
        <thead style="background:var(--accent); color:white;">
          <tr>
            <th style="padding:12px; border:1px solid #ddd;">Department</th>
            <th style="padding:12px; border:1px solid #ddd;">Event</th>
            <th style="padding:12px; border:1px solid #ddd;">Paid Amount</th>
            <th style="padding:12px; border:1px solid #ddd;">Pending Amount</th>
            <th style="padding:12px; border:1px solid #ddd;">Total Fee</th>
            <th style="padding:12px; border:1px solid #ddd;">College</th>
          </tr>
        </thead>
        <tbody>
    `;

    pageData.forEach(row => {
      html += `
        <tr style="background:#f9f9f9;">
          <td style="padding:10px; border:1px solid #ddd;">${escapeHtml(row.department)}</td>
          <td style="padding:10px; border:1px solid #ddd;">${escapeHtml(row.event)}</td>
          <td style="padding:10px; border:1px solid #ddd; color:green; font-weight:bold;">₹${row.paid}</td>
          <td style="padding:10px; border:1px solid #ddd; color:orange; font-weight:bold;">₹${row.pending}</td>
          <td style="padding:10px; border:1px solid #ddd; font-weight:bold;">₹${row.total}</td>
          <td style="padding:10px; border:1px solid #ddd;">${escapeHtml(row.college)}</td>
        </tr>
      `;
    });

    html += '</tbody></table>';

    // Add pagination
    const totalPages = Math.ceil(amountsData.length / pageSize);
    if (totalPages > 1) {
      html += '<div id="amounts-pagination" style="margin:12px 0;text-align:center;"></div>';
    }

    container.innerHTML = html;

    // Render pagination controls
    if (totalPages > 1) {
      renderAmountsPagination(totalPages);
    }
  } catch (err) {
    console.warn('renderAmountsTable err', err);
  }
}


//revamped harts
// ---------- DAILY ANALYTICS CHARTS (revamped) ----------
function _buildRecentDateKeys(days = 14) {
  const keys = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; --i) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

function _groupCountsBy(regs, dateKeys, keyPicker) {
  const map = {};
  regs.forEach(r => {
    const day = r.created_at ? String(r.created_at).slice(0, 10) : null;
    if (!day || !dateKeys.includes(day)) return;
    const key = keyPicker(r);
    if (!key) return;
    if (!map[key]) map[key] = {};
    map[key][day] = (map[key][day] || 0) + 1;
  });
  const out = {};
  Object.keys(map).forEach(series => {
    out[series] = dateKeys.map(d => map[series][d] || 0);
  });
  return out;
}

function _palette(i) {
  const base = [
    '#ff7f11','#1f77b4','#2ca02c','#d62728',
    '#9467bd','#8c564b','#e377c2','#7f7f7f',
    '#bcbd22','#17becf'
  ];
  return base[i % base.length];
}

function _datasets(seriesObj) {
  const keys = Object.keys(seriesObj).sort();
  return keys.map((k, i) => {
    const c = _palette(i);
    return {
      label: k,
      data: seriesObj[k],
      borderColor: c,
      backgroundColor: c + '33',
      pointRadius: 1.5,
      pointHoverRadius: 3,
      tension: 0.35,
      fill: true
    };
  });
}

function _renderLine(existing, canvasId, labels, datasets) {
  const ctx = document.getElementById(canvasId)?.getContext?.('2d');
  if (!ctx) return existing;
  if (existing) existing.destroy();
  return new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false, // required to honor the CSS height
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 14, usePointStyle: true, pointStyle: 'circle' } },
        tooltip: { mode: 'index', intersect: false }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } }
      }
    }
  });
}


let chartDailyDept = null;
let chartDailyEvent = null;
let chartDailyDeptEvent = null;

function renderDailyCharts() {
  const regs = window.registrationData || [];
  const labels = _buildRecentDateKeys(14);

  // per Department
  const deptSeries = _groupCountsBy(regs, labels, r => r.department || 'Unknown');
  const dsDept = _datasets(deptSeries);
  chartDailyDept = _renderLine(chartDailyDept, 'chartDailyDept', labels, dsDept);

  // per Event
  const eventSeries = _groupCountsBy(regs, labels, r => r.event || 'Unknown');
  const dsEvent = _datasets(eventSeries);
  chartDailyEvent = _renderLine(chartDailyEvent, 'chartDailyEvent', labels, dsEvent);

  // Dept × Event (Top 4)
  const keyDE = r => `${r.department || 'Unknown'} — ${r.event || 'Unknown'}`;
  const seriesFull = _groupCountsBy(regs, labels, keyDE);
  const ranked = Object.entries(seriesFull)
    .map(([k, arr]) => [k, arr.reduce((s, v) => s + v, 0)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k]) => k);

  const reduced = {};
  ranked.forEach(k => { reduced[k] = seriesFull[k]; });
  const dsDE = _datasets(reduced);
  chartDailyDeptEvent = _renderLine(chartDailyDeptEvent, 'chartDailyDeptEvent', labels, dsDE);
}





function _renderOrUpdateLineChart(existing, canvasId, labels, datasets, yTitle) {
  const ctx = document.getElementById(canvasId)?.getContext?.('2d');
  if (!ctx) return existing;
  if (existing) { existing.destroy(); }
  return new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { mode: 'index', intersect: false }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      scales: {
        x: { ticks: { autoSkip: true, maxRotation: 0 } },
        y: { beginAtZero: true, title: { display: true, text: yTitle } }
      }
    }
  });
}

function _destroyIf(chartRef) { if (chartRef && chartRef.destroy) chartRef.destroy(); }


function renderAmountsTableByDept(registrations) {
  const stats = {};
  (registrations || []).forEach(r => {
    if (r.status === 'paid') stats[r.department] = (stats[r.department] || 0) + Number(r.fee || 0);
  });
  const container = $('amountsTableContainer'); if (!container) return;
  let html = '<table><thead><tr><th>Department</th><th>Total (₹)</th></tr></thead><tbody>';
  Object.entries(stats).forEach(([dept, amt]) => {
    html += `<tr><td>${escapeHtml(dept)}</td><td>₹${escapeHtml(String(amt))}</td></tr>`;
  });
  html += '</tbody></table>';
  container.innerHTML = html;
}
// ---------- INIT / AUTH ----------
async function checkUserAndInit() {
  setStatus('Checking session...');
  try {
    const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) console.warn('session err', sessionErr);
    if (!session) {
      warn('No session — redirecting to login');
      window.location.href = '/git/dashboards/login.html';
      return;
    }
    const user = session.user;
    let profile = null;
    try {
      const { data, error } = await supabase.from('profiles').select('role,email,disabled').eq('id', user.id).maybeSingle();
      if (error) console.warn('profiles by id error', error);
      if (data) profile = data;
    } catch (err) { console.warn('profiles by id failed', err); }

    if (!profile) {
      try {
        const { data, error } = await supabase.from('profiles').select('role,email,disabled').eq('email', user.email).maybeSingle();
        if (error) console.warn('profiles by email error', error);
        if (data) profile = data;
      } catch (err) { console.warn('profiles by email failed', err); }
    }

    // fallback for super_admin
    if (!profile && user.email && user.email.toLowerCase() === 'convenor@srit.ac.in') {
      profile = { role: 'convenor', email: user.email, disabled: false };
    }

    if (!profile || (profile.role !== 'convenor' && profile.role !== 'super_admin') || profile.disabled === true) {
      warn('profile check failed', profile);
      try { await supabase.auth.signOut(); } catch (_) { }
      window.location.href = '/git/dashboards/login.html';
      return;
    }

    // welcome
    const welcomeEl = $('welcome'); if (welcomeEl) welcomeEl.textContent = `Welcome, ${escapeHtml(profile.email || user.email)}`;

    // load data
    setStatus('Loading data...');
    await loadDashboardData();

   
window.amountsData = (window.registrationData || []).map(r => ({
  department: r.department || 'Unknown',
  event: r.event || 'Unknown',
  email: r.email || '—',        
  college: r.college || '—',     
  total: Number(r.fee || 0),
  paid: r.status === 'paid' ? Number(r.fee || 0) : 0,
  pending: r.status === 'paid' ? 0 : Number(r.fee || 0)
}));

// --------- TOTAL HEADCOUNT (participants) ---------



    const { totalPaid, totalPending } = computeAmountsTotals(window.registrationData || []);
$('totalPaidAmount').textContent = `₹${totalPaid.toLocaleString('en-IN')}`;
$('totalPendingAmount').textContent = `₹${totalPending.toLocaleString('en-IN')}`;
    
    populateEventFilterOptions();
show('dashboard', 'menu-dashboard');
renderDailyCharts();
window.addEventListener('resize', () => {
  if (window.chartDailyDept?.resize) window.chartDailyDept.resize();
  if (window.chartDailyEvent?.resize) window.chartDailyEvent.resize();
  if (window.chartDailyDeptEvent?.resize) window.chartDailyDeptEvent.resize();
});
    // render amounts chart only — DO NOT call renderAmountsTableByDept to avoid overwriting nested Dept→Event table
    renderAmountsChart(window.registrationData || []);
    
    // Ensure amounts table is rendered
    renderAmountsTable(window.registrationData || []);

    // wire forms / handlers
    wireForms();

    // wire table back button and export button - respect window.tablesBackTarget
    const backBtn = $('tables-back'); if (backBtn) backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = window.tablesBackTarget || 'events';
      if (target === 'dashboard') {
        show('dashboard', 'menu-dashboard');
      } else if (target === 'events') {
        show('events', 'menu-events');
        const ed = $('eventDetails'); if (ed) ed.innerHTML = '';
      } else {
        show('events', 'menu-events');
      }
    });
    const exportVisible = $('export-visible-csv'); if (exportVisible) exportVisible.addEventListener('click', exportVisibleCSV);

    setStatus('');
  } catch (err) {
    console.error('checkUserAndInit err', err);
    setStatus('Error checking session (see console)');
  }
}



// ---------- BOOTSTRAP ----------
document.addEventListener('DOMContentLoaded', () => {
  try {
    log('bootstrapping convenor dashboard');
    wireSidebarClicks();
    wireLogout();
    show('dashboard', 'menu-dashboard');
    checkUserAndInit();
    window.supabase = supabase; // debug handle
  } catch (err) { console.error('init err', err); setStatus('Init error'); }
});
function updateDashboardCards() {
  const regs = window.registrationData || [];
  let totalRegs = regs.length;
  let totalAmount = 0;

  regs.forEach(r => {
    if (r.status === 'paid') {
    totalAmount += (r.fee || 0);
    }
  });

  // Update the dashboard summary cards
  const totalCard = document.querySelector('#totalRegs');
  const amountCard = document.querySelector('#totalAmount');

  if (totalCard) totalCard.textContent = totalRegs;
  if (amountCard) amountCard.textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
}
//pagination controls
function renderRegistrationsPagination(totalPages) {
  let container = document.getElementById('registrations-pagination');
  if (!container) {
    container = document.createElement('div');
    container.id = 'registrations-pagination';
    container.style = 'margin:12px 0;text-align:center;';
    const tableContainer = document.getElementById('tableContainer');
    if (tableContainer) tableContainer.appendChild(container);
  }
  container.innerHTML = '';

  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Prev';
  prevBtn.disabled = registrationsCurrentPage === 1;
  prevBtn.onclick = () => {
    if (registrationsCurrentPage > 1) {
      registrationsCurrentPage--;
      showRegistrations(window.lastTableRequest || {});
    }
  };

  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = registrationsCurrentPage === totalPages;
  nextBtn.onclick = () => {
    if (registrationsCurrentPage < totalPages) {
      registrationsCurrentPage++;
      showRegistrations(window.lastTableRequest || {});
    }
  };

  const pageInfo = document.createElement('span');
  pageInfo.textContent = ` Page ${registrationsCurrentPage} of ${totalPages} `;

  container.appendChild(prevBtn);
  container.appendChild(pageInfo);
  container.appendChild(nextBtn);
}

//render department code
function renderDepartmentsCards(departments) {
  const container = $('departmentsCardsContainer'); // make sure you have a div with this id
  if (!container) return;
  container.innerHTML = '';

  // Get registration data to count registrations per department
  const registrations = window.registrationData || [];
  const deptRegCounts = {};
  
  // Helper function to normalize department names for matching
  function normalizeDeptName(name) {
    if (!name) return '';
    const normalized = name.toString().trim().toLowerCase();
    
    // Handle specific cases
    if (normalized.includes('civil')) return 'civil';
    if (normalized.includes('civ') && normalized.length <= 4) return 'civil'; // CIV -> civil
    if (normalized.includes('cse')) return 'cse';
    if (normalized.includes('ece')) return 'ece';
    if (normalized.includes('eee')) return 'eee';
    if (normalized.includes('mech')) return 'mech';
    
    return normalized;
  }
  
  registrations.forEach(r => {
    const dept = r.department || 'Unknown';
    deptRegCounts[dept] = (deptRegCounts[dept] || 0) + 1;
  });
  
  // Create a mapping from normalized names to actual names for better matching
  const normalizedDeptMap = {};
  Object.keys(deptRegCounts).forEach(dept => {
    const normalized = normalizeDeptName(dept);
    if (!normalizedDeptMap[normalized]) {
      normalizedDeptMap[normalized] = [];
    }
    normalizedDeptMap[normalized].push(dept);
  });
  

  departments.forEach(d => {
    // Try exact match first
    let regCount = deptRegCounts[d.name] || 0;
    
    // If no exact match, try normalized matching
    if (regCount === 0) {
      const normalizedDeptName = normalizeDeptName(d.name);
      const matchingDepts = normalizedDeptMap[normalizedDeptName] || [];
      
      // Sum up registrations from all matching department names
      regCount = matchingDepts.reduce((total, matchingDept) => {
        return total + (deptRegCounts[matchingDept] || 0);
      }, 0);
      
    }
    const card = document.createElement('div');
    card.className = 'dept-card';
    card.innerHTML = `
      <h4>${escapeHtml(d.name)}</h4>
      <p class="small-note">${regCount} registrations</p>
      <button class="btn-view-dept-events" data-dept="${escapeHtml(d.name)}">View Events</button>
    `;
    container.appendChild(card);
  });

  // attach click handlers
  container.querySelectorAll('.btn-view-dept-events').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const dept = btn.dataset.dept;
      showDepartmentEvents(dept);
    });
  });
}
window.renderDepartmentsCards = renderDepartmentsCards;
function computeAmountsTotals(registrations) {
  let totalPaid = 0;
  let totalPending = 0;

  (registrations || []).forEach(r => {
    const fee = Number(r.fee || 0);
    if (r.status === 'paid') totalPaid += fee;
    else totalPending += fee;
  });

  return { totalPaid, totalPending };
}


//show events for a department
function showDepartmentEvents(departmentName) {
  const regs = window.registrationData || [];
  const departments = window.departmentsData || [];
  const deptInfo = departments.find(d => d.name === departmentName);
  if (!deptInfo) return;

  const events = Array.isArray(deptInfo.events) ? deptInfo.events : [];
  const container = $('deptEventsContainer');
  if (!container) return;

  let html = `<h3>${escapeHtml(departmentName)} — Events</h3>`;
  if (!events.length) {
    html += `<p class="small-note">No events configured for this department.</p>`;
    container.innerHTML = html;
    container.style.display = 'block';
    return;
  }

  // Build cards with per-event "View registrations" buttons
const deptMap = {
  "CIV": "CIVIL",
  "CSE": "CSE",
  "ECE": "ECE",
  "EEE": "EEE",
  "MEC": "MECH"
};
const dbDept = deptMap[departmentName] || departmentName;

events.forEach(ev => {
  const eventRegs = regs.filter(r => r.department === dbDept && r.event === ev);
  html += `
    <div class="event-section">
      <h4>${escapeHtml(ev)} (${eventRegs.length} registrations)</h4>
      <div class="actions">
        <button class="view-btn btn-view-dept-event"
                data-dept="${escapeHtml(departmentName)}"
                data-event="${escapeHtml(ev)}">
          View registrations
        </button>
      </div>
      </div>
      `;
    
});

  container.innerHTML = html;
  container.style.display = 'block';

  // Delegate click handlers for the event-level view buttons
  // container.querySelectorAll('.btn-view-dept-event').forEach(btn => {
  //   btn.addEventListener('click', (e) => {
  //     e.preventDefault();
  //     const dept = btn.dataset.dept;
  //     const ev = btn.dataset.event;

  //     // Ensure Back returns to Departments
  //     window.tablesBackTarget = 'departments';

  //     // Show the Tables view with department + event applied
  //     showRegistrations({
  //       department: dept,
  //       event: ev,
  //       title: `${ev} — ${dept}`
  //     });
  //   });
  // });
  container.querySelectorAll('.btn-view-dept-event').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const dept = btn.dataset.dept;
    const ev = btn.dataset.event;

    // Ensure the Event filter in Tables reflects the clicked event
    const eventSel = document.getElementById('filterEvent');
    if (eventSel) {
      // Make sure the dropdown has this event; populate if needed
      if (!Array.from(eventSel.options).some(o => o.value === ev)) {
        // Attempt to refresh options from current data
        if (typeof populateEventFilterOptions === 'function') {
          populateEventFilterOptions();
        }
      }
      // Set and trigger change only if value differs
      if (eventSel.value !== ev) {
        eventSel.value = ev;
        // Trigger change so any listeners (pagination reset, etc.) run
        const evt = new Event('change', { bubbles: true });
        eventSel.dispatchEvent(evt);
      }
    }

    // Back should return to Departments
    window.tablesBackTarget = 'departments';

    // Navigate to Tables with department + event context
    showRegistrations({
      department: dept,
      event: ev,
      title: `${ev} — ${dept}`
    });
  });
});

}



window.showDepartmentEvents = showDepartmentEvents;
//integration with side bar
document.querySelector('#menu-departments')?.addEventListener('click', async () => {
  show('departments', 'menu-departments');

  // Load departments data from Supabase if not loaded yet
  if (!window.departmentsData) {
    try {
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (!error && data) window.departmentsData = data;
    } catch (e) { console.warn('fetch departments failed', e); }
  }

  renderDepartmentsCards(window.departmentsData || []);
  $('deptEventsContainer').style.display = 'none'; // hide events section initially
});
 //add edit handler
 function handleEditDepartment(deptId) {
  const dept = window.departmentsData.find(d => d.id == deptId);
  if (!dept) return alert("Department not found!");

  // pre-fill the form
  const form = document.getElementById('department-form');
  form.dept.value = dept.name;
  form.events.value = (dept.events || []).join(', ');

  // mark editing mode
  form.dataset.editing = deptId;

  // change button text
  form.querySelector('button[type="submit"]').textContent = "Update Department";
}

// add delete handler for departments table
async function handleDeleteDepartment(deptId) {
  const dept = window.departmentsData.find(d => d.id == deptId);
  if (!dept) return alert("Department not found!");

  if (!confirm('Are you sure you want to delete this department?')) return;

  // Find the button to disable
  const btn = document.querySelector(`.btn-delete[data-id="${deptId}"]`);
  if (btn) btn.disabled = true;

  try {
    const { error } = await supabase.from('departments').delete().eq('id', deptId);
    if (error) throw error;
    await loadDashboardData();
  } catch (err) {
    console.error('delete department err', err);
    alert('Delete failed — see console');
    if (btn) btn.disabled = false;
  }
}
//filter dropdown
function populateEventFilterOptions() {
  const sel = document.getElementById('filterEvent');
  if (!sel) return;

  const regs = window.registrationData || [];
  const depts = window.departmentsData || [];
  const evSet = new Set();

  // Include events from registrations
  regs.forEach(r => { if (r.event) evSet.add(String(r.event)); });

  // Include events defined on departments (so empty events still show)
  depts.forEach(d => {
    const list = Array.isArray(d.events) ? d.events : [];
    list.forEach(ev => evSet.add(String(ev)));
  });

  const prev = sel.value || 'all';
  sel.innerHTML = '';
  sel.add(new Option('All', 'all'));
  Array.from(evSet).sort((a, b) => a.localeCompare(b)).forEach(ev => {
    sel.add(new Option(ev, ev));
  });
  sel.value = [...evSet].includes(prev) ? prev : 'all';
}

// --- RESET PASSWORD VIA EMAIL --- //
const resetLink = document.getElementById("resetPassword");

resetLink?.addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) {
      alert("⚠️ Could not find your account. Please log in again.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + "/git/dashboards/reset.html", // 👈 redirect page after clicking email link
    });

    if (error) throw error;

    alert("📩 Password reset email sent to " + user.email);
  } catch (err) {
    console.error("Error sending reset email:", err.message);
    alert("⚠️ Failed to send reset email. Try again later.");
  }
});
