"""Fragen ohne Abschnitt (sec = null) per Stichwort der passendsten Folie im selben Kapitel zuordnen.
Aufruf: python tools/fragen_zuordnen.py themen/<slug>.json [--schreiben]
Ohne --schreiben nur Vorschau. Zugeordnete Fragen bekommen "secAuto": true (zum Nachprüfen)."""
import json, math, re, sys, collections

STOP = set('aber alle allem auch beim dass dem den der des die das durch eine einem einen einer eines für hat ist mit nach nicht oder sich sind und vom von vor wie wird werden welche welcher welches zum zur bei auf aus als was wozu wieso warum wenn wobei sowie dabei diese dieser dieses kann können man noch nur sehr über unter zwischen'.split())
words = lambda t: [w for w in re.findall(r'[a-zäöüß0-9]{4,}', t.lower()) if w not in STOP]

def qtext(q):
    parts = [q.get('q', ''), q.get('explain', ''), str(q.get('answer', '')) if q['type'] == 'open' else '']
    if q['type'] == 'mc': parts.append(q['options'][q['answer']])
    parts += q.get('answers', []) + q.get('items', []) + [x for p in q.get('pairs', []) for x in p]
    return ' '.join(parts)

def stext(s):
    return s['title'] + ' ' + ' '.join(' '.join([b.get('text', '')] + b.get('items', []) + b.get('head', []) + [c for r in b.get('rows', []) for c in r]) for b in s['blocks'])

def assign(topic, min_score=1.5):
    done = []
    for c in topic['chapters']:
        secs = [(s['id'], collections.Counter(words(stext(s)))) for s in c['sections']]
        df = collections.Counter(w for _, ws in secs for w in ws)
        idf = {w: math.log((len(secs) + 1) / (n + .5)) for w, n in df.items()}
        for q in c['questions']:
            if q.get('sec') or q['type'] == 'open': continue  # lange offene Aufgaben bleiben im freien Üben
            qw = set(words(qtext(q)))
            best = max(((sum(idf[w] * (1 + math.log(ws[w])) for w in qw if w in ws), sid) for sid, ws in secs), default=(0, None))
            if best[0] >= min_score: q['sec'] = best[1]; q['secAuto'] = True; done.append((q['id'], best[1], round(best[0], 1)))
    return done

if __name__ == '__main__':
    path = sys.argv[1]; t = json.load(open(path, encoding='utf-8'))
    open_before = sum(1 for c in t['chapters'] for q in c['questions'] if not q.get('sec'))
    done = assign(t)
    for x in done: print(*x)
    print(f'{len(done)} von {open_before} Fragen zugeordnet')
    if '--schreiben' in sys.argv: json.dump(t, open(path, 'w', encoding='utf-8', newline='\n'), ensure_ascii=False, separators=(',', ':')); print('geschrieben')
