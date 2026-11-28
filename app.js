import { pits } from './pits.js';
import { initMap } from './js/map.js';
import { initPitModal } from './js/modal/modal.js';

// Initialise the modal first so the map can open it when a pit is selected.
const pitModal = initPitModal({ pits });

initMap({
  onPitSelect: index => pitModal.open(index)
});
