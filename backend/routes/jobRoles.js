const express = require("express");
const pool = require("../db");

const router = express.Router();


// GET all job roles
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                role_id,
                role_name,
                description,
                created_at
            FROM job_roles
            ORDER BY role_id;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching job roles:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch job roles"
        });
    }
});


// GET job role by ID
router.get("/:id", async (req, res) => {
    try {
        const roleId = req.params.id;

        const result = await pool.query(`
            SELECT
                role_id,
                role_name,
                description,
                created_at
            FROM job_roles
            WHERE role_id = $1;
        `, [roleId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job role not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching job role:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch job role"
        });
    }
});


// POST create job role
router.post("/", async (req, res) => {
    try {
        const {
            role_name,
            description
        } = req.body;

        if (!role_name) {
            return res.status(400).json({
                success: false,
                message: "role_name is required"
            });
        }

        const result = await pool.query(`
            INSERT INTO job_roles (
                role_name,
                description
            )
            VALUES ($1, $2)
            RETURNING
                role_id,
                role_name,
                description,
                created_at;
        `, [
            role_name,
            description || null
        ]);

        res.status(201).json({
            success: true,
            message: "Job role created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating job role:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Job role already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create job role"
        });
    }
});


// PUT update job role
router.put("/:id", async (req, res) => {
    try {
        const roleId = req.params.id;

        const {
            role_name,
            description
        } = req.body;

        if (!role_name) {
            return res.status(400).json({
                success: false,
                message: "role_name is required"
            });
        }

        const result = await pool.query(`
            UPDATE job_roles
            SET
                role_name = $1,
                description = $2
            WHERE role_id = $3
            RETURNING
                role_id,
                role_name,
                description,
                created_at;
        `, [
            role_name,
            description || null,
            roleId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Job role not found"
            });
        }

        res.json({
            success: true,
            message: "Job role updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating job role:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Job role already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update job role"
        });
    }
});


module.exports = router;