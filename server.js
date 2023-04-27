require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;
const SECRET_KEY = process.env.SECRET_KEY;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useFindAndModify: false,
  // useCreateIndex: true,
});

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error(`Error connecting to MongoDB: ${err}`);
});

const todoSchema = new mongoose.Schema({
  task: String,
  priority: Number,
  completed: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Todo = mongoose.model("Todo", todoSchema);
const User = mongoose.model("User", userSchema);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// app.post("/api/register", async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = new User({ username, password: hashedPassword });
//     await user.save();

//     res.status(201).json({ message: "User registered successfully" });
//   } catch (error) {
//     if (error.code === 11000) {
//       res.status(400).json({ message: "Username is already taken" });
//     } else {
//       res.status(500).json({ message: "Error occurred while registering user" });
//     }
//   }
// });

app.post("/api/login", cors(), async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).json({ message: "Username or password is incorrect" });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    return res.status(400).json({ message: "Username or password is incorrect" });
  }

  const token = jwt.sign({ userId: user._id }, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.user = payload; /// here true
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
}
app.post("/api/todos", cors(), isAuthenticated, async (req, res) => {
  const { task, priority } = req.body;
  const userId = req.user._id; // req.userId; //
  const newTodo = new Todo({ task, priority, userId });
  await newTodo.save();
  // console.log(`New todo created: ${newTodo}`);
  res.status(201).json(newTodo);
});

app.get("/api/todos", cors(), isAuthenticated, async (req, res) => {
  const userId = req.user._id; // req.userId; //
  const todos = await Todo.find({ userId }); //user
  // console.log(`Todos fetched for user ${userId}:`, todos);
  res.json(todos);
});

app.put("/api/todos/:id", cors(), isAuthenticated, async (req, res) => {
  const { id } = req.params;
  await Todo.findByIdAndUpdate(id, req.body);
  res.json({ message: "Todo updated successfully" });
});

app.delete("/api/todos/:id", cors(), isAuthenticated, async (req, res) => {
  const { id } = req.params;
  await Todo.findByIdAndDelete(id);
  res.json({ message: "Todo deleted successfully" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
