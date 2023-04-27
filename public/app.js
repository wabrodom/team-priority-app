const API_URL = "http://localhost:3000/api/todos";
const logoutButton = document.getElementById("logoutButton");
if (logoutButton) {
  logoutButton.addEventListener("click", logout);
}

// Add functions to handle user registration and login
// async function registerUser(event) {
//   event.preventDefault();
//   const username = document.getElementById("username").value;
//   const password = document.getElementById("password").value;

//   const response = await fetch("/api/register", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ username, password }),
//   });

//   if (response.ok) {
//     alert("User registered successfully");
//     location.href = "login.html";
//   } else {
//     const errorData = await response.json();
//     alert(errorData.message);
//   }
// }

async function loginUser(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", username); // Store the username
    location.href = "index.html";
  } else {
    const errorData = await response.json();
    alert(errorData.message);
  }
}

function getAuthHeader() {
  const token = localStorage.getItem("token");
  // console.log("Authorization header:", { Authorization: `Bearer ${token}` });
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// Check if we're on the register or login page, and attach the event listeners
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

if (registerForm) {
  registerForm.addEventListener("submit", registerUser);
}

if (loginForm) {
  loginForm.addEventListener("submit", loginUser);
}

function displayUsername() {
  const username = localStorage.getItem("username");
  if (username) {
    const usernameDisplay = document.getElementById("usernameDisplay");
    usernameDisplay.textContent = `Welcome, ${username}`;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "/login.html";
}

///// about user end

async function fetchTodos() {
  const response = await fetch(API_URL, { headers: getAuthHeader() });
  const data = await response.json();

  // console.log("Response data ja:", data);

  if (Array.isArray(data)) {
    displayTodos(data);
  } else {
    console.error("Unexpected response data:", data);
  }
}

function displayTodos(todos) {
  const quadrants = {
    quickWins: document.getElementById("quickWins").querySelector("ul"),
    majorProjects: document.getElementById("majorProjects").querySelector("ul"),
    fillIns: document.getElementById("fillIns").querySelector("ul"),
    hardSlogs: document.getElementById("hardSlogs").querySelector("ul"),
  };

  Object.values(quadrants).forEach((quadrant) => (quadrant.innerHTML = ""));

  todos.forEach((todo) => {
    const li = document.createElement("li");
    li.textContent = todo.task;

    if (todo.completed) {
      li.classList.add("completed");
    }

    li.addEventListener("dblclick", () => {
      toggleComplete(todo._id, todo.completed);
    });

    const deleteButton = document.createElement("span");
    deleteButton.textContent = " X ";
    deleteButton.classList.add("delete-button");
    deleteButton.onclick = (event) => {
      event.stopPropagation();
      deleteTask(todo._id);
    };

    li.appendChild(deleteButton);

    switch (todo.priority) {
      case 1:
        quadrants.quickWins.appendChild(li);
        break;
      case 2:
        quadrants.majorProjects.appendChild(li);
        break;
      case 3:
        quadrants.fillIns.appendChild(li);
        break;
      case 4:
        quadrants.hardSlogs.appendChild(li);
        break;
    }
  });
}

async function addTask() {
  const taskInput = document.getElementById("taskInput");
  const prioritySelect = document.getElementById("prioritySelect");
  const task = taskInput.value.trim();
  const priority = parseInt(prioritySelect.value);
  if (!task) return;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ task, priority }),
  });

  taskInput.value = "";
  setTimeout(fetchTodos, 500);
}

async function toggleComplete(id, completed) {
  await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ completed: !completed }),
  });

  fetchTodos();
}

// only boss can delete yeah!
async function deleteTask(id) {
  const username = localStorage.getItem("username");
  if (username !== "boss") {
    alert("Only the 'boss' can delete tasks.");
    return;
  }

  await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: getAuthHeader() });
  fetchTodos();
}

// Call fetchTodos() only when we're on the index page
if (!registerForm && !loginForm) {
  fetchTodos();
}

if (window.location.pathname === "/index.html") {
  displayUsername();
}
