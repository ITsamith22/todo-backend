const express = require('express');
const router = express.Router();
const {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo,
  markAsCompleted,
  markAsPending,
  getTodoStats
} = require('../controllers/todoController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected (require authentication)
router.use(protect);

// Todo CRUD routes
router.route('/')
  .get(getTodos)      // GET /api/todos - Get all todos
  .post(createTodo);  // POST /api/todos - Create new todo

router.route('/stats')
  .get(getTodoStats); // GET /api/todos/stats - Get todo statistics

router.route('/:id')
  .get(getTodo)       // GET /api/todos/:id - Get single todo
  .put(updateTodo)    // PUT /api/todos/:id - Update todo
  .delete(deleteTodo); // DELETE /api/todos/:id - Delete todo

// Status update routes
router.patch('/:id/complete', markAsCompleted); // PATCH /api/todos/:id/complete
router.patch('/:id/pending', markAsPending);    // PATCH /api/todos/:id/pending

module.exports = router;