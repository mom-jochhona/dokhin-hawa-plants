const mapSettings = { viewBox: '0 0 1886 1064', pitRadius: 16, pitStroke: '#17212b', minZoom: .5, maxZoom: 5 };

const svgNS = 'http://www.w3.org/2000/svg';
const map = document.getElementById('map');
const pitsLayer = document.getElementById('pits');

function getPitId(pit) {
  if (Number.isInteger(pit.row)) {
    return `R${String(pit.row)}C${String(pit.column)}`;
  }
  // For AVENUE, WILD1 and WILD2
  return `${pit.row}-${String(pit.column)}`;
}

function getPitLocation(pit) {
  let section = pit.row;
  if (Number.isInteger(pit.row)) {
    section = `Row ${pit.row}`;
  }
  return `${section}, ${pit.column}`;
}

function getPitName(pit) {
  return pit.species;
}

function getDate(YYYYMMDD) {
  // This is sloppy implementation, but serves the purpose
  // ToDo: Need to refactor
  const MONTHS = {'01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'};
  const year = YYYYMMDD.substr(0,4);
  const month = YYYYMMDD.substr(4,2);
  const date = YYYYMMDD.substr(6,2);

  return `${MONTHS[month]} ${date}, ${year}`;
}

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
    circle.setAttribute('aria-label', `Open ${getPitId(pit, index)}`);
    pitsLayer.appendChild(circle);

    const pitId = document.createElementNS(svgNS, 'text');
    pitId.setAttribute('class', 'pit-id');
    pitId.setAttribute('x', pit.x);
    pitId.setAttribute('y', pit.y - mapSettings.pitRadius - 16);
    pitId.setAttribute('text-anchor', 'middle');
    pitId.textContent = getPitId(pit, index);
    pitsLayer.appendChild(pitId);

    const pitName = document.createElementNS(svgNS, 'text');
    pitName.setAttribute('class', 'pit-name');
    pitName.setAttribute('x', pit.x);
    pitName.setAttribute('y', pit.y - mapSettings.pitRadius - 4);
    pitName.setAttribute('text-anchor', 'middle');
    pitName.textContent = getPitName(pit, index);
    pitsLayer.appendChild(pitName);
  });
}

const modal = document.getElementById('pit-modal');
const photoArea = document.getElementById('pit-photo-area');

const IMAGE_BASE_URL =
    "https://ik.imagekit.io/4zcvbyytp/dokhin-hawa-plants/images";

// Cache modal elements once. The markup remains in index.html; only its content changes.
const modalElements = {
  title: document.getElementById('pit-title'),
  close: document.getElementById('close-modal'),
  previousPit: document.getElementById('previous-pit-button'),
  nextPit: document.getElementById('next-pit-button'),
  image: document.getElementById('pit-photo'),
  loader: document.getElementById('photo-loader'),
  photoControls: document.getElementById('photo-controls'),
  previousPhoto: document.getElementById('previous-photo'),
  nextPhoto: document.getElementById('next-photo'),
  photoCount: document.getElementById('photo-count'),
  photoDate: document.getElementById('photo-date'),
  noPhotoMessage: document.getElementById('no-photo-message')
};

let currentPitIndex = -1;
let currentPhotoIndex = 0;

function updatePitNavigation() {
  modalElements.previousPit.disabled = currentPitIndex <= 0;
  modalElements.nextPit.disabled = currentPitIndex >= pits.length - 1;
}

function displayPitPhoto(photoIndex) {
  const pit = pits[currentPitIndex];
  const photos = pit.images || [];
  const pitId = getPitId(pit);

  if (!photos.length) {
    modalElements.image.removeAttribute('src');
    modalElements.image.alt = 'No photograph available';
    modalElements.image.hidden = true;
    modalElements.photoControls.classList.add('u-hidden');
    modalElements.photoDate.classList.add('u-hidden');
    modalElements.loader.classList.add('u-hidden');
    modalElements.noPhotoMessage.hidden = false;
    return;
  }

  // Photograph navigation wraps around within the currently selected pit.
  currentPhotoIndex = (photoIndex + photos.length) % photos.length;
  const filename = photos[currentPhotoIndex];

  // Show loader while the photograph is loading.
  modalElements.loader.classList.remove('u-hidden');
  modalElements.image.src = `${IMAGE_BASE_URL}/${pitId}/${filename}`;
  modalElements.image.alt = `Photograph ${currentPhotoIndex + 1} of ${photos.length}`;
  modalElements.image.hidden = false;
  modalElements.photoControls.classList.remove('u-hidden');
  modalElements.photoCount.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;
  modalElements.photoDate.textContent = getDate(filename.split('.')[0]);
  modalElements.photoDate.classList.remove('u-hidden');
  modalElements.noPhotoMessage.hidden = true;
}

function updatePitModal(index) {
  // Guard against invalid indices before accessing the pit record.
  if (!Number.isInteger(index) || index < 0 || index >= pits.length) return;

  currentPitIndex = index;
  currentPhotoIndex = 0;
  const pit = pits[currentPitIndex];

  modalElements.title.textContent = `${pit.species} (${getPitLocation(pit)})`;
  updatePitNavigation();
  displayPitPhoto((pit.images || []).length - 1); // Start with the most recent photograph.
}

function openPitModal(index) {
  if (!Number.isInteger(index) || index < 0 || index >= pits.length) return;

  updatePitModal(index);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  modalElements.close.focus();
}

function navigateToPit(direction) {
  const nextIndex = currentPitIndex + direction;

  // Pit navigation stops at the first and last records; it does not wrap.
  if (nextIndex < 0 || nextIndex >= pits.length) return;

  updatePitModal(nextIndex);
}

function closePitModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

function initializeModal() {
  // Register modal event listeners once, not every time a pit or photo changes.
  modalElements.close.addEventListener('click', closePitModal);
  modalElements.previousPit.addEventListener('click', () => navigateToPit(-1));
  modalElements.nextPit.addEventListener('click', () => navigateToPit(1));
  modalElements.previousPhoto.addEventListener('click', () => displayPitPhoto(currentPhotoIndex - 1));
  modalElements.nextPhoto.addEventListener('click', () => displayPitPhoto(currentPhotoIndex + 1));

  modal.addEventListener('click', event => {
    if (event.target === modal) closePitModal();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closePitModal();

    if ((event.key === 'Enter' || event.key === ' ') &&
        document.activeElement?.classList.contains('pit-marker')) {
      event.preventDefault();
      openPitModal(Number(document.activeElement.getAttribute('data-index')));
    }
  });

  modalElements.image.addEventListener('load', () => {
    modalElements.loader.classList.add('u-hidden');
  });

  modalElements.image.addEventListener('error', () => {
    modalElements.loader.classList.add('u-hidden');
  });
}

initializeModal();

pitsLayer.addEventListener('click', event => {
  const marker = event.target.closest('.pit-marker');
  if (marker && !pointerMoved) openPitModal(Number(marker.getAttribute('data-index')));
});

// Map zoom and pan state.
let zoom = 1, panX = 0, panY = 0, dragging = false, pointerMoved = false, startX = 0, startY = 0, startPanX = 0, startPanY = 0;

// Track active pointers for touch gestures.
const activePointers = new Map();

let pinchStartDistance = 0;
let pinchStartZoom = 1;
let lastPinchMidpoint = null;

function getViewBox() {
  const [vx, vy, vw, vh] = mapSettings.viewBox.split(' ').map(Number);
  const width = vw / zoom;
  const height = vh / zoom;
  const x = vx + (vw - width) / 2 - panX / zoom;
  const y = vy + (vh - height) / 2 - panY / zoom;

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

function zoomAtPoint(nextZoom, clientX, clientY) {
  const boundedZoom = Math.max(mapSettings.minZoom, Math.min(mapSettings.maxZoom, nextZoom));

  if (boundedZoom === zoom) return;

  const anchor = getSvgPoint(clientX, clientY);
  const oldView = getViewBox();
  const [vx, vy, vw, vh] = mapSettings.viewBox.split(' ').map(Number);

  const nextWidth = vw / boundedZoom;
  const nextHeight = vh / boundedZoom;

  const fx = (anchor.x - oldView.x) / oldView.width;
  const fy = (anchor.y - oldView.y) / oldView.height;

  const nextX = anchor.x - fx * nextWidth;
  const nextY = anchor.y - fy * nextHeight;

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

map.addEventListener('pointerdown', e => {
  const wasEmpty = activePointers.size === 0;

  activePointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  });

  if (wasEmpty) {
    // First pointer: prepare for normal dragging.
    dragging = true;
    pointerMoved = false;

    startX = e.clientX;
    startY = e.clientY;
    startPanX = panX;
    startPanY = panY;
  } else if (activePointers.size === 2) {
    // Second pointer: switch from dragging to pinch zoom.
    dragging = false;
    pointerMoved = true;

    resetPinchBaseline();
  }

  if (e.target.setPointerCapture) {
    e.target.setPointerCapture(e.pointerId);
  }
});

map.addEventListener('pointermove', e => {
  if (!activePointers.has(e.pointerId)) return;

  activePointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
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

  const dx = e.clientX - startX;
  const dy = e.clientY - startY;

  if (Math.hypot(dx, dy) > 5) pointerMoved = true;

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

function finishPointer(e) {
  if (!activePointers.has(e.pointerId)) return;

  if (e.type === 'pointercancel') {
    pointerMoved = true;
  }

  activePointers.delete(e.pointerId);

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

renderPitsInSVG();
