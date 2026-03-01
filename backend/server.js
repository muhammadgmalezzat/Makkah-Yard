require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./src/config/db");

// Routes
const authRoutes = require("./src/routes/auth");
const packageRoutes = require("./src/routes/packages");
const subscriptionRoutes = require("./src/routes/subscriptions");

// Middleware
const errorHandler = require("./src/middleware/errorHandler");

// Initialize app
const app = express();

// Connect to database
connectDB();

// Security and logging middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
