const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all employee training records
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                et.employee_training_id,

                et.employee_id,
                e.employee_code,
                e.first_name || ' ' || e.last_name AS employee_name,

                et.training_id,
                tp.training_name,
                tp.training_category,

                et.enrollment_date,
                et.attendance_status,
                et.completion_date,
                et.score,
                et.certificate_issued,
                et.employee_feedback,

                et.created_at,
                et.updated_at

            FROM employee_training et

            JOIN employees e
                ON et.employee_id = e.employee_id

            JOIN training_programs tp
                ON et.training_id = tp.training_id

            ORDER BY et.employee_training_id DESC;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching employee training:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch employee training records"
        });
    }
});

// GET employee training by ID
router.get("/:id", async (req, res) => {
    try {
        const employeeTrainingId = req.params.id;

        const result = await pool.query(`
            SELECT
                et.employee_training_id,

                et.employee_id,
                e.employee_code,
                e.first_name || ' ' || e.last_name AS employee_name,

                et.training_id,
                tp.training_name,
                tp.training_category,

                et.enrollment_date,
                et.attendance_status,
                et.completion_date,
                et.score,
                et.certificate_issued,
                et.employee_feedback,

                et.created_at,
                et.updated_at

            FROM employee_training et

            JOIN employees e
                ON et.employee_id = e.employee_id

            JOIN training_programs tp
                ON et.training_id = tp.training_id

            WHERE et.employee_training_id = $1;
        `, [employeeTrainingId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee training record not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching employee training record:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch employee training record"
        });
    }
});

// GET training records for employee
router.get("/employee/:employeeId", async (req, res) => {
    try {
        const employeeId = req.params.employeeId;

        const result = await pool.query(`
            SELECT
                et.employee_training_id,
                et.employee_id,
                e.employee_code,
                e.first_name || ' ' || e.last_name AS employee_name,

                et.training_id,
                tp.training_name,
                tp.training_category,

                et.enrollment_date,
                et.attendance_status,
                et.completion_date,
                et.score,
                et.certificate_issued,
                et.employee_feedback,

                et.created_at,
                et.updated_at

            FROM employee_training et

            JOIN employees e
                ON et.employee_id = e.employee_id

            JOIN training_programs tp
                ON et.training_id = tp.training_id

            WHERE et.employee_id = $1

            ORDER BY et.employee_training_id DESC;
        `, [employeeId]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching employee training records:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch employee training records"
        });
    }
});

// ENROLL employee in training
router.post("/", async (req, res) => {
    try {
        const {
            employee_id,
            training_id,
            enrollment_date
        } = req.body;

        if (!employee_id || !training_id) {
            return res.status(400).json({
                success: false,
                message: "employee_id and training_id are required"
            });
        }

        const result = await pool.query(`
            INSERT INTO employee_training
            (
                employee_id,
                training_id,
                enrollment_date
            )
            VALUES
            ($1, $2, $3)
            RETURNING
                employee_training_id,
                employee_id,
                training_id,
                enrollment_date,
                attendance_status,
                created_at;
        `, [
            employee_id,
            training_id,
            enrollment_date || null
        ]);

        res.status(201).json({
            success: true,
            message: "Employee enrolled in training successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error enrolling employee:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Employee or training program does not exist"
            });
        }

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Employee is already enrolled in this training"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to enroll employee"
        });
    }
});

// UPDATE employee training record
router.put("/:id", async (req, res) => {
    try {
        const employeeTrainingId = req.params.id;

        const {
            attendance_status,
            completion_date,
            score,
            certificate_issued,
            employee_feedback
        } = req.body;

        const result = await pool.query(`
            UPDATE employee_training
            SET
                attendance_status = $1,
                completion_date = $2,
                score = $3,
                certificate_issued = $4,
                employee_feedback = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE employee_training_id = $6
            RETURNING
                employee_training_id,
                employee_id,
                training_id,
                attendance_status,
                completion_date,
                score,
                certificate_issued,
                employee_feedback,
                updated_at;
        `, [
            attendance_status,
            completion_date || null,
            score || null,
            certificate_issued ?? false,
            employee_feedback || null,
            employeeTrainingId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee training record not found"
            });
        }

        res.json({
            success: true,
            message: "Employee training record updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating employee training:", error);

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid employee training data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update employee training record"
        });
    }
});

// UPDATE employee training status
router.patch("/:id/status", async (req, res) => {
    try {
        const employeeTrainingId = req.params.id;
        const {
            attendance_status,
            completion_date,
            score,
            certificate_issued
        } = req.body;

        const allowedStatuses = [
            "ENROLLED",
            "ATTENDED",
            "COMPLETED",
            "DID_NOT_ATTEND",
            "CANCELLED"
        ];

        if (!attendance_status) {
            return res.status(400).json({
                success: false,
                message: "attendance_status is required"
            });
        }

        if (!allowedStatuses.includes(attendance_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid attendance status"
            });
        }

        const result = await pool.query(`
            UPDATE employee_training
            SET
                attendance_status = $1,
                completion_date = $2,
                score = $3,
                certificate_issued = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE employee_training_id = $5
            RETURNING
                employee_training_id,
                employee_id,
                training_id,
                attendance_status,
                completion_date,
                score,
                certificate_issued,
                updated_at;
        `, [
            attendance_status,
            completion_date || null,
            score || null,
            certificate_issued ?? false,
            employeeTrainingId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee training record not found"
            });
        }

        res.json({
            success: true,
            message: "Employee training status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating employee training status:", error);

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid employee training data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update employee training status"
        });
    }
});

module.exports = router;