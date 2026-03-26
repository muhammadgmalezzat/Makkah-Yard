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
const academyRoutes = require("./src/routes/academyRoutes");
const messagingRoutes = require("./src/routes/messagingRoutes");
const memberRoutes = require("./src/routes/memberRoutes");

// Middleware
const errorHandler = require("./src/middleware/errorHandler");

// Initialize app
const app = express();

// Connect to database
connectDB();

// Load models to ensure indexes are created
require("./src/models/Sport");
require("./src/models/AcademyGroup");
require("./src/models/AcademySubscription");

// Security and logging middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/academy", academyRoutes);
app.use("/api/messaging", messagingRoutes);
app.use("/api/members", memberRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
app.listen(5000, "0.0.0.0", () => {
  console.log("Server running on port 5000");
});
