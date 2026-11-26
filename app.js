const mapSettings = { viewBox: '0 0 1886 1064', pitRadius: 16, pitStroke: '#17212b', minZoom: .5, maxZoom: 5 };

const svgNS = 'http://www.w3.org/2000/svg';
const PAN_START_THRESHOLD = 5;
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
  const section = Number.isInteger(pit.row) ? `Row ${pit.row}` : pit.row;
  return `${section}, ${pit.column}`;
}

function getDate(dateString) {
  // Photo filenames begin with YYYYMMDD.
  const match = dateString.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) return dateString;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  // Reject impossible dates rather than displaying a misleading date.
  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return dateString;
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(date);
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

const modal = document.getElementById('pit-modal');

const IMAGE_BASE_URL =
  'https://ik.imagekit.io/4zcvbyytp/dokhin-hawa-plants/images';

// Cache modal elements once. The markup remains in index.html; only its content changes.
const modalElements = {
  title: document.getElementById('pit-title'),
  closeModalButton: document.getElementById('close-modal'),
  previousPitButton: document.getElementById('previous-pit-button'),
  nextPitButton: document.getElementById('next-pit-button'),
  pitPhotoFrame: document.getElementById('pit-photo-frame'),
  image: document.getElementById('pit-photo'),
  loader: document.getElementById('photo-loader'),
  photoControls: document.getElementById('photo-controls'),
  previousPhotoButton: document.getElementById('previous-photo'),
  nextPhotoButton: document.getElementById('next-photo'),
  photoCountLabel: document.getElementById('photo-count'),
  photoDateLabel: document.getElementById('photo-date'),
  noPhotoMessage: document.getElementById('no-photo-message')
};

let currentPitIndex = -1;
let currentPhotoIndex = 0;

function updatePitNavigation() {
  modalElements.previousPitButton.disabled = currentPitIndex <= 0;
  modalElements.nextPitButton.disabled = currentPitIndex >= pits.length - 1;
}

// Display one already-selected photograph. Photo selection and wrapping are
// handled by selectPitPhoto(), keeping this function focused on presentation.
function displayPitPhoto(photoPath, photoDate, photoIndex, photoCount) {
  modalElements.loader.classList.remove('u-hidden');
  modalElements.pitPhotoFrame.classList.remove('u-hidden');
  modalElements.image.hidden = false;
  modalElements.image.alt = `Photograph ${photoIndex + 1} of ${photoCount}`;
  modalElements.image.src = photoPath;

  modalElements.photoControls.classList.remove('u-hidden');
  modalElements.photoCountLabel.textContent = `${photoIndex + 1} / ${photoCount}`;
  modalElements.photoDateLabel.textContent = photoDate;
  modalElements.photoDateLabel.classList.remove('u-hidden');
  modalElements.noPhotoMessage.hidden = true;
}

// Select a photograph by index, wrapping at either end of the current pit's
// photograph list. Passing an index keeps navigation logic out of rendering.
function selectPitPhoto(photoIndex) {
  const photos = pits[currentPitIndex]?.images || [];

  if (photos.length === 0) {
    modalElements.image.removeAttribute('src');
    modalElements.image.hidden = true;
    modalElements.image.alt = '';
    modalElements.photoControls.classList.add('u-hidden');
    modalElements.photoDateLabel.classList.add('u-hidden');
    modalElements.loader.classList.add('u-hidden');
    modalElements.pitPhotoFrame.classList.add('u-hidden');
    modalElements.noPhotoMessage.textContent =
        'No photographs are linked to this pit yet.';
    modalElements.noPhotoMessage.hidden = false;
    currentPhotoIndex = 0;
    return;
  }

  currentPhotoIndex = (photoIndex + photos.length) % photos.length;

  const filename = photos[currentPhotoIndex];
  const pitId = getPitId(pits[currentPitIndex]);
  const photoPath = `${IMAGE_BASE_URL}/${pitId}/${filename}`;
  const photoDate = getDate(filename.split('.')[0]);

  displayPitPhoto(photoPath, photoDate, currentPhotoIndex, photos.length);
}

function updatePitModal(index) {
  currentPitIndex = index;
  const pit = pits[currentPitIndex];
  const photos = pit.images || [];

  modalElements.title.textContent = `${pit.species} (${getPitLocation(pit)})`;
  updatePitNavigation();

  // Show the most recent photograph first.
  selectPitPhoto(photos.length - 1);
}

function openPitModal(index) {
  if (!Number.isInteger(index) || index < 0 || index >= pits.length) return;

  updatePitModal(index);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  modalElements.closeModalButton.focus();
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

  const marker = pitsLayer.querySelector(
    `.pit-marker[data-index="${currentPitIndex}"]`
  );
  marker?.focus();
}

function initializeModal() {
  // Register modal event listeners once, not every time a pit or photo changes.
  modalElements.closeModalButton.addEventListener('click', closePitModal);
  modalElements.previousPitButton.addEventListener('click', () => navigateToPit(-1));
  modalElements.nextPitButton.addEventListener('click', () => navigateToPit(1));
  // Navigation controls select the next photo; the display function only renders it.
  modalElements.previousPhotoButton.addEventListener('click', () => selectPitPhoto(currentPhotoIndex - 1));
  modalElements.nextPhotoButton.addEventListener('click', () => selectPitPhoto(currentPhotoIndex + 1));

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

    if (event.key === 'ArrowLeft') {
        navigateToPit(-1);
    } 
    
    if (event.key === 'ArrowRight') {
        navigateToPit(1);
    }
  });

  modalElements.image.addEventListener('load', () => {
    modalElements.loader.classList.add('u-hidden');
  });

  modalElements.image.addEventListener('error', () => {
    modalElements.loader.classList.add('u-hidden');
    modalElements.image.hidden = true;
    modalElements.photoControls.classList.add('u-hidden');
    modalElements.photoDateLabel.classList.add('u-hidden');
    modalElements.noPhotoMessage.textContent =
        'This photograph could not be loaded.';
    modalElements.noPhotoMessage.hidden = false;
  });

  let swipeStartX = 0;
  let swipeStartY = 0;

  modalElements.pitPhotoFrame.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;

      swipeStartX = event.clientX;
      swipeStartY = event.clientY;
  });

  modalElements.pitPhotoFrame.addEventListener('pointerup', event => {
      if (event.pointerType !== 'touch') return;

      const deltaX = event.clientX - swipeStartX;
      const deltaY = event.clientY - swipeStartY;

      // Ignore short or predominantly vertical movements.
      if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) {
          return;
      }

      navigateToPit(deltaX < 0 ? 1 : -1);
  });

  modalElements.pitPhotoFrame.addEventListener('pointercancel', () => {
      swipeStartX = 0;
      swipeStartY = 0;
  });
}

initializeModal();

pitsLayer.addEventListener('click', event => {
  const marker = event.target.closest('.pit-marker');
  if (marker && !pointerMoved) openPitModal(Number(marker.getAttribute('data-index')));
});

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
