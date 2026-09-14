const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { db } = require('../db');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = 30; // Храним максимум 30 бэкапов

// Создаём директорию для бэкапов
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Создание резервной копии
function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `itam_backup_${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupName);
    
    // Используем SQLite backup API
    const backup = db.backup(backupPath);
    
    backup.then(() => {
      console.log(`✅ Резервная копия создана: ${backupName}`);
      cleanupOldBackups();
    }).catch(err => {
      console.error('❌ Ошибка создания резервной копии:', err);
    });
  } catch (err) {
    console.error('❌ Ошибка создания резервной копии:', err);
  }
}

// Удаление старых бэкапов
function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('itam_backup_') && f.endsWith('.db'))
      .sort()
      .reverse();
    
    if (files.length > MAX_BACKUPS) {
      const toDelete = files.slice(MAX_BACKUPS);
      toDelete.forEach(file => {
        fs.unlinkSync(path.join(BACKUP_DIR, file));
        console.log(`🗑️ Удалён старый бэкап: ${file}`);
      });
    }
  } catch (err) {
    console.error('❌ Ошибка очистки старых бэкапов:', err);
  }
}

// Ручное создание бэкапа
function manualBackup() {
  return new Promise((resolve, reject) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `itam_manual_${timestamp}.db`;
      const backupPath = path.join(BACKUP_DIR, backupName);
      
      const backup = db.backup(backupPath);
      
      backup.then(() => {
        console.log(`✅ Ручная резервная копия создана: ${backupName}`);
        resolve({ success: true, filename: backupName });
      }).catch(err => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Список всех бэкапов
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.db'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          filename: file,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          created: stats.birthtime.toISOString(),
          isManual: file.includes('manual')
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    return files;
  } catch (err) {
    console.error('❌ Ошибка получения списка бэкапов:', err);
    return [];
  }
}

// Восстановление из бэкапа
function restoreBackup(filename) {
  return new Promise((resolve, reject) => {
    try {
      const backupPath = path.join(BACKUP_DIR, filename);
      
      if (!fs.existsSync(backupPath)) {
        return reject(new Error('Файл бэкапа не найден'));
      }
      
      // Закрываем текущее соединение
      db.close();
      
      // Копируем бэкап на место основной БД
      const dbPath = path.join(__dirname, 'itam.db');
      fs.copyFileSync(backupPath, dbPath);
      
      console.log(`✅ БД восстановлена из: ${filename}`);
      resolve({ success: true, filename });
    } catch (err) {
      reject(err);
    }
  });
}

// Удаление бэкапа
function deleteBackup(filename) {
  try {
    const backupPath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error('Файл бэкапа не найден');
    }
    
    fs.unlinkSync(backupPath);
    console.log(`🗑️ Бэкап удалён: ${filename}`);
    return { success: true };
  } catch (err) {
    throw err;
  }
}

// Форматирование размера файла
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Запуск автоматического бэкапа по расписанию (каждый день в 3:00)
function startScheduledBackups() {
  cron.schedule('0 3 * * *', () => {
    console.log('🕐 Запуск автоматического резервного копирования...');
    createBackup();
  });
  console.log('✅ Автоматическое резервное копирование настроено (ежедневно в 3:00)');
}

module.exports = {
  createBackup,
  manualBackup,
  listBackups,
  restoreBackup,
  deleteBackup,
  startScheduledBackups
};
