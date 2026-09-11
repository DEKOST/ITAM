// Маппинг символов между русской и английской раскладками
const layoutMap: Record<string, string> = {
  // English to Russian
  'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г',
  'i': 'ш', 'o': 'щ', 'p': 'з', '[': 'х', ']': 'ъ', 'a': 'ф', 's': 'ы',
  'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л', 'l': 'д',
  ';': 'ж', '\'': 'э', 'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и',
  'n': 'т', 'm': 'ь', ',': 'б', '.': 'ю', '`': 'ё',
  
  // Russian to English
  'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u',
  'ш': 'i', 'щ': 'o', 'з': 'p', 'х': '[', 'ъ': ']', 'ф': 'a', 'ы': 's',
  'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l',
  'ж': ';', 'э': '\'', 'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b',
  'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.', 'ё': '`'
};

/**
 * Конвертирует текст между русской и английской раскладками
 */
export function convertLayout(text: string): string {
  return text
    .split('')
    .map(char => {
      const lower = char.toLowerCase();
      const converted = layoutMap[lower];
      if (!converted) return char;
      
      // Сохраняем регистр
      return char === char.toUpperCase() && char !== char.toLowerCase()
        ? converted.toUpperCase()
        : converted;
    })
    .join('');
}

/**
 * Проверяет, содержит ли текст подстроку (с учетом конвертации раскладки)
 */
export function matchesWithLayout(text: string, query: string): boolean {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // Прямое совпадение
  if (lowerText.includes(lowerQuery)) return true;
  
  // Совпадение с конвертацией раскладки
  const convertedQuery = convertLayout(query).toLowerCase();
  if (lowerText.includes(convertedQuery)) return true;
  
  return false;
}
