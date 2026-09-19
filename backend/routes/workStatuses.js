const express = require("express");
const pool = require("../db");

const router = express.Router();


// GET all work statuses
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                work_status_id,
                status_name,
                description,
                created_at
            FROM work_statuses
            ORDER BY work_status_id;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching work statuses:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch work statuses"
        });
    }
});


// GET work status by ID
router.get("/:id", async (req, res) => {
    try {
        const workStatusId = req.params.id;

        const result = await pool.query(`
            SELECT
                work_status_id,
                status_name,
                description,
                created_at
            FROM work_statuses
            WHERE work_status_id = $1;
        `, [workStatusId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Work status not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching work status:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch work status"
        });
    }
});


// POST create work status
router.post("/", async (req, res) => {
    try {
        const {
            status_name,
            description
        } = req.body;

        if (!status_name) {
            return res.status(400).json({
                success: false,
                message: "status_name is required"
            });
        }

        const result = await pool.query(`
            INSERT INTO work_statuses (
                status_name,
                description
            )
            VALUES ($1, $2)
            RETURNING
                work_status_id,
                status_name,
                description,
                created_at;
        `, [
            status_name,
            description || null
        ]);

        res.status(201).json({
            success: true,
            message: "Work status created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating work status:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Work status already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create work status"
        });
    }
});


// PUT update work status
router.put("/:id", async (req, res) => {
    try {
        const workStatusId = req.params.id;

        const {
            status_name,
            description
        } = req.body;

        if (!status_name) {
            return res.status(400).json({
                success: false,
                message: "status_name is required"
            });
        }

        const result = await pool.query(`
            UPDATE work_statuses
            SET
                status_name = $1,
                description = $2
            WHERE work_status_id = $3
            RETURNING
                work_status_id,
                status_name,
                description,
                created_at;
        `, [
            status_name,
            description || null,
            workStatusId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Work status not found"
            });
        }

        res.json({
            success: true,
            message: "Work status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating work status:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Work status already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update work status"
        });
    }
});


module.exports = router;
