const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all candidates
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                candidate_id,
                candidate_code,
                first_name,
                last_name,
                first_name || ' ' || last_name AS candidate_name,
                email,
                phone,
                resume_url,
                experience_years,
                highest_qualification,
                current_company,
                current_designation,
                candidate_status,
                source,
                applied_date,
                created_at,
                updated_at
            FROM candidates
            ORDER BY candidate_id DESC;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching candidates:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch candidates"
        });
    }
});

// GET candidate by ID
router.get("/:id", async (req, res) => {
    try {
        const candidateId = req.params.id;

        const result = await pool.query(`
            SELECT
                candidate_id,
                candidate_code,
                first_name,
                last_name,
                first_name || ' ' || last_name AS candidate_name,
                email,
                phone,
                resume_url,
                experience_years,
                highest_qualification,
                current_company,
                current_designation,
                candidate_status,
                source,
                applied_date,
                created_at,
                updated_at
            FROM candidates
            WHERE candidate_id = $1;
        `, [candidateId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Candidate not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching candidate:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch candidate"
        });
    }
});

// CREATE candidate
router.post("/", async (req, res) => {
    try {
        const {
            candidate_code,
            first_name,
            last_name,
            email,
            phone,
            resume_url,
            experience_years,
            highest_qualification,
            current_company,
            current_designation,
            candidate_status,
            source,
            applied_date
        } = req.body;

        if (
            !candidate_code ||
            !first_name ||
            !last_name ||
            !email
        ) {
            return res.status(400).json({
                success: false,
                message: "candidate_code, first_name, last_name and email are required"
            });
        }

        const result = await pool.query(`
            INSERT INTO candidates
            (
                candidate_code,
                first_name,
                last_name,
                email,
                phone,
                resume_url,
                experience_years,
                highest_qualification,
                current_company,
                current_designation,
                candidate_status,
                source,
                applied_date
            )
            VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING
                candidate_id,
                candidate_code,
                first_name,
                last_name,
                email,
                phone,
                experience_years,
                highest_qualification,
                current_company,
                current_designation,
                candidate_status,
                source,
                applied_date,
                created_at;
        `, [
            candidate_code,
            first_name,
            last_name,
            email,
            phone || null,
            resume_url || null,
            experience_years || null,
            highest_qualification || null,
            current_company || null,
            current_designation || null,
            candidate_status || "NEW",
            source || null,
            applied_date || null
        ]);

        res.status(201).json({
            success: true,
            message: "Candidate created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating candidate:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Candidate code or email already exists"
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid candidate data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create candidate"
        });
    }
});

// UPDATE candidate
router.put("/:id", async (req, res) => {
    try {
        const candidateId = req.params.id;

        const {
            candidate_code,
            first_name,
            last_name,
            email,
            phone,
            resume_url,
            experience_years,
            highest_qualification,
            current_company,
            current_designation,
            candidate_status,
            source,
            applied_date
        } = req.body;

        const result = await pool.query(`
            UPDATE candidates
            SET
                candidate_code = $1,
                first_name = $2,
                last_name = $3,
                email = $4,
                phone = $5,
                resume_url = $6,
                experience_years = $7,
                highest_qualification = $8,
                current_company = $9,
                current_designation = $10,
                candidate_status = $11,
                source = $12,
                applied_date = $13,
                updated_at = CURRENT_TIMESTAMP
            WHERE candidate_id = $14
            RETURNING
                candidate_id,
                candidate_code,
                first_name,
                last_name,
                email,
                phone,
                experience_years,
                highest_qualification,
                current_company,
                current_designation,
                candidate_status,
                source,
                applied_date,
                updated_at;
        `, [
            candidate_code,
            first_name,
            last_name,
            email,
            phone || null,
            resume_url || null,
            experience_years || null,
            highest_qualification || null,
            current_company || null,
            current_designation || null,
            candidate_status || "NEW",
            source || null,
            applied_date || null,
            candidateId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Candidate not found"
            });
        }

        res.json({
            success: true,
            message: "Candidate updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating candidate:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Candidate code or email already exists"
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid candidate data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update candidate"
        });
    }
});

// UPDATE candidate status
router.patch("/:id/status", async (req, res) => {
    try {
        const candidateId = req.params.id;
        const { candidate_status } = req.body;

        const allowedStatuses = [
            "NEW",
            "SCREENING",
            "SHORTLISTED",
            "INTERVIEW",
            "OFFERED",
            "HIRED",
            "REJECTED",
            "WITHDRAWN"
        ];

        if (!candidate_status) {
            return res.status(400).json({
                success: false,
                message: "candidate_status is required"
            });
        }

        if (!allowedStatuses.includes(candidate_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid candidate status"
            });
        }

        const result = await pool.query(`
            UPDATE candidates
            SET
                candidate_status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE candidate_id = $2
            RETURNING
                candidate_id,
                candidate_code,
                first_name,
                last_name,
                candidate_status,
                updated_at;
        `, [
            candidate_status,
            candidateId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Candidate not found"
            });
        }

        res.json({
            success: true,
            message: "Candidate status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating candidate status:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update candidate status"
        });
    }
});

module.exports = router;