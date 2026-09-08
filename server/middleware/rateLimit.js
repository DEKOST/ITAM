const rateLimit = require('express-rate-limit');

// Общий rate limiter для всех API запросов
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 1000 запросов за 15 минут
  message: { error: 'Слишком много запросов, попробуйте позже' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгий rate limiter для авторизации
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток входа
  message: { error: 'Слишком много попыток входа, попробуйте через 15 минут' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Rate limiter для генерации сертификатов
const certLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 10, // максимум 10 генераций в час
  message: { error: 'Слишком много запросов на генерацию сертификатов' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter для API операций
const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 минута
  max: 60, // максимум 60 операций записи в минуту
  message: { error: 'Слишком много операций, попробуйте позже' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, authLimiter, certLimiter, writeLimiter };
