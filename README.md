# Lernstudio

Statische Lernseite für den HTL-Unterricht (GitHub Pages). Kurze Lektionen (Vortest → Lesen → Abfrage), Wiederholung nach Plan, Karteikarten, freies Üben und Testsimulation. Fortschritt bleibt im Browser (localStorage), kein Server, kein Login.

Die Seite ist für Suchmaschinen gesperrt (`robots.txt`, `noindex`). Der Stoff stammt aus Schulunterlagen; nur für den eigenen Unterricht verwenden.

## Lokal ansehen

```
python -m http.server 8000
```
Dann http://localhost:8000 öffnen (per Doppelklick auf `index.html` gehen die Themen-Dateien nicht).

## Neues Thema hinzufügen

1. Datei `themen/<slug>.json` anlegen (Aufbau wie `strahlentherapie.json`):
   `{ "slug", "title", "fach", "desc", "accent", "chapters": [ { "id", "nr", "title", "links"?, "sections": [ { "id", "title", "blocks": [...], "links"? } ], "questions": [...] } ] }`
   - Blöcke: `p` (text), `ul`/`steps` (items), `table` (head, rows), `merke` (text)
   - Fragen (jede mit `id` eindeutig, `ch` = Kapitel-id, `sec` = Abschnitts-id oder null):
     `mc` (options[4], answer 0–3, explain), `tf` (answer true/false), `cloze` (q mit genau einem `___`, answers[]), `order` (items in richtiger Reihenfolge), `match` (pairs [[Begriff, Erklärung]]), `open` (answer)
2. Eintrag in `themen/index.json` ergänzen (slug, title, fach, desc, accent, count, chapters).
3. In `sw.js` die Versionsnummer `lernstudio-vN` erhöhen, damit alle Geräte die neue Version laden.

## Lernprinzipien (Quellen)
- Abfragen statt Wiederlesen: Roediger & Karpicke 2006
- Verteilte Wiederholung, Abstand ≈ 30 % der Restzeit bis zum Test: Cepeda et al. 2008
- Bis zum Kriterium wiederholen: Rawson & Dunlosky (Successive Relearning)
- Vortest vor dem Lesen: Richland, Kornell & Kao 2009
- Sicherheitsabfrage (Hyperkorrektur): Butterfield & Metcalfe 2001
