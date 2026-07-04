import { pool } from '../db/pool.js';
import { AppError } from '../utils/errors.js';

export async function listTasks(userId) {
  const result = await pool.query(
    'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function createTask(userId, data) {
  const result = await pool.query(
    `INSERT INTO tasks (user_id, title, description, status, priority)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      userId,
      data.title,
      data.description || null,
      data.status || 'todo',
      data.priority || 'medium',
    ]
  );
  return result.rows[0];
}

export async function getTask(userId, taskId) {
  const result = await pool.query(
    'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
    [taskId, userId]
  );
  if (result.rows.length === 0) {
    throw new AppError(404, 'Task not found');
  }
  return result.rows[0];
}

export async function updateTask(userId, taskId, data) {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    throw new AppError(400, 'No fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(userId, taskId);

  const result = await pool.query(
    `UPDATE tasks SET ${fields.join(', ')}
     WHERE user_id = $${idx++} AND id = $${idx}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Task not found');
  }
  return result.rows[0];
}

export async function deleteTask(userId, taskId) {
  const result = await pool.query(
    'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
    [taskId, userId]
  );
  if (result.rows.length === 0) {
    throw new AppError(404, 'Task not found');
  }
}
