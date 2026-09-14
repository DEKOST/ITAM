const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

// Получить все доступные типы связей (должен быть ДО /:id/relations)
router.get('/relation-types', (req, res) => {
  const types = [
    { value: 'component', label: 'Компонент', description: 'Внутренний компонент (HDD, RAM, видеокарта)' },
    { value: 'monitor', label: 'Монитор', description: 'Подключённый монитор' },
    { value: 'ups', label: 'ИБП', description: 'Источник бесперебойного питания' },
    { value: 'dock', label: 'Док-станция', description: 'Док-станция или хаб' },
    { value: 'printer', label: 'Принтер/МФУ', description: 'Подключённый принтер или МФУ' },
    { value: 'accessory', label: 'Аксессуар', description: 'Дополнительный аксессуар (веб-камера, колонки)' },
    { value: 'backup', label: 'Резервное', description: 'Резервное оборудование' },
    { value: 'related', label: 'Связанное', description: 'Просто связанное оборудование' }
  ];

  res.json(types);
});

// Получить оборудование для выбора связей (с поиском) (должен быть ДО /:id/relations)
router.get('/available-equipment', (req, res) => {
  try {
    const { search, exclude_id } = req.query;

    let query = `
      SELECT 
        e.id,
        e.name,
        e.serial_number,
        e.inventory_number,
        et.name as type_name,
        u.first_name || ' ' || u.last_name as user_name
      FROM equipment e
      LEFT JOIN equipment_types et ON e.type_id = et.id
      LEFT JOIN users u ON e.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    // Исключаем текущее оборудование
    if (exclude_id) {
      query += ' AND e.id != ?';
      params.push(exclude_id);
    }

    // Поиск по названию или сотруднику
    if (search) {
      query += ' AND (e.name LIKE ? OR e.inventory_number LIKE ? OR (u.first_name || \' \' || u.last_name) LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    query += ' ORDER BY e.name LIMIT 50';

    const equipment = db.prepare(query).all(...params);
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Получить связи для оборудования (родительские и дочерние)
router.get('/:id/relations', (req, res) => {
  try {
    const equipmentId = req.params.id;

    // Автоматически удаляем "битые" связи (где связанное оборудование было удалено)
    const brokenRelations = db.prepare(`
      SELECT er.id 
      FROM equipment_relations er
      LEFT JOIN equipment e1 ON er.child_equipment_id = e1.id
      LEFT JOIN equipment e2 ON er.parent_equipment_id = e2.id
      WHERE (er.parent_equipment_id = ? OR er.child_equipment_id = ?)
        AND (e1.id IS NULL OR e2.id IS NULL)
    `).all(equipmentId, equipmentId);

    if (brokenRelations.length > 0) {
      const ids = brokenRelations.map(r => r.id);
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(`DELETE FROM equipment_relations WHERE id IN (${placeholders})`).run(...ids);
      console.log(`Автоматически удалено ${brokenRelations.length} битых связей для оборудования ${equipmentId}`);
    }

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
      LEFT JOIN equipment e ON er.child_equipment_id = e.id
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
      LEFT JOIN equipment e ON er.parent_equipment_id = e.id
      LEFT JOIN equipment_types et ON e.type_id = et.id
      WHERE er.child_equipment_id = ?
      ORDER BY er.relation_type, e.name
    `).all(equipmentId);

    res.json({ 
      children: children, 
      parents: parents
    });
  } catch (error) {
    console.error('Ошибка загрузки связей:', error);
    res.status(500).json({ error: error.message });
  }
});

// Создать связь между оборудованием
router.post('/', (req, res) => {
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

    // Проверяем, не существует ли уже такая связь (в любом направлении)
    const existingRelation = db.prepare(`
      SELECT id, parent_equipment_id, child_equipment_id FROM equipment_relations 
      WHERE (parent_equipment_id = ? AND child_equipment_id = ?)
         OR (parent_equipment_id = ? AND child_equipment_id = ?)
    `).get(parent_id, child_id, child_id, parent_id);

    if (existingRelation) {
      return res.status(400).json({ 
        error: 'Связь между этим оборудованием уже существует',
        existing: {
          id: existingRelation.id,
          parent_id: existingRelation.parent_equipment_id,
          child_id: existingRelation.child_equipment_id
        }
      });
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

// Удалить связь по ID связи
router.delete('/:id', (req, res) => {
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

// Удалить связь между двумя устройствами
router.delete('/between/:equipment1/:equipment2', (req, res) => {
  try {
    const equipment1 = req.params.equipment1;
    const equipment2 = req.params.equipment2;

    const relation = db.prepare(`
      SELECT id FROM equipment_relations 
      WHERE (parent_equipment_id = ? AND child_equipment_id = ?)
         OR (parent_equipment_id = ? AND child_equipment_id = ?)
    `).get(equipment1, equipment2, equipment2, equipment1);

    if (!relation) {
      return res.status(404).json({ error: 'Связь не найдена' });
    }

    db.prepare('DELETE FROM equipment_relations WHERE id = ?').run(relation.id);

    res.json({ success: true, message: 'Связь удалена' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Удалить все "битые" связи для оборудования
router.delete('/:id/broken', (req, res) => {
  try {
    const equipmentId = req.params.id;

    // Находим все связи, где связанное оборудование было удалено
    const brokenRelations = db.prepare(`
      SELECT er.id 
      FROM equipment_relations er
      LEFT JOIN equipment e1 ON er.child_equipment_id = e1.id
      LEFT JOIN equipment e2 ON er.parent_equipment_id = e2.id
      WHERE (er.parent_equipment_id = ? OR er.child_equipment_id = ?)
        AND (e1.id IS NULL OR e2.id IS NULL)
    `).all(equipmentId, equipmentId);

    if (brokenRelations.length === 0) {
      return res.json({ success: true, message: 'Битых связей не найдено', deleted: 0 });
    }

    // Удаляем все битые связи
    const ids = brokenRelations.map(r => r.id);
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM equipment_relations WHERE id IN (${placeholders})`).run(...ids);

    console.log(`Удалено ${brokenRelations.length} битых связей для оборудования ${equipmentId}`);

    res.json({ 
      success: true, 
      message: `Удалено ${brokenRelations.length} битых связей`,
      deleted: brokenRelations.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Функция для очистки всех "битых" связей в базе данных
function cleanupAllBrokenRelations() {
  try {
    const brokenRelations = db.prepare(`
      SELECT er.id 
      FROM equipment_relations er
      LEFT JOIN equipment e1 ON er.child_equipment_id = e1.id
      LEFT JOIN equipment e2 ON er.parent_equipment_id = e2.id
      WHERE e1.id IS NULL OR e2.id IS NULL
    `).all();

    if (brokenRelations.length === 0) {
      console.log('Битых связей не найдено');
      return 0;
    }

    const ids = brokenRelations.map(r => r.id);
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM equipment_relations WHERE id IN (${placeholders})`).run(...ids);

    console.log(`Автоматически удалено ${brokenRelations.length} битых связей из базы данных`);
    return brokenRelations.length;
  } catch (error) {
    console.error('Ошибка очистки битых связей:', error);
    return 0;
  }
}

module.exports = router;
module.exports.cleanupAllBrokenRelations = cleanupAllBrokenRelations;
