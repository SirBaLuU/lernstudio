"use strict";
/* Abbildungen aus den Unterrichtsunterlagen (nur für den Unterrichtsgebrauch; Quelle je Bild).
   Erzeugt aus den PDFs; Schlüssel = Kapitel|Abschnitt, Wert = [Datei, Bildunterschrift, Quelle, Breite, Höhe]. */
const IMG = {
 "strahlentherapie": {
  "k1|1.2": [
   [
    "bilder/strahlentherapie/st_59.webp",
    "Eines der ersten Röntgenbilder (1895): Hand mit Ring.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    419,
    558
   ]
  ],
  "k1|1.3": [
   [
    "bilder/strahlentherapie/st_109.webp",
    "Direkte und indirekte Schädigung der DNA durch ionisierende Strahlung (über Radikale).",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    850,
    540
   ]
  ],
  "k2|2.4.1": [
   [
    "bilder/strahlentherapie/st_123.webp",
    "Gammastrahlung: elektromagnetische Welle aus dem Atomkern.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    280,
    280
   ]
  ],
  "k2|2.4.2": [
   [
    "bilder/strahlentherapie/st_140.webp",
    "Alphastrahlung: Heliumkerne (2 Protonen, 2 Neutronen).",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    349,
    262
   ],
   [
    "bilder/strahlentherapie/st_151.webp",
    "Betastrahlung: Elektronen aus dem Atomkern.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    280,
    280
   ]
  ],
  "k2|2.4.3": [
   [
    "bilder/strahlentherapie/st_186.webp",
    "Eindringvermögen von Alpha-, Beta-, Gamma- und Neutronenstrahlung im Vergleich.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    900,
    506
   ],
   [
    "bilder/strahlentherapie/st_181.webp",
    "Tiefendosiskurven: Röntgenstrahlung fällt ab, Protonen und C-Ionen enden im Bragg-Peak.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    790,
    493
   ]
  ],
  "k2|2.5": [
   [
    "bilder/strahlentherapie/st_172.webp",
    "Protonen sparen Gewebe hinter dem Tumor (vermeidbare Photonendosis).",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    900,
    656
   ],
   [
    "bilder/strahlentherapie/st_201.webp",
    "Photonen (links) belasten den ganzen Weg, Protonen (rechts) geben die Dosis gezielt ab.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    844,
    582
   ]
  ],
  "k3|3.4": [
   [
    "bilder/strahlentherapie/st_244.webp",
    "Drehanoden-Röntgenröhre: Kathode und rotierende Anode.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    617,
    285
   ]
  ],
  "k3|3.5": [
   [
    "bilder/strahlentherapie/st_258.webp",
    "Kreisbeschleuniger: Ablenkmagnete halten die Teilchen auf der Bahn.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    446,
    237
   ]
  ],
  "k3|3.5.1": [
   [
    "bilder/strahlentherapie/st_302.webp",
    "Linearbeschleuniger am Patienten: Strahlerkopf, Lasermarkierung, Bestrahlungsfeld, Patiententisch.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    517,
    329
   ]
  ],
  "k4|4.1": [
   [
    "bilder/strahlentherapie/st_154.webp",
    "Bestrahlungsraum mit Linearbeschleuniger.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    308,
    356
   ]
  ],
  "k4|4.1.1": [
   [
    "bilder/strahlentherapie/st_317.webp",
    "Multileaf-Kollimator: Lamellen formen das Feld nach der Tumorform.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    300,
    280
   ],
   [
    "bilder/strahlentherapie/st_344.webp",
    "Gamma Knife: viele Strahlen aus Kobaltquellen treffen sich im Ziel.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    525,
    398
   ],
   [
    "bilder/strahlentherapie/st_355.webp",
    "CyberKnife: Beschleuniger auf einem Roboterarm.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    900,
    900
   ]
  ],
  "k4|4.2": [
   [
    "bilder/strahlentherapie/st_378.webp",
    "Seeds für die Brachytherapie neben einer 1-Cent-Münze.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    275,
    183
   ]
  ],
  "k4|4.2.1": [
   [
    "bilder/strahlentherapie/st_379.webp",
    "Seed-Implantation in die Prostata mit Ultraschall-Führung.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    634,
    546
   ]
  ],
  "k4|4.2.4": [
   [
    "bilder/strahlentherapie/st_384.webp",
    "Afterloading-Gerät: die Quelle wird erst nach dem Legen der Schläuche eingefahren.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    490,
    374
   ]
  ],
  "k4|4.3": [
   [
    "bilder/strahlentherapie/st_390.webp",
    "Szintigramm: Verteilung des Radionuklids im Körper.",
    "Strahlentherapie V2 (MGT, 5. Klasse)",
    400,
    366
   ]
  ]
 },
 "chromatographie": {
  "c12|F181": [
   [
    "bilder/chromatographie/c12_55.webp",
    "Trennung in der Säule über die Zeit und das entstehende Chromatogramm.",
    "Folien 4JG Kapitel 12 (AYCQ)",
    900,
    253
   ]
  ],
  "c12|F183": [
   [
    "bilder/chromatographie/c12_59.webp",
    "Totzeit tM und Retentionszeit tR im Chromatogramm.",
    "Folien 4JG Kapitel 12 (AYCQ)",
    829,
    404
   ]
  ],
  "c12|F185": [
   [
    "bilder/chromatographie/c12_74.webp",
    "Peakbreite an der Basis (wb) und auf halber Höhe (wh).",
    "Folien 4JG Kapitel 12 (AYCQ)",
    900,
    414
   ]
  ],
  "c12|F186": [
   [
    "bilder/chromatographie/c12_82.webp",
    "Van-Deemter-Kurve: Trennstufenhöhe H aus A-, B- und C-Term.",
    "Folien 4JG Kapitel 12 (AYCQ)",
    900,
    588
   ]
  ],
  "c12|F188": [
   [
    "bilder/chromatographie/c12_86.webp",
    "Auflösung zweier Peaks aus Abstand und Basisbreiten.",
    "Folien 4JG Kapitel 12 (AYCQ)",
    900,
    482
   ]
  ],
  "c12|F190": [
   [
    "bilder/chromatographie/c12_95.webp",
    "Symmetrischer Peak, Tailing und Fronting (Messung bei 10 % Peakhöhe).",
    "Folien 4JG Kapitel 12 (AYCQ)",
    900,
    329
   ]
  ],
  "c13|F195": [
   [
    "bilder/chromatographie/c13_11.webp",
    "DC-Kammer: Trägerplatte, Dünnschicht, Fließmittel.",
    "Folien 4JG Kapitel 13 (AYCQ)",
    624,
    470
   ]
  ],
  "c13|F197": [
   [
    "bilder/chromatographie/c13_12.webp",
    "Entwicklung der DC-Platte nach 5 und 10 Minuten.",
    "Folien 4JG Kapitel 13 (AYCQ)",
    900,
    366
   ]
  ],
  "c13|F198": [
   [
    "bilder/chromatographie/c13_16.webp",
    "Rf-Wert = Laufstrecke der Substanz (Y) / Laufstrecke der Front (X).",
    "Folien 4JG Kapitel 13 (AYCQ)",
    653,
    584
   ]
  ],
  "c13|F199": [
   [
    "bilder/chromatographie/c13_53.webp",
    "Fluoreszierende Flecken unter UV-Licht.",
    "Folien 4JG Kapitel 13 (AYCQ)",
    900,
    592
   ]
  ],
  "c14|F207": [
   [
    "bilder/chromatographie/c14_8.webp",
    "Aufbau eines Gaschromatographen: Trägergas, Injektor, Säule im Ofen, Detektor.",
    "Folien 4JG Kapitel 14 (AYCQ)",
    900,
    394
   ]
  ],
  "c14|F212": [
   [
    "bilder/chromatographie/c14_32.webp",
    "Head-Space: nur die Gasphase über der Probe wird injiziert.",
    "Folien 4JG Kapitel 14 (AYCQ)",
    446,
    342
   ]
  ],
  "c14|F215": [
   [
    "bilder/chromatographie/c14_13.webp",
    "Gepackte Säule: Trägermaterial mit flüssiger stationärer Phase.",
    "Folien 4JG Kapitel 14 (AYCQ)",
    781,
    721
   ]
  ],
  "c14|F218": [
   [
    "bilder/chromatographie/c14_79.webp",
    "Kovats-Retentionsindex über n-Alkane als Bezug.",
    "Folien 4JG Kapitel 14 (AYCQ)",
    651,
    900
   ]
  ],
  "c14|F220": [
   [
    "bilder/chromatographie/c14_88.webp",
    "Konventionelle GC und Hochgeschwindigkeits-GC im Vergleich.",
    "Folien 4JG Kapitel 14 (AYCQ)",
    847,
    340
   ]
  ],
  "c15|F228": [
   [
    "bilder/chromatographie/c15_60.webp",
    "Aufbau einer HPLC-Anlage: Solventien, Pumpe, Injektor, Säule, Detektor.",
    "Folien 4JG Kapitel 15 (AYCQ)",
    900,
    849
   ]
  ],
  "c15|F229": [
   [
    "bilder/chromatographie/c15_64.webp",
    "Kleinere Korngröße → kleinere Trennstufenhöhe H.",
    "Folien 4JG Kapitel 15 (AYCQ)",
    791,
    557
   ]
  ],
  "c15|F230": [
   [
    "bilder/chromatographie/c15_69.webp",
    "Niederdruck-Gradientensystem mit Mischkammer.",
    "Folien 4JG Kapitel 15 (AYCQ)",
    639,
    666
   ]
  ],
  "c15|F231": [
   [
    "bilder/chromatographie/c15_73.webp",
    "Kolbenpumpe beim Ansaugen.",
    "Folien 4JG Kapitel 15 (AYCQ)",
    433,
    546
   ]
  ],
  "c15|F232": [
   [
    "bilder/chromatographie/c15_78.webp",
    "Probenschleifenventil: Laden und Injizieren.",
    "Folien 4JG Kapitel 15 (AYCQ)",
    900,
    407
   ]
  ],
  "c15|F239": [
   [
    "bilder/chromatographie/c15_120.webp",
    "Ionenchromatographie mit Suppressor.",
    "Folien 4JG Kapitel 15 (AYCQ)",
    573,
    900
   ]
  ],
  "c15|F240": [
   [
    "bilder/chromatographie/c15_124.webp",
    "Größenausschluss: große Moleküle laufen an den Poren vorbei und kommen zuerst.",
    "Folien 4JG Kapitel 15 (AYCQ)",
    900,
    373
   ]
  ]
 }
};
