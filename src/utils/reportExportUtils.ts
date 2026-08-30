/**
 * Report Export Utilities: CSV Export, Print View & Clipboard
 */

export function exportTableToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCsv = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCsv).join(';'),
    ...rows.map((row) => row.map(escapeCsv).join(';')),
  ].join('\r\n');

  // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function copyTableToClipboard(headers: string[], rows: (string | number)[][]): boolean {
  try {
    const text = [
      headers.join('\t'),
      ...rows.map((r) => r.join('\t')),
    ].join('\n');
    navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy table', err);
    return false;
  }
}

export function printReportTable(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  totalsHtml?: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permita popups para imprimir o relatório.');
    return;
  }

  const tableHeaders = headers.map((h) => `<th style="border: 1px solid #cbd5e1; padding: 6px 8px; background: #f8fafc; font-size: 11px; text-align: left;">${h}</th>`).join('');
  const tableRows = rows
    .map(
      (row) =>
        `<tr>${row
          .map(
            (cell, idx) =>
              `<td style="border: 1px solid #e2e8f0; padding: 5px 8px; font-size: 10.5px; font-family: monospace; ${
                typeof cell === 'number' || (!isNaN(Number(cell)) && String(cell).includes(','))
                  ? 'text-align: right;'
                  : 'text-align: left;'
              }">${cell}</td>`
          )
          .join('')}</tr>`
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - PULSE</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #0f172a; font-size: 12px; }
          .header { margin-bottom: 16px; border-bottom: 2px solid #0f172a; padding-bottom: 8px; }
          .header h1 { margin: 0 0 4px 0; font-size: 16px; text-transform: uppercase; }
          .header p { margin: 0; font-size: 11px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .totals { margin-top: 15px; border-top: 1px dashed #94a3b8; padding-top: 10px; }
          @media print {
            body { margin: 0; }
            @page { margin: 1cm; size: landscape; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>${subtitle} | Emitido em: ${new Date().toLocaleString('pt-AO')}</p>
        </div>
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        ${totalsHtml ? `<div class="totals">${totalsHtml}</div>` : ''}
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
