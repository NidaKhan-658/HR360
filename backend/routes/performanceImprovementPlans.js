const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all PIPs
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                pip.pip_id,
                pip.employee_id,
                e.employee_code,
                e.first_name || ' ' || e.last_name AS employee_name,

                pip.performance_review_id,
                pr.overall_rating,
                pr.performance_level,

                pip.start_date,
                pip.end_date,
                pip.reason,
                pip.objectives,
                pip.action_plan,
                pip.review_frequency,

                pip.manager_id,
                m.first_name || ' ' || m.last_name AS manager_name,

                pip.employee_comments,
                pip.outcome,
                pip.pip_status,
                pip.completion_date,
                pip.created_at,
                pip.updated_at

            FROM performance_improvement_plans pip

            JOIN employees e
                ON pip.employee_id = e.employee_id

            LEFT JOIN performance_reviews pr
                ON pip.performance_review_id = pr.review_id

            LEFT JOIN employees m
                ON pip.manager_id = m.employee_id

            ORDER BY pip.pip_id DESC;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching PIPs:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch PIPs"
        });
    }
});

// GET PIP by ID
router.get("/:id", async (req, res) => {
    try {
        const pipId = req.params.id;

        const result = await pool.query(`
            SELECT
                pip.pip_id,
                pip.employee_id,
                e.employee_code,
                e.first_name || ' ' || e.last_name AS employee_name,

                pip.performance_review_id,
                pr.overall_rating,
                pr.performance_level,

                pip.start_date,
                pip.end_date,
                pip.reason,
                pip.objectives,
                pip.action_plan,
                pip.review_frequency,

                pip.manager_id,
                m.first_name || ' ' || m.last_name AS manager_name,

                pip.employee_comments,
                pip.outcome,
                pip.pip_status,
                pip.completion_date,
                pip.created_at,
                pip.updated_at

            FROM performance_improvement_plans pip

            JOIN employees e
                ON pip.employee_id = e.employee_id

            LEFT JOIN performance_reviews pr
                ON pip.performance_review_id = pr.review_id

            LEFT JOIN employees m
                ON pip.manager_id = m.employee_id

            WHERE pip.pip_id = $1;
        `, [pipId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "PIP not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching PIP:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch PIP"
        });
    }
});

// GET PIPs for a specific employee
router.get("/employee/:employeeId", async (req, res) => {
    try {
        const employeeId = req.params.employeeId;

        const result = await pool.query(`
            SELECT
                pip.pip_id,
                pip.employee_id,
                e.employee_code,
                e.first_name || ' ' || e.last_name AS employee_name,

                pip.performance_review_id,
                pr.overall_rating,
                pr.performance_level,

                pip.start_date,
                pip.end_date,
                pip.reason,
                pip.objectives,
                pip.action_plan,
                pip.review_frequency,

                pip.manager_id,
                m.first_name || ' ' || m.last_name AS manager_name,

                pip.employee_comments,
                pip.outcome,
                pip.pip_status,
                pip.completion_date,
                pip.created_at,
                pip.updated_at

            FROM performance_improvement_plans pip

            JOIN employees e
                ON pip.employee_id = e.employee_id

            LEFT JOIN performance_reviews pr
                ON pip.performance_review_id = pr.review_id

            LEFT JOIN employees m
                ON pip.manager_id = m.employee_id

            WHERE pip.employee_id = $1

            ORDER BY pip.pip_id DESC;
        `, [employeeId]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching employee PIPs:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch employee PIPs"
        });
    }
});

// CREATE PIP
router.post("/", async (req, res) => {
    try {
        const {
            employee_id,
            performance_review_id,
            start_date,
            end_date,
            reason,
            objectives,
            action_plan,
            review_frequency,
            manager_id,
            employee_comments
        } = req.body;

        if (
            !employee_id ||
            !start_date ||
            !reason ||
            !objectives
        ) {
            return res.status(400).json({
                success: false,
                message: "employee_id, start_date, reason and objectives are required"
            });
        }

        const result = await pool.query(`
            INSERT INTO performance_improvement_plans
            (
                employee_id,
                performance_review_id,
                start_date,
                end_date,
                reason,
                objectives,
                action_plan,
                review_frequency,
                manager_id,
                employee_comments
            )
            VALUES
            (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10
            )
            RETURNING
                pip_id,
                employee_id,
                performance_review_id,
                start_date,
                end_date,
                reason,
                objectives,
                action_plan,
                review_frequency,
                manager_id,
                employee_comments,
                pip_status,
                created_at;
        `, [
            employee_id,
            performance_review_id || null,
            start_date,
            end_date || null,
            reason,
            objectives,
            action_plan || null,
            review_frequency || null,
            manager_id || null,
            employee_comments || null
        ]);

        res.status(201).json({
            success: true,
            message: "PIP created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating PIP:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Employee, performance review, or manager does not exist"
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid PIP data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create PIP"
        });
    }
});

// UPDATE PIP
router.put("/:id", async (req, res) => {
    try {
        const pipId = req.params.id;

        const {
            performance_review_id,
            start_date,
            end_date,
            reason,
            objectives,
            action_plan,
            review_frequency,
            manager_id,
            employee_comments
        } = req.body;

        const result = await pool.query(`
            UPDATE performance_improvement_plans
            SET
                performance_review_id = $1,
                start_date = $2,
                end_date = $3,
                reason = $4,
                objectives = $5,
                action_plan = $6,
                review_frequency = $7,
                manager_id = $8,
                employee_comments = $9,
                updated_at = CURRENT_TIMESTAMP
            WHERE pip_id = $10
            RETURNING
                pip_id,
                employee_id,
                performance_review_id,
                start_date,
                end_date,
                reason,
                objectives,
                action_plan,
                review_frequency,
                manager_id,
                employee_comments,
                pip_status,
                updated_at;
        `, [
            performance_review_id || null,
            start_date,
            end_date || null,
            reason,
            objectives,
            action_plan || null,
            review_frequency || null,
            manager_id || null,
            employee_comments || null,
            pipId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "PIP not found"
            });
        }

        res.json({
            success: true,
            message: "PIP updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating PIP:", error);

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid PIP data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update PIP"
        });
    }
});

// UPDATE PIP status/outcome
router.patch("/:id/status", async (req, res) => {
    try {
        const pipId = req.params.id;

        const {
            pip_status,
            outcome
        } = req.body;

        const allowedStatuses = [
            "ACTIVE",
            "COMPLETED",
            "EXTENDED",
            "CANCELLED"
        ];

        const allowedOutcomes = [
            "SUCCESSFUL",
            "EXTENDED",
            "UNSUCCESSFUL"
        ];

        if (!pip_status) {
            return res.status(400).json({
                success: false,
                message: "pip_status is required"
            });
        }

        if (!allowedStatuses.includes(pip_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid PIP status"
            });
        }

        if (outcome && !allowedOutcomes.includes(outcome)) {
            return res.status(400).json({
                success: false,
                message: "Invalid PIP outcome"
            });
        }

        const completionDate =
            pip_status === "COMPLETED"
                ? new Date().toISOString().split("T")[0]
                : null;

        const result = await pool.query(`
            UPDATE performance_improvement_plans
            SET
                pip_status = $1,
                outcome = $2,
                completion_date = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE pip_id = $4
            RETURNING
                pip_id,
                employee_id,
                pip_status,
                outcome,
                completion_date,
                updated_at;
        `, [
            pip_status,
            outcome || null,
            completionDate,
            pipId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "PIP not found"
            });
        }

        res.json({
            success: true,
            message: "PIP status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating PIP status:", error);

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid PIP status or outcome"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update PIP status"
        });
    }
});

module.exports = router;