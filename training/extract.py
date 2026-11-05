import sys, csv, json, random, os
import numpy as np
from PIL import Image
import mediapipe as mp
from mediapipe.tasks import python as mpt
from mediapipe.tasks.python import vision
D, W = sys.argv[1], sys.argv[2]
NORM = {'anger':'anger','fear':'fear','happiness':'happiness','neutral':'neutral','sad':'sadness','sadness':'sadness'}
rows = {}
for path in [f'{D}/data/legend.csv', f'{W}/picts500.csv']:
    for r in csv.reader(open(path)):
        if len(r) < 3: continue
        lab = NORM.get(r[2].strip().lower())
        if lab: rows[r[1].strip()] = lab
random.seed(42)
by = {}
for f, l in rows.items(): by.setdefault(l, []).append(f)
CAP = 700
sel = []
for l, fs in by.items():
    random.shuffle(fs); sel += [(f, l) for f in fs[:CAP]]
print({l: min(len(v), CAP) for l, v in by.items()}, flush=True)
opts = vision.FaceLandmarkerOptions(base_options=mpt.BaseOptions(model_asset_path=f'{W}/face_landmarker.task'),
    output_face_blendshapes=True, num_faces=1)
lm = vision.FaceLandmarker.create_from_options(opts)
out, names, miss = [], None, 0
for i, (f, l) in enumerate(sel):
    p = f'{D}/images/{f}'
    if not os.path.exists(p): miss += 1; continue
    try:
        arr = np.asarray(Image.open(p).convert('RGB'), dtype=np.uint8)
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(arr))
    except Exception: miss += 1; continue
    res = lm.detect(img)
    if not res.face_blendshapes: miss += 1; continue
    bs = res.face_blendshapes[0]
    if names is None: names = [b.category_name for b in bs]
    out.append({'file': f, 'label': l, 'x': [round(b.score, 5) for b in bs]})
    if i % 500 == 0: print(i, len(out), miss, flush=True)
json.dump({'names': names, 'rows': out}, open(f'{W}/features.json', 'w'))
print('done', len(out), 'missed', miss)
