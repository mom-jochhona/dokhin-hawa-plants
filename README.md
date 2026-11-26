# Dokhin Hawa Plants

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
dokhin-hawa-plants/
│
├── index.html              # Application structure
├── styles.css              # Application styling
├── app.js                  # Map interactions and application logic
├── pits.js                 # Plantation pit data
├── optimize_images.py      # Photograph optimisation script
│
├── images/                 # Original photographs (not tracked)
├── images-optimized/       # Optimised photographs (not tracked)
│
└── README.md
```

Photographs are hosted externally using ImageKit and are not stored in this repository.

## Running locally

No build process or development server is required.

Simply open `index.html` in a browser.

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