const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET all employees
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                e.employee_id,
                e.employee_code,
                e.first_name,
                e.last_name,
                e.email,
                e.phone,
                d.department_name,
                j.role_name,
                w.status_name AS work_status,
                e.employment_status,
                e.joining_date,
                e.salary_amount,
                e.salary_status,

                CASE
                    WHEN d.department_name = 'HR'
                         AND e.employment_status = 'EMPLOYED'
                        THEN 'ACTIVE'

                    WHEN d.department_name = 'Operations'
                         AND w.status_name IN ('WORKING', 'ONLINE')
                        THEN 'ACTIVE'

                    WHEN d.department_name = 'Finance'
                         AND e.salary_status = 'PAID'
                        THEN 'ACTIVE'

                    ELSE 'NOT ACTIVE'
                END AS department_active_status

            FROM employees e
            JOIN departments d
                ON e.department_id = d.department_id
            JOIN job_roles j
                ON e.role_id = j.role_id
            LEFT JOIN work_statuses w
                ON e.work_status_id = w.work_status_id
            ORDER BY e.employee_id;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Error fetching employees:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch employees"
        });
    }
});


// GET employee by ID
router.get("/:id", async (req, res) => {
    try {
        const employeeId = req.params.id;

        const result = await pool.query(`
            SELECT
                e.employee_id,
                e.employee_code,
                e.first_name,
                e.last_name,
                e.email,
                e.phone,
                d.department_name,
                j.role_name,
                w.status_name AS work_status,
                e.employment_status,
                e.joining_date,
                e.salary_amount,
                e.salary_status,

                CASE
                    WHEN d.department_name = 'HR'
                         AND e.employment_status = 'EMPLOYED'
                        THEN 'ACTIVE'

                    WHEN d.department_name = 'Operations'
                         AND w.status_name IN ('WORKING', 'ONLINE')
                        THEN 'ACTIVE'

                    WHEN d.department_name = 'Finance'
                         AND e.salary_status = 'PAID'
                        THEN 'ACTIVE'

                    ELSE 'NOT ACTIVE'
                END AS department_active_status

            FROM employees e
            JOIN departments d
                ON e.department_id = d.department_id
            JOIN job_roles j
                ON e.role_id = j.role_id
            LEFT JOIN work_statuses w
                ON e.work_status_id = w.work_status_id
            WHERE e.employee_id = $1;
        `, [employeeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error fetching employee:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch employee"
        });
    }
});

// CREATE new employee
router.post("/", async (req, res) => {
    try {
        const {
            employee_code,
            first_name,
            last_name,
            email,
            phone,
            department_id,
            role_id,
            work_status_id,
            employment_status,
            joining_date,
            salary_amount,
            salary_status
        } = req.body;

        // Basic validation
        if (
            !employee_code ||
            !first_name ||
            !last_name ||
            !email ||
            !department_id ||
            !role_id ||
            !employment_status ||
            !joining_date
        ) {
            return res.status(400).json({
                success: false,
                message: "Required employee fields are missing"
            });
        }

        const result = await pool.query(`
            INSERT INTO employees (
                employee_code,
                first_name,
                last_name,
                email,
                phone,
                department_id,
                role_id,
                work_status_id,
                employment_status,
                joining_date,
                salary_amount,
                salary_status
            )
            VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12
            )
            RETURNING employee_id;
        `, [
            employee_code,
            first_name,
            last_name,
            email,
            phone || null,
            department_id,
            role_id,
            work_status_id || null,
            employment_status,
            joining_date,
            salary_amount || null,
            salary_status || null
        ]);

        res.status(201).json({
            success: true,
            message: "Employee created successfully",
            employee_id: result.rows[0].employee_id
        });

    } catch (error) {
        console.error("Error creating employee:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create employee"
        });
    }
});
// UPDATE employee
router.put("/:id", async (req, res) => {
    try {
        const employeeId = req.params.id;

        const {
            first_name,
            last_name,
            email,
            phone,
            department_id,
            role_id,
            work_status_id,
            employment_status,
            joining_date,
            salary_amount,
            salary_status
        } = req.body;

        if (
            !first_name ||
            !last_name ||
            !email ||
            !department_id ||
            !role_id ||
            !employment_status ||
            !joining_date
        ) {
            return res.status(400).json({
                success: false,
                message: "Required employee fields are missing"
            });
        }

        const result = await pool.query(`
            UPDATE employees
            SET
                first_name = $1,
                last_name = $2,
                email = $3,
                phone = $4,
                department_id = $5,
                role_id = $6,
                work_status_id = $7,
                employment_status = $8,
                joining_date = $9,
                salary_amount = $10,
                salary_status = $11,
                updated_at = CURRENT_TIMESTAMP
            WHERE employee_id = $12
            RETURNING employee_id;
        `, [
            first_name,
            last_name,
            email,
            phone || null,
            department_id,
            role_id,
            work_status_id || null,
            employment_status,
            joining_date,
            salary_amount || null,
            salary_status || null,
            employeeId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.json({
            success: true,
            message: "Employee updated successfully",
            employee_id: result.rows[0].employee_id
        });

    } catch (error) {
        console.error("Error updating employee:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update employee"
        });
    }
});
// PATCH employee employment status
router.patch("/:id/status", async (req, res) => {
    try {
        const employeeId = req.params.id;
        const { employment_status } = req.body;

        const allowedStatuses = [
            "EMPLOYED",
            "PROBATION",
            "ON_LEAVE",
            "RESIGNED",
            "TERMINATED",
            "RETIRED"
        ];

        if (!employment_status) {
            return res.status(400).json({
                success: false,
                message: "employment_status is required"
            });
        }

        if (!allowedStatuses.includes(employment_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid employment status"
            });
        }

        const result = await pool.query(`
            UPDATE employees
            SET
                employment_status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE employee_id = $2
            RETURNING employee_id, employee_code, employment_status;
        `, [employment_status, employeeId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.json({
            success: true,
            message: "Employee employment status updated successfully",
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Error updating employee status:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update employee status"
        });
    }
});

module.exports = router;