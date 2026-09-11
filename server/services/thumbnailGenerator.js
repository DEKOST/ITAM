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

// Запускаем создание миниатюр при старте сервера
generateThumbnailsForExistingPhotos();

module.exports = { generateThumbnailsForExistingPhotos };
