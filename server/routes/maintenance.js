const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

// Получить историю обслуживания оборудования
router.get('/equipment/:id/maintenance', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT 
        ml.*,
        mt.name as maintenance_type_name,
        mt.description as maintenance_type_description,
        au.full_name as changed_by_name,
        au.username as changed_by_username
      FROM maintenance_logs ml
      LEFT JOIN maintenance_types mt ON ml.maintenance_type_id = mt.id
      LEFT JOIN auth_users au ON ml.changed_by = au.id
      WHERE ml.equipment_id = ?
      ORDER BY ml.date DESC
    `).all(req.params.id);
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить последнюю запись обслуживания по типу
router.get('/equipment/:id/maintenance/last/:typeId', (req, res) => {
  try {
    const log = db.prepare(`
      SELECT 
        ml.*,
        mt.name as maintenance_type_name,
        mt.description as maintenance_type_description
      FROM maintenance_logs ml
      LEFT JOIN maintenance_types mt ON ml.maintenance_type_id = mt.id
      WHERE ml.equipment_id = ? AND ml.maintenance_type_id = ?
      ORDER BY ml.date DESC
      LIMIT 1
    `).get(req.params.id, req.params.typeId);
    
    if (!log) {
      return res.status(404).json({ error: 'Обслуживание не найдено' });
    }
    
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Добавить новую запись обслуживания
router.post('/equipment/:id/maintenance', (req, res) => {
  try {
    const { maintenance_type_id, date, description, notes } = req.body;
    
    if (!maintenance_type_id || !date) {
      return res.status(400).json({ error: 'Тип обслуживания и дата обязательны' });
    }

    // Получаем тип обслуживания для расчета следующей даты
    const maintenanceType = db.prepare('SELECT * FROM maintenance_types WHERE id = ?').get(maintenance_type_id);
    if (!maintenanceType) {
      return res.status(400).json({ error: 'Тип обслуживания не найден' });
    }

    // Рассчитываем следующую дату обслуживания
    const maintenanceDate = new Date(date);
    const nextDate = new Date(maintenanceDate);
    
    if (maintenanceType.interval_days > 0) {
      nextDate.setDate(nextDate.getDate() + maintenanceType.interval_days);
    }
    if (maintenanceType.interval_months > 0) {
      nextDate.setMonth(nextDate.getMonth() + maintenanceType.interval_months);
    }
    if (maintenanceType.interval_years > 0) {
      nextDate.setFullYear(nextDate.getFullYear() + maintenanceType.interval_years);
    }

    const nextMaintenanceDate = nextDate.toISOString().split('T')[0];

    // Получаем ID пользователя из токена
    const changedBy = req.user ? req.user.id : null;

    const id = uuidv4();
    db.prepare(`
      INSERT INTO maintenance_logs (id, equipment_id, maintenance_type_id, date, description, next_maintenance_date, notes, changed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, maintenance_type_id, date, description || '', nextMaintenanceDate, notes || '', changedBy);

    // Обновляем next_maintenance_date в таблице equipment
    db.prepare('UPDATE equipment SET next_maintenance_date = ? WHERE id = ?').run(nextMaintenanceDate, req.params.id);

    const log = db.prepare(`
      SELECT 
        ml.*,
        mt.name as maintenance_type_name,
        mt.description as maintenance_type_description,
        au.full_name as changed_by_name,
        au.username as changed_by_username
      FROM maintenance_logs ml
      LEFT JOIN maintenance_types mt ON ml.maintenance_type_id = mt.id
      LEFT JOIN auth_users au ON ml.changed_by = au.id
      WHERE ml.id = ?
    `).get(id);

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить информацию о следующем обслуживании для оборудования
router.get('/equipment/:id/next-maintenance', (req, res) => {
  try {
    // Получаем категорию оборудования
    const equipment = db.prepare(`
      SELECT e.*, et.category_id 
      FROM equipment e
      LEFT JOIN equipment_types et ON e.type_id = et.id
      WHERE e.id = ?
    `).get(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }
    
    // Получаем типы обслуживания для этой категории (или общие без категории)
    const maintenanceTypes = db.prepare(`
      SELECT DISTINCT mt.*
      FROM maintenance_types mt
      LEFT JOIN maintenance_type_categories mtc ON mt.id = mtc.maintenance_type_id
      WHERE mt.is_active = 1 
      AND (mtc.category_id = ? OR NOT EXISTS (
        SELECT 1 FROM maintenance_type_categories WHERE maintenance_type_id = mt.id
      ))
      ORDER BY mt.name
    `).all(equipment.category_id);
    
    const nextMaintenances = maintenanceTypes.map(type => {
      // Получаем последнее обслуживание этого типа
      const lastLog = db.prepare(`
        SELECT * FROM maintenance_logs 
        WHERE equipment_id = ? AND maintenance_type_id = ?
        ORDER BY date DESC
        LIMIT 1
      `).get(req.params.id, type.id);

      let nextDate = null;
      let daysUntil = null;
      let isOverdue = false;

      if (lastLog && lastLog.next_maintenance_date) {
        nextDate = lastLog.next_maintenance_date;
        const today = new Date();
        const nextDateObj = new Date(nextDate);
        daysUntil = Math.ceil((nextDateObj - today) / (1000 * 60 * 60 * 24));
        isOverdue = daysUntil < 0;
      } else {
        // Если обслуживания никогда не было, рассчитываем от даты создания оборудования
        if (equipment.created_at) {
          const createdDate = new Date(equipment.created_at);
          const nextDateObj = new Date(createdDate);
          
          if (type.interval_days > 0) {
            nextDateObj.setDate(nextDateObj.getDate() + type.interval_days);
          }
          if (type.interval_months > 0) {
            nextDateObj.setMonth(nextDateObj.getMonth() + type.interval_months);
          }
          if (type.interval_years > 0) {
            nextDateObj.setFullYear(nextDateObj.getFullYear() + type.interval_years);
          }
          
          nextDate = nextDateObj.toISOString().split('T')[0];
          const today = new Date();
          daysUntil = Math.ceil((nextDateObj - today) / (1000 * 60 * 60 * 24));
          isOverdue = daysUntil < 0;
        }
      }

      return {
        maintenance_type_id: type.id,
        maintenance_type_name: type.name,
        maintenance_type_description: type.description,
        interval_days: type.interval_days,
        interval_months: type.interval_months,
        interval_years: type.interval_years,
        last_maintenance_date: lastLog ? lastLog.date : null,
        last_maintenance_description: lastLog ? lastLog.description : null,
        next_maintenance_date: nextDate,
        days_until: daysUntil,
        is_overdue: isOverdue
      };
    });

    res.json(nextMaintenances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
