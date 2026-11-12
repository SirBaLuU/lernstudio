"""Bilder aus einem PDF ziehen (JPEG direkt, 8-bit Flate RGB/Grau), ohne Zusatzpaket außer Pillow.
Aufruf: python tools/bilder_aus_pdf.py <pdf> <zielordner> <präfix>  → danach passende Bilder verkleinert als WebP nach bilder/<thema>/ und in bilder.js eintragen."""
import re, sys, zlib, os, io
from PIL import Image

pdf, out, pre = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
data = open(pdf, 'rb').read()
objs = {}
for m in re.finditer(rb'(\d+)\s+0\s+obj(.*?)endobj', data, re.S):
    objs[int(m.group(1))] = m.group(2)

def num(d, key):
    m = re.search(rb'/' + key + rb'\s+(\d+)(\s+0\s+R)?', d)
    if not m: return None
    if m.group(2):  # indirekte Zahl
        v = re.search(rb'^\s*(\d+)', objs.get(int(m.group(1)), b''))
        return int(v.group(1)) if v else None
    return int(m.group(1))

n = 0
for oid, body in objs.items():
    if b'/Subtype' not in body or not re.search(rb'/Subtype\s*/Image', body): continue
    s = re.search(rb'stream\r?\n', body)
    if not s: continue
    head, raw = body[:s.start()], body[s.end():]
    L = num(head, rb'Length')
    raw = raw[:L] if L else raw[:raw.rfind(b'endstream')]
    w, h = num(head, rb'Width'), num(head, rb'Height')
    if not w or not h or w < 200 or h < 120: continue  # Logos/Symbole weglassen
    try:
        if b'/DCTDecode' in head:
            im = Image.open(io.BytesIO(raw))
        elif b'/FlateDecode' in head and num(head, rb'BitsPerComponent') == 8 and b'/DecodeParms' not in head:
            px = zlib.decompress(raw)
            mode = 'RGB' if b'/DeviceRGB' in head else 'L' if b'/DeviceGray' in head else None
            if not mode or len(px) < w * h * len(mode): continue
            im = Image.frombytes(mode, (w, h), px[:w * h * len(mode)])
        else:
            continue
        im = im.convert('RGB')
        im.save(os.path.join(out, f'{pre}_{oid}_{w}x{h}.jpg'), quality=85)
        n += 1
    except Exception as e:
        pass
print(pdf, n)
