/**
 * Форматирует дату в формат "ЧЧ:ММ:СС ДД.ММ.ГГГГ"
 * @param date - Дата в любом формате (ISO строка, Date объект, timestamp)
 * @returns Отформатированная строка
 */
export function formatDateTime(date: string | Date | number | null | undefined): string {
  if (!date) return '—';
  
  try {
    const d = new Date(date);
    
    // Проверяем валидность даты
    if (isNaN(d.getTime())) return '—';
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${hours}:${minutes}:${seconds} ${day}.${month}.${year}`;
  } catch (error) {
    return '—';
  }
}

/**
 * Форматирует только дату в формат "ДД.ММ.ГГГГ"
 * @param date - Дата в любом формате
 * @returns Отформатированная строка
 */
export function formatDate(date: string | Date | number | null | undefined): string {
  if (!date) return '—';
  
  try {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '—';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch (error) {
    return '—';
  }
}

/**
 * Форматирует только время в формат "ЧЧ:ММ:СС"
 * @param date - Дата в любом формате
 * @returns Отформатированная строка
 */
export function formatTime(date: string | Date | number | null | undefined): string {
  if (!date) return '—';
  
  try {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '—';
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  } catch (error) {
    return '—';
  }
}

/**
 * Возвращает текущую дату в ISO формате для отправки на сервер
 * @returns ISO строка
 */
export function getCurrentISODate(): string {
  return new Date().toISOString();
}

/**
 * Конвертирует дату из input type="date" в ISO строку
 * @param dateStr - Строка в формате YYYY-MM-DD
 * @returns ISO строка или пустая строка
 */
export function dateInputToISO(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString();
}

/**
 * Конвертирует ISO строку в формат для input type="date"
 * @param isoStr - ISO строка
 * @returns Строка в формате YYYY-MM-DD или пустая строка
 */
export function isoToDateInput(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}
