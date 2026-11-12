# Lernforschung – Grundlage der Funktionen

| Prinzip | Beleg | Umsetzung |
|---|---|---|
| Abfragen statt Wiederlesen (d≈0.74) | Roediger & Karpicke 2006; Donoghue & Hattie 2021 https://www.frontiersin.org/articles/10.3389/feduc.2021.581216/full | Abfrage in jeder Lektion; offene Fragen/Lückentext vor MC (Rowland 2014 https://pubmed.ncbi.nlm.nih.gov/25150680/) |
| Verteilte Wiederholung, Abstand ≈ 20–40 % der Zeit bis zum Test | Cepeda et al. 2008 https://pubmed.ncbi.nlm.nih.gov/19076480/ | Stufen + Deckel per Testdatum |
| Successive Relearning (bis Kriterium, in mehreren Sitzungen) | Rawson & Dunlosky https://www.retrievalpractice.org/archive/2018/successive-relearning | Fehler kommen in der Runde wieder; App entscheidet, nicht der Nutzer |
| Vortest | Richland, Kornell & Kao 2009 https://pubmed.ncbi.nlm.nih.gov/19751074/ | 2 Vortestfragen je Lektion |
| Hyperkorrektur / Konfidenz | Butterfield & Metcalfe 2001; https://pmc.ncbi.nlm.nih.gov/articles/PMC4036076 | Option „Sicherheit abfragen“ |
| Interleaving nur bei ähnlichen Konzepten (g≈0.42, bei Fakten unklar) | Brunmair & Richter 2019 https://pubmed.ncbi.nlm.nih.gov/31556629/ | Gemischte Runde |
| Self-Explanation mit Verständnis-Prompts (g≈.87) | Bisra et al. 2018, Educ. Psychol. Rev. 30, 703–725 https://doi.org/10.1007/s10648-018-9434-x | Warum-Prompt nach richtiger MC/RF-Antwort, Musterlösung erst danach (Option „Warum-Fragen“) |
| Wort + Bild, Beschriftung im Bild (d 1.1–1.7) | Mayer, Multimedia-Prinzipien https://eddl.tru.ca/wp-content/uploads/2020/01/mayer-multimedia-instruction.pdf | 5 eigene Schemata (`figuren.js`) mit Beschriftung im Bild im Lesestoff; „Was ist markiert?“-Bildfragen in Lektionen |
| FSRS sagt Behalten besser voraus als SM-2 | https://expertium.github.io/Benchmark.html ; Anki-Doku https://docs.ankiweb.net/deck-options.html ; Formeln https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm | Eigene FSRS-6-Umsetzung `fsrs.js` (Standardparameter), Ziel-Behaltensrate 80–95 % in Optionen, Testdatum-Deckel bleibt |
| Serien/Spiele: nur Bindung belegt, kein Lerneffekt | Duolingo-Blog | Serie ja, Punkte/Wetten nein |
| Leistung im Training ≠ dauerhaftes Lernen; erst verzögerter Abruf zeigt Behalten | Soderstrom & Bjork 2015 https://doi.org/10.1177/1745691615569000 | „Gemeistert“ erst nach Abruf ≥ 20 h später |
| Mastery-Stufen steigen nur in gemischten Tests (Unit Test/Course Challenge), Fehler stufen zurück | Khan Academy Hilfe https://support.khanacademy.org/hc/en-us/articles/5548760867853 | „Gemeistert“ nur in gemischter Runde/Testsimulation; Fehler nimmt es weg |
| Rückmeldung/erneuter Abruf einen Tag nach dem Test behält besser als sofort | Butler, Karpicke & Roediger 2007, J. Exp. Psychol. Appl. 13(4), 273–281 https://doi.org/10.1037/1076-898X.13.4.273 (PDF https://pcllab.github.io/downloads/2007/2007_Butler_Karpicke_Roediger_JEPA.pdf); 24-h-Verzögerung zitiert in https://link.springer.com/article/10.3758/s13421-011-0092-1 | Testfehler am Folgetag als kurze Runde im Lernpfad |
| Pausentag in der Serie: Ausfall eines Tages beendet die Serie nicht | keine Lernforschung, nur Bindung (wie Serien oben, Duolingo-Blog); bewusst klein gehalten | 1 Pausentag pro 7 Tage, Tagesrückblick „Heute gelernt“ ohne Punkte |
