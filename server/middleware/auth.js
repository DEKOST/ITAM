const jwt = require('jsonwebtoken');
const { db } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'itam-secret-key-change-in-production-' + Date.now();
const JWT_EXPIRES_IN = '24h';

// Middleware для проверки авторизации
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Проверяем, существует ли пользователь и активен ли он
    const user = db.prepare('SELECT id, username, full_name, email, role, is_active FROM auth_users WHERE id = ?').get(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    
    if (!user.is_active) {
      return res.status(403).json({ error: 'Пользователь деактивирован' });
    }
    
    // Проверяем сессию
    const session = db.prepare('SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")').get(token);
    if (!session) {
      return res.status(401).json({ error: 'Сессия истекла' });
    }
    
    // Добавляем информацию о пользователе в запрос
    req.user = user;
    req.token = token;
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истёк' });
    }
    return res.status(401).json({ error: 'Недействительный токен' });
  }
}

// Middleware для проверки роли администратора
function adminMiddleware(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещён. Требуются права администратора' });
  }
  next();
}

// Генерация JWT токена
function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

module.exports = { authMiddleware, adminMiddleware, generateToken, JWT_SECRET, JWT_EXPIRES_IN };
