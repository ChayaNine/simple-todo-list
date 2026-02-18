const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TODOS_FILE = path.join(__dirname, 'todos.json');

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize todos file if it doesn't exist
function initTodosFile() {
  if (!fs.existsSync(TODOS_FILE)) {
    fs.writeFileSync(TODOS_FILE, JSON.stringify([]));
  }
}

// Read todos from file
function readTodos() {
  try {
    initTodosFile();
    const data = fs.readFileSync(TODOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading todos:', error);
    return [];
  }
}

// Write todos to file
function writeTodos(todos) {
  try {
    fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing todos:', error);
    return false;
  }
}

/* ============================
   API ROUTES
============================ */

// Get all todos
app.get('/api/todos', (req, res) => {
  const todos = readTodos();
  res.json(todos);
});

// Add a new todo
app.post('/api/todos', (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Todo text is required' });
  }

  const todos = readTodos();

  // Generate incremental ID (important for tests)
  const nextId =
    todos.length > 0
      ? Math.max(...todos.map(t => t.id)) + 1
      : 1;

  const newTodo = {
    id: nextId,
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };

  todos.push(newTodo);

  if (writeTodos(todos)) {
    return res.status(201).json(newTodo);
  } else {
    return res.status(500).json({ error: 'Failed to save todo' });
  }
});

// Toggle todo completion (FIXED)
app.put('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todos = readTodos();
  const todoIndex = todos.findIndex(t => t.id === id);

  if (todoIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  // Toggle true <-> false
  todos[todoIndex].completed = !todos[todoIndex].completed;

  if (writeTodos(todos)) {
    return res.json(todos[todoIndex]);
  } else {
    return res.status(500).json({ error: 'Failed to update todo' });
  }
});

// Delete a todo
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const todos = readTodos();
  const filteredTodos = todos.filter(t => t.id !== id);

  if (todos.length === filteredTodos.length) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  if (writeTodos(filteredTodos)) {
    return res.json({ message: 'Todo deleted successfully' });
  } else {
    return res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Initialize todos file on startup
initTodosFile();

// Only start server if file run directly (important for tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for testing
module.exports = app;

