const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  const items = db.prepare(`
    SELECT r.*, 
      (SELECT COUNT(*) FROM equipment WHERE room_id = r.id) as equipment_count
    FROM rooms r 
    ORDER BY r.building, r.floor, r.name
  `).all();
  res.json(items);
});

router.get('/:id', (req, res) => {
  const item = db.prepare(`
    SELECT r.*, 
      (SELECT COUNT(*) FROM equipment WHERE room_id = r.id) as equipment_count
    FROM rooms r 
    WHERE r.id = ?
  `).get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Помещение не найдено' });
  
  // Получаем оборудование в помещении
  const equipment = db.prepare(`
    SELECT e.*, et.name as type_name, u.first_name as user_first_name, u.last_name as user_last_name
    FROM equipment e
    LEFT JOIN equipment_types et ON e.type_id = et.id
    LEFT JOIN users u ON e.user_id = u.id
    WHERE e.room_id = ?
  `).all(req.params.id);
  
  res.json({ ...item, equipment });
});

router.post('/', (req, res) => {
  const { name, building, floor, description } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO rooms (id, name, building, floor, description) VALUES (?, ?, ?, ?, ?)').run(id, name, building || '', floor || 0, description || '');
  const item = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  res.status(201).json(item);
});

router.put('/:id', (req, res) => {
  const { name, building, floor, description } = req.body;
  const existing = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Помещение не найдено' });
  
  db.prepare('UPDATE rooms SET name = ?, building = ?, floor = ?, description = ? WHERE id = ?').run(
    name || existing.name,
    building !== undefined ? building : existing.building,
    floor !== undefined ? floor : existing.floor,
    description !== undefined ? description : existing.description,
    req.params.id
  );
  const item = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  res.json(item);
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Помещение не найдено' });
  
  // Снимаем привязку с оборудования
  db.prepare('UPDATE equipment SET room_id = NULL WHERE room_id = ?').run(req.params.id);
  db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
