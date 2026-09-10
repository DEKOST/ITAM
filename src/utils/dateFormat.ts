/**
 * Получает часовой пояс из localStorage или использует часовой пояс браузера
 */
function getUserTimezone(): string {
  return localStorage.getItem('user_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Форматирует дату в формат "ЧЧ:ММ:СС ДД.ММ.ГГГГ"
 * @param date - Дата в любом формате (ISO строка, Date объект, timestamp)
 * @returns Отформатированная строка в часовом поясе пользователя
 */
export function formatDateTime(date: string | Date | number | null | undefined): string {
  if (!date) return '—';
  
  try {
    const d = new Date(date);
    
    // Проверяем валидность даты
    if (isNaN(d.getTime())) return '—';
    
    // Получаем часовой пояс пользователя
    const timezone = getUserTimezone();
    
    // Форматируем дату с учётом часового пояса
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false
    };
    
    const formatter = new Intl.DateTimeFormat('ru-RU', options);
    const parts = formatter.formatToParts(d);
    
    const hours = parts.find(p => p.type === 'hour')?.value || '00';
    const minutes = parts.find(p => p.type === 'minute')?.value || '00';
    const seconds = parts.find(p => p.type === 'second')?.value || '00';
    const day = parts.find(p => p.type === 'day')?.value || '00';
    const month = parts.find(p => p.type === 'month')?.value || '00';
    const year = parts.find(p => p.type === 'year')?.value || '0000';
    
    return `${hours}:${minutes}:${seconds} ${day}.${month}.${year}`;
  } catch (error) {
    return '—';
  }
}

/**
 * Форматирует только дату в формат "ДД.ММ.ГГГГ"
 * @param date - Дата в любом формате
 * @returns Отформатированная строка в часовом поясе пользователя
 */
export function formatDate(date: string | Date | number | null | undefined): string {
  if (!date) return '—';
  
  try {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '—';
    
    // Получаем часовой пояс пользователя
    const timezone = getUserTimezone();
    
    // Форматируем дату с учётом часового пояса
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    
    const formatter = new Intl.DateTimeFormat('ru-RU', options);
    const parts = formatter.formatToParts(d);
    
    const day = parts.find(p => p.type === 'day')?.value || '00';
    const month = parts.find(p => p.type === 'month')?.value || '00';
    const year = parts.find(p => p.type === 'year')?.value || '0000';
    
    return `${day}.${month}.${year}`;
  } catch (error) {
    return '—';
  }
}

/**
 * Форматирует только время в формат "ЧЧ:ММ:СС"
 * @param date - Дата в любом формате
 * @returns Отформатированная строка в часовом поясе пользователя
 */
export function formatTime(date: string | Date | number | null | undefined): string {
  if (!date) return '—';
  
  try {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) return '—';
    
    // Получаем часовой пояс пользователя
    const timezone = getUserTimezone();
    
    // Форматируем время с учётом часового пояса
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    
    const formatter = new Intl.DateTimeFormat('ru-RU', options);
    const parts = formatter.formatToParts(d);
    
    const hours = parts.find(p => p.type === 'hour')?.value || '00';
    const minutes = parts.find(p => p.type === 'minute')?.value || '00';
    const seconds = parts.find(p => p.type === 'second')?.value || '00';
    
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
