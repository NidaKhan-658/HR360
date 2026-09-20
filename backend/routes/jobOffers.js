const express = require("express");
const pool = require("../db");

const router = express.Router();


// GET all job offers
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                jo.offer_id,
                jo.application_id,
                c.candidate_code,
                c.first_name,
                c.last_name,
                jr.role_name,
                jo.offer_date,
                jo.joining_date,
                jo.offered_salary,
                jo.employment_type,
                jo.offer_status,
                jo.accepted_date,
                jo.rejection_reason,
                jo.created_at,
                jo.updated_at
            FROM job_offers jo
            JOIN job_applications ja
                ON jo.application_id = ja.application_id
            JOIN candidates c
                ON ja.candidate_id = c.candidate_id
            JOIN job_roles jr
                ON ja.job_role_id = jr.role_id
            ORDER BY jo.offer_id;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching job offers:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch job offers"
        });
    }
});


// GET job offer by ID
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                jo.offer_id,
                jo.application_id,
                c.candidate_code,
                c.first_name,
                c.last_name,
                c.email,
                jr.role_name,
                jo.offer_date,
                jo.joining_date,
                jo.offered_salary,
                jo.employment_type,
                jo.offer_status,
                jo.accepted_date,
                jo.rejection_reason,
                jo.created_at,
                jo.updated_at
            FROM job_offers jo
            JOIN job_applications ja
                ON jo.application_id = ja.application_id
            JOIN candidates c
                ON ja.candidate_id = c.candidate_id
            JOIN job_roles jr
                ON ja.job_role_id = jr.role_id
            WHERE jo.offer_id = $1;
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job offer not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching job offer:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch job offer"
        });
    }
});


// GET job offer by application ID
// IMPORTANT: This route must be before /:id
router.get("/application/:applicationId", async (req, res) => {
    try {
        const { applicationId } = req.params;

        const result = await pool.query(`
            SELECT
                jo.offer_id,
                jo.application_id,
                c.candidate_code,
                c.first_name,
                c.last_name,
                c.email,
                jr.role_name,
                jo.offer_date,
                jo.joining_date,
                jo.offered_salary,
                jo.employment_type,
                jo.offer_status,
                jo.accepted_date,
                jo.rejection_reason,
                jo.created_at,
                jo.updated_at
            FROM job_offers jo
            JOIN job_applications ja
                ON jo.application_id = ja.application_id
            JOIN candidates c
                ON ja.candidate_id = c.candidate_id
            JOIN job_roles jr
                ON ja.job_role_id = jr.role_id
            WHERE jo.application_id = $1;
        `, [applicationId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No job offer found for this application"
            });
        }

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching offer by application:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch job offer"
        });
    }
});


// POST create a new job offer
router.post("/", async (req, res) => {
    try {
        const {
            application_id,
            offer_date,
            joining_date,
            offered_salary,
            employment_type,
            offer_status,
            accepted_date,
            rejection_reason
        } = req.body;

        if (!application_id || !offered_salary) {
            return res.status(400).json({
                success: false,
                message: "application_id and offered_salary are required"
            });
        }

        const result = await pool.query(`
            INSERT INTO job_offers (
                application_id,
                offer_date,
                joining_date,
                offered_salary,
                employment_type,
                offer_status,
                accepted_date,
                rejection_reason
            )
            VALUES (
                $1,
                COALESCE($2, CURRENT_DATE),
                $3,
                $4,
                COALESCE($5, 'FULL_TIME'),
                COALESCE($6, 'DRAFT'),
                $7,
                $8
            )
            RETURNING *;
        `, [
            application_id,
            offer_date,
            joining_date,
            offered_salary,
            employment_type,
            offer_status,
            accepted_date,
            rejection_reason
        ]);

        res.status(201).json({
            success: true,
            message: "Job offer created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating job offer:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create job offer"
        });
    }
});


// PUT update a job offer
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            offer_date,
            joining_date,
            offered_salary,
            employment_type,
            offer_status,
            accepted_date,
            rejection_reason
        } = req.body;

        const result = await pool.query(`
            UPDATE job_offers
            SET
                offer_date = COALESCE($1, offer_date),
                joining_date = COALESCE($2, joining_date),
                offered_salary = COALESCE($3, offered_salary),
                employment_type = COALESCE($4, employment_type),
                offer_status = COALESCE($5, offer_status),
                accepted_date = COALESCE($6, accepted_date),
                rejection_reason = COALESCE($7, rejection_reason),
                updated_at = CURRENT_TIMESTAMP
            WHERE offer_id = $8
            RETURNING *;
        `, [
            offer_date,
            joining_date,
            offered_salary,
            employment_type,
            offer_status,
            accepted_date,
            rejection_reason,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job offer not found"
            });
        }

        res.json({
            success: true,
            message: "Job offer updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating job offer:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update job offer"
        });
    }
});


// PATCH update offer status
router.patch("/:id/status", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            offer_status,
            accepted_date,
            rejection_reason
        } = req.body;

        if (!offer_status) {
            return res.status(400).json({
                success: false,
                message: "offer_status is required"
            });
        }

        const result = await pool.query(`
            UPDATE job_offers
            SET
                offer_status = $1,
                accepted_date = $2,
                rejection_reason = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE offer_id = $4
            RETURNING *;
        `, [
            offer_status,
            accepted_date || null,
            rejection_reason || null,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job offer not found"
            });
        }

        res.json({
            success: true,
            message: "Job offer status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating job offer status:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update job offer status"
        });
    }
});


module.exports = router;