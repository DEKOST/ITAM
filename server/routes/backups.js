const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimit');
const backupService = require('../services/backup');

// Список всех бэкапов
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const backups = backupService.listBackups();
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Создать бэкап вручную
router.post('/', authMiddleware, adminMiddleware, writeLimiter, async (req, res) => {
  try {
    const result = await backupService.manualBackup();
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Восстановить из бэкапа
router.post('/restore', authMiddleware, adminMiddleware, writeLimiter, async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Не указан файл бэкапа' });
    }
    
    const result = await backupService.restoreBackup(filename);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить бэкап
router.delete('/:filename', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const result = backupService.deleteBackup(req.params.filename);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
