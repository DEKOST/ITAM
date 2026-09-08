const express = require('express');
const router = express.Router();
const { db } = require('../db');

// Получение полной истории оборудования
router.get('/equipment/:id/history', (req, res) => {
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
  
  // 5. История изменений названия
  const nameLogs = db.prepare(`
    SELECT * FROM name_logs 
    WHERE equipment_id = ? 
    ORDER BY date DESC
  `).all(equipmentId);
  
  nameLogs.forEach(log => {
    history.push({
      id: log.id,
      date: log.date,
      type: 'name_change',
      description: 'Изменение названия',
      details: {
        from_name: log.from_name,
        to_name: log.to_name,
        comment: log.comment
      }
    });
  });

  // 6. История изменений полей (редактирование)
  const fieldChanges = db.prepare(`
    SELECT efc.*, au.username as changed_by_username, au.full_name as changed_by_name
    FROM equipment_field_changes efc
    LEFT JOIN auth_users au ON efc.changed_by = au.id
    WHERE efc.equipment_id = ? 
    ORDER BY efc.changed_at DESC
  `).all(equipmentId);

  // Группируем изменения по времени (в пределах 1 минуты считаем одним редактированием)
  const groupedChanges = {};
  fieldChanges.forEach(change => {
    const timestamp = new Date(change.changed_at).getTime();
    const groupKey = Math.floor(timestamp / 60000); // Группируем по минутам
    
    if (!groupedChanges[groupKey]) {
      groupedChanges[groupKey] = {
        id: `edit-${groupKey}`,
        date: change.changed_at,
        type: 'edit',
        description: 'Редактирование оборудования',
        changed_by: change.changed_by_username || 'Неизвестно',
        changed_by_name: change.changed_by_name || '',
        changes: []
      };
    }
    
    groupedChanges[groupKey].changes.push({
      field: change.field_name,
      old_value: change.old_value,
      new_value: change.new_value
    });
  });

  // Добавляем сгруппированные изменения в историю
  Object.values(groupedChanges).forEach(group => {
    history.push({
      id: group.id,
      date: group.date,
      type: 'edit',
      description: 'Редактирование оборудования',
      details: {
        changed_by: group.changed_by,
        changed_by_name: group.changed_by_name,
        changes: group.changes
      }
    });
  });
  
  // Сортируем все записи по дате (новые сначала)
  history.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json(history);
});

module.exports = router;
