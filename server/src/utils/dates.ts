// Today's date in Israel as "YYYY-MM-DD". Servers usually run in UTC, which is
// still "yesterday" for the first hours of an Israeli morning.
export function todayInIsrael(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem' }).format(now);
}
