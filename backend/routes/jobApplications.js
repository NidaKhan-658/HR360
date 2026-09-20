const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all job applications
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                ja.application_id,

                ja.candidate_id,
                c.candidate_code,
                c.first_name || ' ' || c.last_name AS candidate_name,
                c.email,

                ja.job_role_id,
                jr.role_name,

                ja.application_date,
                ja.application_status,

                ja.recruiter_id,
                e.first_name || ' ' || e.last_name AS recruiter_name,

                ja.expected_salary,
                ja.notice_period_days,
                ja.recruiter_notes,

                ja.created_at,
                ja.updated_at

            FROM job_applications ja

            JOIN candidates c
                ON ja.candidate_id = c.candidate_id

            JOIN job_roles jr
                ON ja.job_role_id = jr.role_id

            LEFT JOIN employees e
                ON ja.recruiter_id = e.employee_id

            ORDER BY ja.application_id DESC;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching job applications:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch job applications"
        });
    }
});

// GET application by ID
router.get("/:id", async (req, res) => {
    try {
        const applicationId = req.params.id;

        const result = await pool.query(`
            SELECT
                ja.application_id,

                ja.candidate_id,
                c.candidate_code,
                c.first_name || ' ' || c.last_name AS candidate_name,
                c.email,

                ja.job_role_id,
                jr.role_name,

                ja.application_date,
                ja.application_status,

                ja.recruiter_id,
                e.first_name || ' ' || e.last_name AS recruiter_name,

                ja.expected_salary,
                ja.notice_period_days,
                ja.recruiter_notes,

                ja.created_at,
                ja.updated_at

            FROM job_applications ja

            JOIN candidates c
                ON ja.candidate_id = c.candidate_id

            JOIN job_roles jr
                ON ja.job_role_id = jr.role_id

            LEFT JOIN employees e
                ON ja.recruiter_id = e.employee_id

            WHERE ja.application_id = $1;
        `, [applicationId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job application not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching job application:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch job application"
        });
    }
});

// GET applications by candidate
router.get("/candidate/:candidateId", async (req, res) => {
    try {
        const candidateId = req.params.candidateId;

        const result = await pool.query(`
            SELECT
                ja.application_id,

                ja.candidate_id,
                c.candidate_code,
                c.first_name || ' ' || c.last_name AS candidate_name,

                ja.job_role_id,
                jr.role_name,

                ja.application_date,
                ja.application_status,

                ja.recruiter_id,
                e.first_name || ' ' || e.last_name AS recruiter_name,

                ja.expected_salary,
                ja.notice_period_days,
                ja.recruiter_notes,

                ja.created_at,
                ja.updated_at

            FROM job_applications ja

            JOIN candidates c
                ON ja.candidate_id = c.candidate_id

            JOIN job_roles jr
                ON ja.job_role_id = jr.role_id

            LEFT JOIN employees e
                ON ja.recruiter_id = e.employee_id

            WHERE ja.candidate_id = $1

            ORDER BY ja.application_id DESC;
        `, [candidateId]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching candidate applications:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch candidate applications"
        });
    }
});

// CREATE job application
router.post("/", async (req, res) => {
    try {
        const {
            candidate_id,
            job_role_id,
            application_date,
            application_status,
            recruiter_id,
            expected_salary,
            notice_period_days,
            recruiter_notes
        } = req.body;

        if (!candidate_id || !job_role_id) {
            return res.status(400).json({
                success: false,
                message: "candidate_id and job_role_id are required"
            });
        }

        const result = await pool.query(`
            INSERT INTO job_applications
            (
                candidate_id,
                job_role_id,
                application_date,
                application_status,
                recruiter_id,
                expected_salary,
                notice_period_days,
                recruiter_notes
            )
            VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING
                application_id,
                candidate_id,
                job_role_id,
                application_date,
                application_status,
                recruiter_id,
                expected_salary,
                notice_period_days,
                recruiter_notes,
                created_at;
        `, [
            candidate_id,
            job_role_id,
            application_date || null,
            application_status || "APPLIED",
            recruiter_id || null,
            expected_salary || null,
            notice_period_days || null,
            recruiter_notes || null
        ]);

        res.status(201).json({
            success: true,
            message: "Job application created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating job application:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Candidate, job role or recruiter does not exist"
            });
        }

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Candidate is already applying for this job role"
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid job application data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create job application"
        });
    }
});

// UPDATE job application
router.put("/:id", async (req, res) => {
    try {
        const applicationId = req.params.id;

        const {
            candidate_id,
            job_role_id,
            application_date,
            application_status,
            recruiter_id,
            expected_salary,
            notice_period_days,
            recruiter_notes
        } = req.body;

        const result = await pool.query(`
            UPDATE job_applications
            SET
                candidate_id = $1,
                job_role_id = $2,
                application_date = $3,
                application_status = $4,
                recruiter_id = $5,
                expected_salary = $6,
                notice_period_days = $7,
                recruiter_notes = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE application_id = $9
            RETURNING
                application_id,
                candidate_id,
                job_role_id,
                application_date,
                application_status,
                recruiter_id,
                expected_salary,
                notice_period_days,
                recruiter_notes,
                updated_at;
        `, [
            candidate_id,
            job_role_id,
            application_date || null,
            application_status || "APPLIED",
            recruiter_id || null,
            expected_salary || null,
            notice_period_days || null,
            recruiter_notes || null,
            applicationId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job application not found"
            });
        }

        res.json({
            success: true,
            message: "Job application updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating job application:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Candidate, job role or recruiter does not exist"
            });
        }

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Candidate is already applying for this job role"
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid job application data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update job application"
        });
    }
});

// UPDATE application status
router.patch("/:id/status", async (req, res) => {
    try {
        const applicationId = req.params.id;
        const { application_status } = req.body;

        const allowedStatuses = [
            "APPLIED",
            "SCREENING",
            "SHORTLISTED",
            "INTERVIEW",
            "OFFERED",
            "HIRED",
            "REJECTED",
            "WITHDRAWN"
        ];

        if (!application_status) {
            return res.status(400).json({
                success: false,
                message: "application_status is required"
            });
        }

        if (!allowedStatuses.includes(application_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application status"
            });
        }

        const result = await pool.query(`
            UPDATE job_applications
            SET
                application_status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE application_id = $2
            RETURNING
                application_id,
                candidate_id,
                job_role_id,
                application_status,
                updated_at;
        `, [
            application_status,
            applicationId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job application not found"
            });
        }

        res.json({
            success: true,
            message: "Job application status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating application status:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update application status"
        });
    }
});

module.exports = router;