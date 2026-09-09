const { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } = require('@simplewebauthn/server');
const { db } = require('../db');
const crypto = require('crypto');

const rpName = 'ITAM Service';
let rpID = 'localhost';
let origin = 'http://localhost:3001';

// Настройка из переменных окружения
if (process.env.DOMAIN) {
  rpID = process.env.DOMAIN;
  origin = `https://${process.env.DOMAIN}:3443`;
}

// Генерация challenge
function generateChallenge() {
  return crypto.randomBytes(32);
}

// Регистрация нового устройства
async function generateRegistration(userId) {
  const user = db.prepare('SELECT * FROM auth_users WHERE id = ?').get(userId);
  if (!user) throw new Error('Пользователь не найден');

  // Проверяем существующие устройства
  const existingDevices = db.prepare('SELECT * FROM webauthn_credentials WHERE user_id = ?').all(userId);
  
  // Конвертируем userID из строки в ArrayBuffer (требование новой версии SimpleWebAuthn)
  const userIDBuffer = Buffer.from(userId, 'utf-8');
  
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: userIDBuffer,
    userName: user.username,
    displayName: user.full_name || user.username,
    attestationType: 'none',
    excludeCredentials: existingDevices.map(dev => ({
      id: dev.credential_id,
      type: 'public-key',
      transports: ['internal', 'usb', 'ble', 'nfc']
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred'
    }
  });

  // Сохраняем challenge
  db.prepare('UPDATE auth_users SET webauthn_challenge = ? WHERE id = ?').run(options.challenge, userId);
  
  return options;
}
// Верификация регистрации
async function verifyRegistration(userId, body) {
  const user = db.prepare('SELECT * FROM auth_users WHERE id = ?').get(userId);
  if (!user || !user.webauthn_challenge) {
    throw new Error('Challenge не найден');
  }

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: user.webauthn_challenge,
    expectedOrigin: origin,
    expectedRPID: rpID
  });

  if (verification.verified) {
    const { credential } = verification.registrationInfo;
    
    // Сохраняем устройство
    db.prepare(`
      INSERT INTO webauthn_credentials (id, user_id, credential_id, public_key, counter, device_type, device_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      userId,
      Buffer.from(credential.id).toString('base64url'),
      Buffer.from(credential.publicKey).toString('base64url'),
      credential.counter,
      credential.deviceType || 'unknown',
      body.deviceName || 'Unknown Device'
    );

    // Очищаем challenge
    db.prepare('UPDATE auth_users SET webauthn_challenge = NULL WHERE id = ?').run(userId);

    return { verified: true };
  }

  return { verified: false };
}

// Генерация опций для аутентификации
async function generateAuthentication(userId) {
  const devices = db.prepare('SELECT * FROM webauthn_credentials WHERE user_id = ?').all(userId);
  
  if (devices.length === 0) {
    throw new Error('Нет зарегистрированных устройств');
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: devices.map(dev => ({
      id: dev.credential_id,
      type: 'public-key',
      transports: ['internal', 'usb', 'ble', 'nfc']
    })),
    userVerification: 'preferred'
  });

  // Сохраняем challenge
  db.prepare('UPDATE auth_users SET webauthn_challenge = ? WHERE id = ?').run(options.challenge, userId);

  return options;
}

// Верификация аутентификации
async function verifyAuthentication(userId, body) {
  const user = db.prepare('SELECT * FROM auth_users WHERE id = ?').get(userId);
  if (!user || !user.webauthn_challenge) {
    throw new Error('Challenge не найден');
  }

  const device = db.prepare('SELECT * FROM webauthn_credentials WHERE credential_id = ?').get(body.id);
  if (!device) {
    throw new Error('Устройство не найдено');
  }

  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: user.webauthn_challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: device.credential_id,
      publicKey: Buffer.from(device.public_key, 'base64url'),
      counter: device.counter
    }
  });

  if (verification.verified) {
    // Обновляем счётчик
    db.prepare('UPDATE webauthn_credentials SET counter = ? WHERE id = ?').run(
      verification.authenticationInfo.newCounter,
      device.id
    );

    // Очищаем challenge
    db.prepare('UPDATE auth_users SET webauthn_challenge = NULL WHERE id = ?').run(userId);

    return { verified: true };
  }

  return { verified: false };
}

// Список устройств пользователя
function getUserDevices(userId) {
  return db.prepare('SELECT id, device_type, device_name, created_at, last_used FROM webauthn_credentials WHERE user_id = ?').all(userId);
}

// Удаление устройства
function deleteDevice(userId, deviceId) {
  const result = db.prepare('DELETE FROM webauthn_credentials WHERE id = ? AND user_id = ?').run(deviceId, userId);
  return result.changes > 0;
}

module.exports = {
  generateRegistration,
  verifyRegistration,
  generateAuthentication,
  verifyAuthentication,
  getUserDevices,
  deleteDevice
};
