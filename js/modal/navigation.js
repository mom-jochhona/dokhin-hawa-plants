export function createPitNavigation({ pits, onChange }) {
  let currentIndex = -1;

  function setIndex(index) {
    if (!Number.isInteger(index) || index < 0 || index >= pits.length) return false;

    currentIndex = index;
    onChange(pits[currentIndex], currentIndex);
    return true;
  }

  function previous() {
    return setIndex(currentIndex - 1);
  }

  function next() {
    return setIndex(currentIndex + 1);
  }

  return {
    setIndex,
    previous,
    next,
    getIndex: () => currentIndex,
    getCurrentPit: () => currentIndex >= 0 ? pits[currentIndex] : null
  };
}
