const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all interviews
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                i.interview_id,

                i.application_id,

                c.candidate_id,
                c.candidate_code,
                c.first_name || ' ' || c.last_name AS candidate_name,

                jr.role_id,
                jr.role_name,

                i.interviewer_id,
                e.first_name || ' ' || e.last_name AS interviewer_name,

                i.interview_round,
                i.interview_type,
                i.scheduled_date,
                i.scheduled_time,
                i.interview_status,
                i.rating,
                i.feedback,
                i.result,

                i.created_at,
                i.updated_at

            FROM interviews i

            JOIN job_applications ja
                ON i.application_id = ja.application_id

            JOIN candidates c
                ON ja.candidate_id = c.candidate_id

            JOIN job_roles jr
                ON ja.job_role_id = jr.role_id

            LEFT JOIN employees e
                ON i.interviewer_id = e.employee_id

            ORDER BY i.interview_id DESC;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching interviews:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch interviews"
        });
    }
});

// GET interview by ID
router.get("/:id", async (req, res) => {
    try {
        const interviewId = req.params.id;

        const result = await pool.query(`
            SELECT
                i.interview_id,

                i.application_id,

                c.candidate_id,
                c.candidate_code,
                c.first_name || ' ' || c.last_name AS candidate_name,

                jr.role_id,
                jr.role_name,

                i.interviewer_id,
                e.first_name || ' ' || e.last_name AS interviewer_name,

                i.interview_round,
                i.interview_type,
                i.scheduled_date,
                i.scheduled_time,
                i.interview_status,
                i.rating,
                i.feedback,
                i.result,

                i.created_at,
                i.updated_at

            FROM interviews i

            JOIN job_applications ja
                ON i.application_id = ja.application_id

            JOIN candidates c
                ON ja.candidate_id = c.candidate_id

            JOIN job_roles jr
                ON ja.job_role_id = jr.role_id

            LEFT JOIN employees e
                ON i.interviewer_id = e.employee_id

            WHERE i.interview_id = $1;
        `, [interviewId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Interview not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching interview:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch interview"
        });
    }
});

// GET interviews by application
router.get("/application/:applicationId", async (req, res) => {
    try {
        const applicationId = req.params.applicationId;

        const result = await pool.query(`
            SELECT
                i.interview_id,
                i.application_id,

                c.candidate_code,
                c.first_name || ' ' || c.last_name AS candidate_name,

                jr.role_name,

                i.interviewer_id,
                e.first_name || ' ' || e.last_name AS interviewer_name,

                i.interview_round,
                i.interview_type,
                i.scheduled_date,
                i.scheduled_time,
                i.interview_status,
                i.rating,
                i.feedback,
                i.result,

                i.created_at,
                i.updated_at

            FROM interviews i

            JOIN job_applications ja
                ON i.application_id = ja.application_id

            JOIN candidates c
                ON ja.candidate_id = c.candidate_id

            JOIN job_roles jr
                ON ja.job_role_id = jr.role_id

            LEFT JOIN employees e
                ON i.interviewer_id = e.employee_id

            WHERE i.application_id = $1

            ORDER BY i.interview_round;
        `, [applicationId]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching application interviews:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch application interviews"
        });
    }
});

// CREATE interview
router.post("/", async (req, res) => {
    try {
        const {
            application_id,
            interviewer_id,
            interview_round,
            interview_type,
            scheduled_date,
            scheduled_time,
            interview_status,
            rating,
            feedback,
            result
        } = req.body;

        if (!application_id) {
            return res.status(400).json({
                success: false,
                message: "application_id is required"
            });
        }

        const insertResult = await pool.query(`
            INSERT INTO interviews
            (
                application_id,
                interviewer_id,
                interview_round,
                interview_type,
                scheduled_date,
                scheduled_time,
                interview_status,
                rating,
                feedback,
                result
            )
            VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING
                interview_id,
                application_id,
                interviewer_id,
                interview_round,
                interview_type,
                scheduled_date,
                scheduled_time,
                interview_status,
                rating,
                feedback,
                result,
                created_at;
        `, [
            application_id,
            interviewer_id || null,
            interview_round || 1,
            interview_type || null,
            scheduled_date || null,
            scheduled_time || null,
            interview_status || "SCHEDULED",
            rating || null,
            feedback || null,
            result || null
        ]);

        res.status(201).json({
            success: true,
            message: "Interview created successfully",
            data: insertResult.rows[0]
        });

    } catch (error) {
        console.error("Error creating interview:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Application or interviewer does not exist"
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid interview data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create interview"
        });
    }
});

// UPDATE interview
router.put("/:id", async (req, res) => {
    try {
        const interviewId = req.params.id;

        const {
            interviewer_id,
            interview_round,
            interview_type,
            scheduled_date,
            scheduled_time,
            interview_status,
            rating,
            feedback,
            result
        } = req.body;

        const updateResult = await pool.query(`
            UPDATE interviews
            SET
                interviewer_id = $1,
                interview_round = $2,
                interview_type = $3,
                scheduled_date = $4,
                scheduled_time = $5,
                interview_status = $6,
                rating = $7,
                feedback = $8,
                result = $9,
                updated_at = CURRENT_TIMESTAMP
            WHERE interview_id = $10
            RETURNING
                interview_id,
                application_id,
                interviewer_id,
                interview_round,
                interview_type,
                scheduled_date,
                scheduled_time,
                interview_status,
                rating,
                feedback,
                result,
                updated_at;
        `, [
            interviewer_id || null,
            interview_round || 1,
            interview_type || null,
            scheduled_date || null,
            scheduled_time || null,
            interview_status || "SCHEDULED",
            rating || null,
            feedback || null,
            result || null,
            interviewId
        ]);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Interview not found"
            });
        }

        res.json({
            success: true,
            message: "Interview updated successfully",
            data: updateResult.rows[0]
        });

    } catch (error) {
        console.error("Error updating interview:", error);

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid interview data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update interview"
        });
    }
});

// UPDATE interview status
router.patch("/:id/status", async (req, res) => {
    try {
        const interviewId = req.params.id;
        const {
            interview_status,
            rating,
            feedback,
            result
        } = req.body;

        const allowedStatuses = [
            "SCHEDULED",
            "COMPLETED",
            "CANCELLED",
            "NO_SHOW"
        ];

        if (!interview_status) {
            return res.status(400).json({
                success: false,
                message: "interview_status is required"
            });
        }

        if (!allowedStatuses.includes(interview_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid interview status"
            });
        }

        const updateResult = await pool.query(`
            UPDATE interviews
            SET
                interview_status = $1,
                rating = $2,
                feedback = $3,
                result = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE interview_id = $5
            RETURNING
                interview_id,
                application_id,
                interview_status,
                rating,
                feedback,
                result,
                updated_at;
        `, [
            interview_status,
            rating || null,
            feedback || null,
            result || null,
            interviewId
        ]);

        if (updateResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Interview not found"
            });
        }

        res.json({
            success: true,
            message: "Interview status updated successfully",
            data: updateResult.rows[0]
        });

    } catch (error) {
        console.error("Error updating interview status:", error);

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid interview data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update interview status"
        });
    }
});

module.exports = router;