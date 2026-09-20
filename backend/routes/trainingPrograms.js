const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all training programs
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                training_id,
                training_name,
                description,
                training_category,
                trainer_name,
                start_date,
                end_date,
                duration_hours,
                training_status,
                created_at,
                updated_at
            FROM training_programs
            ORDER BY training_id DESC;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching training programs:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch training programs"
        });
    }
});

// GET training program by ID
router.get("/:id", async (req, res) => {
    try {
        const trainingId = req.params.id;

        const result = await pool.query(`
            SELECT
                training_id,
                training_name,
                description,
                training_category,
                trainer_name,
                start_date,
                end_date,
                duration_hours,
                training_status,
                created_at,
                updated_at
            FROM training_programs
            WHERE training_id = $1;
        `, [trainingId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Training program not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching training program:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch training program"
        });
    }
});

// CREATE training program
router.post("/", async (req, res) => {
    try {
        const {
            training_name,
            description,
            training_category,
            trainer_name,
            start_date,
            end_date,
            duration_hours,
            training_status
        } = req.body;

        if (!training_name) {
            return res.status(400).json({
                success: false,
                message: "training_name is required"
            });
        }

        const result = await pool.query(`
            INSERT INTO training_programs
            (
                training_name,
                description,
                training_category,
                trainer_name,
                start_date,
                end_date,
                duration_hours,
                training_status
            )
            VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING
                training_id,
                training_name,
                description,
                training_category,
                trainer_name,
                start_date,
                end_date,
                duration_hours,
                training_status,
                created_at;
        `, [
            training_name,
            description || null,
            training_category || null,
            trainer_name || null,
            start_date || null,
            end_date || null,
            duration_hours || null,
            training_status || "PLANNED"
        ]);

        res.status(201).json({
            success: true,
            message: "Training program created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating training program:", error);

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid training program data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create training program"
        });
    }
});

// UPDATE training program
router.put("/:id", async (req, res) => {
    try {
        const trainingId = req.params.id;

        const {
            training_name,
            description,
            training_category,
            trainer_name,
            start_date,
            end_date,
            duration_hours,
            training_status
        } = req.body;

        const result = await pool.query(`
            UPDATE training_programs
            SET
                training_name = $1,
                description = $2,
                training_category = $3,
                trainer_name = $4,
                start_date = $5,
                end_date = $6,
                duration_hours = $7,
                training_status = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE training_id = $9
            RETURNING
                training_id,
                training_name,
                description,
                training_category,
                trainer_name,
                start_date,
                end_date,
                duration_hours,
                training_status,
                updated_at;
        `, [
            training_name,
            description || null,
            training_category || null,
            trainer_name || null,
            start_date || null,
            end_date || null,
            duration_hours || null,
            training_status || "PLANNED",
            trainingId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Training program not found"
            });
        }

        res.json({
            success: true,
            message: "Training program updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating training program:", error);

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid training program data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update training program"
        });
    }
});

// UPDATE training program status
router.patch("/:id/status", async (req, res) => {
    try {
        const trainingId = req.params.id;
        const { training_status } = req.body;

        const allowedStatuses = [
            "PLANNED",
            "ONGOING",
            "COMPLETED",
            "CANCELLED"
        ];

        if (!training_status) {
            return res.status(400).json({
                success: false,
                message: "training_status is required"
            });
        }

        if (!allowedStatuses.includes(training_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid training status"
            });
        }

        const result = await pool.query(`
            UPDATE training_programs
            SET
                training_status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE training_id = $2
            RETURNING
                training_id,
                training_name,
                training_status,
                updated_at;
        `, [
            training_status,
            trainingId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Training program not found"
            });
        }

        res.json({
            success: true,
            message: "Training program status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating training status:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update training status"
        });
    }
});

module.exports = router;