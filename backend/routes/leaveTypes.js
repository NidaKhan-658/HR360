const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all leave types
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                leave_type_id,
                leave_type_name,
                description,
                default_days,
                created_at
            FROM leave_types
            ORDER BY leave_type_id;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching leave types:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch leave types"
        });
    }
});

// GET leave type by ID
router.get("/:id", async (req, res) => {
    try {
        const leaveTypeId = req.params.id;

        const result = await pool.query(`
            SELECT
                leave_type_id,
                leave_type_name,
                description,
                default_days,
                created_at
            FROM leave_types
            WHERE leave_type_id = $1;
        `, [leaveTypeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Leave type not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching leave type:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch leave type"
        });
    }
});

// CREATE leave type
router.post("/", async (req, res) => {
    try {
        const {
            leave_type_name,
            description,
            default_days
        } = req.body;

        if (!leave_type_name) {
            return res.status(400).json({
                success: false,
                message: "leave_type_name is required"
            });
        }

        const result = await pool.query(`
            INSERT INTO leave_types
                (leave_type_name, description, default_days)
            VALUES
                ($1, $2, $3)
            RETURNING
                leave_type_id,
                leave_type_name,
                description,
                default_days,
                created_at;
        `, [
            leave_type_name,
            description || null,
            default_days || null
        ]);

        res.status(201).json({
            success: true,
            message: "Leave type created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating leave type:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Leave type already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create leave type"
        });
    }
});

// UPDATE leave type
router.put("/:id", async (req, res) => {
    try {
        const leaveTypeId = req.params.id;

        const {
            leave_type_name,
            description,
            default_days
        } = req.body;

        if (!leave_type_name) {
            return res.status(400).json({
                success: false,
                message: "leave_type_name is required"
            });
        }

        const result = await pool.query(`
            UPDATE leave_types
            SET
                leave_type_name = $1,
                description = $2,
                default_days = $3
            WHERE leave_type_id = $4
            RETURNING
                leave_type_id,
                leave_type_name,
                description,
                default_days,
                created_at;
        `, [
            leave_type_name,
            description || null,
            default_days || null,
            leaveTypeId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Leave type not found"
            });
        }

        res.json({
            success: true,
            message: "Leave type updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating leave type:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Leave type name already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update leave type"
        });
    }
});

module.exports = router;