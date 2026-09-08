const Joi = require('joi');

// Валидация для авторизации
const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(100).required()
});

// Валидация для создания пользователя
const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('admin', 'user').required(),
  email: Joi.string().email().optional(),
  fullName: Joi.string().max(100).optional()
});

// Валидация для обновления пользователя
const updateUserSchema = Joi.object({
  password: Joi.string().min(6).max(100).optional(),
  role: Joi.string().valid('admin', 'user').optional(),
  email: Joi.string().email().optional(),
  fullName: Joi.string().max(100).optional(),
  isActive: Joi.boolean().optional()
});

// Валидация для оборудования
const equipmentSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  serialNumber: Joi.string().max(100).optional().allow(''),
  inventoryNumber: Joi.string().max(100).optional().allow(''),
  typeId: Joi.string().uuid().required(),
  status: Joi.string().valid('in_use', 'in_reserve', 'written_off', 'in_repair').required(),
  userId: Joi.string().uuid().optional().allow(null),
  roomId: Joi.string().uuid().optional().allow(null),
  purchaseDate: Joi.string().isoDate().optional().allow(''),
  warrantyEnd: Joi.string().isoDate().optional().allow(''),
  lastMaintenanceDate: Joi.string().isoDate().optional().allow(''),
  nextMaintenanceDate: Joi.string().isoDate().optional().allow(''),
  notes: Joi.string().max(1000).optional().allow('')
});

// Валидация для категории
const categorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional().allow('')
});

// Валидация для типа оборудования
const equipmentTypeSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  categoryId: Joi.string().uuid().required()
});

// Валидация для пользователя (сотрудника)
const userSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  email: Joi.string().email().optional().allow(''),
  department: Joi.string().max(100).optional().allow(''),
  position: Joi.string().max(100).optional().allow('')
});

// Валидация для помещения
const roomSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  building: Joi.string().max(100).optional().allow(''),
  floor: Joi.number().integer().min(0).max(999).optional(),
  description: Joi.string().max(500).optional().allow('')
});

// Валидация для смены статуса
const changeStatusSchema = Joi.object({
  status: Joi.string().valid('in_use', 'in_reserve', 'written_off', 'in_repair').required(),
  comment: Joi.string().max(500).optional().allow('')
});

// Валидация для перемещения
const moveSchema = Joi.object({
  userId: Joi.string().uuid().optional().allow(null),
  roomId: Joi.string().uuid().optional().allow(null),
  comment: Joi.string().max(500).optional().allow('')
});

// Middleware для валидации
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({ error: 'Ошибка валидации', details: errors });
    }
    next();
  };
};

module.exports = {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  equipmentSchema,
  categorySchema,
  equipmentTypeSchema,
  userSchema,
  roomSchema,
  changeStatusSchema,
  moveSchema,
  validate
};
