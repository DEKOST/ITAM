const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { writeLimiter } = require('../middleware/rateLimit');
const { equipmentTypeSchema, validate } = require('../middleware/validation');

// Получить все типы с категорией
router.get('/', (req, res) => {
  const items = db.prepare(`
    SELECT et.*, c.name as category_name 
    FROM equipment_types et 
    LEFT JOIN categories c ON et.category_id = c.id 
    ORDER BY et.name
  `).all();
  res.json(items);
});

router.get('/:id', (req, res) => {
  const item = db.prepare(`
    SELECT et.*, c.name as category_name 
    FROM equipment_types et 
    LEFT JOIN categories c ON et.category_id = c.id 
    WHERE et.id = ?
  `).get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Тип не найден' });
  res.json(item);
});

router.post('/', writeLimiter, validate(equipmentTypeSchema), (req, res) => {
  const { name, category_id } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO equipment_types (id, name, category_id) VALUES (?, ?, ?)').run(id, name, category_id);
  const item = db.prepare(`
    SELECT et.*, c.name as category_name 
    FROM equipment_types et 
    LEFT JOIN categories c ON et.category_id = c.id 
    WHERE et.id = ?
  `).get(id);
  res.status(201).json(item);
});

router.put('/:id', writeLimiter, validate(equipmentTypeSchema), (req, res) => {
  const { name, category_id } = req.body;
  const existing = db.prepare('SELECT * FROM equipment_types WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Тип не найден' });
  
  db.prepare('UPDATE equipment_types SET name = ?, category_id = ? WHERE id = ?').run(name || existing.name, category_id || existing.category_id, req.params.id);
  const item = db.prepare('SELECT * FROM equipment_types WHERE id = ?').get(req.params.id);
  res.json(item);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM equipment_types WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Тип не найден' });
  
  // Проверяем, есть ли оборудование с этим типом
  const eqCount = db.prepare('SELECT COUNT(*) as count FROM equipment WHERE type_id = ?').get(req.params.id);
  if (eqCount.count > 0) {
    return res.status(400).json({ error: 'Невозможно удалить тип с привязанным оборудованием' });
  }
  
  db.prepare('DELETE FROM equipment_types WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
