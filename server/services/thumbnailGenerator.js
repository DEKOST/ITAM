const { db } = require('../db');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Создание миниатюр для существующих фотографий
async function generateThumbnailsForExistingPhotos() {
  try {
    console.log('🖼️ Проверка существующих фотографий...');
    
    // Получаем все фотографии без миниатюр
    const photosWithoutThumbnails = db.prepare(`
      SELECT id, file_path, original_name 
      FROM equipment_photos 
      WHERE thumbnail_path IS NULL
    `).all();
    
    if (photosWithoutThumbnails.length === 0) {
      console.log('✅ Все фотографии уже имеют миниатюры');
      return;
    }
    
    console.log(`📸 Найдено ${photosWithoutThumbnails.length} фотографий без миниатюр`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const photo of photosWithoutThumbnails) {
      try {
        const filePath = path.join(__dirname, '..', photo.file_path);
        
        // Проверяем существование файла
        if (!fs.existsSync(filePath)) {
          console.warn(`⚠️ Файл не найден: ${filePath}`);
          errorCount++;
          continue;
        }
        
        // Создаем имя для миниатюры
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const baseName = path.basename(filePath, ext);
        const thumbnailName = `thumb_${baseName}.jpg`;
        const thumbnailPath = path.join(dir, thumbnailName);
        
        // Создаем миниатюру
        await sharp(filePath)
          .rotate() // Автоматически применяем EXIF ориентацию
          .resize(300, 300, {
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ quality: 85 })
          .toFile(thumbnailPath);
        
        // Обновляем запись в БД
        const relativeThumbnailPath = `/uploads/equipment/${thumbnailName}`;
        db.prepare('UPDATE equipment_photos SET thumbnail_path = ? WHERE id = ?')
          .run(relativeThumbnailPath, photo.id);
        
        successCount++;
        console.log(`✅ Создана миниатюра для: ${photo.original_name}`);
        
      } catch (error) {
        console.error(`❌ Ошибка создания миниатюры для ${photo.original_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Результат:`);
    console.log(`   ✅ Успешно: ${successCount}`);
    console.log(`   ❌ Ошибок: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Ошибка при создании миниатюр:', error);
  }
}

// Пересоздание всех миниатюр с правильной EXIF ориентацией
async function regenerateAllThumbnails() {
  try {
    console.log('🔄 Проверка необходимости пересоздания миниатюр...');
    
    // Получаем все фотографии с миниатюрами
    const photosWithThumbnails = db.prepare(`
      SELECT id, file_path, thumbnail_path, original_name 
      FROM equipment_photos 
      WHERE thumbnail_path IS NOT NULL
    `).all();
    
    if (photosWithThumbnails.length === 0) {
      console.log('ℹ️ Нет фотографий с миниатюрами для пересоздания');
      return;
    }
    
    console.log(`📸 Найдено ${photosWithThumbnails.length} фотографий с миниатюрами`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const photo of photosWithThumbnails) {
      try {
        const filePath = path.join(__dirname, '..', photo.file_path);
        const thumbnailPath = path.join(__dirname, '..', photo.thumbnail_path);
        
        // Проверяем существование файлов
        if (!fs.existsSync(filePath) || !fs.existsSync(thumbnailPath)) {
          console.warn(`⚠️ Файл не найден для: ${photo.original_name}`);
          errorCount++;
          continue;
        }
        
        // Получаем метаданные оригинала
        const metadata = await sharp(filePath).metadata();
        
        // Проверяем наличие EXIF ориентации
        if (metadata.orientation && metadata.orientation !== 1) {
          console.log(`🔄 Пересоздание миниатюры с EXIF ориентацией для: ${photo.original_name}`);
          
          // Удаляем старую миниатюру
          fs.unlinkSync(thumbnailPath);
          
          // Создаем новую миниатюру с правильной ориентацией
          await sharp(filePath)
            .rotate() // Применяем EXIF ориентацию
            .resize(300, 300, {
              fit: 'cover',
              position: 'center'
            })
            .jpeg({ quality: 85 })
            .toFile(thumbnailPath);
          
          successCount++;
        } else {
          skippedCount++;
        }
        
      } catch (error) {
        console.error(`❌ Ошибка пересоздания миниатюры для ${photo.original_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Результат пересоздания:`);
    console.log(`   ✅ Пересоздано: ${successCount}`);
    console.log(`   ⏭️ Пропущено (без EXIF): ${skippedCount}`);
    console.log(`   ❌ Ошибок: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Ошибка при пересоздании миниатюр:', error);
  }
}

// Запускаем создание миниатюр при старте сервера
generateThumbnailsForExistingPhotos();

// Запускаем пересоздание миниатюр с правильной ориентацией
regenerateAllThumbnails();

module.exports = { generateThumbnailsForExistingPhotos, regenerateAllThumbnails };
