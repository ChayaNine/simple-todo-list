// API endpoints
const API_BASE = '/api/todos';

// DOM elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const totalCount = document.getElementById('totalCount');
const completedCount = document.getElementById('completedCount');

// State
let todos = [];

// Fetch all todos
async function fetchTodos() {
  try {
    const response = await fetch(API_BASE);
    todos = await response.json();
    renderTodos();
  } catch (error) {
    console.error('Error fetching todos:', error);
    alert('Failed to load todos');
  }
}

// Add a new todo
async function addTodo() {
  const text = todoInput.value.trim();

  if (!text) {
    alert('Please enter a todo');
    return;
  }

  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (response.ok) {
      const newTodo = await response.json();
      todos.push(newTodo);
      todoInput.value = '';
      renderTodos();
    } else {
      const err = await safeReadJson(response);
      alert(err?.error || 'Failed to add todo');
    }
  } catch (error) {
    console.error('Error adding todo:', error);
    alert('Failed to add todo');
  }
}

// Toggle todo completion
async function toggleTodo(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, { method: 'PUT' });

    if (response.ok) {
      const updatedTodo = await response.json();
      const index = todos.findIndex(t => t.id === id);
      if (index !== -1) {
        todos[index] = updatedTodo;
        renderTodos();
      }
    } else {
      const err = await safeReadJson(response);
      alert(err?.error || 'Failed to update todo');
    }
  } catch (error) {
    console.error('Error toggling todo:', error);
    alert('Failed to update todo');
  }
}

// ✅ NEW: Edit a todo text
async function editTodo(id) {
  const current = todos.find(t => t.id === id);
  const currentText = current ? current.text : '';

  const newTextRaw = prompt('Edit todo:', currentText);

  // If user pressed Cancel
  if (newTextRaw === null) return;

  const newText = newTextRaw.trim();
  if (!newText) {
    alert('Todo text cannot be empty');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/${id}/edit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText }),
    });

    if (response.ok) {
      const updatedTodo = await response.json();
      const index = todos.findIndex(t => t.id === id);
      if (index !== -1) {
        todos[index] = updatedTodo;
        renderTodos();
      }
    } else {
      const err = await safeReadJson(response);
      alert(err?.error || 'Failed to edit todo');
    }
  } catch (error) {
    console.error('Error editing todo:', error);
    alert('Failed to edit todo');
  }
}

// Delete a todo
async function deleteTodo(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });

    if (response.ok) {
      todos = todos.filter(t => t.id !== id);
      renderTodos();
    } else {
      const err = await safeReadJson(response);
      alert(err?.error || 'Failed to delete todo');
    }
  } catch (error) {
    console.error('Error deleting todo:', error);
    alert('Failed to delete todo');
  }
}

// Render todos to the DOM
function renderTodos() {
  if (todos.length === 0) {
    todoList.innerHTML = '<div class="empty-state">No todos yet. Add one above!</div>';
  } else {
    todoList.innerHTML = todos.map(todo => `
      <div class="todo-item ${todo.completed ? 'completed' : ''}">
        <input
          type="checkbox"
          class="todo-checkbox"
          ${todo.completed ? 'checked' : ''}
          onchange="toggleTodo(${todo.id})"
        />
        <span class="todo-text">${escapeHtml(todo.text)}</span>

        <button class="edit-btn" onclick="editTodo(${todo.id})">Edit</button>
        <button class="delete-btn" onclick="deleteTodo(${todo.id})">Delete</button>
      </div>
    `).join('');
  }

  updateStats();
}

// Update statistics
function updateStats() {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  totalCount.textContent = `Total: ${total}`;
  completedCount.textContent = `Completed: ${completed}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Safely try to read JSON error response
async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Event listeners
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTodo();
});

// Initialize
fetchTodos();
