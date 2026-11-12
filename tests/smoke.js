// Rauchtest Lernstudio: Bibliothek → Thema → Lektion komplett → Üben/Test → Karten → Lesen → Statistik → Optionen
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://localhost:8000/';
const OUT = __dirname + '/shots/';
require('fs').mkdirSync(OUT, { recursive: true });
async function answerCurrent(p, right = true) {
  const t = await p.evaluate(() => QBY[R.list[R.i]].type);
  const box = await p.evaluate(() => '#v-' + R.el);
  if (t === 'mc') { const a = await p.evaluate(() => QBY[R.list[R.i]].answer); await p.click(`${box} .opt[data-o="${right ? a : (a + 1) % 4}"]`); }
  if (t === 'tf') { const a = await p.evaluate(() => QBY[R.list[R.i]].answer); await p.click(`${box} .opt[data-tf="${(a === right) ? 1 : 0}"]`); }
  if (t === 'cloze') { await p.fill(`${box} #cz`, right ? await p.evaluate(() => QBY[R.list[R.i]].answers[0]) : 'xyz'); await p.click(`${box} #check`); }
  if (t === 'order') { const n = await p.evaluate(() => QBY[R.list[R.i]].items.length); for (let i = 0; i < n; i++) await p.click(`${box} #pool .opt[data-pi="${i}"]`); await p.click(`${box} #check`); }
  if (t === 'match') { const n = await p.evaluate(() => QBY[R.list[R.i]].pairs.length); for (let i = 0; i < n; i++) { await p.click(`${box} #ml .opt[data-l="${i}"]`); await p.click(`${box} #mr .opt[data-r="${i}"]`); } await p.click(`${box} #check`); }
  if (t === 'open') { await p.click(`${box} #show`); await p.click(`${box} [data-self="${right ? 1 : 0}"]`); }
  return t;
}
(async () => {
  const b = await chromium.launch(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}); const errs = [];
  for (const [w, h, scheme] of [[1280, 860, 'light'], [390, 844, 'dark']]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, colorScheme: scheme });
    p.on('pageerror', e => errs.push(w + ' ' + e.message));
    p.on('console', m => m.type() === 'error' && !/TUNNEL/.test(m.text()) && errs.push(w + ' console ' + m.text()));
    await p.goto(BASE); await p.waitForTimeout(800);
    await p.screenshot({ path: OUT + `home_${w}.png`, fullPage: w === 1280 });
    for (const slug of ['strahlentherapie', 'chromatographie']) {
      await p.click(`[data-t="${slug}"]`); await p.waitForTimeout(3200);
      await p.screenshot({ path: OUT + `start_${slug}_${w}.png` });
      // Lektion über "Weiterlernen"
      await p.click('#goNext'); await p.waitForTimeout(300);
      let guard = 0;
      while (guard++ < 40) {
        const st = await p.evaluate(() => LS && LS.stage);
        if (st === 'done' || !st) break;
        if (st === 'read') { if (guard < 3 && w === 1280) await p.screenshot({ path: OUT + `lesson_read_${slug}.png` }); await p.click('#toQuiz'); continue; }
        const t = await answerCurrent(p, guard % 3 !== 0);
        if (w === 1280 && guard === 2) await p.screenshot({ path: OUT + `lesson_q_${slug}.png` });
        await p.click('#v-lektion #next');
      }
      if ((await p.evaluate(() => LS && LS.stage)) !== 'done') errs.push(w + ' lesson not done ' + slug);
      await p.waitForTimeout(400); if (w === 390) await p.screenshot({ path: OUT + `lesson_done_${slug}_390.png` });
      await p.click('#lback2'); await p.waitForTimeout(400);
      await p.screenshot({ path: OUT + `path_${slug}_${w}.png`, fullPage: false });
      await p.goto(BASE + '#home'); await p.waitForTimeout(500);
    }
    // Üben + Test auf Chromatographie
    await p.evaluate(() => go('chromatographie/quiz')); await p.waitForTimeout(500);
    await p.click('[data-key="mode"] [data-v="test"]'); await p.click('[data-key="count"] [data-v="5"]'); await p.click('#go'); await p.waitForTimeout(300);
    for (let i = 0; i < 12; i++) { if (await p.evaluate(() => !R || R.done)) break; const t = await answerCurrent(p, i % 2 === 0); await p.waitForTimeout(450); if (t === 'open' || !(await p.evaluate(() => R.done)) && await p.$('#v-quiz #next')) { const n = await p.$('#v-quiz #next'); if (n) await n.click(); } }
    await p.waitForTimeout(1500); await p.screenshot({ path: OUT + `result_${w}.png` });
    if (!(await p.evaluate(() => R && R.done))) errs.push(w + ' test not done');
    // Karten, Lesen, Statistik, Optionen
    await p.evaluate(() => go('strahlentherapie/karten')); await p.waitForTimeout(3000);
    await p.click('#flash'); await p.waitForTimeout(700); await p.click('[data-r="2"]');
    await p.evaluate(() => go('strahlentherapie/lernen')); await p.waitForTimeout(500); await p.screenshot({ path: OUT + `lernen_${w}.png` });
    await p.fill('#lsearch', 'Bragg'); await p.waitForTimeout(200); if (!(await p.$$eval('.hit', x => x.length))) errs.push(w + ' no hits');
    for (const v of ['statistik', 'optionen']) { await p.evaluate(v => go(v === 'optionen' ? v : 'strahlentherapie/' + v), v); await p.waitForTimeout(800); await p.screenshot({ path: OUT + `${v}_${w}.png` }); }
    const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (over > 0) errs.push(w + ' overflow ' + over);
    await p.close();
  }
  // Navigation: jede Ansicht per Browser-Zurück, Zurück-Knopf oder Esc wieder zum Lernpfad (Aufgabe 1)
  {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const E = m => errs.push('nav ' + m);
    p.on('pageerror', e => E(e.message)); p.on('dialog', d => { E('dialog ' + d.message()); d.dismiss(); });
    const at = async (want, how) => { await p.waitForTimeout(350); const h = await p.evaluate(() => location.hash); if (h !== '#' + want) E(`${how}: ${h} statt #${want}`); };
    const S = 'strahlentherapie';
    await p.goto(BASE + '#' + S + '/start'); await p.waitForTimeout(3000);
    for (const v of ['lernen', 'karten', 'quiz', 'statistik']) {
      await p.click(`#tabsMob a[href="#${S}/${v}"]`); await at(S + '/' + v, v);
      if (!(await p.isVisible('#crumbs #back'))) E('kein Zurück-Knopf ' + v);
      await p.goBack(); await at(S + '/start', 'goBack ' + v);
      await p.click(`#tabsMob a[href="#${S}/${v}"]`); await at(S + '/' + v, v); await p.click('#crumbs #back'); await at(S + '/start', 'Knopf ' + v);
    }
    await p.click('#optLink'); await at('optionen', 'opt'); await p.keyboard.press('Escape'); await at(S + '/start', 'Esc optionen');
    // Lektion: Vortest → Lesen → Abfrage, Zurück zu Lesen, Vor zur Abfrage an derselben Stelle
    await p.click('#goNext'); await p.waitForTimeout(300);
    while ((await p.evaluate(() => LS.stage)) === 'pre') { await answerCurrent(p); await p.click('#v-lektion #next'); }
    await at(S + '/lektion/read', 'Lesen'); await p.click('#toQuiz'); await at(S + '/lektion/quiz', 'Abfrage');
    await answerCurrent(p); await p.click('#v-lektion #next'); const i = await p.evaluate(() => R.i);
    await p.goBack(); await at(S + '/lektion/read', 'goBack Abfrage');
    await p.goForward(); await at(S + '/lektion/quiz', 'goForward');
    if ((await p.evaluate(() => R.i)) !== i) E('Lektionsfortschritt verloren');
    await p.keyboard.press('Escape'); await at(S + '/lektion/read', 'Esc Abfrage');
    await p.click('#crumbs #back'); await at(S + '/start', 'Knopf Lesen');
    // Übungsrunde: Zurück behält die Runde, Beenden fragt in der Seite, Ergebnis → Zurück
    await p.click(`#tabsMob a[href="#${S}/quiz"]`); await p.click('#go'); await at(S + '/quiz/run', 'Runde');
    await answerCurrent(p); await p.click('#v-quiz #next'); const j = await p.evaluate(() => R.i);
    await p.goBack(); await at(S + '/quiz', 'goBack Runde'); await p.click('#resume'); await at(S + '/quiz/run', 'Fortsetzen');
    if ((await p.evaluate(() => R.i)) !== j) E('Rundenfortschritt verloren');
    await p.click('#quit'); if (!(await p.isVisible('#quitAsk'))) E('keine Nachfrage');
    await p.click('#quitNo'); await at(S + '/quiz/run', 'Weiter üben');
    await p.keyboard.press('Escape'); await p.click('#quitYes'); await at(S + '/quiz/ergebnis', 'Beenden');
    await p.screenshot({ path: OUT + 'nav_ergebnis_390.png' });
    await p.click('#crumbs #back'); await at(S + '/quiz', 'Zurück Ergebnis'); await p.goBack(); await at(S + '/start', 'zum Lernpfad');
    await p.close();
  }
  // Handy 390 px: Ziele ≥ 44 px, nichts unter der unteren Leiste, Wischen auf Karteikarten (Aufgabe 2)
  {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', hasTouch: true }); const E = m => errs.push('mobil ' + m);
    p.on('pageerror', e => E(e.message));
    const S = 'strahlentherapie';
    await p.goto(BASE + '#' + S + '/start'); await p.waitForTimeout(3000);
    const check = async name => {
      const small = await p.evaluate(() => [...document.querySelectorAll('button,a,input,select,textarea,label.btn')].filter(e => {
        const r = e.getBoundingClientRect(); if (!r.width || e.closest('[hidden]') || e.type === 'file') return false;
        if (e.tagName === 'A' && !e.matches('.btn,.topic-pill,.icon-btn,.brand') && e.closest('p,li,.links,.principles,.crumbs li')) return false; // Links im Fließtext sind ausgenommen (WCAG 2.5.8)
        return r.height < 44 - .5;
      }).map(e => (e.id || e.className || e.tagName) + ' ' + Math.round(e.getBoundingClientRect().height) + 'px'));
      if (small.length) E(`${name}: zu klein ${[...new Set(small)].slice(0, 5).join(', ')}`);
      for (let k = 0, h0 = -1, h; k < 8 && (h = await p.evaluate(() => document.documentElement.scrollHeight)) !== h0; k++, h0 = h) { await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(250); } // bis die Höhe stabil ist
      const cover = await p.evaluate(() => { const bar = document.querySelector('#tabsMob'); if (bar.hidden) return 0; const top = bar.getBoundingClientRect().top; const v = document.querySelector('.view:not([hidden])'); const kids = [...v.querySelectorAll('*')].filter(e => e.getBoundingClientRect().height && !e.closest('[hidden]')); return Math.max(0, ...kids.map(e => e.getBoundingClientRect().bottom)) - top; });
      if (cover > 0) E(`${name}: ${Math.round(cover)} px unter der Leiste`);
      const wide = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (wide > 0) E(`${name}: ${wide} px zu breit`);
      await p.screenshot({ path: OUT + `m_${name}_390.png` });
    };
    for (const v of ['start', 'lernen', 'karten', 'quiz', 'statistik']) { await p.evaluate(h => go(h), S + '/' + v); await p.waitForTimeout(700); await check(v); }
    await p.evaluate(() => go('optionen')); await p.waitForTimeout(500); await check('optionen');
    await p.evaluate(() => go('home')); await p.waitForTimeout(500); await check('home');
    await p.evaluate(h => go(h), S + '/start'); await p.waitForTimeout(500); await p.click('#goNext'); await p.waitForTimeout(300); await check('lektion');
    await p.evaluate(h => go(h), S + '/quiz'); await p.waitForTimeout(400); await p.click('#go'); await p.waitForTimeout(400); await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({ path: OUT + "m_runde_oben_390.png" }); await check('runde');
    // Wischen: Karte umdrehen, nach links wischen = Nochmal
    await p.evaluate(h => go(h), S + '/karten'); await p.waitForTimeout(600);
    const id0 = await p.evaluate(() => K.list[0]); await p.click('#flash'); await p.waitForTimeout(700);
    const bx = await p.locator('#flash').boundingBox(); const y = bx.y + bx.height / 2;
    await p.mouse.move(bx.x + bx.width * .7, y); await p.mouse.down(); await p.mouse.move(bx.x + bx.width * .4, y, { steps: 6 }); await p.mouse.move(bx.x + bx.width * .2, y, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(500);
    const after = await p.evaluate(id => ({ first: K.list[0], flipped: K.flipped, rated: !!S.q[id], again: K.list.includes(id) }), id0);
    if (!after.rated || after.first === id0 || after.flipped || !after.again) E('Wischen links ' + JSON.stringify(after));
    await p.close();
  }
  // Kontrast hell und dunkel ≥ 4,5:1 (große Schrift 3:1), alle Hauptansichten (Aufgabe 3)
  for (const scheme of ['dark', 'light']) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
    await p.goto(BASE + '#strahlentherapie/start'); await p.waitForTimeout(3000);
    for (const h of ['home', 'strahlentherapie/start', 'strahlentherapie/lernen', 'strahlentherapie/karten', 'strahlentherapie/quiz', 'strahlentherapie/statistik', 'optionen']) {
      await p.evaluate(h => go(h), h); await p.waitForTimeout(1300);
      const bad = await p.evaluate(() => {
      const rgb = s => { const m = (s.match(/[\d.]+/g) || [0, 0, 0, 0]).map(Number); if (s.startsWith('color(')) { const [r, g, b, a] = m; return [r * 255, g * 255, b * 255, a ?? 1]; } return m; };
      const lum = ([r, g, b]) => { const f = c => (c /= 255) <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
      const bgOf = e => { for (; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length < 4 || c[3] > .9) return c; } return [255, 255, 255]; };
      const out = [];
      document.querySelectorAll('.view:not([hidden]) *, #crumbs *, header *').forEach(e => {
        if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return; if (!e.getBoundingClientRect().width || e.closest('[hidden]')) return;
        const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none') return; const fg = rgb(cs.color), bg = bgOf(e);
        const a = fg[3] ?? 1; const mix = fg.slice(0, 3).map((c, i) => c * a + bg[i] * (1 - a));
        const L1 = lum(mix), L2 = lum(bg), r = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
        const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.6 && +cs.fontWeight >= 700);
        if (r < (big ? 3 : 4.5)) out.push(`${r.toFixed(2)} ${e.tagName}.${e.className} "${e.textContent.trim().slice(0, 25)}"`);
      }); return out;
    });
      bad.slice(0, 3).forEach(x => errs.push(`Kontrast ${scheme} ${h}: ${x}`));
    }
    await p.close();
  }
  // Gemeistert erst nach verzögerter, gemischter Abfrage; Fehler stuft zurück (Aufgabe 5)
  {
    const p = await b.newPage(); p.on('pageerror', e => errs.push('meister ' + e.message));
    await p.goto(BASE + '#chromatographie/start'); await p.waitForTimeout(2500);
    const r = await p.evaluate(() => {
      const [a, c] = [Q[0].id, Q[1].id], old = () => ({ c: 1, w: 0, b: 2, ok: true, t: Date.now() - 2 * DAY, due: 0 });
      const out = {};
      S.q[a] = old(); record(a, 1, false, false); out.einzeln = mastered(a);          // nicht gemischt → nein
      S.q[a] = old(); S.q[a].t = Date.now() - 3600e3; record(a, 1, false, true); out.sofort = mastered(a); // zu früh → nein
      S.q[a] = old(); record(a, 1, false, true); out.gemischt = mastered(a);          // verzögert + gemischt → ja
      record(a, 0, false, true); out.nachFehler = mastered(a);                         // Fehler → zurück
      S.q[c] = old(); out.neu = mastered(c);                                           // alter Stand (b ≥ 2) zählt nicht automatisch
      out.runMixed = newRun({ ids: [Q[0].id, Q.find(q => q.ch !== Q[0].ch).id] }).mixed && !newRun({ ids: [Q[0].id, Q[1].id], el: 'lektion' }).mixed;
      delete S.q[a]; delete S.q[c]; saveS(); return out;
    });
    if (r.einzeln || r.sofort || !r.gemischt || r.nachFehler || r.neu || !r.runMixed) errs.push('Meisterung ' + JSON.stringify(r));
    await p.close();
  }
  // Warum-Prompt nach richtiger Antwort, Musterlösung erst nach Vergleichen (Aufgabe 6)
  {
    const p = await b.newPage(); p.on('pageerror', e => errs.push('warum ' + e.message));
    await p.goto(BASE + '#strahlentherapie/start'); await p.waitForTimeout(3000);
    const id = await p.evaluate(() => { const q = Q.find(q => q.type === 'mc' && q.explain && q.explain.length >= 40); startSession({ ids: [q.id, Q[5].id], mode: 'ueben', title: 'Test' }); return q.id; });
    await p.waitForTimeout(400); await answerCurrent(p, true);
    if (!(await p.isVisible('#why'))) errs.push('warum: kein Prompt');
    if (await p.evaluate(id => document.querySelector('#v-quiz #fb').textContent.includes(QBY[id].explain), id)) errs.push('warum: Lösung zu früh sichtbar');
    await p.fill('#why', 'Weil es so ist.'); await p.click('#whyShow'); await p.screenshot({ path: OUT + 'warum_1280.png' });
    if (!(await p.evaluate(id => document.querySelector('#whyModel').textContent.includes(QBY[id].explain), id))) errs.push('warum: keine Musterlösung');
    await p.click('#whyYes'); if ((await p.evaluate(() => R.i)) !== 1) errs.push('warum: nicht weiter');
    await p.evaluate(() => { G.opt.why = false; startSession({ ids: [Q.find(q => q.type === 'mc' && q.explain && q.explain.length >= 40).id], mode: 'ueben' }); }); await p.waitForTimeout(400);
    await answerCurrent(p, true); if (await p.isVisible('#why')) errs.push('warum: Option Aus wirkt nicht');
    await p.evaluate(() => { G.opt.why = true; saveG(); });
    await p.close();
  }
  // Lektionen haben gemischte Fragetypen, nicht nur offene Fragen (Aufgabe 7)
  {
    const p = await b.newPage(); p.on('pageerror', e => errs.push('typen ' + e.message));
    for (const slug of ['chromatographie', 'strahlentherapie']) {
      await p.goto(BASE + '#' + slug + '/start'); await p.waitForTimeout(2500);
      const r = await p.evaluate(() => { const withQ = LESSONS.filter(l => l.qs.length); const mixed = withQ.filter(l => new Set(l.qs.map(id => QBY[id].type)).size >= 2 && l.qs.some(id => QBY[id].type !== 'open')); return { n: withQ.length, mixed: mixed.length }; });
      if (r.mixed < r.n * .75) errs.push(`typen ${slug}: nur ${r.mixed} von ${r.n} Lektionen gemischt`);
    }
    await p.close();
  }
  // Testfehler am Folgetag als kurze Runde (Aufgabe 8)
  {
    const p = await b.newPage(); p.on('pageerror', e => errs.push('folgetag ' + e.message));
    await p.goto(BASE + '#strahlentherapie/start'); await p.waitForTimeout(3000);
    await p.evaluate(() => { S.retest = null; startSession({ ids: Q.filter(q => q.type === 'tf').slice(0, 3).map(q => q.id), mode: 'test', title: 'Testsimulation' }); }); await p.waitForTimeout(300);
    for (let i = 0; i < 3; i++) { await answerCurrent(p, i === 0); await p.waitForTimeout(500); }
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => { const o = { saved: S.retest && S.retest.ids.length, tomorrow: S.retest && S.retest.day > dayKey(), today: nextAction().kind }; S.retest.day = dayKey(); o.next = nextAction().kind; runAction(nextAction()); o.title = R.title; o.cleared = !S.retest; return o; });
    if (r.saved !== 2 || !r.tomorrow || r.today === 'retest' || r.next !== 'retest' || r.title !== 'Testfehler von gestern' || !r.cleared) errs.push('folgetag ' + JSON.stringify(r));
    await p.close();
  }
  // Schemazeichnungen mit Beschriftung + Bildfragen „Was ist markiert?“ (Aufgabe 9)
  {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.on('pageerror', e => errs.push('bild ' + e.message));
    for (const [slug, figs] of [['strahlentherapie', ['roehre', 'linac', 'bragg']], ['chromatographie', ['gc', 'hplc']]]) {
      await p.goto(BASE + '#' + slug + '/start'); await p.waitForTimeout(3000);
      const r = await p.evaluate(figs => figs.map(f => { const F = FIG[f], s = SEC[F.ch + '|' + F.sec], n = Object.keys(F.parts).length, qs = Q.filter(q => q.fig === f);
        const tmp = document.createElement('div'); tmp.innerHTML = secHTML(F.ch, s); const svg = tmp.querySelector('svg.fig');
        const lbls = svg ? svg.querySelectorAll('[data-p] .lbl').length : 0; const inLesson = LESSONS.some(l => qs.every(q => l.qs.includes(q.id)));
        return { f, sec: !!s, svg: !!svg, lbls: lbls >= n, qs: qs.length === n, opts: qs.every(q => new Set(q.options).size === 4), inLesson }; }), figs);
      r.filter(x => !(x.sec && x.svg && x.lbls && x.qs && x.opts && x.inLesson)).forEach(x => errs.push('bild ' + JSON.stringify(x)));
    }
    await p.evaluate(() => startSession({ ids: ['fig-hplc-pumpe'], mode: 'ueben' })); await p.waitForTimeout(500);
    const q = await p.evaluate(() => { const s = document.querySelector('#v-quiz svg.fig.quiz'); return s && { mark: !!s.querySelector('.mark[data-p="pumpe"]'), hidden: getComputedStyle(s.querySelector('.lbl')).display === 'none', over: document.documentElement.scrollWidth - innerWidth }; });
    if (!q || !q.mark || !q.hidden || q.over > 0) errs.push('bildfrage ' + JSON.stringify(q));
    await answerCurrent(p, true); if (!(await p.evaluate(() => S.q['fig-hplc-pumpe'] && S.q['fig-hplc-pumpe'].ok))) errs.push('bildfrage nicht gewertet');
    await p.screenshot({ path: OUT + 'bildfrage_390.png' });
    await p.close();
  }
  // Serien-Pause (1 Tag pro Woche) und Tagesrückblick (Aufgabe 10)
  {
    const p = await b.newPage(); p.on('pageerror', e => errs.push('serie ' + e.message));
    await p.goto(BASE + '#strahlentherapie/start'); await p.waitForTimeout(3000);
    const r = await p.evaluate(() => {
      const keep = G.days, set = offs => { G.days = {}; offs.forEach(o => { const d = new Date(); d.setDate(d.getDate() - o); G.days[dayKey(d)] = 3; }); return streak(); };
      const o = { durch: set([0, 1, 2, 3]), pause: set([0, 1, 3, 4]), zweiPausen: set([0, 2, 4]), pauseNachWoche: set([0, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12]), gestern: set([1, 2]), alt: set([2, 3]) };
      G.days = keep;
      const id = Q[0].id; S.q[id] = { c: 1, w: 0, b: 1, ok: true, t: Date.now() }; RENDER.start(document.querySelector('#v-start'));
      o.recap = (document.querySelector('#recap') || {}).textContent || ''; delete S.q[id]; saveS(); return o;
    });
    // Erwartung: 4; 4 (Tag 2 Pause); 2 (zweite Lücke in 7 Tagen bricht); 11 (Pausen an Tag 1 und 10, 9 Tage Abstand); 2; 0
    const want = { durch: 4, pause: 4, zweiPausen: 2, pauseNachWoche: 11, gestern: 2, alt: 0 };
    for (const k in want) if (r[k] !== want[k]) errs.push(`serie ${k}: ${r[k]} statt ${want[k]}`);
    if (!/Heute gelernt\s*1 Frage abgerufen, 1 davon zuletzt richtig/.test(r.recap)) errs.push('rückblick: ' + r.recap);
    await p.close();
  }
  // Prüfskript für Themen + Vorlage (Aufgabe 11)
  {
    const { spawnSync } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
    const PY = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3'), root = path.join(__dirname, '..');
    const run = f => spawnSync(PY, [path.join(root, 'tools/check_thema.py'), ...(f ? [f] : [])], { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    const all = run(); if (all.status !== 0) errs.push('check_thema: ' + all.stdout);
    const tpl = JSON.parse(fs.readFileSync(path.join(root, 'tools/neues_thema.md'), 'utf8').match(/```json\r?\n([\s\S]*?)```/)[1]);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lernstudio-')), f = path.join(dir, 'beispiel.json');
    fs.writeFileSync(f, JSON.stringify(tpl)); const ok = run(f).stdout.split('\n').filter(l => l.includes('FEHLER'));
    if (ok.length !== 1 || !ok[0].includes('index.json')) errs.push('Vorlage ungültig: ' + ok.join(' | '));
    const q = tpl.chapters[0].questions; q[0].options.pop(); q[1].id = q[0].id; q[2].q = 'ohne Lücke';
    fs.writeFileSync(f, JSON.stringify(tpl)); const bad = run(f);
    if (bad.status !== 1 || !/4 verschiedene Optionen/.test(bad.stdout) || !/id doppelt/.test(bad.stdout) || !/genau ein ___/.test(bad.stdout)) errs.push('check_thema erkennt Fehler nicht: ' + bad.stdout);
  }
  process.exitCode = errs.length ? 1 : 0; // für CI
  // FSRS: Referenzwerte (unabhängig in Python nach den FSRS-6-Formeln gerechnet), Altstand-Übernahme, Option (Aufgabe 4)
  {
    const p = await b.newPage(); p.on('pageerror', e => errs.push('fsrs ' + e.message));
    await p.goto(BASE + '#strahlentherapie/start'); await p.waitForTimeout(3000);
    const r = await p.evaluate(() => {
      const T0 = new Date(2026, 10, 12, 10).getTime(), D = 864e5, o = {};
      const a = FSRS.review(null, 3, T0, .9); o.neu = [a.s, a.d, (a.due - T0) / D];
      const b2 = FSRS.review(a, 3, T0 + 2 * D, .9); o.gut2 = [b2.s, b2.d, (b2.due - b2.last) / D];
      o.ret = [.8, .95].map(x => (FSRS.review(a, 3, T0 + 2 * D, x).due - T0 - 2 * D) / D);
      const c = FSRS.review(b2, 1, T0 + 12 * D, .9); o.falsch = [c.s, c.d, c.due - c.last];
      o.r90 = FSRS.retrievability(7, 7);
      // Altstand: Stufe 3 (7 Tage) wird übernommen, b verschwindet, s/d gesetzt
      const id = Q[0].id; S.q[id] = { c: 2, w: 0, b: 3, ok: true, t: Date.now() - 7 * D, due: Date.now() };
      record(id, 1, false, false); const st = S.q[id]; o.alt = { b: 'b' in st, s: st.s, d: st.d, tage: (st.due - st.t) / D };
      delete S.q[id]; saveS(); return o;
    });
    const near = (x, y) => Math.abs(x - y) < 1e-3, bad = m => errs.push('fsrs ' + m + ' ' + JSON.stringify(r));
    if (!near(r.neu[0], 2.3065) || !near(r.neu[1], 2.1181) || r.neu[2] !== 2) bad('neu');
    if (!near(r.gut2[0], 10.9643) || !near(r.gut2[1], 2.1112) || r.gut2[2] !== 11) bad('gut nach 2 Tagen');
    if (r.ret[0] !== 36 || r.ret[1] !== 4) bad('Behaltensrate');
    if (!near(r.falsch[0], 1.5221) || !near(r.falsch[1], 7.3922) || r.falsch[2] !== 0) bad('falsch');
    if (!near(r.r90, .9)) bad('r(s,s) = 0,9');
    if (r.alt.b || !(r.alt.s > 7) || !(r.alt.tage >= 7)) bad('Altstand');
    await p.evaluate(() => go('optionen')); await p.waitForTimeout(400);
    await p.click('[data-key="ret"] [data-v="0.85"]'); await p.waitForTimeout(200);
    if ((await p.evaluate(() => G.opt.ret)) !== .85 || (await p.getAttribute('[data-key="ret"] [data-v="0.85"]', 'aria-pressed')) !== 'true') bad('Option');
    await p.click('[data-key="ret"] [data-v="0.9"]');
    await p.close();
  }
  // Neue Optionen: Tagesziel, Lektionslänge, Merken, Erklärvideos
  {
    const p = await b.newPage(); p.on('pageerror', e => errs.push('opt2 ' + e.message));
    const bad = m => errs.push('Optionen neu: ' + m);
    await p.goto(BASE + '#optionen'); await p.waitForTimeout(1500);
    for (const [k, v] of [['goal', '10'], ['len', '4'], ['vid', 'true']]) { await p.click(`[data-key="${k}"] [data-v="${v}"]`); await p.waitForTimeout(150); }
    const o = await p.evaluate(() => G.opt); if (o.goal !== 10 || o.len !== 4 || o.vid !== true) bad('speichern ' + JSON.stringify(o));
    await p.evaluate(() => go('strahlentherapie/start')); await p.waitForTimeout(1500);
    if (!/Tagesziel: \d+ \/ 10/.test(await p.textContent('#goal').catch(() => ''))) bad('Tagesziel fehlt im Lernpfad');
    const len = await p.evaluate(() => { startLesson(LESSONS.find(l => l.qs.length > 8).id); return LS.main.length; });
    if (len > 4) bad('Lektionslänge ' + len);
    await p.evaluate(() => go('strahlentherapie/lernen')); await p.waitForTimeout(800);
    const href = await p.getAttribute('.vidlink a', 'href').catch(() => null);
    if (!href || !href.startsWith('https://www.youtube.com/results?search_query=')) bad('Videolink ' + href);
    await p.evaluate(() => startSession({ ids: [Q[0].id, Q[1].id], mode: 'ueben', title: 'T' })); await p.waitForTimeout(500);
    await p.click('#mark'); await p.waitForTimeout(150);
    const m = await p.evaluate(() => ({ s: !!S.mark[Q[0].id], pool: poolFor(Object.assign({}, QS, { chapters: CH.map(c => c.id), mark: true })).length }));
    if (!m.s || m.pool !== 1) bad('Merken ' + JSON.stringify(m));
    await p.evaluate(() => { endRun(); go('strahlentherapie/quiz'); }); await p.waitForTimeout(600);
    if (!/Nur gemerkte Fragen \(1\)/.test(await p.textContent('#markOnly').catch(() => ''))) bad('Merkliste im Üben');
    await p.evaluate(() => { delete S.mark[Q[0].id]; saveS(); Object.assign(G.opt, { goal: 0, len: 6, vid: false }); saveG(); });
    await p.close();
  }
  console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'OK');
  await b.close();
})();
