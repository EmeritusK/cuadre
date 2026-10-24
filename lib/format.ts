const LOCALE = "es-EC";

const money = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "USD" });
const signedMoney = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  signDisplay: "exceptZero",
});
const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const quantity = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 });
const percent = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 1 });
const dateTime = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" });
const date = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium" });
const time = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" });

export const formatMoney = (value: number) => money.format(value);
export const formatSignedMoney = (value: number) => signedMoney.format(value);
export const formatInteger = (value: number) => integer.format(value);
export const formatQuantity = (value: number) => quantity.format(value);
export const formatPercent = (ratio: number) => percent.format(ratio);
export const formatDateTime = (value: string | Date) => dateTime.format(new Date(value));
export const formatDate = (value: string | Date) => date.format(new Date(value));
export const formatTime = (value: string | Date) => time.format(new Date(value));

/** "hace 4 min" style label for recent events. */
export function formatRelative(value: string | Date, now = Date.now()) {
  const seconds = Math.round((now - new Date(value).getTime()) / 1000);
  if (seconds < 45) return "hace un momento";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return formatDate(value);
}

export const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : 0);
