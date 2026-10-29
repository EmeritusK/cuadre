/**
 * CSV the way spreadsheet software in Ecuador opens it without an import wizard:
 * semicolon separated, decimal comma, CRLF line endings and a UTF-8 BOM.
 */
export function toCsv(header: string[], rows: (string | number | null)[][]) {
  const cell = (value: string | number | null) => {
    if (value === null) return "";
    const text = typeof value === "number" ? String(value).replace(".", ",") : value;
    return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [header, ...rows].map((row) => row.map(cell).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`;
}
