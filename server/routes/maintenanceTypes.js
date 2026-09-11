const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

// Получить все типы обслуживания
router.get('/', (req, res) => {
  try {
    const { category_id } = req.query;
    
    if (category_id) {
      // Получить типы для конкретной категории (или общие)
      const query = `
        SELECT DISTINCT mt.*
        FROM maintenance_types mt
        LEFT JOIN maintenance_type_categories mtc ON mt.id = mtc.maintenance_type_id
        WHERE mt.is_active = 1 
        AND (mtc.category_id = ? OR NOT EXISTS (
          SELECT 1 FROM maintenance_type_categories WHERE maintenance_type_id = mt.id
        ))
        ORDER BY mt.name
      `;
      const types = db.prepare(query).all(category_id);
      res.json(types);
    } else {
      // Получить все типы с их категориями
      const query = `
        SELECT mt.*, 
          GROUP_CONCAT(c.name, ', ') as category_names,
          GROUP_CONCAT(c.id, ',') as category_ids
        FROM maintenance_types mt
        LEFT JOIN maintenance_type_categories mtc ON mt.id = mtc.maintenance_type_id
        LEFT JOIN categories c ON mtc.category_id = c.id
        WHERE mt.is_active = 1
        GROUP BY mt.id
        ORDER BY mt.name
      `;
      const types = db.prepare(query).all();
      res.json(types);
    }
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
    const { name, description, category_ids, interval_days, interval_months, interval_years } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO maintenance_types (id, name, description, interval_days, interval_months, interval_years)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, description || '', interval_days || 0, interval_months || 0, interval_years || 0);

    // Добавляем связи с категориями
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      const insertLink = db.prepare('INSERT INTO maintenance_type_categories (maintenance_type_id, category_id) VALUES (?, ?)');
      for (const categoryId of category_ids) {
        insertLink.run(id, categoryId);
      }
    }

    const type = db.prepare(`
      SELECT mt.*, 
        GROUP_CONCAT(c.name, ', ') as category_names,
        GROUP_CONCAT(c.id, ',') as category_ids
      FROM maintenance_types mt
      LEFT JOIN maintenance_type_categories mtc ON mt.id = mtc.maintenance_type_id
      LEFT JOIN categories c ON mtc.category_id = c.id
      WHERE mt.id = ?
      GROUP BY mt.id
    `).get(id);
    res.status(201).json(type);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Обновить тип обслуживания
router.put('/:id', (req, res) => {
  try {
    const { name, description, category_ids, interval_days, interval_months, interval_years } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Название обязательно' });
    }

    db.prepare(`
      UPDATE maintenance_types 
      SET name = ?, description = ?, interval_days = ?, interval_months = ?, interval_years = ?
      WHERE id = ?
    `).run(name, description || '', interval_days || 0, interval_months || 0, interval_years || 0, req.params.id);

    // Обновляем связи с категориями
    db.prepare('DELETE FROM maintenance_type_categories WHERE maintenance_type_id = ?').run(req.params.id);
    
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      const insertLink = db.prepare('INSERT INTO maintenance_type_categories (maintenance_type_id, category_id) VALUES (?, ?)');
      for (const categoryId of category_ids) {
        insertLink.run(req.params.id, categoryId);
      }
    }

    const type = db.prepare(`
      SELECT mt.*, 
        GROUP_CONCAT(c.name, ', ') as category_names,
        GROUP_CONCAT(c.id, ',') as category_ids
      FROM maintenance_types mt
      LEFT JOIN maintenance_type_categories mtc ON mt.id = mtc.maintenance_type_id
      LEFT JOIN categories c ON mtc.category_id = c.id
      WHERE mt.id = ?
      GROUP BY mt.id
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
