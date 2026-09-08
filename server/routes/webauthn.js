const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const webauthn = require('../services/webauthn');
const { db } = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'itam-secret-key-change-in-production';

// Начало регистрации устройства
router.post('/register/begin', requireAuth, async (req, res) => {
  try {
    const options = await webauthn.generateRegistration(req.user.id);
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Завершение регистрации устройства
router.post('/register/complete', requireAuth, async (req, res) => {
  try {
    const { deviceName } = req.body;
    const result = await webauthn.verifyRegistration(req.user.id, { ...req.body, deviceName });
    
    if (result.verified) {
      res.json({ success: true, message: 'Устройство зарегистрировано' });
    } else {
      res.status(400).json({ error: 'Верификация не пройдена' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Начало аутентификации по биометрии
router.post('/auth/begin', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Имя пользователя не указано' });
    }

    const user = db.prepare('SELECT * FROM auth_users WHERE username = ? AND is_active = 1').get(username);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const options = await webauthn.generateAuthentication(user.id);
    res.json({ options, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Завершение аутентификации
router.post('/auth/complete', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await webauthn.verifyAuthentication(userId, req.body);
    
    if (result.verified) {
      const user = db.prepare('SELECT * FROM auth_users WHERE id = ?').get(userId);
      
      // Записываем вход в лог
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      db.prepare('INSERT INTO login_logs (id, user_id, login_time, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?, ?)').run(
        require('crypto').randomUUID(),
        userId,
        new Date().toISOString(),
        ip,
        userAgent,
        1
      );

      // Генерируем токен
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          fullName: user.full_name
        }
      });
    } else {
      res.status(400).json({ error: 'Верификация не пройдена' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Список устройств пользователя
router.get('/devices', requireAuth, (req, res) => {
  try {
    const devices = webauthn.getUserDevices(req.user.id);
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удаление устройства
router.delete('/devices/:id', requireAuth, (req, res) => {
  try {
    const deleted = webauthn.deleteDevice(req.user.id, req.params.id);
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Устройство не найдено' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
