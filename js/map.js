import { pits } from '../pits.js';
import { getPitId } from './pit-utils.js';

const mapSettings = {
  viewBox: '0 0 1886 1064',
  pitRadius: 16,
  pitStroke: '#17212b',
  minZoom: 0.5,
  maxZoom: 5
};

const svgNS = 'http://www.w3.org/2000/svg';
const PAN_START_THRESHOLD = 5;
const map = document.getElementById('map');
const pitsLayer = document.getElementById('pits');

function renderPitsInSVG() {
  pitsLayer.replaceChildren();

  pits.forEach((pit, index) => {
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('class', 'pit-marker');
    circle.setAttribute('data-index', index);
    circle.setAttribute('cx', pit.x);
    circle.setAttribute('cy', pit.y);
    circle.setAttribute('r', mapSettings.pitRadius);
    circle.setAttribute('fill', pit.color || '#32b900');
    circle.setAttribute('stroke', pit.stroke || mapSettings.pitStroke);
    circle.setAttribute('tabindex', '0');
    circle.setAttribute('role', 'button');
    circle.setAttribute('aria-label', `Open ${getPitId(pit)}`);
    pitsLayer.appendChild(circle);

    const pitId = document.createElementNS(svgNS, 'text');
    pitId.setAttribute('class', 'pit-id');
    pitId.setAttribute('x', pit.x);
    pitId.setAttribute('y', pit.y - mapSettings.pitRadius - 16);
    pitId.setAttribute('text-anchor', 'middle');
    pitId.textContent = getPitId(pit);
    pitsLayer.appendChild(pitId);

    const pitName = document.createElementNS(svgNS, 'text');
    pitName.setAttribute('class', 'pit-name');
    pitName.setAttribute('x', pit.x);
    pitName.setAttribute('y', pit.y - mapSettings.pitRadius - 4);
    pitName.setAttribute('text-anchor', 'middle');
    pitName.textContent = pit.species;
    pitsLayer.appendChild(pitName);
  });
}

export function initMap({ onPitSelect }) {
  // Map zoom and pan state.
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let dragging = false;
  let pointerMoved = false;
  let startX = 0;
  let startY = 0;
  let startPanX = 0;
  let startPanY = 0;

  // Track active pointers for touch gestures.
  const activePointers = new Map();

  let pinchStartDistance = 0;
  let pinchStartZoom = 1;
  let lastPinchMidpoint = null;

  function getViewBox() {
    const [baseX, baseY, baseWidth, baseHeight] =
      mapSettings.viewBox.split(' ').map(Number);

    // Zoom reduces the visible SVG coordinate range. The subtraction of
    // half the size difference keeps the zoom centred before panning.
    const width = baseWidth / zoom;
    const height = baseHeight / zoom;
    const x = baseX + (baseWidth - width) / 2 - panX / zoom;
    const y = baseY + (baseHeight - height) / 2 - panY / zoom;

    return { x, y, width, height };
  }

  function applyView() {
    const view = getViewBox();
    map.setAttribute('viewBox', `${view.x} ${view.y} ${view.width} ${view.height}`);
  }

  // Convert a screen position to SVG coordinates, accounting for the current viewBox.
  function getSvgPoint(clientX, clientY) {
    const point = map.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    return point.matrixTransform(map.getScreenCTM().inverse());
  }

  // Zoom around the pointer rather than the map centre. First find the
  // pointer's position as a fraction of the current viewBox; then calculate
  // the new viewBox origin so that the same SVG point stays under the pointer.
  function zoomAtPoint(nextZoom, clientX, clientY) {
    const boundedZoom = Math.max(mapSettings.minZoom, Math.min(mapSettings.maxZoom, nextZoom));

    if (boundedZoom === zoom) return;

    const anchor = getSvgPoint(clientX, clientY);
    const oldView = getViewBox();
    const [vx, vy, vw, vh] = mapSettings.viewBox.split(' ').map(Number);

    const nextWidth = vw / boundedZoom;
    const nextHeight = vh / boundedZoom;

    const horizontalAnchorRatio = (anchor.x - oldView.x) / oldView.width;
    const verticalAnchorRatio = (anchor.y - oldView.y) / oldView.height;

    const nextX = anchor.x - horizontalAnchorRatio * nextWidth;
    const nextY = anchor.y - verticalAnchorRatio * nextHeight;

    // Keep the SVG point beneath the pointer stationary while zooming.
    zoom = boundedZoom;
    panX = zoom * (vx + (vw - nextWidth) / 2 - nextX);
    panY = zoom * (vy + (vh - nextHeight) / 2 - nextY);

    applyView();
  }

  document.getElementById('zoom-in').addEventListener('click', () => {
    zoom = Math.min(mapSettings.maxZoom, zoom * 1.25);
    applyView();
  });

  document.getElementById('zoom-out').addEventListener('click', () => {
    zoom = Math.max(mapSettings.minZoom, zoom / 1.25);
    applyView();
  });

  document.getElementById('reset').addEventListener('click', () => {
    zoom = 1;
    panX = 0;
    panY = 0;
    applyView();
  });

  // Trackpad pinch gestures commonly arrive as wheel events with ctrlKey=true.
  // Intercept only those gestures over the map; ordinary mouse-wheel scrolling is untouched.
  map.addEventListener('wheel', event => {
    if (!event.ctrlKey) return;

    event.preventDefault();

    const zoomFactor = Math.exp(-event.deltaY * 0.002);
    zoomAtPoint(zoom * zoomFactor, event.clientX, event.clientY);
  }, { passive: false });

  // Calculate the distance and midpoint between the first two active pointers.
  function getPinchState() {
    const [a, b] = [...activePointers.values()].slice(0, 2);

    if (!a || !b) return null;

    return {
      distance: Math.hypot(b.x - a.x, b.y - a.y),
      midpoint: {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2
      }
    };
  }

  // Establish a new baseline for pinch zoom.
  function resetPinchBaseline() {
    const state = getPinchState();

    if (!state) return;

    pinchStartDistance = state.distance;
    pinchStartZoom = zoom;
    lastPinchMidpoint = state.midpoint;
  }

  map.addEventListener('pointerdown', event => {
    const wasEmpty = activePointers.size === 0;

    activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    if (wasEmpty) {
      // First pointer: prepare for normal dragging.
      dragging = true;
      pointerMoved = false;

      startX = event.clientX;
      startY = event.clientY;
      startPanX = panX;
      startPanY = panY;
    } else if (activePointers.size === 2) {
      // Second pointer: switch from dragging to pinch zoom.
      dragging = false;
      pointerMoved = true;

      resetPinchBaseline();
    }

    if (event.target.setPointerCapture) {
      event.target.setPointerCapture(event.pointerId);
    }
  });

  map.addEventListener('pointermove', event => {
    if (!activePointers.has(event.pointerId)) return;

    activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    if (activePointers.size >= 2) {
      const state = getPinchState();

      if (!state || !pinchStartDistance || !lastPinchMidpoint) return;

      const { distance, midpoint } = state;

      // Calculate zoom relative to the initial pinch distance.
      const nextZoom = pinchStartZoom * (distance / pinchStartDistance);

      zoomAtPoint(nextZoom, midpoint.x, midpoint.y);

      // Also allow the midpoint itself to move (two-finger pan).
      const dx = midpoint.x - lastPinchMidpoint.x;
      const dy = midpoint.y - lastPinchMidpoint.y;

      if (dx || dy) {
        panX += dx;
        panY += dy;
        applyView();
      }

      lastPinchMidpoint = midpoint;
      return;
    }

    // Single pointer: retain existing drag-to-pan behaviour.
    if (!dragging) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (Math.hypot(dx, dy) > PAN_START_THRESHOLD) pointerMoved = true;

    if (pointerMoved) {
      // Convert screen-pixel movement into SVG coordinate units.
      // SVG uses one common scale for both axes to preserve its aspect ratio.
      const [, , viewBoxWidth, viewBoxHeight] = mapSettings.viewBox.split(' ').map(Number);
      const rect = map.getBoundingClientRect();
      const svgScale = Math.min(
        rect.width / viewBoxWidth,
        rect.height / viewBoxHeight
      );

      panX = startPanX + dx / svgScale;
      panY = startPanY + dy / svgScale;
      applyView();
    }
  });

  function finishPointer(event) {
    if (!activePointers.has(event.pointerId)) return;

    if (event.type === 'pointercancel') {
      pointerMoved = true;
    }

    activePointers.delete(event.pointerId);

    if (activePointers.size === 0) {
      dragging = false;
      pinchStartDistance = 0;
      lastPinchMidpoint = null;
    } else if (activePointers.size === 1) {
      // One finger remains: resume dragging from its current position.
      const remaining = activePointers.values().next().value;

      dragging = true;
      pointerMoved = true;

      startX = remaining.x;
      startY = remaining.y;
      startPanX = panX;
      startPanY = panY;

      pinchStartDistance = 0;
      lastPinchMidpoint = null;
    } else {
      // Re-establish the baseline if more than two pointers were used.
      resetPinchBaseline();
    }
  }

  map.addEventListener('pointerup', finishPointer);
  map.addEventListener('pointercancel', finishPointer);

  pitsLayer.addEventListener('click', event => {
    const marker = event.target.closest('.pit-marker');
    if (marker && !pointerMoved) {
      onPitSelect(Number(marker.getAttribute('data-index')));
    }
  });

  renderPitsInSVG();
}
