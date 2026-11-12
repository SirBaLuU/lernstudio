# Neues Thema hinzufügen

Ein Thema ist eine JSON-Datei in `themen/`. Kein Build, kein Server-Code.

## Schritte

1. Vorlage unten nach `themen/<slug>.json` kopieren (`slug` = Dateiname, nur Kleinbuchstaben und Bindestriche).
2. Stoff in Kapitel → Abschnitte → Blöcke gliedern, Fragen ans Kapitel hängen (`ch` = Kapitel-id, `sec` = Abschnitts-id oder `null`).
3. Eintrag in `themen/index.json` ergänzen: `slug`, `title`, `fach`, `desc`, `accent` (Farbe), `count` (Anzahl Fragen), `chapters` (Anzahl Kapitel).
4. Prüfen: `python tools/check_thema.py themen/<slug>.json` → muss `OK` melden.
5. Optional: Fragen ohne Abschnitt den Folien zuordnen: `python tools/fragen_zuordnen.py themen/<slug>.json --schreiben` (danach Stichprobe ansehen, `"secAuto": true` markiert die Zuordnung).
6. In `sw.js` `themen/<slug>.json` in `SHELL` eintragen (offline verfügbar) und die Cache-Version `lernstudio-vN` erhöhen, dann `node tests/smoke.js` (Server auf Port 8000 muss laufen).

## Regeln für gute Fragen

- Jede Frage braucht eine eindeutige `id` (Tipp: `<kapitel>-<nr>`); `fig-…` ist für Bildfragen reserviert.
- Pro Abschnitt mehrere Typen mischen: Lückentext und offene Fragen fördern Abruf stärker als Multiple Choice.
- `mc`: genau 4 verschiedene Optionen, `answer` = Index 0–3 der richtigen. Ablenker plausibel, nicht lächerlich.
- `explain` (1–2 Sätze, ≥ 40 Zeichen) einbauen: bei MC/Richtig-Falsch löst das die Warum-Frage aus.
- `cloze`: genau ein `___` im Fragetext, in `answers` alle zulässigen Schreibweisen.
- Fakten nur mit Quelle; Nachlese-Links pro Kapitel oder Abschnitt unter `links`.

## Vorlage

```json
{
  "slug": "beispiel",
  "title": "Beispielthema",
  "fach": "Fachkürzel",
  "desc": "Ein Satz, worum es geht.",
  "accent": "#2C55E0",
  "chapters": [
    {
      "id": "k1",
      "nr": "1",
      "title": "Erstes Kapitel",
      "links": [{ "title": "Artikel", "url": "https://de.wikipedia.org/wiki/…", "src": "Wikipedia" }],
      "sections": [
        {
          "id": "1.1",
          "title": "Erster Abschnitt",
          "blocks": [
            { "t": "p", "text": "Absatz." },
            { "t": "ul", "items": ["Punkt A", "Punkt B"] },
            { "t": "steps", "items": ["Schritt 1", "Schritt 2"] },
            { "t": "table", "head": ["Begriff", "Bedeutung"], "rows": [["A", "…"], ["B", "…"]] },
            { "t": "merke", "text": "Das Wichtigste in einem Satz." }
          ]
        }
      ],
      "questions": [
        { "id": "k1-1", "ch": "k1", "sec": "1.1", "type": "mc", "q": "Frage?", "options": ["richtig", "falsch 1", "falsch 2", "falsch 3"], "answer": 0, "explain": "Warum die Antwort stimmt, in einem ganzen Satz." },
        { "id": "k1-2", "ch": "k1", "sec": "1.1", "type": "tf", "q": "Aussage.", "answer": true, "explain": "Begründung." },
        { "id": "k1-3", "ch": "k1", "sec": "1.1", "type": "cloze", "q": "Satz mit ___ Lücke.", "answers": ["einer", "1"] },
        { "id": "k1-4", "ch": "k1", "sec": "1.1", "type": "order", "q": "Bringe in die richtige Reihenfolge.", "items": ["erstens", "zweitens", "drittens"] },
        { "id": "k1-5", "ch": "k1", "sec": "1.1", "type": "match", "q": "Ordne zu.", "pairs": [["Begriff A", "Erklärung A"], ["Begriff B", "Erklärung B"]] },
        { "id": "k1-6", "ch": "k1", "sec": null, "type": "open", "q": "Erkläre …", "answer": "Musterantwort in Stichworten." }
      ]
    }
  ]
}
```
