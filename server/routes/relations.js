const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

// Получить связи для оборудования (родительские и дочерние)
router.get('/:id/relations', (req, res) => {
  try {
    const equipmentId = req.params.id;

    // Получаем дочерние элементы (что привязано к этому оборудованию)
    const children = db.prepare(`
      SELECT 
        er.id as relation_id,
        er.relation_type,
        e.id,
        e.name,
        e.serial_number,
        e.inventory_number,
        et.name as type_name
      FROM equipment_relations er
      JOIN equipment e ON er.child_equipment_id = e.id
      LEFT JOIN equipment_types et ON e.type_id = et.id
      WHERE er.parent_equipment_id = ?
      ORDER BY er.relation_type, e.name
    `).all(equipmentId);

    // Получаем родительские элементы (к чему привязано это оборудование)
    const parents = db.prepare(`
      SELECT 
        er.id as relation_id,
        er.relation_type,
        e.id,
        e.name,
        e.serial_number,
        e.inventory_number,
        et.name as type_name
      FROM equipment_relations er
      JOIN equipment e ON er.parent_equipment_id = e.id
      LEFT JOIN equipment_types et ON e.type_id = et.id
      WHERE er.child_equipment_id = ?
      ORDER BY er.relation_type, e.name
    `).all(equipmentId);

    res.json({ children, parents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Создать связь между оборудованием
router.post('/relations', (req, res) => {
  try {
    const { parent_id, child_id, relation_type } = req.body;

    if (!parent_id || !child_id) {
      return res.status(400).json({ error: 'Необходимо указать parent_id и child_id' });
    }

    if (parent_id === child_id) {
      return res.status(400).json({ error: 'Оборудование не может быть связано само с собой' });
    }

    // Проверяем существование оборудования
    const parentExists = db.prepare('SELECT id FROM equipment WHERE id = ?').get(parent_id);
    const childExists = db.prepare('SELECT id FROM equipment WHERE id = ?').get(child_id);

    if (!parentExists || !childExists) {
      return res.status(404).json({ error: 'Оборудование не найдено' });
    }

    // Проверяем, не существует ли уже такая связь
    const existingRelation = db.prepare(`
      SELECT id FROM equipment_relations 
      WHERE parent_equipment_id = ? AND child_equipment_id = ?
    `).get(parent_id, child_id);

    if (existingRelation) {
      return res.status(400).json({ error: 'Такая связь уже существует' });
    }

    const id = uuidv4();
    const type = relation_type || 'component';

    db.prepare(`
      INSERT INTO equipment_relations (id, parent_equipment_id, child_equipment_id, relation_type)
      VALUES (?, ?, ?, ?)
    `).run(id, parent_id, child_id, type);

    const relation = db.prepare(`
      SELECT 
        er.*,
        p.name as parent_name,
        c.name as child_name
      FROM equipment_relations er
      JOIN equipment p ON er.parent_equipment_id = p.id
      JOIN equipment c ON er.child_equipment_id = c.id
      WHERE er.id = ?
    `).get(id);

    res.status(201).json(relation);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Такая связь уже существует' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Удалить связь
router.delete('/relations/:id', (req, res) => {
  try {
    const relationId = req.params.id;

    const relation = db.prepare('SELECT * FROM equipment_relations WHERE id = ?').get(relationId);
    if (!relation) {
      return res.status(404).json({ error: 'Связь не найдена' });
    }

    db.prepare('DELETE FROM equipment_relations WHERE id = ?').run(relationId);

    res.json({ success: true, message: 'Связь удалена' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить все доступные типы связей
router.get('/relation-types', (req, res) => {
  const types = [
    { value: 'component', label: 'Компонент', description: 'Дочернее оборудование является компонентом родительского' },
    { value: 'peripheral', label: 'Периферия', description: 'Периферийное устройство (монитор, клавиатура, мышь)' },
    { value: 'accessory', label: 'Аксессуар', description: 'Дополнительный аксессуар' },
    { value: 'backup', label: 'Резервное', description: 'Резервное оборудование' },
    { value: 'related', label: 'Связанное', description: 'Просто связанное оборудование' }
  ];

  res.json(types);
});

module.exports = router;
