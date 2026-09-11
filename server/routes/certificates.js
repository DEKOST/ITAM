const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const https = require('https');

// Все роуты требуют авторизации и прав админа
router.use(authMiddleware, adminMiddleware);

// Папка для сертификатов
const CERTS_DIR = path.join(__dirname, '..', 'certs');
if (!fs.existsSync(CERTS_DIR)) {
  fs.mkdirSync(CERTS_DIR, { recursive: true });
}

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CERTS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pem', '.crt', '.key', '.cer', '.cert'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла. Разрешены: .pem, .crt, .key, .cer, .cert'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Получить все сертификаты
router.get('/', (req, res) => {
  const certs = db.prepare('SELECT * FROM ssl_certificates ORDER BY created_at DESC').all();
  
  // Проверяем статус каждого сертификата
  const certsWithStatus = certs.map(cert => {
    let status = 'unknown';
    let info = {};
    
    try {
      if (fs.existsSync(cert.cert_path)) {
        const certContent = fs.readFileSync(cert.cert_path, 'utf8');
        // Простая проверка - читаем сертификат
        info = parseCertInfo(certContent);
        if (info.notAfter) {
          const expiryDate = new Date(info.notAfter);
          const now = new Date();
          if (expiryDate < now) {
            status = 'expired';
          } else if (expiryDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
            status = 'expiring_soon';
          } else {
            status = 'valid';
          }
        }
      } else {
        status = 'file_missing';
      }
    } catch (e) {
      status = 'error';
    }
    
    return { ...cert, status, certInfo: info };
  });
  
  res.json(certsWithStatus);
});

// Загрузить новый сертификат
router.post('/', upload.fields([
  { name: 'cert', maxCount: 1 },
  { name: 'key', maxCount: 1 },
  { name: 'ca', maxCount: 1 }
]), (req, res) => {
  const { name, domain } = req.body;
  
  if (!name || !domain) {
    // Удаляем загруженные файлы
    cleanupFiles(req.files);
    return res.status(400).json({ error: 'Укажите название и домен' });
  }
  
  if (!req.files || !req.files.cert || !req.files.key) {
    cleanupFiles(req.files);
    return res.status(400).json({ error: 'Загрузите сертификат (.crt/.pem) и ключ (.key)' });
  }
  
  const id = uuidv4();
  const certPath = req.files.cert[0].path;
  const keyPath = req.files.key[0].path;
  const caPath = req.files.ca ? req.files.ca[0].path : null;
  
  // Пытаемся прочитать информацию о сертификате
  let validFrom = null;
  let validTo = null;
  let issuer = '';
  
  try {
    const certContent = fs.readFileSync(certPath, 'utf8');
    const info = parseCertInfo(certContent);
    validFrom = info.notBefore || null;
    validTo = info.notAfter || null;
    issuer = info.issuer || '';
  } catch (e) {
    // Игнорируем ошибки парсинга
  }
  
  db.prepare(`
    INSERT INTO ssl_certificates (id, name, domain, cert_path, key_path, ca_path, issuer, valid_from, valid_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, domain, certPath, keyPath, caPath, issuer, validFrom, validTo);
  
  const cert = db.prepare('SELECT * FROM ssl_certificates WHERE id = ?').get(id);
  res.status(201).json(cert);
});

// Активировать сертификат
router.post('/:id/activate', (req, res) => {
  const cert = db.prepare('SELECT * FROM ssl_certificates WHERE id = ?').get(req.params.id);
  if (!cert) return res.status(404).json({ error: 'Сертификат не найден' });
  
  // Проверяем файлы
  if (!fs.existsSync(cert.cert_path) || !fs.existsSync(cert.key_path)) {
    return res.status(400).json({ error: 'Файлы сертификата не найдены' });
  }
  
  // Деактивируем все другие сертификаты
  db.prepare('UPDATE ssl_certificates SET is_active = 0').run();
  
  // Активируем выбранный
  db.prepare('UPDATE ssl_certificates SET is_active = 1 WHERE id = ?').run(req.params.id);
  
  res.json({ success: true, message: 'Сертификат активирован. Перезапустите сервер для применения.' });
});

// Деактивировать сертификат
router.post('/:id/deactivate', (req, res) => {
  db.prepare('UPDATE ssl_certificates SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Сертификат деактивирован. Перезапустите сервер для применения.' });
});

// Удалить сертификат
router.delete('/:id', (req, res) => {
  const cert = db.prepare('SELECT * FROM ssl_certificates WHERE id = ?').get(req.params.id);
  if (!cert) return res.status(404).json({ error: 'Сертификат не найден' });
  
  if (cert.is_active) {
    return res.status(400).json({ error: 'Нельзя удалить активный сертификат. Сначала деактивируйте его.' });
  }
  
  // Удаляем файлы
  try {
    if (fs.existsSync(cert.cert_path)) fs.unlinkSync(cert.cert_path);
    if (fs.existsSync(cert.key_path)) fs.unlinkSync(cert.key_path);
    if (cert.ca_path && fs.existsSync(cert.ca_path)) fs.unlinkSync(cert.ca_path);
  } catch (e) {
    // Игнорируем ошибки удаления файлов
  }
  
  db.prepare('DELETE FROM ssl_certificates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Сгенерировать самоподписанный сертификат
router.post('/generate-self-signed', (req, res) => {
  const { domain, name, days } = req.body;
  
  if (!domain) {
    return res.status(400).json({ error: 'Укажите домен' });
  }
  
  const certName = name || `Self-signed ${domain}`;
  const validDays = days || 365;
  
  try {
    // Используем openssl для генерации
    const { execSync } = require('child_process');
    const id = uuidv4();
    const certPath = path.join(CERTS_DIR, `${id}.crt`);
    const keyPath = path.join(CERTS_DIR, `${id}.key`);
    
    // Генерируем самоподписанный сертификат
    execSync(`openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days ${validDays} -nodes -subj "/CN=${domain}"`);
    
    const validFrom = new Date().toISOString();
    const validTo = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
    
    db.prepare(`
      INSERT INTO ssl_certificates (id, name, domain, cert_path, key_path, issuer, valid_from, valid_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, certName, domain, certPath, keyPath, 'Self-signed', validFrom, validTo);
    
    const cert = db.prepare('SELECT * FROM ssl_certificates WHERE id = ?').get(id);
    res.status(201).json(cert);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка генерации сертификата: ' + e.message });
  }
});

// Получить активный сертификат (для сервера)
function getActiveCertificate() {
  const cert = db.prepare('SELECT * FROM ssl_certificates WHERE is_active = 1 LIMIT 1').get();
  if (!cert) return null;
  
  try {
    const options = {
      cert: fs.readFileSync(cert.cert_path),
      key: fs.readFileSync(cert.key_path),
    };
    if (cert.ca_path && fs.existsSync(cert.ca_path)) {
      options.ca = fs.readFileSync(cert.ca_path);
    }
    return options;
  } catch (e) {
    console.error('Ошибка загрузки сертификата:', e.message);
    return null;
  }
}

// Вспомогательные функции
function cleanupFiles(files) {
  if (!files) return;
  Object.values(files).flat().forEach(file => {
    try { fs.unlinkSync(file.path); } catch (e) {}
  });
}

function parseCertInfo(certPem) {
  // Простой парсер для извлечения информации из PEM
  const info = {};
  
  try {
    const { execSync } = require('child_process');
    const tempFile = path.join(CERTS_DIR, 'temp_cert.pem');
    fs.writeFileSync(tempFile, certPem);
    
    const output = execSync(`openssl x509 -in "${tempFile}" -noout -subject -issuer -dates 2>/dev/null`, { encoding: 'utf8' });
    
    const subjectMatch = output.match(/subject=.*CN\s*=\s*([^\n\/]+)/);
    if (subjectMatch) info.subject = subjectMatch[1].trim();
    
    const issuerMatch = output.match(/issuer=.*CN\s*=\s*([^\n\/]+)/);
    if (issuerMatch) info.issuer = issuerMatch[1].trim();
    
    const notBeforeMatch = output.match(/notBefore=(.+)/);
    if (notBeforeMatch) info.notBefore = new Date(notBeforeMatch[1].trim()).toISOString();
    
    const notAfterMatch = output.match(/notAfter=(.+)/);
    if (notAfterMatch) info.notAfter = new Date(notAfterMatch[1].trim()).toISOString();
    
    fs.unlinkSync(tempFile);
  } catch (e) {
    // Игнорируем ошибки
  }
  
  return info;
}

module.exports = router;
module.exports.getActiveCertificate = getActiveCertificate;
