import { Router } from 'express';
import Joi from 'joi';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as taskService from '../services/task.js';

const router = Router();

const createSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(5000).allow('', null),
  status: Joi.string().valid('todo', 'in_progress', 'done').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
});

const updateSchema = Joi.object({
  title: Joi.string().min(1).max(255),
  description: Joi.string().max(5000).allow('', null),
  status: Joi.string().valid('todo', 'in_progress', 'done'),
  priority: Joi.string().valid('low', 'medium', 'high'),
}).min(1);

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const tasks = await taskService.listTasks(req.user.id);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.user.id, req.body);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const task = await taskService.getTask(req.user.id, req.params.id);
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const task = await taskService.updateTask(req.user.id, req.params.id, req.body);
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await taskService.deleteTask(req.user.id, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
