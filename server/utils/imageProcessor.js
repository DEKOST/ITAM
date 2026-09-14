const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Транслитерация русского текста в латиницу
function transliterate(text) {
  const ru = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
    'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
    'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
    'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch',
    'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
    'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };

  return text.split('').map(char => ru[char] || char).join('');
}

// Создание имени файла на основе названия оборудования
function createFileName(equipmentName, originalExt) {
  // Транслитерируем название
  let transliterated = transliterate(equipmentName);
  
  // Заменяем пробелы и специальные символы на дефисы
  transliterated = transliterated
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Убираем все кроме букв, цифр, пробелов и дефисов
    .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
    .replace(/-+/g, '-') // Убираем множественные дефисы
    .toLowerCase();
  
  // Если название пустое после обработки, используем "photo"
  if (!transliterated) {
    transliterated = 'photo';
  }
  
  return transliterated + originalExt;
}

// Создание миниатюры из изображения
async function createThumbnail(inputPath, outputPath, size = 300) {
  try {
    await sharp(inputPath)
      .rotate() // Автоматически применяем EXIF ориентацию
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 }) // Сжимаем в JPEG с качеством 85%
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    console.error('Ошибка создания миниатюры:', error);
    return false;
  }
}

// Сжатие оригинального изображения без потери качества
async function compressImage(inputPath, outputPath) {
  try {
    const metadata = await sharp(inputPath).metadata();
    
    // Определяем формат и применяем оптимальные настройки
    let processor = sharp(inputPath)
      .rotate(); // Автоматически применяем EXIF ориентацию
    
    if (metadata.format === 'jpeg' || metadata.format === 'jpg') {
      processor = processor.jpeg({ 
        quality: 90, // Высокое качество
        progressive: true, // Прогрессивная загрузка
        mozjpeg: true // Оптимизация Mozilla
      });
    } else if (metadata.format === 'png') {
      processor = processor.png({ 
        quality: 90,
        compressionLevel: 9, // Максимальное сжатие
        progressive: true
      });
    } else if (metadata.format === 'webp') {
      processor = processor.webp({ 
        quality: 90,
        lossless: false
      });
    }
    
    await processor.toFile(outputPath);
    return true;
  } catch (error) {
    console.error('Ошибка сжатия изображения:', error);
    return false;
  }
}

// Обработка загруженного изображения
async function processImage(originalPath, equipmentName, photoCount = 0) {
  const dir = path.dirname(originalPath);
  const ext = path.extname(originalPath);
  
  // Создаем базовое имя файла на основе названия оборудования
  const baseName = createFileName(equipmentName);
  
  // Создаем имя файла с номером если это не первая фотография
  let newName;
  if (photoCount === 0) {
    // Первая фотография - просто название оборудования
    newName = `${baseName}${ext}`;
  } else {
    // Последующие фотографии - название с номером
    const number = String(photoCount + 1).padStart(2, '0');
    newName = `${baseName}_${number}${ext}`;
  }
  
  let newPath = path.join(dir, newName);
  
  // Если файл с таким именем уже существует, добавляем номер
  let counter = photoCount + 1;
  while (fs.existsSync(newPath)) {
    const number = String(counter + 1).padStart(2, '0');
    newName = `${baseName}_${number}${ext}`;
    newPath = path.join(dir, newName);
    counter++;
  }
  
  // Создаем миниатюру
  let thumbnailName;
  if (photoCount === 0) {
    thumbnailName = `${baseName}.jpg`;
  } else {
    const number = String(photoCount + 1).padStart(2, '0');
    thumbnailName = `${baseName}_${number}.jpg`;
  }
  
  let thumbnailPath = path.join(dir, 'thumb_' + thumbnailName);
  
  // Если миниатюра с таким именем уже существует, добавляем номер
  let thumbCounter = photoCount + 1;
  while (fs.existsSync(thumbnailPath)) {
    const number = String(thumbCounter + 1).padStart(2, '0');
    thumbnailName = `${baseName}_${number}.jpg`;
    thumbnailPath = path.join(dir, 'thumb_' + thumbnailName);
    thumbCounter++;
  }
  
  try {
    // Сжимаем оригинал
    await compressImage(originalPath, newPath);
    
    // Создаем миниатюру
    await createThumbnail(originalPath, thumbnailPath, 300);
    
    // Удаляем оригинальный файл (он был временным)
    if (originalPath !== newPath) {
      fs.unlinkSync(originalPath);
    }
    
    return {
      originalPath: newPath,
      thumbnailPath: thumbnailPath,
      originalName: newName,
      thumbnailName: 'thumb_' + thumbnailName
    };
  } catch (error) {
    console.error('Ошибка обработки изображения:', error);
    // В случае ошибки возвращаем оригинальный путь
    return {
      originalPath: originalPath,
      thumbnailPath: null,
      originalName: path.basename(originalPath),
      thumbnailName: null
    };
  }
}

module.exports = {
  transliterate,
  createFileName,
  createThumbnail,
  compressImage,
  processImage
};
