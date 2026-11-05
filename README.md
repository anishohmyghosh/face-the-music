# Face the Music

Make a face, hear a genre. A live facial-expression classifier moves a point across a valence–arousal map, and a generative Web Audio engine plays the nearest genre.

**Live:** https://anishohmyghosh.github.io/face-the-music/

This is a rebuild of my 2025 *Design with AI* class project (University of Miami), where I trained a facial-expression classifier in Apple CreateML and tested how training-set size affects accuracy ([original process document](https://anishohmyghosh.github.io/website/files/createml-emotion-classifier-process.pdf)).

## How it works
1. **Find the face:** MediaPipe Face Landmarker (in the browser) measures 52 facial blendshapes per frame.
2. **Classify:** a logistic-regression model trained on the same [muxspace/facial_expressions](https://github.com/muxspace/facial_expressions) data and five emotions (anger, fear, happiness, neutral, sadness) turns 43 of those blendshapes (eye-gaze ones dropped) into probabilities. Weights live in `model.json`.
3. **Map:** probabilities are averaged onto Russell's valence–arousal circumplex and smoothed.
4. **Play:** `music.js` holds 15 genre recipes; the nearest genre picks drums, scale and instruments, while tempo, brightness and reverb glide between neighbours.

Nothing is uploaded; video stays in the browser. Drag the point (or use the arrow keys) to play without a camera.

## Results
Same protocol as the original (fixed 20-per-emotion test set, 10–50 training images per emotion, averaged over 20 splits): **38→47%** test accuracy vs CreateML's **24→36%**. The full model reaches **54%** accuracy over 5 classes (chance 20%). Fear is still weak because the dataset has only ~70 fear images.

## Run locally
```sh
python3 -m http.server 8000   # camera access needs localhost or https
```
Then open http://localhost:8000.

## Retrain
```sh
git clone --depth 1 https://github.com/muxspace/facial_expressions data/facial_expressions
python3 -m venv .venv && .venv/bin/pip install mediapipe scikit-learn pandas pillow
curl -LO https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
tr '\r' '\n' < data/facial_expressions/data/500_picts_satz.csv > picts500.csv
.venv/bin/python training/extract.py data/facial_expressions .   # writes features.json
.venv/bin/python training/train.py .                             # writes model.json
```

Made by [Anish Ghosh](https://anishohmyghosh.github.io/website/).
