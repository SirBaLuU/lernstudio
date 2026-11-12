"use strict";
/* FSRS-6 – eigene Umsetzung des Wiederholungsplans (Free Spaced Repetition Scheduler).
   Formeln und Standardparameter: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
   (abgeglichen mit dem Quelltext von ts-fsrs 5.4.2, MIT; dessen Code wird nicht verwendet).

   Begriffe
   - Stabilität s (Tage): nach s Tagen ist die Abrufwahrscheinlichkeit genau 90 %.
   - Schwierigkeit d (1–10): wie schwer die Frage für dich ist; bestimmt, wie stark s wächst.
   - Abrufwahrscheinlichkeit r: Chance, die Frage jetzt noch zu wissen; fällt mit der Zeit.
   - Bewertung g: 1 = Nochmal (falsch), 2 = Schwer (teilweise), 3 = Gut (richtig), 4 = Leicht. */
const FSRS = (() => {
  // 21 Standardparameter FSRS-6 (aus Millionen Anki-Wiederholungen trainiert)
  const W = Object.freeze([0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796,
    1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542]);
  const DECAY = -W[20], FACTOR = 0.9 ** (1 / DECAY) - 1; // so gewählt, dass r(t = s) = 0,9
  const S_MIN = 0.001, S_MAX = 36500, DAY = 864e5;
  const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

  // Vergessenskurve und daraus der Abstand bis zur gewünschten Behaltensrate
  const retrievability = (t, s) => (1 + FACTOR * t / s) ** DECAY;
  const intervalDays = (s, ret) => clamp(Math.round(s / FACTOR * (ret ** (1 / DECAY) - 1)), 1, S_MAX);

  // Startwerte nach der ersten Bewertung
  const initStability = g => Math.max(W[g - 1], 0.1);
  const initDifficulty = g => W[4] - Math.exp((g - 1) * W[5]) + 1;

  // Schwierigkeit: richtig → leichter, falsch → schwerer; gedämpft nahe 10, leichter Zug zum Mittel
  const nextDifficulty = (d, g) => {
    const step = -W[6] * (g - 3), damped = d + step * (10 - d) / 9;
    return clamp(W[7] * initDifficulty(4) + (1 - W[7]) * damped, 1, 10);
  };
  // Stabilität nach richtigem Abruf: wächst stärker, wenn die Frage leicht, s klein und r niedrig war
  const recallStability = (d, s, r, g) => s * (1 + Math.exp(W[8]) * (11 - d) * s ** -W[9] * (Math.exp((1 - r) * W[10]) - 1)
    * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1));
  // Stabilität nach Vergessen: fällt, aber nie über den bisherigen Wert
  const forgetStability = (d, s, r) => Math.min(
    W[11] * d ** -W[12] * ((s + 1) ** W[13] - 1) * Math.exp((1 - r) * W[14]),
    s / Math.exp(W[17] * W[18]));
  // Mehrere Abrufe am selben Tag ändern s nur wenig
  const sameDayStability = (s, g) => { const inc = s ** -W[19] * Math.exp(W[17] * (g - 3 + W[18])); return s * (g >= 2 ? Math.max(inc, 1) : inc); };

  const dayStart = ms => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const daysBetween = (a, b) => Math.round((dayStart(b) - dayStart(a)) / DAY); // Kalendertage, wie bei Anki

  /** Neue Gedächtnisdaten nach einer Bewertung.
   *  mem = { s, d, last } oder null (neue Frage); g = 1–4; now = ms; ret = Ziel-Behaltensrate (0,8–0,95)
   *  Ergebnis: { s, d, last, due } – due = nächster Abruftermin (ms). Falsch → sofort wieder fällig. */
  function review(mem, g, now, ret) {
    let s, d;
    if (!mem) { s = initStability(g); d = clamp(initDifficulty(g), 1, 10); }
    else {
      const t = daysBetween(mem.last, now);
      if (t === 0) s = sameDayStability(mem.s, g);
      else { const r = retrievability(t, mem.s); s = g === 1 ? forgetStability(mem.d, mem.s, r) : recallStability(mem.d, mem.s, r, g); }
      d = nextDifficulty(mem.d, g);
    }
    s = clamp(s, S_MIN, S_MAX);
    return { s, d, last: now, due: g === 1 ? now : now + intervalDays(s, ret) * DAY };
  }

  return { review, retrievability, intervalDays, initDifficulty, W };
})();
