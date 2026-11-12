# Aufgaben (oben = zuerst)

1. [x] **Navigation und Zurück** (erledigt 2026-11-12)
   - Jede Ansicht hat einen sichtbaren Zurück-Weg: Lektion (jede Stufe), Quiz-Runde, Ergebnis, Karteikarten, Lesen, Statistik, Optionen.
   - Browser-/Handy-Zurück führt einen Schritt zurück (Hash-Verlauf je Ansicht, in Lektionen je Stufe), ohne Fortschritt zu verlieren.
   - Brotkrumen „Bibliothek › Thema › Ansicht“ und Esc-Taste.
   - Abbrechen einer Runde fragt in der Seite nach (kein confirm()).
   - Abnahme: Playwright klickt jede Ansicht und kommt per Zurück wieder zum Lernpfad.
2. [x] **Mobile-Feinschliff:** (erledigt 2026-11-12) Daumen-Zone, Knöpfe ≥ 44 px, kein Text unter der unteren Leiste, Wischgeste Karteikarten (links/rechts = Nochmal/Gut). Abnahme: Screenshots 390 px aller Ansichten in `tests/shots/` ohne Überdeckung.
3. [x] **Lighthouse ≥ 95** (erledigt 2026-11-12) in Leistung, Barrierefreiheit, Best Practices (Fonts mit `font-display`, Bildgrößen, Kontraste, Labels). Abnahme: Lighthouse-Bericht in `docs/`.
4. [ ] **FSRS** (wartet: Samuel wählt A/B, s. STAND) statt fester Stufen (ts-fsrs per CDN mit fester Version, Lizenz prüfen), Ziel-Behaltensrate 90 % in Optionen (80–95 %); bestehende Stände übernehmen.
5. [x] (erledigt 2026-11-12) **Gemeistert erst nach verzögertem, gemischtem Test** (Khan-Prinzip); falscher Test senkt die Stufe.
6. [x] (erledigt 2026-11-12) **Warum-Prompts:** nach richtiger Antwort bei Verständnisfragen „Erkläre in einem Satz, warum“ + Musterlösung zur Selbstbewertung (Bisra 2018).
7. [x] (erledigt 2026-11-12) **Fragen ohne Abschnitt zuordnen** (Chromatographie: MC, Lückentext, Reihenfolge, Zuordnen per Stichwort zur passenden Folie), damit Lektionen gemischte Fragetypen bekommen.
8. [x] (erledigt 2026-11-12) **Testfehler am Folgetag** automatisch als kurze Runde anbieten (Butler et al. 2007).
9. [x] (erledigt 2026-11-12) **Schemata/Bilder** zu Bragg-Peak, Röntgenröhre, LINAC, Gaschromatograph, HPLC als SVG mit Beschriftung im Bild + Bildfragen „Was ist markiert?“ (nur eigene Zeichnungen).
10. **Serien-Pause** 1 Tag/Woche; Tagesrückblick „Heute gelernt“.
11. **Neues Thema leicht hinzufügen:** `tools/neues_thema.md` mit Vorlage-JSON + Prüfskript `tools/check_thema.py` (Schema, eindeutige ids, mc 4 Optionen).
12. **GitHub Action**: Smoke-Test bei jedem Push.
