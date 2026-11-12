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
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(200);
      const cover = await p.evaluate(() => { const bar = document.querySelector('#tabsMob'); if (bar.hidden) return 0; const top = bar.getBoundingClientRect().top; const v = document.querySelector('.view:not([hidden])'); const kids = [...v.querySelectorAll('*')].filter(e => e.getBoundingClientRect().height && !e.closest('[hidden]')); return Math.max(0, ...kids.map(e => e.getBoundingClientRect().bottom)) - top; });
      if (cover > 0) E(`${name}: ${Math.round(cover)} px unter der Leiste`);
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
  console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'OK');
  await b.close();
})();
