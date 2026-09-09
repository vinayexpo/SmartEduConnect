/** Minimal CSV download helper (UTF-8 BOM so Excel opens it correctly). */
export function downloadCSV(filename: string, columns: string[], rows: (string | number | null | undefined)[][]): void {
  const escape = (value: string | number | null | undefined): string => {
    let text = value === null || value === undefined ? '' : String(value);
    // Prevent spreadsheet applications from evaluating user-provided cell values as formulas.
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const lines = [columns.map(escape).join(',')];
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
