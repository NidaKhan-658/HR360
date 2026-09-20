
import { useEffect, useMemo, useState } from "react";
import {
  createAttendance,
  getAttendance,
  getEmployees,
  updateAttendance,
} from "../services/api";

const ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "ON_LEAVE",
  "HOLIDAY",
];

const ITEMS_PER_PAGE = 10;

const emptyForm = {
  employee_id: "",
  attendance_date: "",
  attendance_status: "PRESENT",
  check_in_time: "",
  check_out_time: "",
  working_hours: "",
  remarks: "",
};

function formatStatus(status) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeValue) {
  if (!timeValue) {
    return "-";
  }

  return String(timeValue).slice(0, 5);
}

function getStatusClass(status) {
  switch (status) {
    case "PRESENT":
      return "attendance-status present";

    case "ABSENT":
      return "attendance-status absent";

    case "LATE":
      return "attendance-status late";

    case "HALF_DAY":
      return "attendance-status half-day";

    case "ON_LEAVE":
      return "attendance-status on-leave";

    case "HOLIDAY":
      return "attendance-status holiday";

    default:
      return "attendance-status";
  }
}

function timeToMinutes(timeValue) {
  if (!timeValue) {
    return null;
  }

  const parts = String(timeValue).split(":");

  if (parts.length < 2) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function escapeCsvValue(value) {
  const text =
    value === null || value === undefined
      ? ""
      : String(value);

  const escapedText = text.replaceAll('"', '""');

  return '"' + escapedText + '"';
}

function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [employeeFilter, setEmployeeFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [sortField, setSortField] = useState("attendance_date");
  const [sortDirection, setSortDirection] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);

  const [formData, setFormData] = useState(emptyForm);
  const [validationError, setValidationError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadAttendance(showInitialLoader = false) {
    try {
      if (showInitialLoader) {
        setLoading(true);
      }

      setError("");

      const response = await getAttendance();

      if (!response.success) {
        throw new Error(
          "Attendance API returned an unsuccessful response"
        );
      }

      setAttendance(response.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Unable to load attendance records."
      );
    } finally {
      if (showInitialLoader) {
        setLoading(false);
      }
    }
  }

  async function loadEmployees() {
    try {
      const response = await getEmployees();

      if (!response.success) {
        throw new Error(
          "Employee API returned an unsuccessful response"
        );
      }

      setEmployees(response.data || []);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Unable to load employees."
      );
    }
  }

  useEffect(() => {
    async function loadPageData() {
      await Promise.all([
        loadAttendance(true),
        loadEmployees(),
      ]);
    }

    loadPageData();
  }, []);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      setError("");
      setSuccessMessage("");

      await Promise.all([
        loadAttendance(false),
        loadEmployees(),
      ]);

      setCurrentPage(1);

      setSuccessMessage(
        "Attendance records refreshed successfully."
      );
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Unable to refresh attendance records."
      );
    } finally {
      setRefreshing(false);
    }
  }

  function openAddModal() {
    setEditingAttendance(null);

    setFormData({
      ...emptyForm,
      attendance_date: new Date()
        .toISOString()
        .split("T")[0],
    });

    setValidationError("");
    setError("");
    setSuccessMessage("");
    setShowModal(true);
  }

  function openEditModal(record) {
    setEditingAttendance(record);

    setFormData({
      employee_id: record.employee_id || "",
      attendance_date: record.attendance_date
        ? String(record.attendance_date).slice(0, 10)
        : "",
      attendance_status:
        record.attendance_status || "PRESENT",
      check_in_time:
        formatTime(record.check_in_time) === "-"
          ? ""
          : formatTime(record.check_in_time),
      check_out_time:
        formatTime(record.check_out_time) === "-"
          ? ""
          : formatTime(record.check_out_time),
      working_hours: record.working_hours ?? "",
      remarks: record.remarks || "",
    });

    setValidationError("");
    setError("");
    setSuccessMessage("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingAttendance(null);
    setFormData(emptyForm);
    setValidationError("");
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setValidationError("");
  }

  function validateForm() {
    if (!formData.employee_id) {
      return "Please select an employee.";
    }

    if (!formData.attendance_date) {
      return "Please select an attendance date.";
    }

    if (
      !ATTENDANCE_STATUSES.includes(
        formData.attendance_status
      )
    ) {
      return "Please select a valid attendance status.";
    }

    if (
      formData.working_hours !== "" &&
      (
        Number.isNaN(Number(formData.working_hours)) ||
        Number(formData.working_hours) < 0 ||
        Number(formData.working_hours) > 24
      )
    ) {
      return "Working hours must be between 0 and 24 hours.";
    }

    if (
      formData.check_in_time &&
      formData.check_out_time
    ) {
      const checkIn = timeToMinutes(
        formData.check_in_time
      );

      const checkOut = timeToMinutes(
        formData.check_out_time
      );

      if (
        checkIn !== null &&
        checkOut !== null &&
        checkOut < checkIn
      ) {
        return "Check-out time cannot be earlier than check-in time.";
      }
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const formValidationError = validateForm();

    if (formValidationError) {
      setValidationError(formValidationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      setValidationError("");

      const payload = {
        employee_id: Number(formData.employee_id),
        attendance_date: formData.attendance_date,
        attendance_status: formData.attendance_status,
        check_in_time: formData.check_in_time || null,
        check_out_time: formData.check_out_time || null,
        working_hours:
          formData.working_hours === ""
            ? null
            : Number(formData.working_hours),
        remarks: formData.remarks.trim() || null,
      };

      if (editingAttendance) {
        const response = await updateAttendance(
          editingAttendance.attendance_id,
          {
            attendance_date: payload.attendance_date,
            attendance_status:
              payload.attendance_status,
            check_in_time: payload.check_in_time,
            check_out_time: payload.check_out_time,
            working_hours: payload.working_hours,
            remarks: payload.remarks,
          }
        );

        if (!response.success) {
          throw new Error(
            "Attendance update was unsuccessful"
          );
        }

        setSuccessMessage(
          "Attendance record updated successfully."
        );
      } else {
        const response = await createAttendance(payload);

        if (!response.success) {
          throw new Error(
            "Attendance creation was unsuccessful"
          );
        }

        setSuccessMessage(
          "Attendance record created successfully."
        );
      }

      setShowModal(false);
      setEditingAttendance(null);
      setFormData(emptyForm);

      await loadAttendance(false);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Unable to save attendance record."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredAttendance = useMemo(() => {
    return attendance.filter((record) => {
      const recordDate = record.attendance_date
        ? String(record.attendance_date).slice(0, 10)
        : "";

      const matchesEmployee =
        !employeeFilter ||
        String(record.employee_id) === employeeFilter;

      const matchesDate =
        !dateFilter ||
        recordDate === dateFilter;

      const matchesStatus =
        !statusFilter ||
        record.attendance_status === statusFilter;

      return (
        matchesEmployee &&
        matchesDate &&
        matchesStatus
      );
    });
  }, [
    attendance,
    employeeFilter,
    dateFilter,
    statusFilter,
  ]);

  const sortedAttendance = useMemo(() => {
    const records = [...filteredAttendance];

    records.sort((a, b) => {
      let valueA;
      let valueB;

      switch (sortField) {
        case "employee":
          valueA =
            `${a.first_name || ""} ${a.last_name || ""}`
              .trim()
              .toLowerCase();

          valueB =
            `${b.first_name || ""} ${b.last_name || ""}`
              .trim()
              .toLowerCase();
          break;

        case "attendance_date":
          valueA = a.attendance_date
            ? String(a.attendance_date).slice(0, 10)
            : "";

          valueB = b.attendance_date
            ? String(b.attendance_date).slice(0, 10)
            : "";
          break;

        case "attendance_status":
          valueA = a.attendance_status || "";
          valueB = b.attendance_status || "";
          break;

        case "working_hours":
          valueA =
            a.working_hours === null ||
            a.working_hours === undefined
              ? -1
              : Number(a.working_hours);

          valueB =
            b.working_hours === null ||
            b.working_hours === undefined
              ? -1
              : Number(b.working_hours);
          break;

        default:
          valueA = "";
          valueB = "";
      }

      if (typeof valueA === "number") {
        return sortDirection === "asc"
          ? valueA - valueB
          : valueB - valueA;
      }

      return sortDirection === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });

    return records;
  }, [
    filteredAttendance,
    sortField,
    sortDirection,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      sortedAttendance.length / ITEMS_PER_PAGE
    )
  );

  const paginatedAttendance = useMemo(() => {
    const startIndex =
      (currentPage - 1) * ITEMS_PER_PAGE;

    return sortedAttendance.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [
    sortedAttendance,
    currentPage,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    employeeFilter,
    dateFilter,
    statusFilter,
    sortField,
    sortDirection,
  ]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginationStart =
    sortedAttendance.length === 0
      ? 0
      : (currentPage - 1) * ITEMS_PER_PAGE + 1;

  const paginationEnd =
    sortedAttendance.length === 0
      ? 0
      : Math.min(
          currentPage * ITEMS_PER_PAGE,
          sortedAttendance.length
        );

  const summary = useMemo(() => {
    const total = attendance.length;

    const present = attendance.filter(
      (record) =>
        record.attendance_status === "PRESENT"
    ).length;

    const absent = attendance.filter(
      (record) =>
        record.attendance_status === "ABSENT"
    ).length;

    const late = attendance.filter(
      (record) =>
        record.attendance_status === "LATE"
    ).length;

    const halfDay = attendance.filter(
      (record) =>
        record.attendance_status === "HALF_DAY"
    ).length;

    const onLeave = attendance.filter(
      (record) =>
        record.attendance_status === "ON_LEAVE"
    ).length;

    const holiday = attendance.filter(
      (record) =>
        record.attendance_status === "HOLIDAY"
    ).length;

    const attendanceEligible =
      present + absent + late + halfDay;

    const attendanceRate =
      attendanceEligible > 0
        ? (present / attendanceEligible) * 100
        : 0;

    return {
      total,
      present,
      absent,
      late,
      halfDay,
      onLeave,
      holiday,
      attendanceRate,
    };
  }, [attendance]);

  function clearFilters() {
    setEmployeeFilter("");
    setDateFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection((previous) =>
        previous === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function getSortIndicator(field) {
    if (sortField !== field) {
      return "↕";
    }

    return sortDirection === "asc"
      ? "↑"
      : "↓";
  }

  function exportAttendanceToCsv() {
    if (filteredAttendance.length === 0) {
      setError(
        "There are no attendance records to export."
      );
      return;
    }

    const headers = [
      "Employee Code",
      "Employee Name",
      "Attendance Date",
      "Attendance Status",
      "Check-in Time",
      "Check-out Time",
      "Working Hours",
      "Remarks",
    ];

    const rows = filteredAttendance.map((record) => [
      record.employee_code,
      `${record.first_name} ${record.last_name}`,
      record.attendance_date
        ? String(record.attendance_date).slice(0, 10)
        : "",
      record.attendance_status,
      formatTime(record.check_in_time),
      formatTime(record.check_out_time),
      record.working_hours ?? "",
      record.remarks || "",
    ]);

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row.map(escapeCsvValue).join(",")
      )
      .join("\n");

    const blob = new Blob(
      [`\uFEFF${csvContent}`],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "HR360_Attendance.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    setError("");
    setSuccessMessage(
      `Attendance CSV exported successfully (${filteredAttendance.length} records).`
    );
  }

  return (
    <div className="attendance-page">
      <div className="page-header">
        <div>
          <h1>Attendance Management</h1>
          <p>
            Track employee attendance, working hours and daily status.
          </p>
        </div>

        <div className="employee-header-actions">
          <button
            type="button"
            className="secondary-action-button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

          <button
            type="button"
            className="secondary-action-button"
            onClick={exportAttendanceToCsv}
            disabled={filteredAttendance.length === 0}
          >
            ↓ Export CSV
          </button>

          <button
            type="button"
            className="primary-action-button"
            onClick={openAddModal}
          >
            + Add Attendance
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="kpi-grid attendance-kpi-grid">
        <div className="kpi-card">
          <span>Total Records</span>
          <strong>{summary.total}</strong>
        </div>

        <div className="kpi-card">
          <span>Present</span>
          <strong>{summary.present}</strong>
        </div>

        <div className="kpi-card">
          <span>Absent</span>
          <strong>{summary.absent}</strong>
        </div>

        <div className="kpi-card">
          <span>Late</span>
          <strong>{summary.late}</strong>
        </div>

        <div className="kpi-card">
          <span>Half Day</span>
          <strong>{summary.halfDay}</strong>
        </div>

        <div className="kpi-card">
          <span>On Leave</span>
          <strong>{summary.onLeave}</strong>
        </div>

        <div className="kpi-card">
          <span>Holiday</span>
          <strong>{summary.holiday}</strong>
        </div>

        <div className="kpi-card">
          <span>Attendance Rate</span>
          <strong>
            {summary.attendanceRate.toFixed(1)}%
          </strong>
        </div>
      </div>

      <div className="attendance-filter-card">
        <div className="attendance-filter-group">
          <label htmlFor="attendance-employee-filter">
            Employee
          </label>

          <select
            id="attendance-employee-filter"
            value={employeeFilter}
            onChange={(event) =>
              setEmployeeFilter(event.target.value)
            }
          >
            <option value="">
              All Employees
            </option>

            {employees.map((employee) => (
              <option
                key={employee.employee_id}
                value={employee.employee_id}
              >
                {employee.employee_code} -{" "}
                {employee.first_name}{" "}
                {employee.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="attendance-filter-group">
          <label htmlFor="attendance-date-filter">
            Attendance Date
          </label>

          <input
            id="attendance-date-filter"
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(event.target.value)
            }
          />
        </div>

        <div className="attendance-filter-group">
          <label htmlFor="attendance-status-filter">
            Status
          </label>

          <select
            id="attendance-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="">
              All Statuses
            </option>

            {ATTENDANCE_STATUSES.map((status) => (
              <option
                key={status}
                value={status}
              >
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="secondary-action-button attendance-clear-button"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>

      <div className="attendance-filter-summary">
        <span>
          Active filters:{" "}
          {
            [
              employeeFilter,
              dateFilter,
              statusFilter,
            ].filter(Boolean).length
          }
        </span>

        <strong>
          {filteredAttendance.length} record
          {filteredAttendance.length === 1
            ? ""
            : "s"} shown
        </strong>
      </div>

      {employeeFilter && (
        <div className="attendance-employee-view">
          <div>
            <span className="attendance-view-label">
              Employee Attendance View
            </span>

            <strong>
              {(() => {
                const selectedEmployee =
                  employees.find(
                    (employee) =>
                      String(employee.employee_id) ===
                      employeeFilter
                  );

                return selectedEmployee
                  ? `${selectedEmployee.employee_code} - ${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                  : "Selected Employee";
              })()}
            </strong>
          </div>

          <span>
            {filteredAttendance.length} attendance record
            {filteredAttendance.length === 1
              ? ""
              : "s"} found
          </span>
        </div>
      )}

      <div className="attendance-table-card">
        <div className="table-card-header">
          <div>
            <h2>Attendance Records</h2>

            <span>
              Showing {paginationStart}-{paginationEnd} of{" "}
              {sortedAttendance.length} filtered records
              {" "}({attendance.length} total)
            </span>
          </div>
        </div>

        {loading ? (
          <div className="table-state">
            <p>Loading attendance records...</p>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="table-state">
            <p>No attendance records found.</p>

            {(employeeFilter ||
              dateFilter ||
              statusFilter) && (
              <button
                type="button"
                className="secondary-action-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table attendance-table">
                <thead>
                  <tr>
                    <th>
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() =>
                          handleSort("employee")
                        }
                      >
                        Employee
                        <span>
                          {getSortIndicator("employee")}
                        </span>
                      </button>
                    </th>

                    <th>
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() =>
                          handleSort(
                            "attendance_date"
                          )
                        }
                      >
                        Date
                        <span>
                          {getSortIndicator(
                            "attendance_date"
                          )}
                        </span>
                      </button>
                    </th>

                    <th>
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() =>
                          handleSort(
                            "attendance_status"
                          )
                        }
                      >
                        Status
                        <span>
                          {getSortIndicator(
                            "attendance_status"
                          )}
                        </span>
                      </button>
                    </th>

                    <th>Check-in</th>

                    <th>Check-out</th>

                    <th>
                      <button
                        type="button"
                        className="table-sort-button"
                        onClick={() =>
                          handleSort("working_hours")
                        }
                      >
                        Working Hours
                        <span>
                          {getSortIndicator(
                            "working_hours"
                          )}
                        </span>
                      </button>
                    </th>

                    <th>Remarks</th>

                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedAttendance.map((record) => (
                    <tr
                      key={record.attendance_id}
                    >
                      <td>
                        <div className="employee-name-cell">
                          <strong>
                            {record.first_name}{" "}
                            {record.last_name}
                          </strong>

                          <span>
                            {record.employee_code}
                          </span>
                        </div>
                      </td>

                      <td>
                        {formatDate(
                          record.attendance_date
                        )}
                      </td>

                      <td>
                        <span
                          className={getStatusClass(
                            record.attendance_status
                          )}
                        >
                          {formatStatus(
                            record.attendance_status
                          )}
                        </span>
                      </td>

                      <td>
                        {formatTime(
                          record.check_in_time
                        )}
                      </td>

                      <td>
                        {formatTime(
                          record.check_out_time
                        )}
                      </td>

                      <td>
                        {record.working_hours !== null &&
                        record.working_hours !==
                          undefined
                          ? `${record.working_hours} hrs`
                          : "-"}
                      </td>

                      <td>
                        {record.remarks || "-"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="table-action-button"
                          onClick={() =>
                            openEditModal(record)
                          }
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="attendance-pagination">
                <div className="attendance-pagination-info">
                  Page {currentPage} of{" "}
                  {totalPages}
                </div>

                <div className="attendance-pagination-controls">
                  <button
                    type="button"
                    className="secondary-action-button"
                    onClick={() =>
                      setCurrentPage(
                        (previous) =>
                          Math.max(
                            previous - 1,
                            1
                          )
                      )
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  ).map((page) => (
                    <button
                      key={page}
                      type="button"
                      className={
                        page === currentPage
                          ? "pagination-page-button active"
                          : "pagination-page-button"
                      }
                      onClick={() =>
                        setCurrentPage(page)
                      }
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="secondary-action-button"
                    onClick={() =>
                      setCurrentPage(
                        (previous) =>
                          Math.min(
                            previous + 1,
                            totalPages
                          )
                      )
                    }
                    disabled={
                      currentPage === totalPages
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card attendance-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingAttendance
                    ? "Edit Attendance"
                    : "Add Attendance"}
                </h2>

                <p>
                  {editingAttendance
                    ? "Update the attendance record."
                    : "Create a new employee attendance record."}
                </p>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {validationError && (
              <div className="form-validation-error">
                {validationError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="employee_id">
                    Employee *
                  </label>

                  <select
                    id="employee_id"
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleInputChange}
                    required
                    disabled={Boolean(
                      editingAttendance
                    )}
                  >
                    <option value="">
                      Select employee
                    </option>

                    {employees.map((employee) => (
                      <option
                        key={employee.employee_id}
                        value={
                          employee.employee_id
                        }
                      >
                        {employee.employee_code} -{" "}
                        {employee.first_name}{" "}
                        {employee.last_name}
                      </option>
                    ))}
                  </select>

                  {editingAttendance && (
                    <small className="form-help">
                      Employee cannot be changed while
                      editing an existing attendance record.
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="attendance_date">
                    Attendance Date *
                  </label>

                  <input
                    id="attendance_date"
                    name="attendance_date"
                    type="date"
                    value={
                      formData.attendance_date
                    }
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="attendance_status">
                    Attendance Status *
                  </label>

                  <select
                    id="attendance_status"
                    name="attendance_status"
                    value={
                      formData.attendance_status
                    }
                    onChange={handleInputChange}
                    required
                  >
                    {ATTENDANCE_STATUSES.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {formatStatus(status)}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="working_hours">
                    Working Hours
                  </label>

                  <input
                    id="working_hours"
                    name="working_hours"
                    type="number"
                    min="0"
                    max="24"
                    step="0.01"
                    value={
                      formData.working_hours
                    }
                    onChange={handleInputChange}
                    placeholder="e.g. 8.75"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="check_in_time">
                    Check-in Time
                  </label>

                  <input
                    id="check_in_time"
                    name="check_in_time"
                    type="time"
                    value={
                      formData.check_in_time
                    }
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="check_out_time">
                    Check-out Time
                  </label>

                  <input
                    id="check_out_time"
                    name="check_out_time"
                    type="time"
                    value={
                      formData.check_out_time
                    }
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="remarks">
                    Remarks
                  </label>

                  <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Enter any attendance remarks..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-action-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingAttendance
                    ? "Update Attendance"
                    : "Save Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;
