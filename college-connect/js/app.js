/* =========================================================
   College Connect - application logic (needs js/data.js first)
   Each page sets <body data-page="..."> and PAGES[page] runs it.
   Demo only: the LocalStorage login is NOT real security.
   ========================================================= */
(function () {
  "use strict";

  const D = window.CC_DATA;
  const SESSION_KEY = "cc_session";      // only the student ID is stored, never the password
  const SUBMIT_KEY = "cc_submitted_";    // + studentId
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const setText = (id, v) => { $("#" + id).textContent = v; };
  const setHTML = (id, v) => { $("#" + id).innerHTML = v; };
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch { return false; } },
    del: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } }
  };
  const debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const pct = (a, c) => (c ? (a / c) * 100 : 0);
  const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const todayStr = () => ccDay(0);
  const fmtDate = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); };
  const timeNow = (d = new Date()) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const to12 = (t) => { const [h, m] = t.split(":").map(Number); return new Date(2000, 0, 1, h, m).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }); };
  function toast(msg) {
    const t = Object.assign(document.createElement("div"), { className: "toast", textContent: msg, role: "status" });
    document.body.append(t);
    setTimeout(() => t.remove(), 2600);
  }

  /* ---------- auth (demo) ---------- */
  const Auth = {
    login(id, pw) {
      const s = D.students.find((x) => x.id.toLowerCase() === id.trim().toLowerCase() && x.password === pw);
      if (s) store.set(SESSION_KEY, s.id);
      return !!s;
    },
    current: () => D.students.find((x) => x.id === store.get(SESSION_KEY)) || null,
    logout() { store.del(SESSION_KEY); location.href = "index.html"; }
  };

  /* ---------- assignment storage: optional server, else LocalStorage ---------- */
  const Submissions = {
    local(id) {
      try { const a = JSON.parse(store.get(SUBMIT_KEY + id)); if (Array.isArray(a)) return a; } catch { /* use default */ }
      return D.defaultSubmitted.slice();
    },
    async load(id) {
      try {
        const r = await fetch("/api/submissions/" + encodeURIComponent(id), { cache: "no-store" });
        const j = r.ok ? await r.json() : null;
        if (j && Array.isArray(j.submitted)) return { list: j.submitted, source: "server" };
      } catch { /* no backend */ }
      return { list: Submissions.local(id), source: "local" };
    },
    async save(id, list) {
      const ok = store.set(SUBMIT_KEY + id, JSON.stringify(list));
      try {
        const r = await fetch("/api/submissions/" + encodeURIComponent(id), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submitted: list }) });
        if (r.ok) return "server";
      } catch { /* ignore */ }
      return ok ? "local" : "failed";
    }
  };

  /* ---------- calculations ---------- */
  const attendanceSummary = () => {
    const attended = D.attendance.reduce((s, x) => s + x.attended, 0);
    const conducted = D.attendance.reduce((s, x) => s + x.conducted, 0);
    return { attended, conducted, percent: pct(attended, conducted) };
  };
  const assignmentState = (a, done) => (done.includes(a.id) ? "Submitted" : ccDay(a.dueOffset) < todayStr() ? "Overdue" : "Pending");
  const todaysClasses = () => D.timetable[DAYS[new Date().getDay()]] || [];
  const nextClass = () => { const n = new Date(); const m = n.getHours() * 60 + n.getMinutes(); return todaysClasses().find((p) => toMin(p.start) > m) || null; };

  /* ---------- simulated bus ---------- */
  const Bus = {
    progress: {},
    start: (bus) => [0.3, 0.55, 0.15][bus.routeId.charCodeAt(1) % 3],
    get: (bus) => Bus.progress[bus.routeId] ?? Bus.start(bus),
    step(bus) { const p = Bus.get(bus); Bus.progress[bus.routeId] = p >= 1 ? 0 : Math.min(1, p + 0.02); },
    snapshot(bus) {
      const p = Bus.get(bus), segs = bus.stops.length - 1;
      const f = Math.min(p, 0.9999) * segs, i = Math.floor(f), t = f - i;
      const a = bus.stops[i], b = bus.stops[i + 1];
      const mins = Math.round((1 - p) * 45), arrived = p >= 0.999;
      return {
        progress: p, segment: i, arrived,
        lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t,
        status: arrived ? "Arrived" : "On the way",
        eta: arrived ? "Arrived" : to12(bus.stops[bus.stops.length - 1].time),
        mins, current: a.name, next: b.name
      };
    }
  };

  /* ---------- shell: sidebar + top bar ---------- */
  const ICON = {
    dashboard: '<path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"/>',
    academic: '<path d="M4 5a2 2 0 012-2h13v15H6a2 2 0 00-2 2zM4 20a2 2 0 002 2h13v-4"/><path d="M9 8h6"/>',
    bus: '<path d="M5 3h14a1 1 0 011 1v13H4V4a1 1 0 011-1zM4 11h16M7 21v-4M17 21v-4"/><circle cx="8" cy="14" r=".6"/><circle cx="16" cy="14" r=".6"/>',
    assignments: '<path d="M9 3h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h4"/>'
  };
  const NAV = [["dashboard", "Dashboard"], ["academic", "Academic"], ["bus", "Bus tracking"], ["assignments", "Assignments"]];
  const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
  const initials = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");

  function buildShell(student, page) {
    const nav = NAV.map(([k, label]) => `<a href="${k}.html" class="${k === page ? "active" : ""}" ${k === page ? 'aria-current="page"' : ""}>${svg(k)}<span>${label}</span></a>`).join("");
    const shell = document.createElement("div");
    shell.className = "app";
    shell.innerHTML = `
      <aside class="sidebar"><div class="brand"><span class="logo"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON.bus}</svg></span><span>FMCET Campus<small>Student &amp; campus transport</small></span></div><nav class="nav" aria-label="Main">${nav}</nav></aside>
      <div class="main"><header class="topbar"><span class="mini-brand">FMCET Campus</span>
        <div class="who"><div class="who-text"><strong>${esc(student.name)}</strong><small>${esc(student.id)}</small></div><div class="avatar" aria-hidden="true">${esc(initials(student.name))}</div>
        <button class="btn secondary small" id="logoutBtn">Log out</button></div></header>
        <main class="content" id="content"></main></div>`;
    const page$ = $("#page-content");
    $("#content", shell).append(page$);
    page$.hidden = false;
    document.body.append(shell);
    $("#logoutBtn").onclick = Auth.logout;
  }

  /* ---------- pages ---------- */
  const PAGES = {
    login() {
      if (Auth.current()) return void (location.href = "dashboard.html");
      const [idEl, pwEl] = [$("#studentId"), $("#password")];
      $("#togglePw").onclick = (e) => { const show = pwEl.type === "password"; pwEl.type = show ? "text" : "password"; e.target.textContent = show ? "Hide" : "Show"; };
      $("#fillDemo").onclick = () => { idEl.value = "CS2301"; pwEl.value = "demo123"; };
      $("#loginForm").onsubmit = (e) => {
        e.preventDefault();
        setText("idError", /^[A-Za-z]{2}\d{4}$/.test(idEl.value.trim()) ? "" : "Enter an ID like CS2301 (2 letters, 4 digits).");
        setText("pwError", pwEl.value.length >= 6 ? "" : "Password must be at least 6 characters.");
        const msg = $("#loginMsg");
        msg.hidden = true;
        if ($("#idError").textContent || $("#pwError").textContent) return;
        if (Auth.login(idEl.value, pwEl.value)) location.href = "dashboard.html";
        else { msg.hidden = false; msg.textContent = "Student ID or password is incorrect. Check them and try again."; }
      };
    },

    async dashboard(s) {
      const att = attendanceSummary();
      const { list } = await Submissions.load(s.id);
      const pending = D.assignments.filter((a) => assignmentState(a, list) !== "Submitted").length;
      const nxt = nextClass(), classes = todaysClasses();
      const bus = D.buses.find((b) => b.routeId === s.busRouteId) || D.buses[0];
      const snap = Bus.snapshot(bus), low = att.percent < D.attendanceThreshold;
      const last = bus.stops[bus.stops.length - 1];

      setText("welcome", `Welcome back, ${s.name.split(" ")[0]}`);
      setText("dateLine", `${DAYS[new Date().getDay()]}, ${fmtDate(todayStr())}. ${s.department}, year ${s.year}, semester ${s.semester}. Reg. no ${s.registerNo}.`);
      setHTML("ticketMain", `<h2>${esc(bus.routeName)}</h2><div class="ticket-meta">${esc(bus.regNo)} &middot; ${snap.status} &middot; simulated</div>
        <div class="leg"><div class="stop">${esc(snap.current)}<small>Now near</small></div><div class="line"><span style="width:${(snap.progress * 100).toFixed(0)}%"></span></div><div class="stop" style="text-align:right">${esc(last.name)}<small>Destination</small></div></div>`);
      setText("ticketEta", snap.eta);
      setText("ticketNote", snap.arrived ? "Bus is at campus" : `about ${snap.mins} min away`);

      const ring = $("#ring");
      ring.style.setProperty("--p", att.percent.toFixed(1));
      ring.classList.toggle("low", low);
      setText("statAttendance", Math.round(att.percent) + "%");
      setHTML("statAttendanceNote", `${att.attended} of ${att.conducted} classes attended ${low ? '<span class="badge bad">Below ' + D.attendanceThreshold + "%</span>" : '<span class="badge ok">On track</span>'}`);

      setText("statPending", pending);
      setText("statNext", nxt ? nxt.start : "None");
      setText("statNextNote", nxt ? `${nxt.subject}, ${nxt.room}` : "No more classes today");
      setText("statToday", classes.length);

      setHTML("todayClasses", classes.length
        ? classes.map((p) => `<div class="list-item"><span class="time">${p.start} - ${p.end}</span><strong>${esc(p.subject)}</strong><br><small>${esc(p.faculty)} &middot; ${esc(p.room)}</small></div>`).join("")
        : `<div class="empty">No classes today. Enjoy the day off.</div>`);
      setHTML("notices", D.announcements.map((n) => `<div class="list-item"><strong>${esc(n.title)}</strong><br><small>${fmtDate(n.date)}</small><br>${esc(n.text)}</div>`).join(""));
    },

    academic() {
      const tabs = $$(".tab");
      tabs.forEach((t) => (t.onclick = () => {
        tabs.forEach((x) => x.classList.toggle("active", x === t));
        $$("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== t.dataset.tab));
      }));

      const daySel = $("#daySelect"), days = Object.keys(D.timetable);
      daySel.innerHTML = days.map((d) => `<option>${d}</option>`).join("");
      const today = DAYS[new Date().getDay()];
      daySel.value = days.includes(today) ? today : days[0];
      const renderDay = () => setHTML("timetableBody", (D.timetable[daySel.value] || []).map((p) =>
        `<tr><td><span class="time">${p.start} - ${p.end}</span></td><td><strong>${esc(p.subject)}</strong></td><td>${esc(p.faculty)}</td><td>${esc(p.room)}</td></tr>`).join("")
        || `<tr><td colspan="4" class="empty">No classes on this day.</td></tr>`);
      daySel.onchange = renderDay; renderDay();

      const sum = attendanceSummary(), th = D.attendanceThreshold;
      setText("overallPct", sum.percent.toFixed(1) + "%");
      setText("overallNote", `${sum.attended} attended of ${sum.conducted} conducted`);
      const lowSubjects = D.attendance.filter((a) => pct(a.attended, a.conducted) < th).map((a) => a.subject);
      $("#attWarn").hidden = !lowSubjects.length && sum.percent >= th;
      setText("lowList", lowSubjects.length ? `Low in: ${lowSubjects.join(", ")}.` : "");
      setHTML("attendanceBody", D.attendance.map((a) => {
        const p = pct(a.attended, a.conducted), low = p < th;
        return `<tr><td><strong>${esc(a.subject)}</strong></td><td>${a.attended}</td><td>${a.conducted}</td><td>${p.toFixed(1)}%</td>
          <td style="min-width:120px"><div class="progress"><span class="${low ? "low" : ""}" style="width:${Math.min(100, p)}%"></span></div></td>
          <td><span class="badge ${low ? "bad" : "ok"}">${low ? "Below " + th + "%" : "OK"}</span></td></tr>`;
      }).join(""));

      const renderMaterials = () => {
        const q = $("#matSearch").value.trim().toLowerCase();
        const items = D.materials.map((m, i) => [m, i]).filter(([m]) => `${m.subject} ${m.title}`.toLowerCase().includes(q));
        setHTML("materialList", items.length
          ? items.map(([m, i]) => `<div class="list-item row"><div class="grow"><strong>${esc(m.title)}</strong><br><small>${esc(m.subject)} &middot; ${esc(m.type)}</small></div><button class="btn small" data-open="${i}">${m.type === "Link" ? "Open link" : "Open or download"}</button></div>`).join("")
          : `<div class="empty">No materials match "${esc(q)}". Try a subject name.</div>`);
      };
      $("#matSearch").oninput = debounce(renderMaterials);
      $("#materialList").onclick = (e) => {
        const b = e.target.closest("[data-open]");
        if (!b) return;
        const m = D.materials[+b.dataset.open];
        if (m.url) window.open(m.url, "_blank", "noopener"); else toast("This file is not uploaded yet (demo placeholder).");
      };
      renderMaterials();
    },

    async assignments(s) {
      let filter = "All";
      const res = await Submissions.load(s.id);
      let done = res.list;
      $("#asgLoading").hidden = true;
      setText("asgSource", res.source === "server" ? "Saved on the demo server." : "Saved in this browser.");

      const render = () => {
        const q = $("#asgSearch").value.trim().toLowerCase();
        const counts = { Pending: 0, Overdue: 0, Submitted: 0 };
        const rows = [];
        D.assignments.forEach((a) => {
          const st = assignmentState(a, done);
          counts[st]++;
          if ((filter === "All" || st === filter) && `${a.title} ${a.subject}`.toLowerCase().includes(q)) rows.push([a, st]);
        });
        setText("asgCounts", `${counts.Pending} pending, ${counts.Overdue} overdue, ${counts.Submitted} submitted`);
        setHTML("asgList", rows.length ? rows.map(([a, st]) => `
          <div class="card asg s-${st}"><div class="row"><div class="grow"><h3>${esc(a.title)}</h3><small>${esc(a.subject)}</small></div>
            <span class="badge ${st === "Submitted" ? "ok" : st === "Overdue" ? "bad" : "warn"}">${st}</span></div>
            <p>${esc(a.description)}</p>
            <div class="row"><small class="grow">Assigned ${fmtDate(ccDay(a.assignedOffset))} &middot; Due ${fmtDate(ccDay(a.dueOffset))}</small>
            <button class="btn ${st === "Submitted" ? "secondary" : ""} small" data-toggle="${a.id}">${st === "Submitted" ? "Mark as not submitted" : "Mark as submitted"}</button></div></div>`).join("")
          : `<div class="card empty">No assignments match. Clear the search or choose All.</div>`);
      };
      $$("[data-filter]").forEach((b) => (b.onclick = () => {
        filter = b.dataset.filter;
        $$("[data-filter]").forEach((x) => x.classList.toggle("active", x === b));
        render();
      }));
      $("#asgSearch").oninput = debounce(render);
      $("#asgList").onclick = async (e) => {
        const b = e.target.closest("[data-toggle]");
        if (!b) return;
        const id = b.dataset.toggle;
        done = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
        const where = await Submissions.save(s.id, done);
        const msg = $("#asgMsg");
        msg.hidden = false;
        msg.className = "notice " + (where === "failed" ? "bad" : "ok");
        msg.textContent = where === "failed" ? "Could not save. Browser storage is unavailable." : "Status updated. This is a demo status; no file was uploaded.";
        render();
      };
      render();
    },

    bus(s) {
      let bus = D.buses.find((b) => b.routeId === s.busRouteId) || D.buses[0];
      let map, pin, timer, unsubscribe, last = new Date();
      const sel = $("#routeSelect"), auto = $("#autoToggle");
      sel.innerHTML = D.buses.map((b) => `<option value="${b.routeId}">${esc(b.routeName)}</option>`).join("");
      sel.value = bus.routeId;

      function setupMap() {
        if (typeof L === "undefined") { setHTML("map", '<div class="map-fallback"><div class="notice warn">The map could not load (no internet?). The route list below still works.</div></div>'); return; }
        map?.remove();
        map = L.map("map");
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" })
          .on("tileerror", () => ($("#mapNote").hidden = false)).addTo(map);
        const pts = bus.stops.map((p) => [p.lat, p.lng]);
        L.polyline(pts, { color: "#0f1f3d", weight: 5, opacity: 0.8 }).addTo(map);
        bus.stops.forEach((p) => L.circleMarker([p.lat, p.lng], { radius: 7, color: "#0f1f3d", fillColor: "#fff", fillOpacity: 1, weight: 3 }).addTo(map).bindPopup(`<strong>${esc(p.name)}</strong><br>Scheduled ${p.time}`));
        map.fitBounds(pts, { padding: [30, 30] });
        pin = L.marker(pts[0], { title: "Simulated bus", icon: L.divIcon({ className: "", html: `<div class="bus-pin"><svg viewBox="0 0 24 24">${ICON.bus}</svg></div>`, iconSize: [34, 34], iconAnchor: [17, 17] }) }).addTo(map);
      }
      function render() {
        const p = Bus.snapshot(bus);
        setText("busReg", bus.regNo); setText("busStatus", p.status); setText("busCurrent", p.current);
        setText("busNext", p.next); setText("busEta", `${p.eta} (about ${p.mins} min)`); setText("busUpdated", last.toLocaleTimeString("en-IN"));
        $("#routeBar").style.width = (p.progress * 100).toFixed(0) + "%";
        setText("routePct", (p.progress * 100).toFixed(0) + "% of the route covered");
        setHTML("stopList", bus.stops.map((st, i) => `<li class="${i <= p.segment ? "done" : ""}${i === p.segment ? " current" : ""}"><strong>${esc(st.name)}</strong> <small>scheduled ${st.time}</small></li>`).join(""));
        pin?.setLatLng([p.lat, p.lng]);
      }
      const tick = () => { Bus.step(bus); last = new Date(); render(); };
      const run = () => { clearInterval(timer); if (auto.checked && !document.hidden) timer = setInterval(tick, 3000); };
      function goLive() {   // optional: real positions from Firebase (see README); keeps simulation if absent
        unsubscribe?.();
        unsubscribe = window.CC_LIVE?.subscribe(bus.routeId, (d) => {
          auto.checked = false; clearInterval(timer);
          pin?.setLatLng([d.lat, d.lng]); map?.panTo([d.lat, d.lng]);
          last = d.updatedAt?.toDate?.() || new Date();
          setText("busUpdated", last.toLocaleTimeString("en-IN")); setText("busStatus", "Live");
        });
      }
      sel.onchange = () => { bus = D.buses.find((b) => b.routeId === sel.value); setupMap(); last = new Date(); render(); goLive(); };
      $("#refreshBtn").onclick = () => { tick(); toast("Simulated location refreshed."); };
      auto.onchange = run;
      document.addEventListener("visibilitychange", run);   // pause when the tab is hidden
      setupMap(); render(); run(); setTimeout(goLive, 1000);
    }
  };

  /* ---------- start ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;
    if (page === "login") return PAGES.login();
    const student = Auth.current();
    if (!student) return void location.replace("index.html");   // page guard (frontend only)
    buildShell(student, page);
    PAGES[page]?.(student);
  });
})();
