const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { writeLimiter } = require('../middleware/rateLimit');
const { subdivisionSchema, validate } = require('../middleware/validation');

router.get('/', (req, res) => {
  const items = db.prepare(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM users WHERE subdivision_id = s.id) as user_count
    FROM subdivisions s 
    ORDER BY s.name
  `).all();
  res.json(items);
});

router.get('/:id', (req, res) => {
  const item = db.prepare(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM users WHERE subdivision_id = s.id) as user_count
    FROM subdivisions s 
    WHERE s.id = ?
  `).get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Подразделение не найдено' });
  res.json(item);
});

router.post('/', writeLimiter, validate(subdivisionSchema), (req, res) => {
  const { name, description, parent_id } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO subdivisions (id, name, description, parent_id) VALUES (?, ?, ?, ?)').run(id, name, description || '', parent_id || null);
  const item = db.prepare('SELECT * FROM subdivisions WHERE id = ?').get(id);
  res.status(201).json(item);
});

router.put('/:id', writeLimiter, validate(subdivisionSchema), (req, res) => {
  const { name, description, parent_id } = req.body;
  const existing = db.prepare('SELECT * FROM subdivisions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Подразделение не найдено' });
  
  // Проверка циклической ссылки
  if (parent_id === req.params.id) {
    return res.status(400).json({ error: 'Подразделение не может быть родителем само для себя' });
  }
  
  db.prepare('UPDATE subdivisions SET name = ?, description = ?, parent_id = ? WHERE id = ?').run(
    name || existing.name,
    description !== undefined ? description : existing.description,
    parent_id !== undefined ? parent_id : existing.parent_id,
    req.params.id
  );
  const item = db.prepare('SELECT * FROM subdivisions WHERE id = ?').get(req.params.id);
  res.json(item);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM subdivisions WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Подразделение не найдено' });
  
  // Проверяем, есть ли дочерние подразделения
  const childrenCount = db.prepare('SELECT COUNT(*) as count FROM subdivisions WHERE parent_id = ?').get(req.params.id);
  if (childrenCount.count > 0) {
    return res.status(400).json({ error: 'Невозможно удалить подразделение с дочерними подразделениями' });
  }
  
  // Снимаем привязку с сотрудников
  db.prepare('UPDATE users SET subdivision_id = NULL WHERE subdivision_id = ?').run(req.params.id);
  db.prepare('DELETE FROM subdivisions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
