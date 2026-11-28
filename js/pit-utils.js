export function getPitId(pit) {
  if (Number.isInteger(pit.row)) {
    return `R${String(pit.row)}C${String(pit.column)}`;
  }

  // For AVENUE, WILD1 and WILD2.
  return `${pit.row}-${String(pit.column)}`;
}

export function getPitLocation(pit) {
  const section = Number.isInteger(pit.row) ? `Row ${pit.row}` : pit.row;
  return `${section} / ${pit.column}`;
}

export function getDate(dateString) {
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
