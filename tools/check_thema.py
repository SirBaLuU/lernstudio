"""Prüft Themen-Dateien auf das Lernstudio-Format.
Aufruf: python tools/check_thema.py themen/<slug>.json [weitere …]   (ohne Argument: alle in themen/)
Ausgabe: FEHLER (Exit-Code 1) oder OK; Hinweise blockieren nicht."""
import glob, json, os, sys

TYPES = {'mc', 'tf', 'cloze', 'order', 'match', 'open'}
BLOCKS = {'p': 'text', 'merke': 'text', 'ul': 'items', 'steps': 'items', 'table': 'rows'}


def check(path, index):
    err, warn = [], []
    E = lambda m: err.append(m)
    try:
        t = json.load(open(path, encoding='utf-8'))
    except Exception as e:
        return [f'kein gültiges JSON: {e}'], []
    for k in ('slug', 'title', 'fach', 'desc', 'accent', 'chapters'):
        if not t.get(k): E(f'Feld „{k}“ fehlt')
    slug = t.get('slug', '')
    if slug and os.path.basename(path) != slug + '.json': E(f'Dateiname muss {slug}.json sein')
    qids, n = set(), 0
    chids = set()
    for c in t.get('chapters', []):
        cid = c.get('id', '?')
        if cid in chids: E(f'Kapitel-id doppelt: {cid}')
        chids.add(cid)
        for k in ('id', 'nr', 'title'):
            if not c.get(k): E(f'Kapitel {cid}: Feld „{k}“ fehlt')
        sids = set()
        for s in c.get('sections', []):
            sid = s.get('id')
            if not sid or sid in sids: E(f'Kapitel {cid}: Abschnitts-id fehlt oder doppelt: {sid}')
            sids.add(sid)
            if not s.get('title'): E(f'Abschnitt {cid}/{sid}: Titel fehlt')
            for i, b in enumerate(s.get('blocks', [])):
                need = BLOCKS.get(b.get('t'))
                if not need: E(f'Abschnitt {cid}/{sid}, Block {i}: unbekannter Typ „{b.get("t")}“')
                elif not b.get(need): E(f'Abschnitt {cid}/{sid}, Block {i} ({b["t"]}): „{need}“ fehlt')
        for q in c.get('questions', []):
            n += 1
            qid, ty = q.get('id'), q.get('type')
            where = f'Frage {qid}'
            if not qid: E(f'Kapitel {cid}: Frage ohne id'); continue
            if qid in qids: E(f'{where}: id doppelt')
            if qid.startswith('fig-'): E(f'{where}: „fig-“ ist für Bildfragen reserviert')
            qids.add(qid)
            if ty not in TYPES: E(f'{where}: unbekannter Typ „{ty}“'); continue
            if q.get('ch') != cid: E(f'{where}: ch = „{q.get("ch")}“, erwartet „{cid}“')
            if q.get('sec') is not None and q['sec'] not in sids: E(f'{where}: Abschnitt „{q["sec"]}“ gibt es in {cid} nicht')
            if not q.get('q'): E(f'{where}: Fragetext fehlt')
            if ty == 'mc':
                o = q.get('options', [])
                if len(o) != 4 or len(set(o)) != 4 or not all(isinstance(x, str) and x for x in o): E(f'{where}: mc braucht genau 4 verschiedene Optionen')
                if q.get('answer') not in (0, 1, 2, 3): E(f'{where}: mc answer muss 0–3 sein')
            if ty == 'tf' and not isinstance(q.get('answer'), bool): E(f'{where}: tf answer muss true/false sein')
            if ty == 'cloze':
                if str(q.get('q', '')).count('___') != 1: E(f'{where}: Lückentext braucht genau ein ___')
                if not q.get('answers') or not all(isinstance(x, str) and x for x in q['answers']): E(f'{where}: answers fehlt')
            if ty == 'order' and len(q.get('items', [])) < 2: E(f'{where}: order braucht mindestens 2 items')
            if ty == 'match':
                p = q.get('pairs', [])
                if len(p) < 2 or not all(isinstance(x, list) and len(x) == 2 and all(x) for x in p): E(f'{where}: match braucht mindestens 2 Paare [Begriff, Erklärung]')
            if ty == 'open' and not q.get('answer'): E(f'{where}: Musterantwort fehlt')
        if not c.get('sections'): warn.append(f'Kapitel {cid}: keine Abschnitte')
        if not c.get('questions'): warn.append(f'Kapitel {cid}: keine Fragen')
    e = next((x for x in index if x.get('slug') == slug), None)
    if not e: E('kein Eintrag in themen/index.json')
    else:
        if e.get('chapters') != len(t.get('chapters', [])): E(f'index.json: chapters = {e.get("chapters")}, im Thema {len(t.get("chapters", []))}')
        if e.get('count', 0) < n: E(f'index.json: count = {e.get("count")}, im Thema {n} Fragen')
        elif e.get('count') != n: warn.append(f'index.json: count = {e["count"]}, im Thema {n} Fragen (Unterschied = Bildfragen aus figuren.js?)')
    return err, warn


if __name__ == '__main__':
    root = os.path.join(os.path.dirname(__file__), '..', 'themen')
    files = sys.argv[1:] or sorted(f for f in glob.glob(os.path.join(root, '*.json')) if not f.endswith('index.json'))
    index = json.load(open(os.path.join(root, 'index.json'), encoding='utf-8'))['topics']
    bad = 0
    for f in files:
        err, warn = check(f, index)
        for w in warn: print(f'{os.path.basename(f)}: Hinweis: {w}')
        for m in err[:30]: print(f'{os.path.basename(f)}: FEHLER: {m}')
        if len(err) > 30: print(f'… und {len(err) - 30} weitere Fehler')
        bad += bool(err)
        if not err: print(f'{os.path.basename(f)}: OK')
    sys.exit(1 if bad else 0)
