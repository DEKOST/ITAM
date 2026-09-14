/**
 * Получает реальный IP-адрес клиента
 * Учитывает заголовки от proxy (Apache/Nginx)
 */
function getClientIP(req) {
  // X-Forwarded-For может содержать цепочку IP: "client, proxy1, proxy2"
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Берём первый IP из цепочки (реальный клиент)
    const ip = forwarded.split(',')[0].trim();
    return ip;
  }
  
  // X-Real-IP (альтернативный заголовок)
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }
  
  // Fallback на req.ip (с trust proxy)
  return req.ip || req.connection.remoteAddress || 'unknown';
}

module.exports = { getClientIP };
