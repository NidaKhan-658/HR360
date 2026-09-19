const express = require("express");
const pool = require("../db");

const router = express.Router();


// GET all departments
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                department_id,
                department_name,
                description,
                created_at
            FROM departments
            ORDER BY department_id;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching departments:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch departments"
        });
    }
});


// GET department by ID
router.get("/:id", async (req, res) => {
    try {
        const departmentId = req.params.id;

        const result = await pool.query(`
            SELECT
                department_id,
                department_name,
                description,
                created_at
            FROM departments
            WHERE department_id = $1;
        `, [departmentId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching department:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch department"
        });
    }
});


// POST create department
router.post("/", async (req, res) => {
    try {
        const {
            department_name,
            description
        } = req.body;

        if (!department_name) {
            return res.status(400).json({
                success: false,
                message: "department_name is required"
            });
        }

        const result = await pool.query(`
            INSERT INTO departments (
                department_name,
                description
            )
            VALUES ($1, $2)
            RETURNING
                department_id,
                department_name,
                description,
                created_at;
        `, [
            department_name,
            description || null
        ]);

        res.status(201).json({
            success: true,
            message: "Department created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating department:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Department already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create department"
        });
    }
});


// PUT update department
router.put("/:id", async (req, res) => {
    try {
        const departmentId = req.params.id;

        const {
            department_name,
            description
        } = req.body;

        if (!department_name) {
            return res.status(400).json({
                success: false,
                message: "department_name is required"
            });
        }

        const result = await pool.query(`
            UPDATE departments
            SET
                department_name = $1,
                description = $2
            WHERE department_id = $3
            RETURNING
                department_id,
                department_name,
                description,
                created_at;
        `, [
            department_name,
            description || null,
            departmentId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Department not found"
            });
        }

        res.json({
            success: true,
            message: "Department updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating department:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Department already exists"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update department"
        });
    }
});


module.exports = router;