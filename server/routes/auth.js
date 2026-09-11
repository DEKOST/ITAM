const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, adminMiddleware, generateToken, JWT_EXPIRES_IN } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { loginSchema, createUserSchema, updateUserSchema, validate } = require('../middleware/validation');
const { getClientIP } = require('../utils/clientIP');

// Максимальное количество активных сессий на пользователя
const MAX_SESSIONS_PER_USER = 5;

// Логин
router.post('/login', authLimiter, validate(loginSchema), (req, res) => {
  const { username, password } = req.body;
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';

  const user = db.prepare('SELECT * FROM auth_users WHERE username = ?').get(username);

  if (!user) {
    // Логируем неудачную попытку
    db.prepare('INSERT INTO auth_logs (id, username, action, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), username, 'login', ip, userAgent, 0);
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  if (!user.is_active) {
    db.prepare('INSERT INTO auth_logs (id, user_id, username, action, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), user.id, username, 'login', ip, userAgent, 0);
    return res.status(403).json({ error: 'Пользователь деактивирован' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    db.prepare('INSERT INTO auth_logs (id, user_id, username, action, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(uuidv4(), user.id, username, 'login', ip, userAgent, 0);
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }

  // Генерируем токен
  const token = generateToken(user);
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  // Ограничение количества активных сессий на пользователя
  const sessionCount = db.prepare(`SELECT COUNT(*) as count FROM sessions WHERE user_id = ? AND expires_at > datetime('now')`).get(user.id);
  if (sessionCount.count >= MAX_SESSIONS_PER_USER) {
    // Удаляем самую старую сессию
    db.prepare(`DELETE FROM sessions WHERE id IN (SELECT id FROM sessions WHERE user_id = ? AND expires_at > datetime('now') ORDER BY created_at ASC LIMIT 1)`).run(user.id);
  }
  
  // Сохраняем сессию
  db.prepare('INSERT INTO sessions (id, user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(sessionId, user.id, token, ip, userAgent, expiresAt);
  // Обновляем время последнего входа
  db.prepare("UPDATE auth_users SET last_login = datetime('now') WHERE id = ?").run(user.id);

  // Логируем успешный вход
  db.prepare('INSERT INTO auth_logs (id, user_id, username, action, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), user.id, username, 'login', ip, userAgent, 1);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    },
    expiresIn: JWT_EXPIRES_IN,
  });
});

// Получить текущего пользователя
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    fullName: req.user.full_name,
    email: req.user.email,
    role: req.user.role,
  });
});

// Выход
router.post('/logout', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(req.token);
  
  db.prepare('INSERT INTO auth_logs (id, user_id, username, action, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), req.user.id, req.user.username, 'logout', getClientIP(req), req.headers['user-agent'] || '', 1);
  
  res.json({ success: true });
});

// Смена пароля
router.post('/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
  }

  const user = db.prepare('SELECT * FROM auth_users WHERE id = ?').get(req.user.id);
  
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(400).json({ error: 'Неверный текущий пароль' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE auth_users SET password_hash = ? WHERE id = ?').run(newHash, req.user.id);

  // Удаляем все сессии кроме текущей
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(req.user.id, req.token);

  res.json({ success: true, message: 'Пароль изменён' });
});

// === Управление пользователями (только для админов) ===

// Список пользователей
router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  const users = db.prepare(`
    SELECT id, username, full_name, email, role, is_active, last_login, created_at,
      (SELECT COUNT(*) FROM sessions WHERE user_id = auth_users.id AND expires_at > datetime('now')) as active_sessions
    FROM auth_users
    ORDER BY created_at DESC
  `).all();
  res.json(users);
});

// Создать пользователя
router.post('/users', authMiddleware, adminMiddleware, validate(createUserSchema), (req, res) => {
  const { username, password, fullName, email, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
  }

  const existing = db.prepare('SELECT id FROM auth_users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
  }

  const id = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  
  db.prepare(`
    INSERT INTO auth_users (id, username, password_hash, full_name, email, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, username, passwordHash, fullName || '', email || '', role || 'user');

  const user = db.prepare('SELECT id, username, full_name, email, role, is_active, created_at FROM auth_users WHERE id = ?').get(id);
  res.status(201).json(user);
});

// Обновить пользователя
router.put('/users/:id', authMiddleware, adminMiddleware, validate(updateUserSchema), (req, res) => {
  const { fullName, email, role, isActive, password } = req.body;
  const existing = db.prepare('SELECT * FROM auth_users WHERE id = ?').get(req.params.id);
  
  if (!existing) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  let updates = [];
  let params = [];

  if (fullName !== undefined) { updates.push('full_name = ?'); params.push(fullName); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (role !== undefined) { updates.push('role = ?'); params.push(role); }
  if (isActive !== undefined) { updates.push('is_active = ?'); params.push(isActive ? 1 : 0); }
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    updates.push('password_hash = ?');
    params.push(bcrypt.hashSync(password, 10));
  }

  if (updates.length > 0) {
    params.push(req.params.id);
    db.prepare(`UPDATE auth_users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const user = db.prepare('SELECT id, username, full_name, email, role, is_active, last_login, created_at FROM auth_users WHERE id = ?').get(req.params.id);
  res.json(user);
});

// Удалить пользователя
router.delete('/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  const existing = db.prepare('SELECT * FROM auth_users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Пользователь не найден' });
  
  if (existing.id === req.user.id) {
    return res.status(400).json({ error: 'Нельзя удалить самого себя' });
  }

  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM auth_users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Журнал авторизации
router.get('/logs', authMiddleware, adminMiddleware, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const logs = db.prepare(`
    SELECT al.*, au.username as user_username
    FROM auth_logs al
    LEFT JOIN auth_users au ON al.user_id = au.id
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(limit);
  res.json(logs);
});

module.exports = router;
