const express = require("express");
const pool = require("../db");

const router = express.Router();


// ======================================================
// HR OVERVIEW
// ======================================================

router.get("/overview", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) AS total_employees,

                COUNT(*) FILTER (
                    WHERE e.employment_status = 'EMPLOYED'
                ) AS employed_employees,

                COUNT(*) FILTER (
                    WHERE e.employment_status = 'RESIGNED'
                ) AS resigned_employees,

                COUNT(*) FILTER (
                    WHERE e.employment_status = 'TERMINATED'
                ) AS terminated_employees,

                COUNT(*) FILTER (
                    WHERE w.status_name = 'ON_BENCH'
                ) AS employees_on_bench,

                COUNT(*) FILTER (
                    WHERE w.status_name = 'PIP'
                ) AS employees_on_pip,

                COUNT(*) FILTER (
                    WHERE w.status_name = 'TRAINING'
                ) AS employees_in_training,

                COUNT(*) FILTER (
                    WHERE w.status_name = 'ON_LEAVE'
                ) AS employees_on_leave

            FROM employees e
            LEFT JOIN work_statuses w
                ON e.work_status_id = w.work_status_id;
        `);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Analytics overview error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch HR overview"
        });
    }
});


// ======================================================
// DEPARTMENT ANALYTICS
// ======================================================

router.get("/departments", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                d.department_id,
                d.department_name,

                COUNT(e.employee_id) AS total_employees,

                COUNT(e.employee_id) FILTER (
                    WHERE e.employment_status = 'EMPLOYED'
                ) AS employed_employees,

                COUNT(e.employee_id) FILTER (
                    WHERE
                        d.department_name = 'HR'
                        AND e.employment_status = 'EMPLOYED'

                        OR

                        d.department_name = 'Operations'
                        AND w.status_name IN ('WORKING', 'ONLINE')

                        OR

                        d.department_name = 'Finance'
                        AND e.salary_status = 'PAID'
                ) AS active_employees,

                COUNT(e.employee_id) FILTER (
                    WHERE w.status_name = 'ON_BENCH'
                ) AS employees_on_bench,

                COUNT(e.employee_id) FILTER (
                    WHERE w.status_name = 'PIP'
                ) AS employees_on_pip

            FROM departments d

            LEFT JOIN employees e
                ON d.department_id = e.department_id

            LEFT JOIN work_statuses w
                ON e.work_status_id = w.work_status_id

            GROUP BY
                d.department_id,
                d.department_name

            ORDER BY
                d.department_id;
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("Department analytics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch department analytics"
        });
    }
});


// ======================================================
// ATTENDANCE ANALYTICS
// ======================================================

router.get("/attendance", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) AS total_attendance_records,

                COUNT(*) FILTER (
                    WHERE attendance_status = 'PRESENT'
                ) AS present_days,

                COUNT(*) FILTER (
                    WHERE attendance_status = 'ABSENT'
                ) AS absent_days,

                COUNT(*) FILTER (
                    WHERE attendance_status = 'ON_LEAVE'
                ) AS leave_days,

                COUNT(*) FILTER (
                    WHERE attendance_status = 'HALF_DAY'
                ) AS half_days,

                COUNT(*) FILTER (
                    WHERE attendance_status = 'LATE'
                ) AS late_days,

                COUNT(*) FILTER (
                    WHERE attendance_status = 'HOLIDAY'
                ) AS holiday_days,

                ROUND(
                    AVG(working_hours)::numeric,
                    2
                ) AS average_working_hours

            FROM attendance;
        `);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Attendance analytics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch attendance analytics"
        });
    }
});


// ======================================================
// LEAVE ANALYTICS
// ======================================================

router.get("/leave", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) AS total_leave_requests,

                COUNT(*) FILTER (
                    WHERE request_status = 'APPROVED'
                ) AS approved_requests,

                COUNT(*) FILTER (
                    WHERE request_status = 'PENDING'
                ) AS pending_requests,

                COUNT(*) FILTER (
                    WHERE request_status = 'REJECTED'
                ) AS rejected_requests,

                COALESCE(
                    SUM(total_days) FILTER (
                        WHERE request_status = 'APPROVED'
                    ),
                    0
                ) AS approved_leave_days

            FROM leave_requests;
        `);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Leave analytics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch leave analytics"
        });
    }
});


// ======================================================
// PERFORMANCE ANALYTICS
// ======================================================

router.get("/performance", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) AS total_reviews,

                ROUND(
                    AVG(overall_rating)::numeric,
                    2
                ) AS average_rating,

                COUNT(*) FILTER (
                    WHERE overall_rating >= 4
                ) AS high_performers,

                COUNT(*) FILTER (
                    WHERE overall_rating < 3
                ) AS low_performers

            FROM performance_reviews;
        `);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Performance analytics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch performance analytics"
        });
    }
});


// ======================================================
// TRAINING ANALYTICS
// ======================================================

router.get("/training", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                COUNT(*) AS total_training_assignments,

                COUNT(*) FILTER (
                    WHERE attendance_status = 'COMPLETED'
                ) AS completed_training,

                COUNT(*) FILTER (
                    WHERE attendance_status = 'ATTENDED'
                ) AS attended_training,

                COUNT(*) FILTER (
                    WHERE attendance_status = 'ENROLLED'
                ) AS enrolled_training,

                COUNT(*) FILTER (
                    WHERE attendance_status = 'DID_NOT_ATTEND'
                ) AS did_not_attend,

                COUNT(*) FILTER (
                    WHERE attendance_status = 'CANCELLED'
                ) AS cancelled_training,

                COUNT(DISTINCT employee_id) AS employees_in_training,

                ROUND(
                    AVG(score)::numeric,
                    2
                ) AS average_training_score

            FROM employee_training;
        `);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Training analytics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch training analytics"
        });
    }
});


// ======================================================
// RECRUITMENT ANALYTICS
// ======================================================

router.get("/recruitment", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                (SELECT COUNT(*)
                 FROM candidates) AS total_candidates,

                (SELECT COUNT(*)
                 FROM candidates
                 WHERE candidate_status = 'HIRED') AS hired_candidates,

                (SELECT COUNT(*)
                 FROM candidates
                 WHERE candidate_status = 'REJECTED') AS rejected_candidates,

                (SELECT COUNT(*)
                 FROM job_applications) AS total_applications,

                (SELECT COUNT(*)
                 FROM job_applications
                 WHERE application_status = 'INTERVIEW') AS interview_stage,

                (SELECT COUNT(*)
                 FROM job_applications
                 WHERE application_status = 'OFFERED') AS offered_applications,

                (SELECT COUNT(*)
                 FROM job_applications
                 WHERE application_status = 'HIRED') AS hired_applications,

                (SELECT COUNT(*)
                 FROM interviews) AS total_interviews,

                (SELECT COUNT(*)
                 FROM interviews
                 WHERE interview_status = 'COMPLETED') AS completed_interviews,

                (SELECT COUNT(*)
                 FROM interviews
                 WHERE result = 'PASS') AS passed_interviews,

                (SELECT COUNT(*)
                 FROM job_offers) AS total_offers,

                (SELECT COUNT(*)
                 FROM job_offers
                 WHERE offer_status = 'ACCEPTED') AS accepted_offers,

                (SELECT COUNT(*)
                 FROM job_offers
                 WHERE offer_status = 'DECLINED') AS declined_offers,

                (SELECT COUNT(*)
                 FROM job_offers
                 WHERE offer_status = 'SENT') AS sent_offers;
        `);

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error("Recruitment analytics error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch recruitment analytics"
        });
    }
});


module.exports = router;