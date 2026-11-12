"use strict";
/* Eigene Schemazeichnungen (SVG) mit Beschriftung im Bild (Mayer: räumliche Nähe von Wort und Bild).
   Jedes Teil: <g data-p="id"> mit Form (.sh), Beschriftung (.lbl) und Hinweislinie (.ld); a = Markierungspunkt für Bildfragen.
   Begriffe wie im Stoff (Arbeitsheft-Abschnitte 3.4, 3.5.1, 2.4.3; Folien 207, 228). */
let FIGN = 0;
const FIG = (() => {
  const T = (x, y, s, a = 'middle') => `<text class="lbl" x="${x}" y="${y}" text-anchor="${a}">${s}</text>`;
  const LD = (x1, y1, x2, y2) => `<path class="ld" d="M${x1} ${y1}L${x2} ${y2}"/>`;
  const AR = (x1, y1, x2, y2, dash) => `<path class="ar" d="M${x1} ${y1}L${x2} ${y2}" ${dash ? 'stroke-dasharray="6 5"' : ''} marker-end="url(#ah${FIGN})"/>`;
  const box = (x, y, w, h, lines) => `<rect class="sh" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>` + lines.map((l, i) => T(x + w / 2, y + h / 2 + 5 + (i - (lines.length - 1) / 2) * 16, l)).join('');
  // Flussbild: Kästen in einer Reihe, verbunden durch Pfeile
  const flow = (W, items) => { const n = items.length, gap = 22, bw = (W - 20 - gap * (n - 1)) / n, y = 50, h = 76; const parts = {};
    items.forEach(([id, lines], i) => { const x = 10 + i * (bw + gap); parts[id] = [() => box(x, y, bw, h, lines) + (i < n - 1 ? AR(x + bw + 2, y + h / 2, x + bw + gap - 3, y + h / 2) : ''), x + bw / 2, y + h / 2]; });
    return parts; };
  return {
    roehre: { topic: 'strahlentherapie', ch: 'k3', sec: '3.4', title: 'Aufbau einer Röntgenröhre (eigene Schemazeichnung)', vb: '0 0 640 300',
      parts: {
        vakuum: ['Vakuum (Glaskolben)', 'Das Vakuum verhindert, dass die Elektronen mit Luftmolekülen zusammenstoßen.', () => `<ellipse class="sh glass" cx="370" cy="140" rx="220" ry="72"/>` + T(300, 196, 'Vakuum'), 300, 190],
        wehnelt: ['Wehnelt-Zylinder', 'Der leicht negativ geladene Wehnelt-Zylinder bündelt die Elektronen zu einem feinen Strahl.', () => `<path class="sh thick" d="M228 112H188V168H228"/>` + LD(144, 116, 188, 124) + T(140, 120, 'Wehnelt-Zylinder', 'end'), 190, 160],
        kathode: ['Glühkathode', 'Die beheizte Glühkathode setzt durch den glühelektrischen Effekt Elektronen frei.', () => `<path class="sh thick" d="M207 214V152M200 126l12 5-12 5 12 5-12 5"/>` + LD(144, 166, 200, 146) + T(140, 170, 'Glühkathode', 'end'), 206, 138],
        strahl: ['Elektronenstrahl', 'Die Elektronen werden im Vakuum von der Kathode zur Anode beschleunigt.', () => AR(232, 140, 486, 140, 1) + T(360, 128, 'Elektronen'), 360, 140],
        anode: ['Anode', 'Beim Aufprall auf die Anode werden die Elektronen abgebremst, dabei entsteht Röntgenstrahlung.', () => `<path class="sh fill" d="M490 100H545V180H505Z"/>` + LD(545, 60, 528, 100) + T(560, 54, 'Anode'), 522, 140],
        roentgen: ['Röntgenstrahlung', 'Röntgenstrahlung ist Photonenstrahlung, die beim Abbremsen der Elektronen an der Anode entsteht.', () => `<g class="ray">${AR(498, 150, 436, 246)}${AR(500, 152, 468, 252)}${AR(502, 154, 500, 250)}</g>` + T(512, 250, 'Röntgenstrahlung', 'start'), 468, 228],
        hv: ['Hochspannung', 'Die Hochspannung (typisch 1–150 kV) beschleunigt die Elektronen von der Kathode zur Anode.', () => `<path class="sh wire" d="M207 214V272H332M346 272H626V140H545"/><path class="sh thick" d="M332 260V284M346 252V292"/>` + `<text class="lbl" x="320" y="258" text-anchor="middle">−</text><text class="lbl" x="358" y="250" text-anchor="middle">+</text>` + T(250, 295, 'Hochspannung 1–150 kV'), 339, 272]
      } },
    linac: { topic: 'strahlentherapie', ch: 'k3', sec: '3.5.1', title: 'Aufbau eines Linearbeschleunigers (eigene Schemazeichnung)', vb: '0 0 640 270',
      parts: {
        vakuum: ['Vakuumröhre', 'Der Bereich, in dem sich die Teilchen bewegen, ist evakuiert, damit sie nicht mit Luft zusammenstoßen.', () => `<rect class="sh glass" x="70" y="72" width="490" height="76" rx="14"/>` + LD(500, 56, 500, 72) + T(500, 50, 'Vakuumröhre'), 450, 140],
        quelle: ['Teilchenquelle', 'Die Teilchenquelle liefert die geladenen Teilchen, meist Elektronen.', () => `<rect class="sh fill" x="14" y="88" width="56" height="44" rx="8"/>` + LD(42, 132, 42, 170) + T(6, 186, 'Teilchenquelle', 'start'), 42, 110],
        drift: ['Driftröhren', 'Im Inneren der Driftröhren ist es feldfrei; die Röhren werden zum Ende hin länger, weil die Teilchen schneller werden.', () => [[92, 36], [146, 50], [214, 64], [296, 80], [394, 98]].map(([x, w]) => `<rect class="sh tube" x="${x}" y="96" width="${w}" height="28" rx="4"/>`).join('') + LD(150, 56, 168, 96) + T(132, 50, 'Driftröhren'), 334, 110],
        spalt: ['Spalt zwischen den Driftröhren', 'Nur im Spalt zwischen zwei Driftröhren wirkt das elektrische Feld und beschleunigt die Teilchen.', () => `<path class="sh field" d="M280 104h14M280 116h14"/>` + LD(287, 56, 287, 96) + T(300, 50, 'Spalt: Feld beschleunigt'), 287, 110],
        hf: ['Wechselspannungsquelle', 'Die Wechselspannungsquelle erzeugt das Feld und polt synchron um (Hochfrequenz).', () => `<path class="sh wire" d="M110 124V204H596M178 124V222H596M246 204V124M336 222V124M443 204V124"/><circle class="sh fill" cx="608" cy="213" r="16"/><path class="sh" d="M600 213q4-8 8 0t8 0"/>` + T(480, 252, 'Wechselspannungsquelle (HF)'), 608, 213],
        target: ['Metalltarget', 'Am wassergekühlten Metalltarget werden die Elektronen abrupt abgebremst.', () => `<rect class="sh hot" x="530" y="90" width="14" height="40" rx="3"/>` + LD(537, 130, 537, 170) + T(537, 186, 'Metalltarget'), 537, 110],
        photonen: ['Photonen (Bremsstrahlung)', 'Die beim Abbremsen entstehenden Photonen (Bremsstrahlung) werden indirekt erzeugt, denn Photonen selbst lassen sich nicht beschleunigen.', () => `<g class="ray">${AR(548, 104, 598, 86)}${AR(548, 110, 600, 110)}${AR(548, 116, 598, 134)}</g>` + T(606, 74, 'Photonen'), 590, 110]
      }, extra: () => AR(72, 110, 526, 110, 1) },
    bragg: { topic: 'strahlentherapie', ch: 'k2', sec: '2.4.3', title: 'Tiefendosiskurven: Photonen und Protonen (eigene Schemazeichnung)', vb: '0 0 600 250',
      parts: (() => { const x0 = 46, y0 = 206, w = 530, h = 165, px = t => x0 + t * w, py = v => y0 - v * h; const ph = [], pr = [];
        for (let i = 0; i <= 120; i++) { const t = i / 120, vph = t < .08 ? .35 + .65 * (t / .08) ** .7 : Math.exp(-(t - .08) * 1.9); ph.push([px(t), py(vph * .92)]); const tp = .78, vp = t < tp ? .26 + .2 * (t / tp) ** 3 + .62 * Math.exp(-(((t - tp) / .035) ** 2)) : 1.08 * Math.exp(-(((t - tp) / .022) ** 2)); pr.push([px(t), py(Math.min(1, vp))]); }
        const d = a => 'M' + a.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
        return {
          tumor: ['Tumor', 'Der Tumor liegt in der Tiefe; dort soll die Dosis am höchsten sein.', () => `<rect class="sh tumor" x="${px(.72)}" y="${py(1.04)}" width="${.12 * w}" height="${1.04 * h}" rx="8"/>` + T(px(.78), py(1.04) - 6, 'Tumor'), px(.78), py(.3)],
          photonen: ['Photonen-Tiefendosiskurve', 'Photonen geben ihre Energie entlang des ganzen Weges ab und belasten Gewebe vor und hinter dem Tumor.', () => `<path class="sh curve" d="${d(ph)}"/>` + T(px(.2), py(.84), 'Photonen'), px(.4), py(Math.exp(-.32 * 1.9) * .92)],
          protonen: ['Protonen-Tiefendosiskurve', 'Protonen geben vor dem Tumor wenig Energie ab und hinter dem Bragg-Peak fast keine.', () => `<path class="sh curve acc" d="${d(pr)}"/>` + T(px(.4), py(.17), 'Protonen'), px(.3), py(.27)],
          peak: ['Bragg-Peak', 'Im Bragg-Peak geben Protonen den Großteil ihrer Energie ab, danach fällt die Dosis fast auf null.', () => `<circle class="sh dot" cx="${px(.78)}" cy="${py(.88)}" r="6"/>` + LD(px(.78) - 10, py(.88), px(.6), py(.7)) + T(px(.6) - 4, py(.66), 'Bragg-Peak', 'end'), px(.78), py(.88)]
        }; })(),
      extra: () => `<path class="axis" d="M46 35V206H576"/><text class="lbl sm" x="576" y="230" text-anchor="end">Gewebetiefe</text><text class="lbl sm" x="34" y="45" text-anchor="end" transform="rotate(-90 34 45)">Dosis</text>` },
    gc: { topic: 'chromatographie', ch: 'c14', sec: 'F207', title: 'Grundkomponenten eines Gaschromatographen (eigene Schemazeichnung)', vb: '0 0 640 170',
      parts: (() => { const f = flow(640, [['gas', ['Trägergas-', 'system']], ['einlass', ['Proben-', 'einlass']], ['saeule', ['Säule', '(im Ofen)']], ['detektor', ['Detektions-', 'system']], ['auswertung', ['Auswertung:', 'Chromatogramm']]]);
        const P = (id, label, note) => [label, note, f[id][0], f[id][1], f[id][2]];
        return { gas: P('gas', 'Trägergassystem', 'Das Trägergas ist die mobile Phase und transportiert die Probe durch die Säule.'), einlass: P('einlass', 'Probeneinlasssystem', 'Über den Probeneinlass wird die Probe eingebracht und verdampft.'), saeule: P('saeule', 'Säule', 'In der Säule (stationäre Phase) werden die Stoffe getrennt.'), detektor: P('detektor', 'Detektionssystem', 'Der Detektor erkennt die Stoffe, wenn sie die Säule verlassen.'), auswertung: P('auswertung', 'Auswertung (Chromatogramm)', 'Das Detektorsignal über der Zeit ergibt das Chromatogramm.') }; })() },
    hplc: { topic: 'chromatographie', ch: 'c15', sec: 'F228', title: 'Grundkomponenten einer HPLC-Anlage (eigene Schemazeichnung)', vb: '0 0 640 170',
      parts: (() => { const f = flow(640, [['res', ['Elutions-', 'mittel']], ['pumpe', ['Pump-', 'system']], ['inj', ['Injektions-', 'ventil']], ['saeule', ['Trenn-', 'säule']], ['det', ['Detektor']], ['frak', ['Fraktions-', 'sammler']]]);
        const P = (id, label, note) => [label, note, f[id][0], f[id][1], f[id][2]];
        return { res: P('res', 'Elutionsmittelreservoir', 'Aus dem Reservoir kommt das Elutionsmittel, die mobile Phase.'), pumpe: P('pumpe', 'Pumpsystem', 'Die Pumpe fördert das Elutionsmittel mit hohem Druck gleichmäßig durch die Säule.'), inj: P('inj', 'Injektionsventil', 'Über das Injektionsventil (oder die Spritze) wird die Probe in den Fluss eingebracht.'), saeule: P('saeule', 'Trennsäule', 'In der Trennsäule werden die Stoffe getrennt.'), det: P('det', 'Detektor', 'Der Detektor erkennt die getrennten Stoffe am Säulenende.'), frak: P('frak', 'Fraktionssammler', 'Der Fraktionssammler fängt die getrennten Stoffe getrennt auf.') }; })() }
  };
})();
// SVG einer Abbildung; mark = Teil-id → Bildfrage (Beschriftungen aus, Teil hervorgehoben, Fragezeichen)
function figSVG(id, mark) {
  const f = FIG[id]; FIGN++;
  const parts = Object.entries(f.parts).map(([k, p]) => `<g data-p="${k}"${k === mark ? ' class="mark"' : ''}>${p[2]()}</g>`).join('');
  const m = mark && f.parts[mark], q = m ? `<g class="qmark"><circle cx="${m[3]}" cy="${m[4]}" r="15"/><text x="${m[3]}" y="${m[4] + 6}" text-anchor="middle">?</text></g>` : '';
  return `<svg class="fig${mark ? ' quiz' : ''}" viewBox="${f.vb}" role="img" aria-label="${mark ? 'Abbildung mit einem markierten Teil' : f.title.replace(/ \(.*/, '') + ': ' + Object.values(f.parts).map(p => p[0]).join(', ')}"><defs><marker id="ah${FIGN}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="currentColor"/></marker></defs>${f.extra ? f.extra() : ''}${parts}${q}</svg>`;
}
const figHTML = (id, mark) => `<figure class="figure">${figSVG(id, mark)}${mark ? '' : `<figcaption class="cap">${FIG[id].title}</figcaption>`}</figure>`;
// Bildfragen „Was ist markiert?“ als Multiple Choice mit Ablenkern aus derselben Abbildung
function figQuestions(slug) {
  return Object.entries(FIG).filter(([, f]) => f.topic === slug).flatMap(([fid, f]) => { const keys = Object.keys(f.parts);
    return keys.map(k => { const others = shuffle(keys.filter(x => x !== k)).slice(0, 3).map(x => f.parts[x][0]);
      return { id: `fig-${fid}-${k}`, type: 'mc', ch: f.ch, sec: f.sec, fig: fid, mark: k, q: 'Was ist in der Abbildung markiert?', options: [f.parts[k][0], ...others], answer: 0, explain: `${f.parts[k][0]}: ${f.parts[k][1]}` }; }); });
}
