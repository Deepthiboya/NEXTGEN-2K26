// forms.js (ES module)
// IMPORTANT: replace below with your actual Supabase project values
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://jkqxisgkngxqlwuojuul.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcXhpc2drbmd4cWx3dW9qdXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTMxODgsImV4cCI6MjA3NDU2OTE4OH0.88ga7OV0KRK44PlAdo3tOZzxARHdSYNBZqp1AIj43vY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ===== department → events mapping (with event codes & member counts) =====
   Keys for departments MUST match the <option value="..."> in the HTML.
*/
const deptEvents = {
  "CSE": {
    "Hackathon":        { code: "hk",  members: 3, fee: 300 },
    "Paper Presentation":{ code: "pp", members: 2, fee: 200 },
    "Crossword Puzzle": { code: "cw",  members: 1, fee: 100 }
  },
  "ECE": {
    "IoT Hackathon":    { code: "iot", members: 3, fee: 300 },
    "Paper Presentation":{ code: "pp", members: 2, fee: 200 },
    "Circuit Master Quiz": { code: "cm", members: 2, fee: 200 }
  },
  "EEE": {
    "Tinkercad Masters":{ code: "tk",  members: 3, fee: 300 },
    "Paper Presentation":{ code: "pp", members: 2, fee: 200 },
    "MindSpark Quiz":   { code: "ms",  members: 3, fee: 300 }
  },
  "MEC": {
    "Model Expo":       { code: "me",  members: 3, fee: 300 },
    "Paper Presentation":{ code: "pp", members: 2, fee: 200 },
    "Technical Quiz":   { code: "tq",  members: 1, fee: 100 }
  },
  "CIV": {
    "Bridge Blitz":     { code: "bb",  members: 3, fee: 300 },
    "Paper Presentation":{ code: "pp", members: 2, fee: 200 },
    "Technical Quiz":   { code: "tq",  members: 1, fee: 100 }
  }
};

/* ===== UI elements ===== */
const departmentEl = document.getElementById('department');
const eventSelectEl = document.getElementById('eventSelect');
const feeEl = document.getElementById('fee');
const membersBlock = document.getElementById('membersBlock');
const regForm = document.getElementById('regForm');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMsg = document.getElementById('statusMsg');

/* helper to show status */
function showStatus(msg, isError = false) {
  statusMsg.textContent = msg;
  statusMsg.style.color = isError ? '#7a1220' : '#083c32';
}

/* populate events when dept changes */
departmentEl.addEventListener('change', () => {
  const d = (departmentEl.value || '').trim();
  eventSelectEl.innerHTML = '<option value="">Select event</option>';
  feeEl.value = '';
  membersBlock.innerHTML = '';

  if (!d) return;
  const events = deptEvents[d];
  if (!events) {
    showStatus('No events configured for chosen department', true);
    return;
  }

  // fill dropdown
  Object.keys(events).forEach(evName => {
    const opt = document.createElement('option');
    opt.value = evName;
    opt.textContent = evName;
    eventSelectEl.appendChild(opt);
  });

  showStatus('');
});

/* when event is chosen update fee & members fields */
eventSelectEl.addEventListener('change', () => {
  const dept = (departmentEl.value || '').trim();
  const ev = eventSelectEl.value;
  membersBlock.innerHTML = '';

  if (!dept || !ev) {
    feeEl.value = '';
    return;
  }
  const info = deptEvents[dept] && deptEvents[dept][ev];
  if (!info) {
    feeEl.value = '';
    showStatus('Configuration missing for this dept/event', true);
    return;
  }

  // update fee
  feeEl.value = info.fee;

  // create member inputs for member2..memberN (leader is member1)
  if (info.members > 1) {
    // explanatory text
    const note = document.createElement('div');
    note.className = 'member-note';
    note.style.fontSize = '13px';
    note.style.marginBottom = '8px';
    note.textContent = `This event needs ${info.members} members (leader + ${info.members - 1} other). Provide other member names below.`;
    membersBlock.appendChild(note);

    for (let i = 2; i <= info.members; i++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'member-row';
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.id = `member${i}_name`;
      inp.name = `member${i}_name`;
      inp.placeholder = `Member ${i} Name`;
      inp.required = true;
      wrapper.appendChild(inp);
      membersBlock.appendChild(wrapper);
    }
  }
});

/* Reset */
resetBtn.addEventListener('click', () => {
  regForm.reset();
  eventSelectEl.innerHTML = '<option value="">Select event</option>';
  feeEl.value = '';
  membersBlock.innerHTML = '';
  showStatus('');
});

/* ===== UTR generator =====
  Pattern: cash<DEPT><EVENTCODE><NNN>
  e.g. cashCSEhk001
  When user leaves UTR blank we auto-generate by fetching existing utrs with same prefix.
*/
async function generateNextUTR(dept, eventCode) {
  const prefix = `cash${dept}${eventCode}`;

  // fetch utr_number column for this prefix (limit 1000 — enough for contests)
  // using ilike to be case-insensitive
  const { data, error } = await supabase
    .from('registrations')
    .select('utr_number')
    .ilike('utr_number', `${prefix}%`)
    .limit(1000);

  if (error) {
    console.error('UTR fetch error', error);
    // fallback to starting number
    return `${prefix}001`;
  }

  // extract numeric suffixes and find max
  let max = 0;
  (data || []).forEach(r => {
    const u = r.utr_number || '';
    // find digits at end
    const m = u.match(/(\d{1,})$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });

  const next = (max + 1);
  const padded = String(next).padStart(3, '0');
  return `${prefix}${padded}`;
}

/* submit handler */
regForm.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  showStatus('');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    // basic validation
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const student_id = document.getElementById('student_id').value.trim();
    const department = (document.getElementById('department').value || '').trim();
    const eventName = document.getElementById('eventSelect').value;
    const college = document.getElementById('college').value.trim();
    let fee = document.getElementById('fee').value;
    let utrProvided = document.getElementById('utr_number').value.trim();

    if (!name || !email || !department || !eventName || !college) {
      showStatus('Please fill required fields (name, email, department, event, college).', true);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Register & Generate UTR';
      return;
    }

    const info = deptEvents[department] && deptEvents[department][eventName];
    if (!info) {
      showStatus('Event configuration not found — choose department/event again.', true);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Register & Generate UTR';
      return;
    }

    fee = info.fee;

    // collect members JSON (member1 = leader is name field)
    const members = {};
    members['member1_name'] = name;
    for (let i = 2; i <= info.members; i++) {
      const val = document.getElementById(`member${i}_name`)?.value?.trim() || null;
      members[`member${i}_name`] = val;
    }

    // determine UTR: if provided use that; otherwise auto-generate
    let finalUTR = utrProvided || await generateNextUTR(department, info.code);

    // Build payload to insert
    const payload = {
      name,
      email,
      phone: phone || null,
      student_id: student_id || null,
      department,
      event: eventName,
      fee,
      utr_number: finalUTR,
      status: 'paid',
      created_at: new Date().toISOString(),
      members,
      college
    };

    // Insert
    const { data: insertData, error: insertError } = await supabase
      .from('registrations')
      .insert([payload]);

    if (insertError) {
      console.error('Insert error', insertError);
      showStatus('Registration failed: ' + insertError.message, true);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Register & Generate UTR';
      return;
    }

    showStatus(`Registration Successfull✅ `);
    alert('Registration Successful!');
    regForm.reset();
    eventSelectEl.innerHTML = '<option value="">Select event</option>';
    feeEl.value = '';
    membersBlock.innerHTML = '';
  } catch (err) {
    console.error(err);
    showStatus('Unexpected error — check console', true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Register & Generate UTR';
  }
});
