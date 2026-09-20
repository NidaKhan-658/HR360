const express = require("express");
const pool = require("./db");
const employeeRoutes = require("./routes/employees");
const departmentRoutes = require("./routes/departments");
const jobRoleRoutes = require("./routes/jobRoles");
const workStatusRoutes = require("./routes/workStatuses");
const attendanceRoutes = require("./routes/attendance");
const leaveTypeRoutes = require("./routes/leaveTypes");
const leaveRequestRoutes = require("./routes/leaveRequests");
const performanceReviewRoutes = require("./routes/performanceReviews");
const pipRoutes = require("./routes/performanceImprovementPlans");
const trainingProgramRoutes = require("./routes/trainingPrograms");
const employeeTrainingRoutes = require("./routes/employeeTraining");
const interviewRoutes = require("./routes/interviews");
const candidateRoutes = require("./routes/candidates");
const jobApplicationRoutes = require("./routes/jobApplications");
const jobOfferRoutes = require("./routes/jobOffers");

const app = express();

const PORT = 5000;

// Middleware
app.use(express.json());

// Routes
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/job-roles", jobRoleRoutes);
app.use("/api/work-statuses", workStatusRoutes);
app.use("/api/attendance",attendanceRoutes);
app.use("/api/leave-types", leaveTypeRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/performance-reviews", performanceReviewRoutes);
app.use("/api/pips", pipRoutes);
app.use("/api/training-programs", trainingProgramRoutes);
app.use("/api/employee-training", employeeTrainingRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/candidates", candidateRoutes);    
app.use("/api/job-applications", jobApplicationRoutes);
app.use("/api/job-offers", jobOfferRoutes);



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