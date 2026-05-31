export function formatDisplayDate(dateValue: string | Date, options?: Intl.DateTimeFormatOptions) {
  let date: Date;

  if (typeof dateValue === 'string') {
    // Prefer the literal YYYY-MM-DD portion to avoid runtime-specific parsing
    // differences (Node vs browser) that can shift dates by timezone.
    const dateMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (dateMatch) {
      const [, year, month, day] = dateMatch;
      date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    } else {
      date = new Date(dateValue);
    }
  } else {
    date = dateValue;
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(date);
}