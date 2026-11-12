"use strict";
/* Lernstudio – kurze Lektionen (Vortest → Lesen → Abfrage), Wiederholung nach Plan, freies Üben, Prüfungsmodus.
   Alles statisch; Fortschritt nur im localStorage dieses Browsers. */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const TYPES = { mc: 'Multiple Choice', tf: 'Richtig/Falsch', cloze: 'Lückentext', order: 'Reihenfolge', match: 'Zuordnen', open: 'Offene Frage' };
const RECALL = { cloze: 0, open: 1, order: 2, match: 3, tf: 4, mc: 5 }; // Abruf vor Wiedererkennen
const DAY = 864e5, STEP = [0, 1, 3, 7, 14, 30];
const LEVEL = ['Neu', 'Versucht', 'Vertraut', 'Sicher', 'Gemeistert'];
const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const store = { get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };

/* ---------- Zustand ---------- */
const G = Object.assign({ days: {} }, store.get('lernstudio:g', {}));
G.opt = Object.assign({ theme: 'system', motion: true, big: false, conf: false }, G.opt || {});
const saveG = () => store.set('lernstudio:g', G);
let TOPICS = [], T = null, CH = [], Q = [], QBY = {}, SEC = {}, CHBY = {}, LESSONS = [], LBY = {}, S = null;
const tkey = slug => 'lernstudio:t:' + slug;
const saveS = () => T && store.set(tkey(T.slug), S);

async function loadIndex() { if (TOPICS.length) return; const r = await fetch('themen/index.json'); TOPICS = (await r.json()).topics; }
async function loadTopic(slug) {
  const r = await fetch('themen/' + encodeURIComponent(slug) + '.json'); if (!r.ok) throw new Error('nicht gefunden');
  T = await r.json(); CH = T.chapters; Q = []; QBY = {}; SEC = {}; CHBY = {}; LESSONS = []; LBY = {};
  CH.forEach(c => { CHBY[c.id] = c; c.sections.forEach(s => SEC[c.id + '|' + s.id] = s); c.questions.forEach(q => { Q.push(q); QBY[q.id] = q; }); });
  // Lektionen: aufeinanderfolgende Abschnitte, bis genug Fragen für eine kurze Einheit beisammen sind
  CH.forEach(c => { let cur = null; c.sections.forEach((s, i) => {
    if (!cur) cur = { ch: c.id, secs: [], qs: [] };
    cur.secs.push(s.id); cur.qs.push(...c.questions.filter(q => q.sec === s.id).map(q => q.id));
    if (cur.qs.length >= 5 || cur.secs.length >= 3 || i === c.sections.length - 1) { cur.id = c.id + '~' + LESSONS.filter(l => l.ch === c.id).length; cur.title = SEC[c.id + '|' + cur.secs[0]].title.replace(/^Folie \d+: /, ''); LESSONS.push(cur); LBY[cur.id] = cur; cur = null; }
  }); });
  S = Object.assign({ q: {}, done: {}, read: {}, exam: '' }, store.get(tkey(slug), {}));
  LS = null; R = null;
}
const chName = c => c.label || 'Kapitel ' + c.nr;
const chTitle = c => c.label ? c.title.replace(c.label, '').replace(/^[\s–-]+/, '') || c.title : c.title;

/* ---------- Lernlogik ---------- */
function daysToExam() { if (!S || !S.exam) return null; const d = Math.ceil((new Date(S.exam + 'T00:00') - new Date(dayKey() + 'T00:00')) / DAY); return d; }
function interval(b) { let d = STEP[b]; const left = daysToExam(); if (left != null && left > 0) d = Math.min(d, Math.max(1, Math.round(left * .3))); return d; } // Abstand ≈ 30 % der Restzeit (Cepeda 2008)
function record(id, score, bonus) {
  const st = S.q[id] || (S.q[id] = { c: 0, w: 0, b: 0 });
  st.c += score; st.w += 1 - score; st.ok = score >= 1; st.t = Date.now();
  st.b = score >= 1 ? Math.min(5, st.b + 1 + (bonus ? 1 : 0)) : score > 0 ? Math.max(1, st.b - 1) : 0;
  st.due = Date.now() + interval(st.b) * DAY;
  G.days[dayKey()] = (G.days[dayKey()] || 0) + 1; saveS(); saveG();
}
const mastered = id => { const s = S.q[id]; return !!(s && s.ok && s.b >= 2); };
const isDue = id => { const s = S.q[id]; return !!(s && s.due <= Date.now()); };
function lessonLevel(l) {
  const sts = l.qs.map(id => S.q[id]); const ans = sts.filter(Boolean);
  if (!ans.length) return S.done[l.id] ? 1 : 0;
  const acc = ans.reduce((a, s) => a + s.c / (s.c + s.w), 0) / ans.length;
  if (ans.length === sts.length && ans.every(s => s.ok)) return ans.every(s => s.b >= 2) ? 4 : 3;
  return acc >= .7 ? 2 : 1;
}
function streak() { let n = 0; const d = new Date(); if (!G.days[dayKey(d)]) d.setDate(d.getDate() - 1); while (G.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); } return n; }
function dueIds() { return Q.filter(q => isDue(q.id)).sort((a, b) => S.q[a.id].due - S.q[b.id].due).map(q => q.id); }
function nextAction() {
  const due = dueIds(); const next = LESSONS.find(l => !S.done[l.id]);
  if (due.length >= 5 || (due.length && !next)) return { kind: 'review', n: Math.min(8, due.length), label: 'Wiederholen', sub: `${Math.min(8, due.length)} fällige Fragen, etwa ${Math.max(2, Math.round(Math.min(8, due.length) * .4))} Minuten` };
  if (next) return { kind: 'lesson', l: next, label: S.done[next.id] ? 'Lektion wiederholen' : 'Nächste Lektion', sub: `${chName(CHBY[next.ch])}: ${next.title}, etwa 5 Minuten` };
  return { kind: 'mixed', label: 'Gemischte Prüfungsrunde', sub: '10 Fragen quer durch alle Kapitel' };
}
function runAction(a) {
  if (a.kind === 'review') startSession({ ids: dueIds().slice(0, a.n), mode: 'ueben', title: 'Wiederholung' });
  if (a.kind === 'lesson') startLesson(a.l.id);
  if (a.kind === 'mixed') startSession({ ids: pick(Q.filter(q => q.type !== 'open'), 10), mode: 'ueben', title: 'Gemischte Runde' });
}
function pick(pool, n) {
  const sc = q => { const s = S.q[q.id]; if (!s) return Math.random() + .8; if (!s.ok) return Math.random() + 1.3; return Math.random() + Math.min(1, (Date.now() - s.t) / (7 * DAY)) - .5; };
  const sorted = pool.map(q => [sc(q), q]).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  return shuffle(n ? sorted.slice(0, n) : sorted).map(q => q.id);
}

/* ---------- Darstellung ---------- */
const ROOT = document.documentElement;
function applyOpt() { if (G.opt.theme === 'system') ROOT.removeAttribute('data-theme'); else ROOT.setAttribute('data-theme', G.opt.theme); ROOT.classList.toggle('no-motion', !G.opt.motion); ROOT.classList.toggle('big', !!G.opt.big); }
const motionOK = () => G.opt.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }
function animateBars(el) { requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('.bar>i').forEach(i => i.style.width = i.style.getPropertyValue('--w')))); }
function countUp(el) { el.querySelectorAll('[data-count]').forEach(b => { const n = +b.dataset.count; if (!motionOK() || !n) { b.textContent = n; return; } const t0 = performance.now(); const f = t => { const k = Math.min(1, (t - t0) / 900); b.textContent = Math.round(n * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }); }
const ICON = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  start: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
  lernen: '<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>',
  karten: '<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 3h12a2 2 0 0 1 2 2v12"/>',
  quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>',
  statistik: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
};
const TVIEWS = [['start', 'Lernpfad'], ['lernen', 'Lesen'], ['karten', 'Karten'], ['quiz', 'Üben'], ['statistik', 'Statistik']];
function drawNav(view) {
  const items = T ? TVIEWS.map(([v, n]) => [T.slug + '/' + v, v, n]) : [['home', 'home', 'Bibliothek']];
  const html = items.map(([href, v, n]) => `<a href="#${href}" ${v === view ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[v]}</svg><span>${n}</span></a>`).join('');
  $('#tabs').innerHTML = html; $('#tabsMob').innerHTML = html; $('#tabsMob').hidden = !T;
  const p = $('#topicPill'); p.hidden = !T; if (T) { p.href = '#home'; p.title = 'Zur Bibliothek'; p.querySelector('span').textContent = T.title; }
  $('#optLink').toggleAttribute('aria-current', view === 'optionen');
  const n = streak(); $('#streakPill').textContent = n + (n === 1 ? ' Tag' : ' Tage') + ' Serie';
}

/* ---------- Navigation ---------- */
let current = '';
let WANT = location.hash.slice(1);
let SUB = ''; // Unteransicht: Lektionsstufe bzw. quiz run/ergebnis
function parse() { const h = decodeURIComponent(WANT); if (!h || h === 'home') return { view: 'home' }; if (h === 'optionen') return { view: 'optionen' }; const [slug, v, sub] = h.split('/'); return { slug, sub: sub || '', view: ['start', 'lektion', 'lernen', 'karten', 'quiz', 'statistik'].includes(v) ? v : 'start' }; }
function go(path) { WANT = path; let moved = false; try { if (location.hash !== '#' + path) { location.hash = path; moved = location.hash === '#' + path; } } catch (e) { } if (!moved) route(); }
function goReplace(path) { WANT = path; try { history.replaceState({ i: HI }, '', '#' + path); } catch (e) { } route(); } // Zwischenstufen nicht in den Verlauf
const tgo = v => go(T.slug + '/' + v);
// Verlaufsindex: HI > 0 heißt, „Zurück“ bleibt in der App
let HI = 0;
function stamp(first) { const s = history.state; if (s && typeof s.i === 'number') HI = s.i; else { HI = first ? 0 : HI + 1; try { history.replaceState({ i: HI }, ''); } catch (e) { } } }
function parentPath() { const r = parse(); if (r.view === 'home') return 'home'; if (r.view === 'optionen') return T ? T.slug + '/start' : 'home'; if (r.view === 'start') return 'home'; if (r.view === 'quiz' && r.sub) return r.slug + '/quiz'; return r.slug + '/start'; }
function back() { if (askQuit()) return; if (HI > 0) history.back(); else go(parentPath()); }
const VNAME = { lernen: 'Lesen', karten: 'Karteikarten', quiz: 'Üben', statistik: 'Statistik', lektion: 'Lektion' };
function drawCrumbs(r) {
  const el = $('#crumbs'); el.hidden = r.view === 'home'; if (el.hidden) return;
  const parts = [`<a href="#home">Bibliothek</a>`];
  if (T && r.view !== 'optionen') parts.push(r.view === 'start' ? `<span aria-current="page">${esc(T.title)}</span>` : `<a href="#${esc(T.slug)}/start">${esc(T.title)}</a>`);
  if (r.view === 'optionen') parts.push('<span aria-current="page">Optionen</span>');
  else if (r.view !== 'start') parts.push(`<span aria-current="page">${VNAME[r.view]}${r.view === 'quiz' && r.sub === 'ergebnis' ? ': Ergebnis' : r.view === 'quiz' && r.sub === 'run' ? ': Runde' : ''}</span>`);
  el.innerHTML = `<button class="btn sm ghost" id="back" aria-label="Zurück"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg><span>Zurück</span></button><ol>${parts.map(p => `<li>${p}</li>`).join('')}</ol>`;
  $('#back', el).onclick = back;
}
async function route() {
  const r = parse();
  try { const need = r.slug && (!T || T.slug !== r.slug); if (need) { show('home'); $('#v-home').innerHTML = '<div class="loading">Lade Thema …</div>'; } await Promise.all([loadIndex(), need && loadTopic(r.slug)]); }
  catch (e) { toast('Thema konnte nicht geladen werden.'); if (r.slug) return go('home'); }
  if (r.view === 'lektion' && !LS) return goReplace(T.slug + '/start');
  if (r.view === 'lektion' && r.sub !== LS.stage) { // Zurück/Vor innerhalb der Lektion, Antworten bleiben gespeichert
    if (r.sub === 'read' && LS.stage !== 'pre') LS.stage = 'read';
    else if (r.sub === 'quiz' && LS.run && !LS.run.done) LS.stage = 'quiz';
    else return goReplace(T.slug + '/lektion/' + LS.stage);
  }
  if (r.view === 'quiz' && r.sub === 'run' && !(R && R.el === 'quiz')) return goReplace(T.slug + '/quiz');
  if (r.view === 'quiz' && r.sub === 'run' && R.done) return goReplace(T.slug + '/quiz/ergebnis');
  if (r.view === 'quiz' && r.sub === 'ergebnis' && !(R && R.el === 'quiz' && R.done)) return goReplace(T.slug + '/quiz');
  SUB = r.sub || '';
  const draw = () => { show(r.view); RENDER[r.view]($('#v-' + r.view)); drawNav(r.view); drawCrumbs(r); };
  if (current && current !== r.view && document.startViewTransition && motionOK()) document.startViewTransition(draw); else draw();
  if (current !== r.view || route.sub !== SUB) window.scrollTo(0, 0);
  current = r.view; route.sub = SUB;
}
function show(v) { document.querySelectorAll('.view').forEach(el => el.hidden = el.id !== 'v-' + v); }
const RENDER = {};

/* ---------- Bibliothek ---------- */
RENDER.home = el => {
  const prog = t => { const s = store.get(tkey(t.slug), { q: {} }); const m = Object.values(s.q || {}).filter(x => x.ok && x.b >= 2).length; return { m, p: t.count ? m / t.count : 0 }; };
  el.innerHTML = `
  <div class="lib-hero"><h1>Lernstudio</h1><p>Kurze Lektionen, die dich abfragen statt nur vorlesen. Was du schon kannst, kommt seltener, was wackelt, öfter.</p></div>
  <div class="topics">${TOPICS.map(t => { const p = prog(t); return `
    <button class="topic" style="--tc:${esc(t.accent)}" data-t="${esc(t.slug)}">
      <span class="fach">${esc(t.fach)}</span><h2>${esc(t.title)}</h2><p>${esc(t.desc)}</p>
      <div class="foot"><span class="num">${t.chapters} Kapitel, ${t.count} Fragen</span><span class="num">${Math.round(p.p * 100)} % gemeistert</span></div>
      <div class="bar"><i style="--w:${p.p * 100}%"></i></div>
    </button>`; }).join('')}
    <div class="topic add"><span class="fach">Neues Fach</span><h3>Weitere Themen</h3><p>Ein Thema ist eine JSON-Datei im Ordner <code>themen/</code>. Wie das geht, steht in der README.</p></div>
  </div>
  <section class="panel" style="display:grid;gap:16px">
    <h2>Warum das funktioniert</h2>
    <div class="principles">
      <div><h3>Abfragen statt Wiederlesen</h3><p class="muted">Wer sich selbst testet, behält nach einer Woche deutlich mehr als jemand, der den Stoff nochmal liest (61 % gegen 40 %).</p><a href="https://source.washu.edu/2006/03/repeated-testtaking-better-for-retention-than-repeated-studying-research-shows/" target="_blank" rel="noopener">Roediger & Karpicke 2006</a></div>
      <div><h3>Verteilt wiederholen</h3><p class="muted">Der beste Abstand wächst mit der Zeit bis zum Test. Mit Prüfungsdatum plant das Lernstudio die Wiederholungen danach.</p><a href="https://pubmed.ncbi.nlm.nih.gov/19076480/" target="_blank" rel="noopener">Cepeda et al. 2008</a></div>
      <div><h3>Bis es sitzt</h3><p class="muted">Falsche Fragen kommen in derselben Runde wieder, bis sie richtig sind, und an späteren Tagen nochmal.</p><a href="https://www.retrievalpractice.org/archive/2018/successive-relearning" target="_blank" rel="noopener">Rawson & Dunlosky</a></div>
      <div><h3>Erst raten, dann lesen</h3><p class="muted">Jede Lektion startet mit zwei Vortestfragen. Auch falsche Versuche helfen danach beim Merken.</p><a href="https://pubmed.ncbi.nlm.nih.gov/19751074/" target="_blank" rel="noopener">Richland et al. 2009</a></div>
    </div>
  </section>`;
  animateBars(el);
  el.onclick = e => { const b = e.target.closest('[data-t]'); if (b) go(b.dataset.t + '/start'); };
};

/* ---------- Lernpfad (Themen-Start) ---------- */
function braggSVG() {
  const W = 600, H = 230, x0 = 46, y0 = 196, w = 530, h = 165, px = t => x0 + t * w, py = v => y0 - v * h; let ph = [], pr = [];
  for (let i = 0; i <= 120; i++) { const t = i / 120; const vph = t < .08 ? .35 + .65 * (t / .08) ** .7 : Math.exp(-(t - .08) * 1.9); ph.push([px(t), py(vph * .92)]);
    const tp = .78; const vp = t < tp ? .26 + .2 * (t / tp) ** 3 + .62 * Math.exp(-(((t - tp) / .035) ** 2)) : 1.08 * Math.exp(-(((t - tp) / .022) ** 2)); pr.push([px(t), py(Math.min(1, vp))]); }
  const d = a => 'M' + a.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tiefendosiskurven von Photonen und Protonen mit Bragg-Peak im Tumor">
  <rect x="${px(.72)}" y="${py(1.04)}" width="${.12 * w}" height="${1.04 * h}" rx="8" fill="var(--dose-soft)"/><text x="${px(.78)}" y="${py(1.04) - 6}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--dose)">Tumor</text>
  <path d="M${x0} ${y0 - h - 6}V${y0}H${x0 + w}" fill="none" stroke="var(--line)" stroke-width="1.5"/><text x="${x0 + w}" y="${y0 + 22}" text-anchor="end" font-size="13" fill="var(--muted)">Gewebetiefe</text>
  <text x="${x0 - 12}" y="${y0 - h + 4}" text-anchor="end" font-size="13" fill="var(--muted)" transform="rotate(-90 ${x0 - 12} ${y0 - h + 4})">Dosis</text>
  <path class="curve draw" d="${d(ph)}" stroke="var(--muted)" style="--len:900"/><path class="curve draw late" d="${d(pr)}" stroke="var(--accent)" style="--len:1100"/>
  <circle class="peak-dot" cx="${px(.78)}" cy="${py(.88)}" r="6" fill="var(--accent)" style="transform-origin:${px(.78)}px ${py(.88)}px"/>
  <text x="${px(.16)}" y="${py(.84)}" font-size="14" font-weight="700" fill="var(--muted)">Photonen</text><text x="${px(.5)}" y="${py(.62)}" font-size="14" font-weight="700" fill="var(--accent)">Protonen: Bragg-Peak</text></svg>`;
}
function ringSVG(p, label) { const C = 2 * Math.PI * 86; return `<svg class="ring" viewBox="0 0 200 200" role="img" aria-label="${Math.round(p * 100)} Prozent ${label}"><circle class="bg" cx="100" cy="100" r="86"/><circle class="fg" cx="100" cy="100" r="86" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${C * (1 - p)}"/><text x="100" y="104" text-anchor="middle" font-size="42">${Math.round(p * 100)}%</text><text x="100" y="132" text-anchor="middle" font-size="14" style="font-family:var(--body);font-weight:400;fill:var(--muted)">${label}</text></svg>`; }
const ringGo = el => requestAnimationFrame(() => requestAnimationFrame(() => el.querySelectorAll('.ring .fg').forEach(r => r.style.strokeDashoffset = r.dataset.off)));
RENDER.start = el => {
  const a = nextAction(), m = Q.filter(q => mastered(q.id)).length, due = dueIds().length, left = daysToExam();
  const open = LESSONS.filter(l => !S.done[l.id]).length, perDay = left && left > 0 ? Math.ceil(open / Math.max(1, left - 1)) : 2;
  const nextId = a.kind === 'lesson' ? a.l.id : null;
  el.innerHTML = `
  <div class="hero">
    <div class="hero-text">
      <span class="fach-label">${esc(T.fach)}</span>
      <h1>${esc(T.title)}</h1>
      <div class="next-card">
        <div><strong>${esc(a.label)}</strong><span class="muted">${esc(a.sub)}</span></div>
        <button class="btn primary big" id="goNext">Weiterlernen</button>
      </div>
      <p class="muted plan">${open ? `Heute: ${due ? 'Wiederholung und ' : ''}${Math.min(perDay, open)} ${Math.min(perDay, open) === 1 ? 'Lektion' : 'Lektionen'}${left > 0 ? `, damit du bis zum Test in ${left} ${left === 1 ? 'Tag' : 'Tagen'} durch bist` : ''}.` : 'Alle Lektionen geschafft. Jetzt hält dich die Wiederholung fit.'}</p>
    </div>
    ${T.hero === 'bragg' ? `<figure class="bragg" style="margin:0">${braggSVG()}<figcaption class="cap">Photonen belasten Gewebe vor und hinter dem Tumor, Protonen geben ihre Energie im Bragg-Peak ab.</figcaption></figure>` : `<div class="panel" style="display:grid;place-items:center">${ringSVG(m / Q.length, 'gemeistert')}</div>`}
  </div>
  <div class="today">
    <div class="panel stat"><small>Fällig zur Wiederholung</small><b class="num" data-count="${due}">0</b><small>${due ? 'Diese Fragen solltest du heute abrufen.' : 'Gerade nichts fällig.'}</small></div>
    <div class="panel stat"><small>Lektionen geschafft</small><b class="num"><span data-count="${LESSONS.length - open}">0</span><span class="muted" style="font-size:1.1rem"> / ${LESSONS.length}</span></b><div class="bar"><i style="--w:${(LESSONS.length - open) / LESSONS.length * 100}%"></i></div></div>
    <div class="panel stat"><small>Test am</small><input type="date" id="exam" value="${esc(S.exam)}" aria-label="Datum des Tests"><small>${left == null ? 'Datum setzen: Wiederholungen werden danach geplant.' : left > 0 ? `Noch ${left} ${left === 1 ? 'Tag' : 'Tage'}.` : left === 0 ? 'Heute ist Test. Viel Erfolg!' : 'Test ist vorbei.'}</small></div>
  </div>
  <div class="section-head"><h2>Lernpfad</h2><span class="muted">Jede Lektion: 2 Vortestfragen, kurz lesen, dann abfragen, bis alles sitzt.</span></div>
  <div class="path">${CH.map(c => `
    <section class="path-ch"><h3><span class="badge">${esc(c.badge || c.nr)}</span>${esc(chTitle(c))}</h3>
      <ol>${LESSONS.filter(l => l.ch === c.id).map(l => { const lv = lessonLevel(l); return `
        <li class="lesson lv${lv} ${l.id === nextId ? 'next' : ''}"><span class="node" aria-hidden="true"></span>
          <button data-l="${esc(l.id)}"><span class="lt">${esc(l.title)}</span><span class="ls">${LEVEL[lv]}${l.qs.length ? `, ${l.qs.length} Fragen` : ''}</span></button></li>`; }).join('')}</ol>
    </section>`).join('')}</div>`;
  animateBars(el); countUp(el); ringGo(el);
  $('#exam', el).onchange = e => { S.exam = e.target.value; saveS(); RENDER.start(el); toast(S.exam ? 'Testdatum gespeichert' : 'Testdatum entfernt'); };
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.id === 'goNext') runAction(a); if (b.dataset.l) startLesson(b.dataset.l); };
};

/* ---------- Lektion: Vortest → Lesen → Abfrage ---------- */
let LS = null;
function startLesson(id) {
  const l = LBY[id]; const qs = l.qs.map(x => QBY[x]);
  const pre = shuffle(qs.filter(q => q.type === 'tf' || q.type === 'mc')).slice(0, 2).map(q => q.id);
  const main = qs.filter(q => !pre.includes(q.id)).sort((a, b) => (mastered(a.id) - mastered(b.id)) || (RECALL[a.type] - RECALL[b.type])).slice(0, 6).map(q => q.id);
  LS = { id, stage: pre.length ? 'pre' : 'read', pre, main: main.length ? main : pre };
  if (LS.stage === 'pre') LS.preRun = R = newRun({ ids: pre, mode: 'pre', el: 'lektion', onDone: () => { LS.stage = 'read'; R = null; goReplace(T.slug + '/lektion/read'); } });
  tgo('lektion/' + LS.stage);
}
function blockHTML(b) {
  if (b.t === 'p') return `<p>${esc(b.text)}</p>`;
  if (b.t === 'ul') return `<ul>${b.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
  if (b.t === 'steps') return `<ol class="steps">${b.items.map(i => `<li><span>${esc(i)}</span></li>`).join('')}</ol>`;
  if (b.t === 'table') return `<div class="tablewrap"><table>${b.head && b.head.length ? `<thead><tr>${b.head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>` : ''}<tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  if (b.t === 'merke') return `<div class="merke"><strong>Merke</strong>${esc(b.text)}</div>`;
  return '';
}
const linksHTML = (links, label = 'Zum Nachlesen') => links && links.length ? `<div class="links"><strong>${label}</strong><ul>${links.map(x => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a> <span class="muted">${esc(x.src || '')}</span></li>`).join('')}</ul></div>` : '';
function secHTML(chId, s, withRead = true) {
  const k = chId + '|' + s.id;
  return `<article class="sec" id="s-${esc(s.id.replace(/\./g, '-'))}"><header><span class="id">${esc(/^[\d.]+$/.test(s.id) ? s.id : '')}</span><h3>${esc(s.title)}</h3>${withRead ? `<button class="btn sm read-toggle" aria-pressed="${!!S.read[k]}" data-readk="${esc(k)}">${S.read[k] ? 'Gelesen' : 'Als gelesen markieren'}</button>` : ''}</header>${s.blocks.map(blockHTML).join('')}${linksHTML(s.links)}</article>`;
}
RENDER.lektion = el => {
  const l = LBY[LS.id], c = CHBY[l.ch];
  const steps = ['Vortest', 'Lesen', 'Abfrage'], idx = { pre: 0, read: 1, quiz: 2, done: 3 }[LS.stage];
  const head = `<div class="lesson-head"><span></span><ol class="stepper">${steps.map((s, i) => `<li class="${i < idx ? 'done' : i === idx ? 'on' : ''}">${s}</li>`).join('')}</ol></div>
    <div><span class="fach-label">${esc(chName(c))}</span><h2>${esc(l.title)}</h2></div>`;
  if (LS.stage === 'pre' || LS.stage === 'quiz') { R = LS.stage === 'pre' ? LS.preRun : LS.run; el.innerHTML = head + '<div id="runbox"></div>' + (LS.stage === 'pre' ? '<p class="muted">Vortest: einfach raten, das zählt nicht. Es macht dein Gehirn neugierig auf die Antwort.</p>' : ''); renderQ($('#runbox', el)); }
  if (LS.stage === 'read') {
    el.innerHTML = head + `<div class="content">${l.secs.map(sid => secHTML(c.id, SEC[c.id + '|' + sid], false)).join('')}</div><div class="qactions"><span class="muted">Fertig? Dann frag ich dich ab, ohne dass du nachsiehst.</span><button class="btn primary big" id="toQuiz">Zur Abfrage</button></div>`;
  }
  if (LS.stage === 'done') {
    const lv = lessonLevel(l); const nx = nextAction();
    el.innerHTML = head + `<div class="panel done-card"><div class="lvl-big lv${lv}"><span class="node"></span></div><h2>Lektion geschafft</h2><p class="muted">Stand: <strong>${LEVEL[lv]}</strong>. Die Fragen kommen in ein paar Tagen zur Wiederholung, damit sie hängen bleiben.</p><div class="row" style="justify-content:center"><button class="btn primary big" id="lnext">${esc(nx.label)}</button><button class="btn" id="lback2">Zum Lernpfad</button></div></div>`;
    if (!LS.cel) { LS.cel = true; confetti(); }
    $('#lnext', el).onclick = () => runAction(nx);
  }
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'lback' || b.id === 'lback2') { R = null; LS = null; tgo('start'); }
    if (b.id === 'toQuiz') { l.secs.forEach(sid => S.read[c.id + '|' + sid] = true); saveS(); if (!LS.main.length) { S.done[l.id] = true; saveS(); LS.stage = 'done'; return goReplace(T.slug + '/lektion/done'); } LS.stage = 'quiz'; if (!LS.run || LS.run.done) LS.run = newRun({ ids: LS.main, mode: 'ueben', el: 'lektion', onDone: () => { S.done[l.id] = true; saveS(); LS.stage = 'done'; R = null; goReplace(T.slug + '/lektion/done'); } }); tgo('lektion/quiz'); }
  };
};

/* ---------- Lesen ---------- */
const L = { ch: null, q: '' };
const secText = s => s.title + ' ' + s.blocks.map(b => [b.text, ...(b.items || []), ...(b.head || []), ...((b.rows || []).flat())].join(' ')).join(' ');
RENDER.lernen = el => {
  if (!L.ch || !CHBY[L.ch]) L.ch = CH[0].id; const c = CHBY[L.ch];
  el.innerHTML = `
  <div class="section-head"><h2>${esc(chName(c))}: ${esc(chTitle(c))}</h2><input class="search" id="lsearch" type="search" placeholder="Im ganzen Thema suchen" value="${esc(L.q)}" style="max-width:380px" aria-label="Im Stoff suchen"></div>
  <div class="learn">
    <nav class="toc" aria-label="Inhalt">${CH.map(k => `<button class="${k.id === c.id ? 'on' : ''}" data-ch="${k.id}"><span>${esc(chName(k))}</span></button>` + (k.id === c.id ? k.sections.map(s => `<button class="sub" data-sec="${esc(s.id)}"><span>${esc(s.title)}</span>${S.read[k.id + '|' + s.id] ? '<span class="tick">✓</span>' : ''}</button>`).join('') : '')).join('')}</nav>
    <div class="content"><select class="toc-select" id="chsel" aria-label="Kapitel wählen">${CH.map(k => `<option value="${k.id}" ${k.id === c.id ? 'selected' : ''}>${esc(chName(k))}: ${esc(chTitle(k))}</option>`).join('')}</select><div id="lbody" class="content"></div></div>
  </div>`;
  const body = $('#lbody', el);
  const draw = () => {
    const q = L.q.trim().toLowerCase();
    if (q.length >= 2) { const hits = []; CH.forEach(k => k.sections.forEach(s => { const tx = secText(s), i = tx.toLowerCase().indexOf(q); if (i >= 0) hits.push({ k, s, snip: tx.slice(Math.max(0, i - 60), i + 90) }); }));
      const hl = h => h.replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`);
      body.innerHTML = `<div class="hits"><p class="muted">${hits.length} Treffer</p>${hits.map(h => `<button class="hit" data-goto="${h.k.id}|${esc(h.s.id)}"><strong>${esc(chName(h.k))}, ${esc(h.s.title)}</strong><small>…${hl(esc(h.snip))}…</small></button>`).join('')}</div>`; return; }
    body.innerHTML = linksHTML(c.links, 'Zum Nachlesen im Internet') + c.sections.map(s => secHTML(c.id, s)).join('');
  };
  draw();
  $('#lsearch', el).oninput = e => { L.q = e.target.value; draw(); };
  $('#chsel', el).onchange = e => { L.ch = e.target.value; L.q = ''; RENDER.lernen(el); window.scrollTo(0, 0); };
  if (L.focus) { const t = $('#s-' + L.focus.replace(/\./g, '-'), el); L.focus = null; t && requestAnimationFrame(() => t.scrollIntoView()); }
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ch) { L.ch = b.dataset.ch; L.q = ''; RENDER.lernen(el); window.scrollTo(0, 0); }
    if (b.dataset.sec) { const t = $('#s-' + b.dataset.sec.replace(/\./g, '-'), el); t && t.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto' }); }
    if (b.dataset.goto) { const [ch, sec] = b.dataset.goto.split('|'); L.ch = ch; L.q = ''; L.focus = sec; RENDER.lernen(el); }
    if (b.dataset.readk) { const k = b.dataset.readk; if (S.read[k]) delete S.read[k]; else S.read[k] = true; saveS(); b.setAttribute('aria-pressed', !!S.read[k]); b.textContent = S.read[k] ? 'Gelesen' : 'Als gelesen markieren'; }
  };
};

/* ---------- Karteikarten ---------- */
const K = { chapters: null, list: null, flipped: false };
function buildDeck() { const pool = Q.filter(q => (q.type === 'open' || q.type === 'cloze') && K.chapters.includes(q.ch)); const due = pool.filter(q => isDue(q.id)); const fresh = shuffle(pool.filter(q => !S.q[q.id])); return due.concat(fresh).slice(0, 12).map(q => q.id); }
RENDER.karten = el => {
  if (!K.chapters || !K.chapters.every(c => CHBY[c])) { K.chapters = CH.map(c => c.id); K.list = null; }
  if (!K.list) K.list = buildDeck();
  const id = K.list[0], q = id && QBY[id];
  el.innerHTML = `
  <div class="section-head"><div><h2>Karteikarten</h2><p class="muted">Erst selbst antworten, dann umdrehen (Leertaste). Runden haben höchstens 12 Karten.</p></div><span class="tag num">${K.list.length} übrig</span></div>
  <div class="chips">${CH.map(c => `<button class="chip" aria-pressed="${K.chapters.includes(c.id)}" data-c="${c.id}">${esc(chName(c))}</button>`).join('')}</div>
  ${q ? `<div class="flash-wrap"><button class="flash ${K.flipped ? 'flipped' : ''}" id="flash" aria-label="Karte umdrehen"><div class="flash-inner">
    <div class="face front"><small>${esc(chName(CHBY[q.ch]))}</small><div class="q">${q.type === 'cloze' ? esc(q.q).replace('___', '<span style="color:var(--accent)">_____</span>') : esc(q.q)}</div><small>Antwort laut sagen oder denken, dann umdrehen</small></div>
    <div class="face back"><div class="a">${q.type === 'cloze' ? `<p class="big-answer">${esc(q.answers[0])}</p>` : `<p>${esc(q.answer)}</p>`}${q.explain ? `<p class="muted" style="margin-top:10px">${esc(q.explain)}</p>` : ''}</div></div></div></button>
    <div class="rate" id="rate" ${K.flipped ? '' : 'hidden'}><button class="btn" data-r="0">Nochmal<small>gleich wieder</small></button><button class="btn" data-r="1">Schwer<small>bald</small></button><button class="btn" data-r="2">Gut<small>in ein paar Tagen</small></button><button class="btn" data-r="3">Leicht<small>viel später</small></button></div><p class="muted swipe-hint" ${K.flipped ? '' : 'hidden'}>Oder wischen: ← Nochmal, Gut →</p></div>`
    : `<div class="panel" style="text-align:center;display:grid;gap:12px;justify-items:center"><h3>Runde geschafft</h3><p class="muted">Gerade ist nichts mehr fällig.</p><button class="btn primary" id="knew">Neue Runde</button></div>`}`;
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.c) { const c = b.dataset.c; K.chapters = K.chapters.includes(c) ? K.chapters.filter(x => x !== c) : K.chapters.concat(c); if (!K.chapters.length) K.chapters = [c]; K.list = null; K.flipped = false; RENDER.karten(el); }
    if (b.id === 'flash' && Date.now() - (K.swipeT || 0) > 400) flip(); if (b.id === 'knew') { K.list = null; RENDER.karten(el); } if (b.dataset.r) rateCard(+b.dataset.r);
  };
  const f = $('#flash', el); if (f) swipe(f);
};
// Wischen auf der umgedrehten Karte: links = Nochmal, rechts = Gut
function swipe(f) {
  let x0 = null, dx = 0;
  f.onpointerdown = e => { if (!K.flipped) return; x0 = e.clientX; dx = 0; f.classList.add('drag'); };
  f.onpointermove = e => { if (x0 == null) return; dx = e.clientX - x0; if (motionOK()) f.style.transform = `translateX(${dx}px) rotate(${dx / 40}deg)`; };
  f.onpointerup = f.onpointercancel = f.onpointerleave = () => { if (x0 == null) return; x0 = null; f.classList.remove('drag'); f.style.transform = ''; if (Math.abs(dx) > 70) { K.swipeT = Date.now(); rateCard(dx < 0 ? 0 : 2); } };
}
function flip() { if (current !== 'karten' || !K.list || !K.list.length) return; K.flipped = !K.flipped; $('#flash').classList.toggle('flipped', K.flipped); $('#rate').hidden = !K.flipped; const h = $('.swipe-hint'); if (h) h.hidden = !K.flipped; }
function rateCard(r) { const id = K.list.shift(); record(id, [0, .5, 1, 1][r], r === 3); if (r === 0) K.list.splice(Math.min(3, K.list.length), 0, id); K.flipped = false; RENDER.karten($('#v-karten')); }

/* ---------- Üben (freies Quiz und Test) ---------- */
const QS = { chapters: null, types: Object.keys(TYPES), count: 10, mode: 'ueben', time: 0, weak: false };
let R = null;
const poolFor = o => Q.filter(q => o.chapters.includes(q.ch) && o.types.includes(q.type) && (!o.weak || (S.q[q.id] && !S.q[q.id].ok)));
function newRun(o) { return { list: o.ids.slice(), i: 0, mode: o.mode, time: o.time || 0, first: {}, rep: {}, t0: Date.now(), state: null, el: o.el || 'quiz', onDone: o.onDone, title: o.title || '' }; }
function startSession(o) { if (!o.ids.length) return toast('Keine Fragen für diese Auswahl.'); R = newRun(o); LS = null; tgo('quiz/run'); }
RENDER.quiz = el => { if (!QS.chapters || !QS.chapters.every(c => CHBY[c])) QS.chapters = CH.map(c => c.id); if (SUB === 'ergebnis' && R && R.done) return renderResult(el); if (SUB === 'run' && R && R.el === 'quiz' && !R.done) { el.onclick = null; el.innerHTML = '<div id="runbox"></div>'; return renderQ($('#runbox', el)); } renderSetup(el); };
function renderSetup(el) {
  const n = poolFor(QS).length;
  const seg = (k, vals) => `<div class="seg" data-key="${k}">${vals.map(([v, l]) => `<button aria-pressed="${QS[k] === v}" data-v="${v}">${l}</button>`).join('')}</div>`;
  el.innerHTML = `
  ${R && R.el === 'quiz' && !R.done ? `<div class="panel resume"><span><strong>${esc(R.title)}</strong> läuft noch: Frage ${R.i + 1} von ${R.list.length}.</span><button class="btn primary" id="resume">Fortsetzen</button></div>` : ''}
  <div class="section-head"><div><h2>Frei üben</h2><p class="muted">Für den Alltag reicht „Weiterlernen“ im Lernpfad. Hier stellst du dir eine eigene Runde oder eine Testsimulation zusammen.</p></div></div>
  <div class="panel setup">
    <div><span class="label">Kapitel</span><div class="chips" data-multi="chapters">${CH.map(c => `<button class="chip" aria-pressed="${QS.chapters.includes(c.id)}" data-v="${c.id}">${esc(chName(c))}</button>`).join('')}</div></div>
    <div><span class="label">Fragetypen</span><div class="chips" data-multi="types">${Object.entries(TYPES).map(([t, l]) => `<button class="chip" aria-pressed="${QS.types.includes(t)}" data-v="${t}">${l}</button>`).join('')}</div></div>
    <div class="row" style="gap:28px;align-items:flex-start">
      <div><span class="label">Anzahl</span>${seg('count', [[5, '5'], [10, '10'], [20, '20'], [40, '40']])}</div>
      <div><span class="label">Modus</span>${seg('mode', [['ueben', 'Üben mit Lösung'], ['test', 'Testsimulation']])}</div>
      <div><span class="label">Zeit pro Frage</span>${seg('time', [[0, 'Ohne'], [30, '30 s'], [60, '60 s']])}</div>
    </div>
    <div class="row"><button class="chip" aria-pressed="${QS.weak}" id="weak">Nur Fragen, die zuletzt falsch waren</button></div>
    <div class="qactions"><span class="muted num">${n} passende Fragen</span><button class="btn primary" id="go" ${n ? '' : 'disabled'}>Runde starten</button></div>
  </div>`;
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; const multi = b.closest('[data-multi]'), seg = b.closest('[data-key]');
    if (multi) { const k = multi.dataset.multi, v = b.dataset.v; QS[k] = QS[k].includes(v) ? QS[k].filter(x => x !== v) : QS[k].concat(v); if (!QS[k].length) QS[k] = [v]; }
    else if (seg) { const k = seg.dataset.key; QS[k] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; }
    else if (b.id === 'resume') return tgo('quiz/run');
    else if (b.id === 'weak') QS.weak = !QS.weak;
    else if (b.id === 'go') return startSession({ ids: pick(poolFor(QS), QS.count), mode: QS.mode, time: QS.time, title: QS.mode === 'test' ? 'Testsimulation' : 'Übungsrunde' });
    renderSetup(el); };
}
const norm = s => String(s).toLowerCase().normalize('NFKC').replace(/[„“”"'’()]/g, '').replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, ' ').replace(/[.!?;:]+$/, '').replace(/^(der|die|das|ein|eine|einen|ca\.?) /, '').trim();
function lev(a, b) { const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9; let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
function clozeOK(inp, answers) { const a = norm(inp); if (!a) return false; return answers.some(x => { const b = norm(x); if (a === b || a.replace(/ /g, '') === b.replace(/ /g, '')) return true; const na = a.match(/^-?\d+(\.\d+)?/), nb = b.match(/^-?\d+(\.\d+)?/); if (na && nb && /^[\d.\s]*[a-zäöüµ/%]*$/i.test(a) && parseFloat(na[0]) === parseFloat(nb[0])) return true; return b.length >= 6 && lev(a, b) <= 1; }); }
function correctText(q) { if (q.type === 'mc') return q.options[q.answer]; if (q.type === 'tf') return q.answer ? 'Richtig' : 'Falsch'; if (q.type === 'cloze') return q.answers[0]; if (q.type === 'order') return q.items.join(' → '); if (q.type === 'match') return q.pairs.map(p => p[0] + ' → ' + p[1]).join('; '); return q.answer; }
const PC = ['#2C55E0', '#D9791E', '#18865B', '#9B4DCA', '#C63B31', '#0E8A9A'];
let timerId = null;
function shuffleNot(a) { if (a.length < 2) return a; let s; do s = shuffle(a); while (s.every((v, i) => v === i)); return s; }
function renderQ(box) {
  clearInterval(timerId);
  const id = R.list[R.i], q = QBY[id], c = CHBY[q.ch], sec = q.sec && SEC[q.ch + '|' + q.sec];
  if (!R.state || R.state.id !== id || R.state.pos !== R.i) R.state = { id, pos: R.i, done: false, mcOrder: shuffle([0, 1, 2, 3]), seq: [], pool: q.type === 'order' ? shuffleNot(q.items.map((_, i) => i)) : null, right: q.type === 'match' ? shuffle(q.pairs.map((_, i) => i)) : null, pairs: {}, selL: null, txt: '', left: R.time, pend: null };
  const st = R.state, test = R.mode === 'test';
  box.innerHTML = `
  <div class="qtop">${R.el === 'quiz' ? '<button class="btn sm ghost" id="quit">Beenden</button>' : ''}<div class="bar"><i style="width:${R.i / R.list.length * 100}%"></i></div><span class="num muted">${Math.min(R.i + 1, R.list.length)} / ${R.list.length}</span>${R.time ? `<span class="timer" id="timer">${st.left} s</span>` : ''}</div>
  <div class="qcard"><div class="qmeta"><span class="tag">${TYPES[q.type]}</span><span>${esc(chName(c))}${sec ? ', ' + esc(sec.title) : ''}</span>${R.rep[id] ? '<span class="tag rep">Nochmal</span>' : ''}</div>
    ${q.type === 'cloze' ? '' : `<div class="qtext">${esc(q.q)}</div>`}<div id="qbody"></div><div id="fb"></div><div class="qactions" id="qact"></div></div>`;
  const body = $('#qbody', box), act = $('#qact', box), key = (i, t) => `<span class="k">${i}</span><span>${esc(t)}</span>`;
  if (q.type === 'mc') body.innerHTML = `<div class="opts">${st.mcOrder.map((o, i) => `<button class="opt" data-o="${o}">${key(i + 1, q.options[o])}</button>`).join('')}</div>`;
  if (q.type === 'tf') body.innerHTML = `<div class="tf"><button class="opt" data-tf="1">${key(1, 'Richtig')}</button><button class="opt" data-tf="0">${key(2, 'Falsch')}</button></div>`;
  if (q.type === 'cloze') { const [a, b] = q.q.split('___'); body.innerHTML = `<div class="qtext cloze">${esc(a)}<input id="cz" autocomplete="off" spellcheck="false" aria-label="Lücke ausfüllen" value="${esc(st.txt)}">${esc(b || '')}</div>`; act.innerHTML = `<span class="muted">Enter zum Prüfen</span><button class="btn primary" id="check">Prüfen</button>`; const i = $('#cz', box); i.oninput = () => st.txt = i.value; setTimeout(() => i.focus({ preventScroll: true }), 30); }
  if (q.type === 'order') { body.innerHTML = `<div style="display:grid;gap:14px"><div class="order-seq" id="seq"></div><div class="order-pool" id="pool"></div></div>`; act.innerHTML = `<button class="btn ghost" id="reset">Zurücksetzen</button><button class="btn primary" id="check" disabled>Prüfen</button>`; drawOrder(box, q); }
  if (q.type === 'match') { body.innerHTML = `<p class="muted" style="margin-bottom:10px">Links antippen, dann rechts das Passende.</p><div class="match"><div class="col left" id="ml"></div><div class="col right" id="mr"></div></div>`; act.innerHTML = `<button class="btn ghost" id="reset">Zurücksetzen</button><button class="btn primary" id="check" disabled>Prüfen</button>`; drawMatch(box, q); }
  if (q.type === 'open') { body.innerHTML = `<textarea id="ta" placeholder="Antworte in Stichworten aus dem Kopf. Danach vergleichst du mit der Musterantwort.">${esc(st.txt)}</textarea>`; act.innerHTML = `<span></span><button class="btn primary" id="show">Musterantwort zeigen</button>`; const t = $('#ta', box); t.oninput = () => st.txt = t.value; }
  if (R.time) timerId = setInterval(() => { if (st.done) return clearInterval(timerId); st.left--; const t = $('#timer'); if (t) { t.textContent = st.left + ' s'; t.classList.toggle('low', st.left <= 5); } if (st.left <= 0) { clearInterval(timerId); finishQ(box, 0, 'Zeit abgelaufen'); } }, 1000);
  box.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.id === 'quit') return askQuit();
    if (b.id === 'quitNo') return $('#quitAsk').remove();
    if (b.id === 'quitYes') return endRun();
    if (b.id === 'next') return nextQ();
    if (b.dataset.look) { L.ch = q.ch; L.focus = q.sec; L.q = ''; return tgo('lernen'); }
    if (b.dataset.conf) { const p = st.pend; st.pend = null; return choose(box, q, p.b, p.ok, p.right, p.given, b.dataset.conf === '1'); }
    if (st.done && !b.dataset.self) return;
    if (b.dataset.o) { const ok = +b.dataset.o === q.answer; return choose(box, q, b, ok, () => box.querySelector(`[data-o="${q.answer}"]`), q.options[+b.dataset.o]); }
    if (b.dataset.tf) { const ok = (b.dataset.tf === '1') === q.answer; return choose(box, q, b, ok, () => box.querySelector(`[data-tf="${q.answer ? 1 : 0}"]`), b.dataset.tf === '1' ? 'Richtig' : 'Falsch'); }
    if (b.id === 'check' && q.type === 'cloze') { const ok = clozeOK(st.txt, q.answers); const i = $('#cz', box); i.disabled = true; if (!test) i.classList.add(ok ? 'ok' : 'no'); return finishQ(box, ok ? 1 : 0, st.txt || '(leer)'); }
    if (q.type === 'order') { if (b.dataset.pi != null) { st.seq.push(+b.dataset.pi); drawOrder(box, q); } if (b.dataset.si != null) { st.seq.splice(+b.dataset.si, 1); drawOrder(box, q); } if (b.id === 'reset') { st.seq = []; drawOrder(box, q); } if (b.id === 'check') { const ok = st.seq.every((v, i) => v === i); if (!test) box.querySelectorAll('#seq .opt').forEach((o, i) => { o.disabled = true; o.classList.add(st.seq[i] === i ? 'ok' : 'no'); }); finishQ(box, ok ? 1 : 0, st.seq.map(i => q.items[i]).join(' → ')); } }
    if (q.type === 'match') { if (b.dataset.l != null) { const l = +b.dataset.l; if (st.pairs[l] != null) delete st.pairs[l]; st.selL = l; drawMatch(box, q); } if (b.dataset.r != null && st.selL != null) { const r = +b.dataset.r; for (const k in st.pairs) if (st.pairs[k] === r) delete st.pairs[k]; st.pairs[st.selL] = r; st.selL = null; drawMatch(box, q); } if (b.id === 'reset') { st.pairs = {}; st.selL = null; drawMatch(box, q); } if (b.id === 'check') { const n = q.pairs.length, k = q.pairs.filter((_, i) => st.pairs[i] === i).length; if (!test) { box.querySelectorAll('.match .opt').forEach(o => o.disabled = true); box.querySelectorAll('#ml .opt').forEach((o, i) => { o.removeAttribute('data-p'); o.classList.add(st.pairs[i] === i ? 'ok' : 'no'); }); } finishQ(box, k === n ? 1 : k / n >= .5 ? .5 : 0, q.pairs.map((p, i) => p[0] + ' → ' + (q.pairs[st.pairs[i]] || ['', '?'])[1]).join('; ')); } }
    if (b.id === 'show') { $('#ta', box).readOnly = true; $('#fb', box).innerHTML = `<div class="feedback part"><h3>Musterantwort</h3><p>${esc(q.answer)}</p></div>`; act.innerHTML = `<span class="muted">Wie gut war deine Antwort?</span><div class="row"><button class="btn" data-self="0">Nicht gewusst</button><button class="btn" data-self="0.5">Teilweise</button><button class="btn primary" data-self="1">Gewusst</button></div>`; }
    if (b.dataset.self) finishQ(box, +b.dataset.self, st.txt || '(selbst bewertet)', true);
  };
}
// Auswahl mit optionaler Sicherheitsabfrage (Hyperkorrektur: sichere Fehler werden besonders gut korrigiert)
function choose(box, q, b, ok, right, given, sure) {
  const st = R.state, test = R.mode === 'test';
  box.querySelectorAll('.opts .opt, .tf .opt').forEach(o => o.disabled = true);
  if (sure === undefined && G.opt.conf && R.mode !== 'pre') { b.classList.add('sel'); st.pend = { b, ok, right, given }; $('#qact', box).innerHTML = `<span class="muted">Wie sicher bist du?</span><div class="row"><button class="btn" data-conf="0">Geraten</button><button class="btn primary" data-conf="1">Sicher</button></div>`; return; }
  b.classList.remove('sel');
  if (test) b.classList.add('sel'); else { b.classList.add(ok ? 'ok' : 'no'); if (!ok) { b.classList.add('shake'); right().classList.add('ok'); } else b.classList.add('popin'); }
  st.sure = sure; finishQ(box, ok ? 1 : 0, given);
}
function drawOrder(box, q) { const st = R.state; $('#seq', box).innerHTML = st.seq.map((v, i) => `<button class="opt" data-si="${i}"><span class="k"></span><span>${esc(q.items[v])}</span></button>`).join(''); $('#pool', box).innerHTML = st.pool.filter(v => !st.seq.includes(v)).map(v => `<button class="opt" data-pi="${v}"><span class="k">+</span><span>${esc(q.items[v])}</span></button>`).join(''); $('#check', box).disabled = st.seq.length !== q.items.length; }
function drawMatch(box, q) { const st = R.state, rightOf = {}; for (const l in st.pairs) rightOf[st.pairs[l]] = +l; const col = l => PC[Object.keys(st.pairs).map(Number).sort((a, b) => a - b).indexOf(l) % PC.length];
  $('#ml', box).innerHTML = q.pairs.map((p, i) => `<button class="opt ${st.selL === i ? 'sel' : ''}" data-l="${i}" ${st.pairs[i] != null ? `data-p style="--pc:${col(i)}"` : ''}>${esc(p[0])}</button>`).join('');
  $('#mr', box).innerHTML = st.right.map(r => `<button class="opt" data-r="${r}" ${rightOf[r] != null ? `data-p style="--pc:${col(rightOf[r])}"` : ''}>${esc(q.pairs[r][1])}</button>`).join('');
  $('#check', box).disabled = Object.keys(st.pairs).length !== q.pairs.length; }
function finishQ(box, score, given, self) {
  const st = R.state; if (st.done) return; st.done = true; clearInterval(timerId);
  const id = st.id, q = QBY[id], test = R.mode === 'test', pre = R.mode === 'pre';
  if (!pre) record(id, score);
  if (st.sure && score < 1 && !pre) { S.q[id].hc = (S.q[id].hc || 0) + 1; saveS(); }
  if (!(id in R.first)) R.first[id] = { score, given };
  const fb = $('#fb', box), act = $('#qact', box);
  if (!test && !(q.type === 'open' && self)) {
    const cls = score >= 1 ? 'ok' : score > 0 ? 'part' : 'no';
    const title = pre ? (score >= 1 ? 'Gut geraten' : 'Gleich lernst du es') : score >= 1 ? 'Richtig' : score > 0 ? 'Teilweise richtig' : given === 'Zeit abgelaufen' ? 'Zeit abgelaufen' : st.sure ? 'Sicher, aber falsch. Genau das merkst du dir jetzt.' : 'Leider falsch';
    fb.innerHTML = `<div class="feedback ${cls}"><h3>${title}</h3>${score < 1 ? `<p><strong>Lösung:</strong> ${esc(correctText(q))}</p>` : ''}${q.explain ? `<p>${esc(q.explain)}</p>` : ''}</div>`;
  }
  if (!test && !pre && score < 1 && (R.rep[id] || 0) < 2) { R.rep[id] = (R.rep[id] || 0) + 1; R.list.splice(Math.min(R.i + (st.sure ? 2 : 3), R.list.length), 0, id); }
  const look = !pre && !test && q.sec && score < 1 ? `<button class="btn sm ghost" data-look="1">Im Stoff nachlesen</button>` : '<span></span>';
  act.innerHTML = `${look}<button class="btn primary" id="next">${R.i + 1 >= R.list.length ? (R.onDone ? 'Weiter' : 'Ergebnis ansehen') : 'Weiter'}</button>`;
  if (test && q.type !== 'open') setTimeout(() => { if (R && R.state === st) nextQ(); }, 350);
  else setTimeout(() => { const n = $('#next', box); n && n.focus({ preventScroll: true }); }, 20);
}
function nextQ() { R.i++; if (R.i >= R.list.length) { R.done = true; if (R.onDone) return R.onDone(); return goReplace(T.slug + '/quiz/ergebnis'); } RENDER[R.el]($('#v-' + R.el)); window.scrollTo({ top: 0 }); }
const grade = p => p >= .89 ? [1, 'Sehr gut'] : p >= .76 ? [2, 'Gut'] : p >= .63 ? [3, 'Befriedigend'] : p >= .5 ? [4, 'Genügend'] : [5, 'Nicht genügend'];
function renderResult(el) {
  clearInterval(timerId);
  const ids = Object.keys(R.first), n = ids.length, p = n ? ids.reduce((a, id) => a + R.first[id].score, 0) / n : 0, [g, gt] = grade(p), wrong = ids.filter(id => R.first[id].score < 1);
  el.innerHTML = `
  <div class="panel result">${ringSVG(p, 'richtig')}
    <div style="display:grid;gap:12px"><h2>${R.title}: ${p >= .89 ? 'ausgezeichnet' : p >= .63 ? 'gut gemacht' : 'dranbleiben'}</h2>
      ${R.mode === 'test' ? `<p class="grade">Note ${g}: ${gt} <span class="muted" style="font-size:.9rem;font-weight:400;font-family:var(--body)">(Richtwert)</span></p>` : ''}
      <p class="muted num">${n} ${n === 1 ? 'Frage' : 'Fragen'}, ${ids.filter(i => R.first[i].score >= 1).length} richtig, ${wrong.length} mit Fehlern, etwa ${Math.max(1, Math.round((Date.now() - R.t0) / 60000))} min</p>
      <div class="row">${wrong.length ? `<button class="btn primary" id="again">${wrong.length} Fehler nochmal</button>` : ''}<button class="btn" id="newq">Neue Runde</button><button class="btn ghost" id="toPath">Zum Lernpfad</button></div></div></div>
  ${wrong.length ? `<h3>Das solltest du dir nochmal ansehen</h3><div class="review">${wrong.map(id => { const q = QBY[id], f = R.first[id]; return `<details class="rv"><summary><span class="dot" style="background:${f.score > 0 ? 'var(--part)' : 'var(--bad)'}"></span><span>${esc(q.q)}</span></summary><div><p><strong>Deine Antwort:</strong> ${esc(f.given)}</p><p><strong>Lösung:</strong> ${esc(correctText(q))}</p>${q.explain ? `<p class="muted">${esc(q.explain)}</p>` : ''}</div></details>`; }).join('')}</div>` : ''}`;
  ringGo(el); if (p >= .76 && !R.cel) { R.cel = true; confetti(); }
  el.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.id === 'again') startSession({ ids: shuffle(wrong), mode: 'ueben', title: 'Fehlerrunde' }); if (b.id === 'newq') { R = null; tgo('quiz'); } if (b.id === 'toPath') { R = null; tgo('start'); } };
}
// Runde abbrechen: Nachfrage in der Seite statt confirm()
function askQuit() {
  if (current !== 'quiz' || SUB !== 'run' || !R || R.done) return false;
  const a = $('#quitAsk'); if (a) { a.remove(); return true; }
  $('#v-quiz .qtop').insertAdjacentHTML('afterend', `<div class="panel quit-ask" id="quitAsk" role="alertdialog" aria-labelledby="quitT"><span id="quitT">Runde beenden? Deine bisherigen Antworten bleiben gespeichert.</span><div class="row"><button class="btn" id="quitNo">Weiter üben</button><button class="btn danger" id="quitYes">Beenden</button></div></div>`);
  $('#quitNo').focus(); return true;
}
function endRun() { clearInterval(timerId); if (Object.keys(R.first).length) { R.done = true; goReplace(T.slug + '/quiz/ergebnis'); } else { R = null; goReplace(T.slug + '/quiz'); } }
function confetti() {
  if (!motionOK()) return; const cv = document.createElement('canvas'); cv.id = 'fx'; document.body.appendChild(cv); const x = cv.getContext('2d'), dpr = devicePixelRatio || 1;
  const W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
  const cs = getComputedStyle(ROOT), cols = ['--accent', '--dose', '--good', '--part'].map(v => cs.getPropertyValue(v).trim());
  const ps = Array.from({ length: 120 }, () => ({ x: W / 2 + (Math.random() - .5) * W * .2, y: H * .35, vx: (Math.random() - .5) * 26 * dpr, vy: (-Math.random() * 22 - 8) * dpr, r: (4 + Math.random() * 5) * dpr, a: Math.random() * 6, c: cols[Math.random() * cols.length | 0] }));
  const t0 = performance.now(); (function f(t) { const k = (t - t0) / 1800; x.clearRect(0, 0, W, H); ps.forEach(p => { p.vy += .9 * dpr; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.a += .2; x.save(); x.globalAlpha = Math.max(0, 1 - k); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore(); }); if (k < 1) requestAnimationFrame(f); else cv.remove(); })(t0);
}

/* ---------- Statistik ---------- */
RENDER.statistik = el => {
  const ans = Object.values(S.q), tot = ans.reduce((a, s) => a + s.c + s.w, 0), cor = ans.reduce((a, s) => a + s.c, 0), m = Q.filter(q => mastered(q.id)).length, hc = ans.reduce((a, s) => a + (s.hc || 0), 0);
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return [d, G.days[dayKey(d)] || 0]; }), max = Math.max(5, ...days.map(d => d[1]));
  const lv = [0, 0, 0, 0, 0]; LESSONS.forEach(l => lv[lessonLevel(l)]++);
  const weak = LESSONS.map(l => [l, l.qs.map(id => S.q[id]).filter(Boolean)]).filter(([, s]) => s.length >= 2).map(([l, s]) => [l, s.reduce((a, x) => a + x.c, 0) / s.reduce((a, x) => a + x.c + x.w, 0)]).sort((a, b) => a[1] - b[1]).slice(0, 5);
  el.innerHTML = `
  <h2>Statistik</h2>
  <div class="statgrid">
    <div class="panel stat"><small>Antworten</small><b class="num" data-count="${Math.round(tot)}">0</b></div>
    <div class="panel stat"><small>Trefferquote</small><b class="num">${tot ? Math.round(cor / tot * 100) : 0}%</b></div>
    <div class="panel stat"><small>Gemeistert</small><b class="num" data-count="${m}">0</b><small>von ${Q.length} Fragen</small></div>
    <div class="panel stat"><small>Sicher, aber falsch</small><b class="num">${hc}</b><small>Fehleinschätzungen</small></div>
  </div>
  <div class="panel" style="display:grid;gap:14px"><h3>Lektionen nach Stand</h3><div class="levels">${LEVEL.map((n, i) => `<div class="lv${i}"><span class="node"></span><b class="num">${lv[i]}</b><small>${n}</small></div>`).join('')}</div><p class="muted">Gemeistert heißt: alle Fragen richtig, auch bei einer späteren Wiederholung.</p></div>
  <div class="panel" style="display:grid;gap:14px"><h3>Letzte 14 Tage</h3><div class="days">${days.map(([d, n]) => `<div title="${n} Antworten"><i style="height:${n / max * 100}%"></i><small>${d.getDate()}.</small></div>`).join('')}</div></div>
  <div class="panel" style="display:grid;gap:12px"><h3>Hier wackelt es noch</h3>${weak.length ? `<div class="weak">${weak.map(([l, a]) => `<div class="w"><span><strong>${esc(chName(CHBY[l.ch]))}</strong>, ${esc(l.title)} <span class="muted num">(${Math.round(a * 100)}% richtig)</span></span><button class="btn sm primary" data-wl="${esc(l.id)}">Lektion üben</button></div>`).join('')}</div>` : '<p class="muted">Beantworte ein paar Fragen, dann siehst du hier deine Lücken.</p>'}</div>`;
  countUp(el);
  el.onclick = e => { const b = e.target.closest('button'); if (b && b.dataset.wl) startLesson(b.dataset.wl); };
};

/* ---------- Optionen ---------- */
RENDER.optionen = el => {
  const seg = (k, vals) => `<div class="seg" data-key="${k}">${vals.map(([v, l]) => `<button aria-pressed="${G.opt[k] === v}" data-v="${v}">${l}</button>`).join('')}</div>`;
  el.innerHTML = `
  <h2>Optionen</h2>
  <div class="panel opts-list">
    <div class="opt-row"><div><h3>Erscheinungsbild</h3></div>${seg('theme', [['system', 'System'], ['light', 'Hell'], ['dark', 'Dunkel']])}</div>
    <div class="opt-row"><div><h3>Animationen</h3></div>${seg('motion', [[true, 'An'], [false, 'Aus']])}</div>
    <div class="opt-row"><div><h3>Schriftgröße</h3></div>${seg('big', [[false, 'Normal'], [true, 'Groß']])}</div>
    <div class="opt-row"><div><h3>Sicherheit abfragen</h3><p class="muted">Nach Multiple Choice und Richtig/Falsch fragst du dich: sicher oder geraten? Sichere Fehler kommen früher wieder.</p></div>${seg('conf', [[false, 'Aus'], [true, 'An']])}</div>
    <div class="opt-row"><div><h3>Fortschritt sichern</h3><p class="muted">Dein Lernstand liegt nur in diesem Browser. Als Datei sichern und auf einem anderen Gerät laden.</p></div><div class="row"><button class="btn" id="exp">Sichern</button><label class="btn" for="imp">Laden</label><input type="file" id="imp" accept="application/json" hidden></div></div>
    <div class="opt-row"><div><h3>Alles zurücksetzen</h3><p class="muted">Löscht Fortschritt in allen Themen auf diesem Gerät.</p></div><div class="row" id="resetBox"><button class="btn" id="reset1">Zurücksetzen</button></div></div>
  </div>`;
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return; const seg = b.closest('[data-key]');
    if (seg) { const k = seg.dataset.key, v = b.dataset.v; G.opt[k] = v === 'true' ? true : v === 'false' ? false : v; saveG(); applyOpt(); RENDER.optionen(el); toast('Gespeichert'); }
    if (b.id === 'exp') { const data = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('lernstudio:')) data[k] = localStorage.getItem(k); } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' })); a.download = 'lernstudio-fortschritt-' + dayKey() + '.json'; a.click(); }
    if (b.id === 'reset1') $('#resetBox', el).innerHTML = `<button class="btn ghost" id="reset0">Abbrechen</button><button class="btn danger" id="reset2">Ja, alles löschen</button>`;
    if (b.id === 'reset0') RENDER.optionen(el);
    if (b.id === 'reset2') { Object.keys(localStorage).filter(k => k.startsWith('lernstudio:t:')).forEach(k => localStorage.removeItem(k)); G.days = {}; saveG(); if (T) S = { q: {}, done: {}, read: {}, exam: '' }; toast('Zurückgesetzt'); RENDER.optionen(el); drawNav('optionen'); }
  };
  $('#imp', el).onchange = async e => { try { const d = JSON.parse(await e.target.files[0].text()); Object.entries(d).forEach(([k, v]) => k.startsWith('lernstudio:') && localStorage.setItem(k, v)); toast('Fortschritt geladen'); setTimeout(() => location.reload(), 600); } catch (err) { toast('Die Datei ist keine Lernstudio-Sicherung.'); } };
};

/* ---------- Tastatur ---------- */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !e.target.matches('input[type=search],input[type=date]')) { e.preventDefault(); return back(); }
  if (e.target.matches('input,textarea') && e.key !== 'Enter') return;
  if (current === 'karten') { if (e.key === ' ') { e.preventDefault(); flip(); } if (K.flipped && /^[1-4]$/.test(e.key)) rateCard(+e.key - 1); return; }
  if (!R || R.done) return; const box = $('#v-' + R.el); if (!box || box.hidden) return;
  if (e.key === 'Enter') { if (e.target.matches('textarea')) return; const b = $('#next', box) || $('#check:not(:disabled)', box) || $('#show', box); if (b) { e.preventDefault(); b.click(); } return; }
  if (/^[1-4]$/.test(e.key)) { const o = box.querySelectorAll('.opts .opt, .tf .opt')[+e.key - 1]; if (o && !o.disabled) o.click(); }
});

applyOpt(); stamp(true); addEventListener('hashchange', () => { stamp(); WANT = location.hash.slice(1); route(); }); route();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
