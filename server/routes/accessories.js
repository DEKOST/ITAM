const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

// Получить все типы аксессуаров
router.get('/types', (req, res) => {
  try {
    const types = db.prepare('SELECT * FROM accessory_types WHERE is_active = 1 ORDER BY name').all();
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать тип аксессуара
router.post('/types', (req, res) => {
  try {
    const { name, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    const id = uuidv4();
    db.prepare('INSERT INTO accessory_types (id, name, icon) VALUES (?, ?, ?)')
      .run(id, name, icon || '🔌');

    const type = db.prepare('SELECT * FROM accessory_types WHERE id = ?').get(id);
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить тип аксессуара
router.put('/types/:id', (req, res) => {
  try {
    const { name, icon } = req.body;
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM accessory_types WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Тип аксессуара не найден' });
    }

    db.prepare('UPDATE accessory_types SET name = ?, icon = ? WHERE id = ?')
      .run(name || existing.name, icon || existing.icon, id);

    const type = db.prepare('SELECT * FROM accessory_types WHERE id = ?').get(id);
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить тип аксессуара (деактивировать)
router.delete('/types/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM accessory_types WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Тип аксессуара не найден' });
    }

    db.prepare('UPDATE accessory_types SET is_active = 0 WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить аксессуары для оборудования
router.get('/:equipmentId/accessories', (req, res) => {
  try {
    const { equipmentId } = req.params;

    const accessories = db.prepare(`
      SELECT 
        ea.id,
        ea.quantity,
        ea.notes,
        at.id as accessory_type_id,
        at.name as accessory_name,
        at.icon as accessory_icon
      FROM equipment_accessories ea
      JOIN accessory_types at ON ea.accessory_type_id = at.id
      WHERE ea.equipment_id = ?
      ORDER BY at.name
    `).all(equipmentId);

    res.json(accessories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Добавить аксессуар к оборудованию
router.post('/:equipmentId/accessories', (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { accessory_type_id, quantity, notes } = req.body;

    if (!accessory_type_id) {
      return res.status(400).json({ error: 'Тип аксессуара обязателен' });
    }

    // Проверяем существование оборудования
    const equipment = db.prepare('SELECT id FROM equipment WHERE id = ?').get(equipmentId);
    if (!equipment) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }

    // Проверяем существование типа аксессуара
    const accessoryType = db.prepare('SELECT id FROM accessory_types WHERE id = ? AND is_active = 1').get(accessory_type_id);
    if (!accessoryType) {
      return res.status(404).json({ error: 'Тип аксессуара не найден' });
    }

    // Проверяем, не существует ли уже такой аксессуар
    const existing = db.prepare('SELECT id FROM equipment_accessories WHERE equipment_id = ? AND accessory_type_id = ?')
      .get(equipmentId, accessory_type_id);

    if (existing) {
      // Обновляем количество
      db.prepare('UPDATE equipment_accessories SET quantity = ?, notes = ? WHERE id = ?')
        .run(quantity || 1, notes || '', existing.id);
      
      const accessory = db.prepare(`
        SELECT 
          ea.id,
          ea.quantity,
          ea.notes,
          at.id as accessory_type_id,
          at.name as accessory_name,
          at.icon as accessory_icon
        FROM equipment_accessories ea
        JOIN accessory_types at ON ea.accessory_type_id = at.id
        WHERE ea.id = ?
      `).get(existing.id);
      
      return res.json(accessory);
    }

    // Создаём новую запись
    const id = uuidv4();
    db.prepare('INSERT INTO equipment_accessories (id, equipment_id, accessory_type_id, quantity, notes) VALUES (?, ?, ?, ?, ?)')
      .run(id, equipmentId, accessory_type_id, quantity || 1, notes || '');

    const accessory = db.prepare(`
      SELECT 
        ea.id,
        ea.quantity,
        ea.notes,
        at.id as accessory_type_id,
        at.name as accessory_name,
        at.icon as accessory_icon
      FROM equipment_accessories ea
      JOIN accessory_types at ON ea.accessory_type_id = at.id
      WHERE ea.id = ?
    `).get(id);

    res.status(201).json(accessory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить аксессуар из оборудования
router.delete('/:equipmentId/accessories/:id', (req, res) => {
  try {
    const { equipmentId, id } = req.params;

    const existing = db.prepare('SELECT * FROM equipment_accessories WHERE id = ? AND equipment_id = ?').get(id, equipmentId);
    if (!existing) {
      return res.status(404).json({ error: 'Аксессуар не найден' });
    }

    db.prepare('DELETE FROM equipment_accessories WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
