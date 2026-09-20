const express = require("express");
const pool = require("../db");

const router = express.Router();


// GET all attendance records
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                a.attendance_id,
                a.employee_id,
                e.employee_code,
                e.first_name,
                e.last_name,
                a.attendance_date,
                a.attendance_status,
                a.check_in_time,
                a.check_out_time,
                a.working_hours,
                a.remarks,
                a.created_at,
                a.updated_at
            FROM attendance a
            JOIN employees e
                ON a.employee_id = e.employee_id
            ORDER BY a.attendance_date DESC, a.employee_id;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching attendance:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch attendance records"
        });
    }
});


// GET attendance by ID
router.get("/:id", async (req, res) => {
    try {
        const attendanceId = req.params.id;

        const result = await pool.query(`
            SELECT
                a.attendance_id,
                a.employee_id,
                e.employee_code,
                e.first_name,
                e.last_name,
                a.attendance_date,
                a.attendance_status,
                a.check_in_time,
                a.check_out_time,
                a.working_hours,
                a.remarks,
                a.created_at,
                a.updated_at
            FROM attendance a
            JOIN employees e
                ON a.employee_id = e.employee_id
            WHERE a.attendance_id = $1;
        `, [attendanceId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching attendance record:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch attendance record"
        });
    }
});


// GET attendance for a specific employee
router.get("/employee/:employeeId", async (req, res) => {
    try {
        const employeeId = req.params.employeeId;

        const result = await pool.query(`
            SELECT
                a.attendance_id,
                a.employee_id,
                e.employee_code,
                e.first_name,
                e.last_name,
                a.attendance_date,
                a.attendance_status,
                a.check_in_time,
                a.check_out_time,
                a.working_hours,
                a.remarks
            FROM attendance a
            JOIN employees e
                ON a.employee_id = e.employee_id
            WHERE a.employee_id = $1
            ORDER BY a.attendance_date DESC;
        `, [employeeId]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching employee attendance:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch employee attendance"
        });
    }
});


// POST create attendance record
router.post("/", async (req, res) => {
    try {
        const {
            employee_id,
            attendance_date,
            attendance_status,
            check_in_time,
            check_out_time,
            working_hours,
            remarks
        } = req.body;

        if (
            !employee_id ||
            !attendance_date ||
            !attendance_status
        ) {
            return res.status(400).json({
                success: false,
                message: "employee_id, attendance_date and attendance_status are required"
            });
        }

        const result = await pool.query(`
            INSERT INTO attendance (
                employee_id,
                attendance_date,
                attendance_status,
                check_in_time,
                check_out_time,
                working_hours,
                remarks
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING
                attendance_id,
                employee_id,
                attendance_date,
                attendance_status,
                check_in_time,
                check_out_time,
                working_hours,
                remarks,
                created_at;
        `, [
            employee_id,
            attendance_date,
            attendance_status,
            check_in_time || null,
            check_out_time || null,
            working_hours || null,
            remarks || null
        ]);

        res.status(201).json({
            success: true,
            message: "Attendance record created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating attendance:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Attendance already exists for this employee and date"
            });
        }

        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Employee does not exist"
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid attendance status"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create attendance record"
        });
    }
});


// PUT update attendance record
router.put("/:id", async (req, res) => {
    try {
        const attendanceId = req.params.id;

        const {
            attendance_date,
            attendance_status,
            check_in_time,
            check_out_time,
            working_hours,
            remarks
        } = req.body;

        if (
            !attendance_date ||
            !attendance_status
        ) {
            return res.status(400).json({
                success: false,
                message: "attendance_date and attendance_status are required"
            });
        }

        const result = await pool.query(`
            UPDATE attendance
            SET
                attendance_date = $1,
                attendance_status = $2,
                check_in_time = $3,
                check_out_time = $4,
                working_hours = $5,
                remarks = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE attendance_id = $7
            RETURNING
                attendance_id,
                employee_id,
                attendance_date,
                attendance_status,
                check_in_time,
                check_out_time,
                working_hours,
                remarks,
                updated_at;
        `, [
            attendance_date,
            attendance_status,
            check_in_time || null,
            check_out_time || null,
            working_hours || null,
            remarks || null,
            attendanceId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Attendance record not found"
            });
        }

        res.json({
            success: true,
            message: "Attendance record updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating attendance:", error);

        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "Attendance already exists for this employee and date"
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid attendance status"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update attendance record"
        });
    }
});


module.exports = router;