// Утилита для экспорта данных в CSV

export function exportToCSV(data: any[], filename: string, headers?: Record<string, string>) {
  if (data.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  // Если headers не указаны, используем ключи первого объекта
  const keys = headers ? Object.keys(headers) : Object.keys(data[0]);
  const displayHeaders = headers ? Object.values(headers) : keys;

  // Создаём CSV контент
  const csvContent = [
    // Заголовки
    displayHeaders.join(','),
    // Данные
    ...data.map(row => 
      keys.map(key => {
        let value = row[key];
        
        // Обработка различных типов данных
        if (value === null || value === undefined) {
          return '';
        }
        
        if (typeof value === 'string') {
          // Экранируем кавычки и добавляем кавычки если есть запятые
          value = value.replace(/"/g, '""');
          if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            value = `"${value}"`;
          }
        } else if (typeof value === 'boolean') {
          value = value ? 'Да' : 'Нет';
        }
        
        return value;
      }).join(',')
    )
  ].join('\n');

  // Добавляем BOM для корректного отображения кириллицы в Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Создаём ссылку для скачивания
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Экспорт в Excel (XLSX) - используем CSV с расширением .xls
export function exportToExcel(data: any[], filename: string, headers?: Record<string, string>) {
  if (data.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  const keys = headers ? Object.keys(headers) : Object.keys(data[0]);
  const displayHeaders = headers ? Object.values(headers) : keys;

  // Создаём HTML таблицу для Excel
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table>';
  
  // Заголовки
  html += '<tr>';
  displayHeaders.forEach(header => {
    html += `<th style="background-color: #f0f0f0; font-weight: bold; padding: 8px; border: 1px solid #ccc;">${header}</th>`;
  });
  html += '</tr>';
  
  // Данные
  data.forEach(row => {
    html += '<tr>';
    keys.forEach(key => {
      let value = row[key];
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'boolean') {
        value = value ? 'Да' : 'Нет';
      }
      html += `<td style="padding: 8px; border: 1px solid #ccc;">${value}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</table></body></html>';

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Печать отчёта
export function printReport(title: string, content: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Не удалось открыть окно печати. Проверьте настройки блокировки всплывающих окон.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        h1 {
          color: #1e40af;
          border-bottom: 2px solid #1e40af;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .header {
          margin-bottom: 20px;
        }
        .date {
          color: #666;
          font-size: 12px;
        }
        @media print {
          body {
            margin: 0;
          }
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <p class="date">Дата формирования: ${new Date().toLocaleString('ru-RU')}</p>
      </div>
      ${content}
      <div class="no-print" style="margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #1e40af; color: white; border: none; border-radius: 4px; cursor: pointer;">Печать</button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Закрыть</button>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
