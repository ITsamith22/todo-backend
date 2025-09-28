const Todo = require('../models/Todo');

// @desc    Get all todos for logged in user
// @route   GET /api/todos
// @access  Private
exports.getTodos = async (req, res) => {
  try {
    const { status, priority, sortBy, sortOrder, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { userId: req.user._id };
    
    if (status) {
      filter.status = status;
    }
    
    if (priority) {
      filter.priority = priority;
    }

    // Build sort object
    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default: newest first
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get todos with pagination
    const todos = await Todo.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination info
    const totalTodos = await Todo.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: todos.length,
      totalCount: totalTodos,
      totalPages: Math.ceil(totalTodos / parseInt(limit)),
      currentPage: parseInt(page),
      data: todos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single todo by ID
// @route   GET /api/todos/:id
// @access  Private
exports.getTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create new todo
// @route   POST /api/todos
// @access  Private
exports.createTodo = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    const todo = await Todo.create({
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: req.user._id
    });

    res.status(201).json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update todo
// @route   PUT /api/todos/:id
// @access  Private
exports.updateTodo = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    let todo = await Todo.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    // Update fields if provided
    if (title !== undefined) todo.title = title;
    if (description !== undefined) todo.description = description;
    if (status !== undefined) todo.status = status;
    if (priority !== undefined) todo.priority = priority;
    if (dueDate !== undefined) todo.dueDate = dueDate ? new Date(dueDate) : null;

    await todo.save();

    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete todo
// @route   DELETE /api/todos/:id
// @access  Private
exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    await Todo.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Mark todo as completed
// @route   PATCH /api/todos/:id/complete
// @access  Private
exports.markAsCompleted = async (req, res) => {
  try {
    const todo = await Todo.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    todo.status = 'completed';
    await todo.save();

    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Mark todo as pending
// @route   PATCH /api/todos/:id/pending
// @access  Private
exports.markAsPending = async (req, res) => {
  try {
    const todo = await Todo.findOne({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    todo.status = 'pending';
    await todo.save();

    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get todos statistics
// @route   GET /api/todos/stats
// @access  Private
exports.getTodoStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Todo.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalTodos: { $sum: 1 },
          completedTodos: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pendingTodos: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          highPriorityTodos: {
            $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
          },
          mediumPriorityTodos: {
            $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] }
          },
          lowPriorityTodos: {
            $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalTodos: 0,
      completedTodos: 0,
      pendingTodos: 0,
      highPriorityTodos: 0,
      mediumPriorityTodos: 0,
      lowPriorityTodos: 0
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};