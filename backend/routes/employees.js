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


module.exports = router;