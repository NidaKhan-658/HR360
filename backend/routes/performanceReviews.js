const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all performance reviews
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                pr.review_id,
                pr.employee_id,
                e.employee_code,
                e.first_name || ' ' || e.last_name AS employee_name,
                pr.reviewer_id,
                r.first_name || ' ' || r.last_name AS reviewer_name,
                pr.review_period_start,
                pr.review_period_end,
                pr.overall_rating,
                pr.performance_level,
                pr.strengths,
                pr.areas_for_improvement,
                pr.goals,
                pr.manager_comments,
                pr.review_status,
                pr.review_date,
                pr.created_at,
                pr.updated_at
            FROM performance_reviews pr
            JOIN employees e
                ON pr.employee_id = e.employee_id
            LEFT JOIN employees r
                ON pr.reviewer_id = r.employee_id
            ORDER BY pr.review_id DESC;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching performance reviews:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch performance reviews"
        });
    }
});

// GET performance review by ID
router.get("/:id", async (req, res) => {
    try {
        const reviewId = req.params.id;

        const result = await pool.query(`
            SELECT
                pr.review_id,
                pr.employee_id,
                e.employee_code,
                e.first_name || ' ' || e.last_name AS employee_name,
                pr.reviewer_id,
                r.first_name || ' ' || r.last_name AS reviewer_name,
                pr.review_period_start,
                pr.review_period_end,
                pr.overall_rating,
                pr.performance_level,
                pr.strengths,
                pr.areas_for_improvement,
                pr.goals,
                pr.manager_comments,
                pr.review_status,
                pr.review_date,
                pr.created_at,
                pr.updated_at
            FROM performance_reviews pr
            JOIN employees e
                ON pr.employee_id = e.employee_id
            LEFT JOIN employees r
                ON pr.reviewer_id = r.employee_id
            WHERE pr.review_id = $1;
        `, [reviewId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Performance review not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching performance review:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch performance review"
        });
    }
});

// GET performance reviews for an employee
router.get("/employee/:employeeId", async (req, res) => {
    try {
        const employeeId = req.params.employeeId;

        const result = await pool.query(`
            SELECT
                pr.review_id,
                pr.employee_id,
                e.employee_code,
                e.first_name || ' ' || e.last_name AS employee_name,
                pr.reviewer_id,
                r.first_name || ' ' || r.last_name AS reviewer_name,
                pr.review_period_start,
                pr.review_period_end,
                pr.overall_rating,
                pr.performance_level,
                pr.strengths,
                pr.areas_for_improvement,
                pr.goals,
                pr.manager_comments,
                pr.review_status,
                pr.review_date,
                pr.created_at,
                pr.updated_at
            FROM performance_reviews pr
            JOIN employees e
                ON pr.employee_id = e.employee_id
            LEFT JOIN employees r
                ON pr.reviewer_id = r.employee_id
            WHERE pr.employee_id = $1
            ORDER BY pr.review_id DESC;
        `, [employeeId]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching employee performance reviews:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch employee performance reviews"
        });
    }
});

// CREATE performance review
router.post("/", async (req, res) => {
    try {
        const {
            employee_id,
            reviewer_id,
            review_period_start,
            review_period_end,
            overall_rating,
            performance_level,
            strengths,
            areas_for_improvement,
            goals,
            manager_comments,
            review_status,
            review_date
        } = req.body;

        if (
            !employee_id ||
            !review_period_start ||
            !review_period_end
        ) {
            return res.status(400).json({
                success: false,
                message: "employee_id, review_period_start and review_period_end are required"
            });
        }

        const result = await pool.query(`
            INSERT INTO performance_reviews
            (
                employee_id,
                reviewer_id,
                review_period_start,
                review_period_end,
                overall_rating,
                performance_level,
                strengths,
                areas_for_improvement,
                goals,
                manager_comments,
                review_status,
                review_date
            )
            VALUES
            (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12
            )
            RETURNING
                review_id,
                employee_id,
                reviewer_id,
                review_period_start,
                review_period_end,
                overall_rating,
                performance_level,
                review_status,
                review_date,
                created_at;
        `, [
            employee_id,
            reviewer_id || null,
            review_period_start,
            review_period_end,
            overall_rating || null,
            performance_level || null,
            strengths || null,
            areas_for_improvement || null,
            goals || null,
            manager_comments || null,
            review_status || "DRAFT",
            review_date || null
        ]);

        res.status(201).json({
            success: true,
            message: "Performance review created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating performance review:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Employee or reviewer does not exist"
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid performance review data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create performance review"
        });
    }
});

// UPDATE performance review
router.put("/:id", async (req, res) => {
    try {
        const reviewId = req.params.id;

        const {
            reviewer_id,
            review_period_start,
            review_period_end,
            overall_rating,
            performance_level,
            strengths,
            areas_for_improvement,
            goals,
            manager_comments,
            review_status,
            review_date
        } = req.body;

        const result = await pool.query(`
            UPDATE performance_reviews
            SET
                reviewer_id = $1,
                review_period_start = $2,
                review_period_end = $3,
                overall_rating = $4,
                performance_level = $5,
                strengths = $6,
                areas_for_improvement = $7,
                goals = $8,
                manager_comments = $9,
                review_status = $10,
                review_date = $11,
                updated_at = CURRENT_TIMESTAMP
            WHERE review_id = $12
            RETURNING
                review_id,
                employee_id,
                reviewer_id,
                review_period_start,
                review_period_end,
                overall_rating,
                performance_level,
                review_status,
                review_date,
                updated_at;
        `, [
            reviewer_id || null,
            review_period_start,
            review_period_end,
            overall_rating || null,
            performance_level || null,
            strengths || null,
            areas_for_improvement || null,
            goals || null,
            manager_comments || null,
            review_status || "DRAFT",
            review_date || null,
            reviewId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Performance review not found"
            });
        }

        res.json({
            success: true,
            message: "Performance review updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating performance review:", error);

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid performance review data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update performance review"
        });
    }
});

// UPDATE performance review status
router.patch("/:id/status", async (req, res) => {
    try {
        const reviewId = req.params.id;
        const { review_status } = req.body;

        const allowedStatuses = [
            "DRAFT",
            "IN_REVIEW",
            "COMPLETED"
        ];

        if (!review_status) {
            return res.status(400).json({
                success: false,
                message: "review_status is required"
            });
        }

        if (!allowedStatuses.includes(review_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid review status"
            });
        }

        const result = await pool.query(`
            UPDATE performance_reviews
            SET
                review_status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE review_id = $2
            RETURNING
                review_id,
                employee_id,
                review_status,
                updated_at;
        `, [
            review_status,
            reviewId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Performance review not found"
            });
        }

        res.json({
            success: true,
            message: "Performance review status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating performance review status:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update performance review status"
        });
    }
});

module.exports = router;