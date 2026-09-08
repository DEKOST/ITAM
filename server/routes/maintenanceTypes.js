const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

// Получить все типы обслуживания
router.get('/', (req, res) => {
  try {
    const { category_id } = req.query;
    let query = `
      SELECT mt.*, c.name as category_name
      FROM maintenance_types mt
      LEFT JOIN categories c ON mt.category_id = c.id
      WHERE mt.is_active = 1
    `;
    const params = [];
    
    if (category_id) {
      query += ' AND mt.category_id = ?';
      params.push(category_id);
    }
    
    query += ' ORDER BY mt.name';
    
    const types = db.prepare(query).all(...params);
    res.json(types);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить тип обслуживания по ID
router.get('/:id', (req, res) => {
  try {
    const type = db.prepare('SELECT * FROM maintenance_types WHERE id = ?').get(req.params.id);
    if (!type) {
      return res.status(404).json({ error: 'Тип обслуживания не найден' });
    }
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать тип обслуживания
router.post('/', (req, res) => {
  try {
    const { name, description, category_id, interval_days, interval_months, interval_years } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO maintenance_types (id, name, description, category_id, interval_days, interval_months, interval_years)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, description || '', category_id || null, interval_days || 0, interval_months || 0, interval_years || 0);

    const type = db.prepare(`
      SELECT mt.*, c.name as category_name
      FROM maintenance_types mt
      LEFT JOIN categories c ON mt.category_id = c.id
      WHERE mt.id = ?
    `).get(id);
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить тип обслуживания
router.put('/:id', (req, res) => {
  try {
    const { name, description, category_id, interval_days, interval_months, interval_years } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    db.prepare(`
      UPDATE maintenance_types 
      SET name = ?, description = ?, category_id = ?, interval_days = ?, interval_months = ?, interval_years = ?
      WHERE id = ?
    `).run(name, description || '', category_id || null, interval_days || 0, interval_months || 0, interval_years || 0, req.params.id);

    const type = db.prepare(`
      SELECT mt.*, c.name as category_name
      FROM maintenance_types mt
      LEFT JOIN categories c ON mt.category_id = c.id
      WHERE mt.id = ?
    `).get(req.params.id);
    res.json(type);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить тип обслуживания (деактивировать)
router.delete('/:id', (req, res) => {
  try {
    db.prepare('UPDATE maintenance_types SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
