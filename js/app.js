const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ---------- state ---------- */
const user = { name: 'Alrich Jay Tapoc', phone: '+63 917 555 0124', city: 'Iligan City' };
const PRICES = { Motorcycle: 80, Car: 120 };
const QUICK = { Home: 'Sta Felomina Iligan City', School: 'MSU-IIT, Tibanga' };
let booking = { dest: 'Sta Felomina Iligan City', vehicle: 'Motorcycle', payment: 'Cash' };
let segFilter = 'Completed';
let currentTrip = null;
let rideRAF = 0, rideStart = 0, rideDone = false;
let refSeq = 24;
const KM = '4.2 km', MINS = '12 mins';

const trips = [
  { date: '3 Nov 2026',  time: '10:24 AM', dest: 'Sta Felomina Iligan City', vehicle: 'Motorcycle', payment: 'Cash', km: '4.2 km', mins: '12 mins', price: 80, status: 'Completed', ref: 'BG-261103-024' },
  { date: '2 Nov 2026',  time: '7:45 AM',  dest: 'MSU-IIT, Tibanga',          vehicle: 'Motorcycle', payment: 'Cash', km: '3.1 km', mins: '9 mins',  price: 65, status: 'Completed', ref: 'BG-261102-023' },
  { date: '31 Oct 2026', time: '4:10 PM',  dest: 'Robinsons Place Iligan',    vehicle: 'Motorcycle', payment: 'Cash', km: '3.8 km', mins: '11 mins', price: 75, status: 'Completed', ref: 'BG-261031-022' },
  { date: '30 Oct 2026', time: '2:15 PM',  dest: 'Poblacion, Iligan City',    vehicle: 'Car',        payment: 'Cash', km: '2.9 km', mins: '8 mins',  price: 60, status: 'Cancelled', ref: 'BG-261030-021' }
];

/* ---------- helpers ---------- */
const peso = n => '₱' + n;
const initials = n => n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
const maskPhone = p => { const d = (p || '').replace(/\D/g, ''); return d.length >= 10 ? '+63 ' + d.slice(2, 5) + ' ••• ' + d.slice(-4) : (p || ''); };
const todayStr = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const nowTime = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const nextRef = () => { refSeq++; const d = new Date(); const stamp = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); return `BG-${stamp}-${String(100 + refSeq).slice(1)}`; };

let toastTimer = 0;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------- navigation ---------- */
function stopRide() { cancelAnimationFrame(rideRAF); rideRAF = 0; }
function go(id) {
  const prev = $('.screen.active');
  if (prev && prev.id === 'riding') stopRide();
  $$('.screen').forEach(s => s.classList.remove('active'));
  const el = $('#' + id);
  el.classList.add('active'); el.scrollTop = 0;
  const phone = $('#phone');
  phone.classList.toggle('nav-on', el.classList.contains('with-nav'));
  $$('.nav-item').forEach(b => b.classList.toggle('on', b.dataset.nav === el.dataset.tab));
  if (id === 'home') renderHome();
  if (id === 'ridebook') renderBooking();
  if (id === 'trips') renderTrips();
  if (id === 'tripdetails') renderTrip();
  if (id === 'profile') renderProfile();
  if (id === 'editprofile') { $('#epName').value = user.name; $('#epMobile').value = user.phone; $('#epAva').textContent = initials(user.name); }
  if (id === 'riding') { renderRide(); startRide(); }
}
function closeDrawer() { $('#drawer').classList.remove('open'); }

/* ---------- renders ---------- */
function renderHome() { $('#homeDest').value = booking.dest; }
function renderBooking() {
  $('#rbDest').textContent = 'My location → ' + booking.dest;
  $('#rbMeta').textContent = KM + ' • ' + MINS;
  $('#rbDestInput').value = booking.dest;
  $$('.veh').forEach(v => v.classList.toggle('on', v.dataset.v === booking.vehicle));
  $('#vpMotor').textContent = peso(PRICES.Motorcycle);
  $('#vpCar').textContent = peso(PRICES.Car);
  $('#payLbl').textContent = '\u00A0' + booking.payment;
}
function renderRide() {
  $('#rdDest').textContent = booking.dest;
  $('#rdPill').textContent = 'Trip route: ' + KM + ' • ' + MINS;
  $('#rmItem').textContent = booking.vehicle + ' • ' + booking.payment;
  $('#rmPrice').textContent = peso(PRICES[booking.vehicle]);
}
function renderComplete(trip) {
  $('#cmDest').textContent = trip.dest;
  $('#cmMeta').textContent = trip.vehicle + ' • ' + trip.km + ' • ' + trip.mins;
  $('#cmFareLbl').textContent = 'Total fare • ' + trip.payment;
  $('#cmFare').textContent = peso(trip.price);
  $$('.star').forEach(s => s.classList.remove('on'));
  $('#cmFeed').value = '';
}
function renderTrips() {
  const list = $('#tripList');
  const data = trips.filter(t => t.status === segFilter);
  if (!data.length) {
    list.innerHTML = `<p style="text-align:center;color:#98A1AC;font-size:15.5px;padding:26px 0">No ${segFilter.toLowerCase()} trips yet.</p>`;
    return;
  }
  list.innerHTML = data.map((t, i) => `
    <article class="trip-card" data-i="${i}">
      <div class="tc-top"><span>${t.date} • ${t.time}</span><span class="badge ${t.status === 'Cancelled' ? 'gray' : ''}">${t.status}</span></div>
      <div class="tc-route">
        <svg class="pin-ic" width="23" height="23" viewBox="0 0 24 24"><use href="#pinmini" width="24" height="24" color="#FF6A13"/></svg>
        <span class="tc-name">${t.dest}</span>
        <svg class="tc-chev" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5.5 6.5 6.5L9 18.5"/></svg>
      </div>
      <div class="tc-meta"><span class="m">${t.vehicle} • ${t.payment} • ${t.km}</span><span class="tc-price">${peso(t.price)}</span></div>
    </article>`).join('');
  list.querySelectorAll('.trip-card').forEach(c => c.addEventListener('click', () => { currentTrip = data[+c.dataset.i]; go('tripdetails'); }));
}
function renderTrip() {
  const t = currentTrip || trips[0];
  $('#duDate').textContent = t.date + ' • ' + t.time;
  const st = $('#duStatus'); st.textContent = t.status; st.classList.toggle('gray', t.status === 'Cancelled');
  $('#duDest').textContent = t.dest;
  $('#duPill').textContent = t.vehicle + ' • ' + t.km + ' • ' + t.mins;
  $('#duFareLbl').textContent = t.vehicle + ' fare';
  $('#duFare').textContent = peso(t.price);
  $('#duMethod').textContent = t.payment;
  $('#duTotal').textContent = peso(t.price);
  $('#duRef').textContent = 'Trip reference: ' + t.ref;
}
function renderProfile() {
  $('#pfAva').textContent = initials(user.name);
  $('#pfName').textContent = user.name;
  $('#pfPhone').textContent = maskPhone(user.phone);
  $('#drvAva').textContent = initials(user.name);
}

/* ---------- ride animation ---------- */
function startRide() {
  const path = $('#rideRt'), veh = $('#rideVeh');
  const L = path.getTotalLength();
  rideDone = false; rideStart = performance.now();
  const step = now => {
    const t = Math.min(1, (now - rideStart) / 9000);
    const p = path.getPointAtLength(t * L);
    veh.setAttribute('transform', `translate(${p.x} ${p.y})`);
    if (t < 1 && !rideDone) { rideRAF = requestAnimationFrame(step); }
    if (t >= 1 && !rideDone) { rideDone = true; finishRide(); }
  };
  rideRAF = requestAnimationFrame(step);
}
function finishRide() {
  stopRide();
  const trip = { date: todayStr(), time: nowTime(), dest: booking.dest, vehicle: booking.vehicle, payment: booking.payment, km: KM, mins: MINS, price: PRICES[booking.vehicle], status: 'Completed', ref: nextRef() };
  trips.unshift(trip); currentTrip = trip;
  renderComplete(trip);
  go('complete');
  toast('You have arrived!');
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g) { closeDrawer(); go(g.dataset.go); return; }
  const a = e.target.closest('[data-act]');
  if (a) toast(a.dataset.act);
  const eye = e.target.closest('[data-eye]');
  if (eye) { const inp = $('#' + eye.dataset.eye); inp.type = inp.type === 'password' ? 'text' : 'password'; }
});

$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!$('#lgMobile').value.trim() || !$('#lgPass').value.trim()) return toast('Enter your mobile number and password');
  go('home'); toast('Welcome back, ' + user.name.split(' ')[0] + '!');
});
$('#registerForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#rgName').value.trim(), mob = $('#rgMobile').value.trim(), pass = $('#rgPass').value;
  if (!name || !mob || !pass) return toast('Fill in all fields to create an account');
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(pass)) return toast('Use 8+ characters with a mix of letters and numbers');
  user.name = name; user.phone = mob;
  renderProfile(); go('home'); toast('Account created — welcome aboard!');
});
$('#fpForm').addEventListener('submit', e => {
  e.preventDefault();
  if (!$('#fpMobile').value.trim()) return toast('Enter the mobile number of your account');
  $('#fpSub').textContent = maskPhone($('#fpMobile').value);
  toast('Recovery code sent to your mobile number');
  go('forgot2');
});
$$('.code-box').forEach((box, i, all) => {
  box.addEventListener('input', () => {
    box.value = box.value.replace(/\D/g, '').slice(0, 1);
    if (box.value && all[i + 1]) all[i + 1].focus();
  });
  box.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !box.value && all[i - 1]) all[i - 1].focus();
  });
});
$('#btnVerify').addEventListener('click', () => {
  const code = $$('.code-box').map(b => b.value).join('');
  if (code.length < 6) return toast('Enter the six-digit code');
  go('forgot3');
});
$('#btnResend').addEventListener('click', () => toast('A new recovery code was sent to your mobile'));
$('#resetForm').addEventListener('submit', e => {
  e.preventDefault();
  const a = $('#fpNew').value, b = $('#fpConf').value;
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(a)) return toast('Use 8+ characters with a mix of letters and numbers');
  if (a !== b) return toast('Passwords do not match');
  toast('Password updated — log in with your new password');
  go('login');
});

/* editable destination rows (home + booking) */
function attachEdit(input, chip, onDone) {
  let on = false;
  chip.addEventListener('click', () => {
    on = !on;
    chip.textContent = on ? 'Save' : 'Edit';
    if (on) { input.removeAttribute('readonly'); input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    else { input.setAttribute('readonly', ''); onDone(input.value.trim() || input.defaultValue); }
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); chip.click(); } });
}
attachEdit($('#homeDest'), $('#homeEdit'), v => { booking.dest = v; toast('Destination updated'); });
attachEdit($('#rbDestInput'), $('#rbEdit'), v => { booking.dest = v; renderBooking(); toast('Destination updated'); });

$$('.choice').forEach(b => b.addEventListener('click', () => {
  booking.dest = QUICK[b.dataset.quick]; renderHome(); toast('Destination set to ' + booking.dest);
}));
$('#btnFind').addEventListener('click', () => { renderBooking(); go('ridebook'); });
$$('.veh').forEach(v => v.addEventListener('click', () => { booking.vehicle = v.dataset.v; renderBooking(); }));
$('#payRow').addEventListener('click', () => {
  booking.payment = booking.payment === 'Cash' ? 'GCash' : 'Cash';
  renderBooking();
});
$('#btnConfirm').addEventListener('click', () => { rideDone = false; go('riding'); });

$('#btnShare').addEventListener('click', () => toast('Trip link copied — share it with someone you trust'));
$('#btnSos').addEventListener('click', () => toast('SOS sent — your emergency contacts were alerted'));
$('#btnDone').addEventListener('click', () => { go('home'); toast('Trip saved to your history'); });
$('#cmReceipt').addEventListener('click', () => { currentTrip = currentTrip || trips[0]; go('tripdetails'); });
$$('.star').forEach(s => s.addEventListener('click', () => {
  const r = +s.dataset.s;
  $$('.star').forEach(x => x.classList.toggle('on', +x.dataset.s <= r));
}));
$('#btnHelp').addEventListener('click', () => toast('Our support team will reach out shortly'));

$$('.seg button').forEach(b => b.addEventListener('click', () => {
  $$('.seg button').forEach(x => x.classList.remove('on'));
  b.classList.add('on'); segFilter = b.dataset.f; renderTrips();
}));

$('#btnMenu').addEventListener('click', () => $('#drawer').classList.add('open'));
$('#drawerScrim').addEventListener('click', closeDrawer);
$('#drawerSignout').addEventListener('click', () => signout());
$('#btnSignout').addEventListener('click', () => signout());
function signout() { closeDrawer(); toast('Signed out'); go('login'); }

$('#epForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#epName').value.trim(), mob = $('#epMobile').value.trim();
  if (!name || !mob) return toast('Name and mobile number are required');
  user.name = name; user.phone = mob;
  renderProfile(); go('profile'); toast('Profile updated');
});
