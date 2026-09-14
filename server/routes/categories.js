const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

// === КАТЕГОРИИ ===

router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(items);
});

router.get('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Категория не найдена' });
  res.json(item);
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)').run(id, name, description || '');
  const item = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.status(201).json(item);
});

router.put('/:id', (req, res) => {
  const { name, description } = req.body;
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Категория не найдена' });
  
  db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(name || existing.name, description !== undefined ? description : existing.description, req.params.id);
  const item = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  res.json(item);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Категория не найдена' });
  
  // Проверяем, есть ли типы в этой категории
  const typesCount = db.prepare('SELECT COUNT(*) as count FROM equipment_types WHERE category_id = ?').get(req.params.id);
  if (typesCount.count > 0) {
    return res.status(400).json({ error: 'Невозможно удалить категорию с типами оборудования' });
  }
  
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
