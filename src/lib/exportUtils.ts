import * as XLSX from 'xlsx';

export const exportData = (
  type: 'pdf' | 'excel' | 'word',
  config: { startDate: string; endDate: string; columns: Record<string, boolean> },
  eventsMap: Record<string, any[]>
) => {
  // Try to gather all events from eventsMap linearly
  const allEvents: any[] = [];
  Object.keys(eventsMap).forEach((dateKey) => {
    // Format the date properly. If the key is just a number, format it as DD/MM/YYYY
    const formattedDate = !isNaN(Number(dateKey)) 
      ? `${String(dateKey).padStart(2, '0')}/04/2569` 
      : dateKey;
      
    eventsMap[dateKey].forEach((ev) => {
      allEvents.push({ ...ev, date: formattedDate }); // Inject date into record
    });
  });

  // Simplified formatting matching export format 
  const preparedData = allEvents.map((ev, index) => {
    const row: any = {};
    if (config.columns.seq) row['ลำดับ'] = index + 1;
    if (config.columns.date) row['วันที่จัดกิจกรรม'] = ev.date;
    if (config.columns.time) row['เวลา'] = ev.time || 'ตลอดวัน';
    if (config.columns.name) row['ชื่อกิจกรรม'] = ev.title;
    if (config.columns.details) row['รายละเอียด'] = ev.description || '-';
    if (config.columns.owner) row['ผู้รับผิดชอบ'] = ev.responsibles || 'คุณครู';
    if (config.columns.dept) row['ฝ่ายงาน'] = ev.department || 'วิชาการ';
    if (config.columns.location) row['สถานที่'] = ev.location || '-';
    if (config.columns.priority) row['ระดับความสำคัญ'] = ev.type === 'primary' || ev.type === 'urgent' ? 'สำคัญมาก' : 'ปกติ';
    return row;
  });

  if (type === 'excel') {
    const worksheet = XLSX.utils.json_to_sheet(preparedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Events');
    XLSX.writeFile(workbook, 'Academic_Calendar_Export.xlsx');
  } else if (type === 'word') {
    // Basic HTML to Word blob export
    const tableHeader = Object.keys(preparedData[0] || {}).map(k => `<th>${k}</th>`).join('');
    const tableRows = preparedData.map(row => {
      const tds = Object.values(row).map(v => `<td>${v}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    
    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Export</title></head><body>
      <h1>รายงานปฏิทินกิจกรรมวิชาการ</h1>
      <p>ตั้งแต่วันที่: ${config.startDate} ถึงวันที่: ${config.endDate}</p>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <thead><tr>${tableHeader}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      </body></html>
    `;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Academic_Calendar_Export.doc';
    link.click();
    URL.revokeObjectURL(url);
  } else if (type === 'pdf') {
    // For PDF, the best zero-dependency way to support Thai font is window.print() of an isolated table view.
    // Or we just do the same trick but print it. Let's create an iframe and print it.
    const tableHeader = Object.keys(preparedData[0] || {}).map(k => `<th style="padding: 8px; border: 1px solid #ddd; background-color: #f2f2f2;">${k}</th>`).join('');
    const tableRows = preparedData.map(row => {
      const tds = Object.values(row).map(v => `<td style="padding: 8px; border: 1px solid #ddd;">${v}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    
    const html = `
      <html><head><meta charset='utf-8'><title>พิมพ์ / PDF</title>
      <style>body { font-family: sans-serif; }</style>
      </head><body>
      <h2 style="text-align: center;">รายงานปฏิทินกิจกรรมวิชาการ</h2>
      <p style="text-align: center;">ตั้งแต่วันที่: ${config.startDate} ถึงวันที่: ${config.endDate}</p>
      <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
        <thead><tr>${tableHeader}</tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <script>window.onload = function() { window.print(); window.close(); }</script>
      </body></html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    }
  }
};
