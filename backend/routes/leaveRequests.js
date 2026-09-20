const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all leave requests
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                lr.leave_request_id,
                lr.employee_id,
                e.employee_code,
                e.first_name || ' ' || e.last_name AS employee_name,
                lr.leave_type_id,
                lt.leave_type_name,
                lr.start_date,
                lr.end_date,
                lr.total_days,
                lr.reason,
                lr.request_status,
                lr.approved_by,
                approver.first_name || ' ' || approver.last_name AS approved_by_name,
                lr.approved_at,
                lr.created_at,
                lr.updated_at
            FROM leave_requests lr
            JOIN employees e
                ON lr.employee_id = e.employee_id
            JOIN leave_types lt
                ON lr.leave_type_id = lt.leave_type_id
            LEFT JOIN employees approver
                ON lr.approved_by = approver.employee_id
            ORDER BY lr.leave_request_id DESC;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching leave requests:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch leave requests"
        });
    }
});

// GET leave request by ID
router.get("/:id", async (req, res) => {
    try {
        const leaveRequestId = req.params.id;

        const result = await pool.query(`
            SELECT
                lr.leave_request_id,
                lr.employee_id,
                e.employee_code,
                e.first_name || ' ' || e.last_name AS employee_name,
                lr.leave_type_id,
                lt.leave_type_name,
                lr.start_date,
                lr.end_date,
                lr.total_days,
                lr.reason,
                lr.request_status,
                lr.approved_by,
                approver.first_name || ' ' || approver.last_name AS approved_by_name,
                lr.approved_at,
                lr.created_at,
                lr.updated_at
            FROM leave_requests lr
            JOIN employees e
                ON lr.employee_id = e.employee_id
            JOIN leave_types lt
                ON lr.leave_type_id = lt.leave_type_id
            LEFT JOIN employees approver
                ON lr.approved_by = approver.employee_id
            WHERE lr.leave_request_id = $1;
        `, [leaveRequestId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching leave request:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch leave request"
        });
    }
});

// GET leave requests for an employee
router.get("/employee/:employeeId", async (req, res) => {
    try {
        const employeeId = req.params.employeeId;

        const result = await pool.query(`
            SELECT
                lr.leave_request_id,
                lr.employee_id,
                e.employee_code,
                e.first_name || ' ' || e.last_name AS employee_name,
                lr.leave_type_id,
                lt.leave_type_name,
                lr.start_date,
                lr.end_date,
                lr.total_days,
                lr.reason,
                lr.request_status,
                lr.approved_by,
                approver.first_name || ' ' || approver.last_name AS approved_by_name,
                lr.approved_at,
                lr.created_at,
                lr.updated_at
            FROM leave_requests lr
            JOIN employees e
                ON lr.employee_id = e.employee_id
            JOIN leave_types lt
                ON lr.leave_type_id = lt.leave_type_id
            LEFT JOIN employees approver
                ON lr.approved_by = approver.employee_id
            WHERE lr.employee_id = $1
            ORDER BY lr.leave_request_id DESC;
        `, [employeeId]);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching employee leave requests:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch employee leave requests"
        });
    }
});

// CREATE leave request
router.post("/", async (req, res) => {
    try {
        const {
            employee_id,
            leave_type_id,
            start_date,
            end_date,
            total_days,
            reason
        } = req.body;

        if (
            !employee_id ||
            !leave_type_id ||
            !start_date ||
            !end_date ||
            !total_days
        ) {
            return res.status(400).json({
                success: false,
                message: "employee_id, leave_type_id, start_date, end_date and total_days are required"
            });
        }

        const result = await pool.query(`
            INSERT INTO leave_requests
                (
                    employee_id,
                    leave_type_id,
                    start_date,
                    end_date,
                    total_days,
                    reason
                )
            VALUES
                ($1, $2, $3, $4, $5, $6)
            RETURNING
                leave_request_id,
                employee_id,
                leave_type_id,
                start_date,
                end_date,
                total_days,
                reason,
                request_status,
                created_at;
        `, [
            employee_id,
            leave_type_id,
            start_date,
            end_date,
            total_days,
            reason || null
        ]);

        res.status(201).json({
            success: true,
            message: "Leave request created successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error creating leave request:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Employee or leave type does not exist"
            });
        }

        if (error.code === "23514") {
            return res.status(400).json({
                success: false,
                message: "Invalid leave request data"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create leave request"
        });
    }
});

// UPDATE leave request status
router.patch("/:id/status", async (req, res) => {
    try {
        const leaveRequestId = req.params.id;
        const {
            request_status,
            approved_by
        } = req.body;

        const allowedStatuses = [
            "PENDING",
            "APPROVED",
            "REJECTED",
            "CANCELLED"
        ];

        if (!request_status) {
            return res.status(400).json({
                success: false,
                message: "request_status is required"
            });
        }

        if (!allowedStatuses.includes(request_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid leave request status"
            });
        }

        let result;

        if (request_status === "APPROVED") {
            if (!approved_by) {
                return res.status(400).json({
                    success: false,
                    message: "approved_by is required when approving a leave request"
                });
            }

            result = await pool.query(`
                UPDATE leave_requests
                SET
                    request_status = $1,
                    approved_by = $2,
                    approved_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE leave_request_id = $3
                RETURNING
                    leave_request_id,
                    request_status,
                    approved_by,
                    approved_at,
                    updated_at;
            `, [
                request_status,
                approved_by,
                leaveRequestId
            ]);

        } else {
            result = await pool.query(`
                UPDATE leave_requests
                SET
                    request_status = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE leave_request_id = $2
                RETURNING
                    leave_request_id,
                    request_status,
                    approved_by,
                    approved_at,
                    updated_at;
            `, [
                request_status,
                leaveRequestId
            ]);
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Leave request not found"
            });
        }

        res.json({
            success: true,
            message: "Leave request status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating leave request status:", error);

        if (error.code === "23503") {
            return res.status(400).json({
                success: false,
                message: "Approving employee does not exist"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update leave request status"
        });
    }
});

module.exports = router;