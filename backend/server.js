const express = require("express");
const pool = require("./db");
const employeeRoutes = require("./routes/employees");

const app = express();

const PORT = 5000;

// Middleware
app.use(express.json());

// Routes
app.use("/api/employees", employeeRoutes);

// Health check + database test
app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            success: true,
            message: "HR360 Backend and PostgreSQL are connected",
            databaseTime: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`HR360 Backend running on http://localhost:${PORT}`);
});