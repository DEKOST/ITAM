const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Получение полной истории оборудования
router.get('/:id/history', (req, res) => {
  const equipmentId = req.params.id;
  
  // Проверяем существование оборудования
  const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(equipmentId);
  if (!equipment) {
    return res.status(404).json({ error: 'Оборудование не найдено' });
  }
  
  const history = [];
  
  // 1. История создания (из самого оборудования)
  history.push({
    id: `created-${equipment.id}`,
    date: equipment.created_at,
    type: 'created',
    description: 'Оборудование добавлено в систему',
    details: {
      name: equipment.name,
      inventory_number: equipment.inventory_number
    }
  });
  
  // 2. История изменений статуса
  const statusLogs = db.prepare(`
    SELECT * FROM status_logs 
    WHERE equipment_id = ? 
    ORDER BY date DESC
  `).all(equipmentId);
  
  statusLogs.forEach(log => {
    history.push({
      id: log.id,
      date: log.date,
      type: 'status_change',
      description: 'Изменение статуса',
      details: {
        from_status: log.from_status,
        to_status: log.to_status,
        comment: log.comment
      }
    });
  });
  
  // 3. История перемещений
  const moveLogs = db.prepare(`
    SELECT * FROM move_logs 
    WHERE equipment_id = ? 
    ORDER BY date DESC
  `).all(equipmentId);
  
  moveLogs.forEach(log => {
    history.push({
      id: log.id,
      date: log.date,
      type: 'move',
      description: 'Перемещение оборудования',
      details: {
        from_user_id: log.from_user_id,
        to_user_id: log.to_user_id,
        from_room_id: log.from_room_id,
        to_room_id: log.to_room_id,
        comment: log.comment
      }
    });
  });
  
  // 4. История обслуживания
  const maintenanceLogs = db.prepare(`
    SELECT * FROM maintenance_logs 
    WHERE equipment_id = ? 
    ORDER BY date DESC
  `).all(equipmentId);
  
  maintenanceLogs.forEach(log => {
    history.push({
      id: log.id,
      date: log.date,
      type: 'maintenance',
      description: 'Техническое обслуживание',
      details: {
        type: log.type,
        description: log.description,
        cost: log.cost,
        performed_by: log.performed_by
      }
    });
  });
  
  // Сортируем все записи по дате (новые сначала)
  history.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json(history);
});

module.exports = router;
