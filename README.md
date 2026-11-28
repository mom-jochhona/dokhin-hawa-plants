# Dokhin Hawa (দখিন হাওয়া) Plants

An [interactive plantation map](https://mom-jochhona.github.io/dokhin-hawa-plants/) for **দখিন হাওয়া**.

## Purpose

A small project to document and explore a plantation through an interactive map. It brings together planting locations and photographs in one place, making it easier to observe, explore and document the plantation over time.

## Features

- Interactive SVG-based plantation map.
- Zoom and pan using mouse, touchpad and touchscreen gestures.
- Pinch-to-zoom support on mobile devices.
- Individually identifiable plantation pits.
- Pit details and associated photographs in a modal viewer.
- Photograph navigation within a pit.
- Navigation between pits.
- Image loading indicator for externally hosted photographs.

## Project structure

```text
index.html
styles.css
pits.js
app.js
js/
  map.js
  pit-utils.js
  modal/
    modal.js
    photo-viewer.js
    navigation.js
```

- `app.js`: application entry point and coordination
- `js/map.js`: SVG pit rendering, map zoom, pan and pinch gestures
- `js/modal/modal.js`: modal lifecycle and pit details
- `js/modal/photo-viewer.js`: photograph loading, display, navigation and touch gestures
- `js/modal/navigation.js`: previous/next pit navigation
- `js/pit-utils.js`: shared pit and date formatting helpers
- `pits.js`: plantation data, exported as an ES module

The description panel is supported when a pit object contains a `description` property. The current `pits.js` data does not provide descriptions, so the panel remains hidden until descriptions are added.

Photographs are hosted externally using ImageKit and are not stored in this repository.

## Run locally

From this project directory, run:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

## Hosted application

The application is hosted using GitHub Pages.

**Live application:**  
[https://mom-jochhona.github.io/dokhin-hawa-plants/](https://mom-jochhona.github.io/dokhin-hawa-plants/)

Photographs are delivered through ImageKit.

## Photograph optimisation

The project includes a Python script to optimise photographs.

The script:

- Processes JPEG photographs recursively.
- Preserves the original folder structure.
- Resizes images to a maximum dimension of 1600 pixels.
- Converts photographs to WebP format.
- Leaves the original photographs untouched.

The script requires Python and Pillow.

```bash
python3 -m pip install Pillow
python3 optimize_images.py
```

Optimised photographs are written to `images-optimized/`.

## Technology

- HTML
- CSS
- JavaScript
- SVG
- Python (photograph optimisation)
- GitHub Pages
- ImageKit

---

*Dokhin Hawa (দখিন হাওয়া) — Southern Breeze.*