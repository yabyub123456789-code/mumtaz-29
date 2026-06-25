/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Helper to export data grid to a clean CSV file that opens natively in Microsoft Excel.
 */
export function exportToExcel(filename: string, headers: string[], rows: any[][]) {
  // UTF-8 BOM to ensure MS Excel opens Indonesian characters and numbers correctly
  const BOM = '\uFEFF';
  
  const csvContent = rows
    .map(e => e.map(val => {
      // Escape double quotes and wrap in quotes if contains comma, newline or quotes
      let strVal = val === null || val === undefined ? '' : String(val);
      if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
        strVal = `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    }).join(','))
    .join('\n');

  const blob = new Blob([BOM + headers.join(',') + '\n' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Helper to trigger a highly customized, print-optimized stylesheet-friendly report window
 */
export function exportToPDF(title: string, headers: string[], rows: any[][], metadata?: Record<string, string>, signatureTitle: string = 'Guru Pengampu') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Harap izinkan pop-up untuk mencetak laporan PDF.');
    return;
  }

  const metaHtml = metadata 
    ? Object.entries(metadata).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join('')
    : '';

  const tableHeaders = headers.map(h => `<th style="border: 1px solid #ddd; padding: 10px; background-color: #f5f5f9; text-align: left; font-weight: 600; color: #566a7f;">${h}</th>`).join('');
  const tableRows = rows.map(r => `
    <tr style="border-bottom: 1px solid #eee;">
      ${r.map(cell => `<td style="border: 1px solid #ddd; padding: 10px; color: #566a7f;">${cell === null || cell === undefined ? '-' : cell}</td>`).join('')}
    </tr>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #696cff; padding-bottom: 20px; }
        .title { font-size: 20px; font-weight: bold; color: #696cff; margin: 0; text-transform: uppercase; }
        .subtitle { font-size: 14px; color: #888; margin: 5px 0 0 0; }
        .metadata { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 30px; background-color: #fafafb; padding: 15px; border-radius: 6px; border-left: 4px solid #696cff; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        .footer { margin-top: 50px; text-align: right; font-size: 12px; color: #888; }
        .sign { margin-top: 60px; display: inline-block; text-align: center; border-top: 1px solid #333; width: 200px; padding-top: 5px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">SMP MUHAMMADIYAH 29 SAWANGAN-LAPORAN AKADEMIK</div>
        <div class="subtitle">Monitoring Upaya dan Mutu Terpadu Akademik serta Zona Karakter (MUMTAZ)</div>
      </div>
      
      <h2 style="font-size: 18px; color: #333; margin-top: 0;">${title}</h2>
      
      ${metadata ? `<div class="metadata">${metaHtml}</div>` : ''}
      
      <table>
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div class="footer">
        <div>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        <div style="margin-top: 40px;">${signatureTitle},</div>
        <div class="sign" style="margin-top: 60px;"><strong>${signatureTitle === 'Wali Kelas' ? (metadata?.['Wali Kelas'] || 'Wali Kelas') : (metadata?.['Nama Guru'] || metadata?.['Guru Mapel'] || metadata?.['Nama'] || signatureTitle)}</strong></div>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          // window.close(); // optional
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
