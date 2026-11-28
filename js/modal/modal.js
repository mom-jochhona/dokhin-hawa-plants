import { createPitNavigation } from './navigation.js';
import { createPhotoViewer } from './photo-viewer.js';
import { getPitId, getPitLocation } from '../pit-utils.js';

function setVisible(element, visible) {
  element.hidden = !visible;
}

export function initPitModal({ pits }) {
  const modal = document.getElementById('pit-modal');

  const elements = {
    title: document.getElementById('pit-title'),
    closeButton: document.getElementById('close-modal'),
    previousPitButton: document.getElementById('previous-pit-button'),
    nextPitButton: document.getElementById('next-pit-button'),
    photoFrame: document.getElementById('pit-photo-frame'),
    image: document.getElementById('pit-photo'),
    loader: document.getElementById('photo-loader'),
    photoControls: document.getElementById('photo-controls'),
    previousPhotoButton: document.getElementById('previous-photo'),
    nextPhotoButton: document.getElementById('next-photo'),
    photoCount: document.getElementById('photo-count'),
    photoDate: document.getElementById('photo-date'),
    noPhotoMessage: document.getElementById('no-photo-message'),
    position: document.getElementById('pit-position'),
    descriptionPanel: document.getElementById('pit-description-panel'),
    description: document.getElementById('pit-description')
  };

  let isOpen = false;

  const photoViewer = createPhotoViewer({
    elements,
    getCurrentPit: () => navigation.getCurrentPit()
  });

  function updatePitDetails(pit, index) {
    elements.title.textContent = `${pit.species} · ${getPitId(pit)}`;
    elements.position.textContent =
      `${getPitLocation(pit)} · Pit ${index + 1} of ${pits.length}`;

    // Description is optional in the current pit data. Keep the expandable
    // panel available whenever a description is supplied in pits.js.
    if (pit.description) {
      elements.description.textContent = pit.description;
      elements.descriptionPanel.open = false;
      setVisible(elements.descriptionPanel, true);
    } else {
      elements.description.textContent = '';
      elements.descriptionPanel.open = false;
      setVisible(elements.descriptionPanel, false);
    }

    elements.previousPitButton.disabled = index <= 0;
    elements.nextPitButton.disabled = index >= pits.length - 1;

    photoViewer.showPhoto((pit.images || []).length - 1);
  }

  const navigation = createPitNavigation({
    pits,
    onChange: updatePitDetails
  });

  function open(index) {
    if (!navigation.setIndex(index)) return;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    isOpen = true;
    elements.closeButton.focus();
  }

  function close() {
    if (!isOpen) return;

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    isOpen = false;

    const marker = document.querySelector(
      `.pit-marker[data-index="${navigation.getIndex()}"]`
    );
    marker?.focus();
  }

  function initialize() {
    photoViewer.initialize();

    elements.closeButton.addEventListener('click', close);
    elements.previousPitButton.addEventListener('click', navigation.previous);
    elements.nextPitButton.addEventListener('click', navigation.next);

    modal.addEventListener('click', event => {
      if (event.target === modal) close();
    });

    document.addEventListener('keydown', event => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        close();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        photoViewer.navigate(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        photoViewer.navigate(1);
      }
    });
  }

  initialize();

  return { open, close };
}
