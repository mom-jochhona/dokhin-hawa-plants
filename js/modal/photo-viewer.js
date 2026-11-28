import { getDate, getPitId } from '../pit-utils.js';

const IMAGE_BASE_URL =
  'https://ik.imagekit.io/4zcvbyytp/dokhin-hawa-plants/images';

function setVisible(element, visible) {
  element.hidden = !visible;
}

export function createPhotoViewer({ elements, getCurrentPit }) {
  let currentPhotoIndex = 0;
  let activePhotoSrc = '';

  function hidePhotoPresentation() {
    setVisible(elements.image, false);
    setVisible(elements.loader, false);
    setVisible(elements.photoControls, false);
    setVisible(elements.photoDate, false);
    setVisible(elements.photoCount, false);
  }

  function showMessage(message) {
    hidePhotoPresentation();
    elements.image.removeAttribute('src');
    elements.image.alt = '';
    elements.noPhotoMessage.textContent = message;
    setVisible(elements.noPhotoMessage, true);
  }

  function showPhoto(photoIndex) {
    const pit = getCurrentPit();
    const photos = pit?.images || [];

    if (!photos.length) {
      currentPhotoIndex = 0;
      activePhotoSrc = '';
      showMessage('No photographs are linked to this pit yet.');
      return;
    }

    currentPhotoIndex = (photoIndex + photos.length) % photos.length;

    const filename = photos[currentPhotoIndex];
    const pitId = getPitId(pit);
    const photoPath = `${IMAGE_BASE_URL}/${pitId}/${filename}`;

    setVisible(elements.noPhotoMessage, false);
    setVisible(elements.image, false);
    setVisible(elements.loader, true);
    setVisible(elements.photoControls, photos.length > 1);
    setVisible(elements.photoDate, true);
    setVisible(elements.photoCount, true);

    elements.image.alt =
      `${pit.species}, ${pitId}, photograph ${currentPhotoIndex + 1} of ${photos.length}`;
    elements.photoDate.textContent = getDate(filename.split('.')[0]);
    elements.photoCount.textContent =
      `Photo ${currentPhotoIndex + 1} of ${photos.length}`;

    elements.previousPhotoButton.disabled = photos.length < 2;
    elements.nextPhotoButton.disabled = photos.length < 2;

    activePhotoSrc = new URL(photoPath, document.baseURI).href;
    elements.image.src = photoPath;
  }

  function navigate(direction) {
    const photos = getCurrentPit()?.images || [];
    if (photos.length < 2) return;
    showPhoto(currentPhotoIndex + direction);
  }

  function initialize() {
    elements.previousPhotoButton.addEventListener('click', () => navigate(-1));
    elements.nextPhotoButton.addEventListener('click', () => navigate(1));

    elements.image.addEventListener('load', () => {
      if (elements.image.src !== activePhotoSrc) return;

      setVisible(elements.loader, false);
      setVisible(elements.image, true);
      setVisible(elements.noPhotoMessage, false);
    });

    elements.image.addEventListener('error', () => {
      if (elements.image.src !== activePhotoSrc) return;

      setVisible(elements.loader, false);
      setVisible(elements.image, false);
      setVisible(elements.photoControls, false);
      setVisible(elements.photoDate, false);
      setVisible(elements.photoCount, false);
      elements.noPhotoMessage.textContent =
        'This photograph could not be loaded. Check your connection and try again.';
      setVisible(elements.noPhotoMessage, true);
    });

    // A horizontal touch swipe changes photographs, not pits.
    // touch-action: pan-y allows the browser to handle vertical gestures.
    let swipeStartX = null;
    let swipeStartY = null;
    let touchPointerCount = 0;

    elements.photoFrame.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;

      touchPointerCount += 1;

      // Ignore swipes when a multi-touch gesture (e.g. pinch) is in progress.
      if (touchPointerCount > 1) {
        swipeStartX = null;
        swipeStartY = null;
        return;
      }

      swipeStartX = event.clientX;
      swipeStartY = event.clientY;
    });

    elements.photoFrame.addEventListener('pointerup', event => {
      if (event.pointerType !== 'touch') return;

      touchPointerCount = Math.max(0, touchPointerCount - 1);

      if (swipeStartX === null || swipeStartY === null || touchPointerCount > 0) {
        swipeStartX = null;
        swipeStartY = null;
        return;
      }

      const deltaX = event.clientX - swipeStartX;
      const deltaY = event.clientY - swipeStartY;

      swipeStartX = null;
      swipeStartY = null;

      if (Math.abs(deltaX) < 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      navigate(deltaX < 0 ? 1 : -1);
    });

    elements.photoFrame.addEventListener('pointercancel', () => {
      touchPointerCount = 0;
      swipeStartX = null;
      swipeStartY = null;
    });
  }

  return {
    initialize,
    showPhoto,
    navigate,
    getCurrentPhotoIndex: () => currentPhotoIndex
  };
}
