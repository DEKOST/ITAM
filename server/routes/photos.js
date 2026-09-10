const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Создаём папку для загрузки фотографий если её нет
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'equipment');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Фильтр для разрешённых типов файлов
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Недопустимый тип файла. Разрешены только: JPEG, PNG, GIF, WebP'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

// Все маршруты требуют авторизации
router.use(authMiddleware);

// Получить список фотографий оборудования
router.get('/equipment/:id/photos', (req, res) => {
  try {
    const photos = db.prepare(`
      SELECT * FROM equipment_photos 
      WHERE equipment_id = ? 
      ORDER BY is_primary DESC, created_at ASC
    `).all(req.params.id);

    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Загрузить фотографию
router.post('/equipment/:id/photos', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не был загружен' });
    }

    // Проверяем существование оборудования
    const equipment = db.prepare('SELECT id FROM equipment WHERE id = ?').get(req.params.id);
    if (!equipment) {
      // Удаляем загруженный файл
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }

    // Проверяем, есть ли уже фотографии
    const photoCount = db.prepare('SELECT COUNT(*) as count FROM equipment_photos WHERE equipment_id = ?').get(req.params.id);
    const isPrimary = photoCount.count === 0 ? 1 : 0; // Первая фотография становится основной

    const photoId = uuidv4();
    const relativePath = `/uploads/equipment/${req.file.filename}`;

    db.prepare(`
      INSERT INTO equipment_photos (id, equipment_id, filename, original_name, file_path, file_size, mime_type, is_primary, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      photoId,
      req.params.id,
      req.file.filename,
      req.file.originalname,
      relativePath,
      req.file.size,
      req.file.mimetype,
      isPrimary,
      req.user.id
    );

    const photo = db.prepare('SELECT * FROM equipment_photos WHERE id = ?').get(photoId);
    res.status(201).json(photo);
  } catch (error) {
    // Удаляем файл при ошибке
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Установить фотографию как основную
router.patch('/equipment/:id/photos/:photoId/primary', (req, res) => {
  try {
    // Проверяем существование фотографии
    const photo = db.prepare('SELECT * FROM equipment_photos WHERE id = ? AND equipment_id = ?')
      .get(req.params.photoId, req.params.id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Фотография не найдена' });
    }

    // Снимаем основную со всех фотографий этого оборудования
    db.prepare('UPDATE equipment_photos SET is_primary = 0 WHERE equipment_id = ?')
      .run(req.params.id);

    // Устанавливаем выбранную фотографию как основную
    db.prepare('UPDATE equipment_photos SET is_primary = 1 WHERE id = ?')
      .run(req.params.photoId);

    const updatedPhoto = db.prepare('SELECT * FROM equipment_photos WHERE id = ?').get(req.params.photoId);
    res.json(updatedPhoto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить фотографию
router.delete('/equipment/:id/photos/:photoId', (req, res) => {
  try {
    const photo = db.prepare('SELECT * FROM equipment_photos WHERE id = ? AND equipment_id = ?')
      .get(req.params.photoId, req.params.id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Фотография не найдена' });
    }

    // Удаляем файл с диска
    const filePath = path.join(__dirname, '..', photo.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Удаляем запись из БД
    db.prepare('DELETE FROM equipment_photos WHERE id = ?').run(req.params.photoId);

    // Если удалённая фотография была основной, назначаем новую основную
    if (photo.is_primary) {
      const nextPhoto = db.prepare(`
        SELECT id FROM equipment_photos 
        WHERE equipment_id = ? 
        ORDER BY created_at ASC 
        LIMIT 1
      `).get(req.params.id);

      if (nextPhoto) {
        db.prepare('UPDATE equipment_photos SET is_primary = 1 WHERE id = ?').run(nextPhoto.id);
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обработка ошибок multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Размер файла превышает 10 MB' });
    }
    return res.status(400).json({ error: error.message });
  }
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  next();
});

module.exports = router;
