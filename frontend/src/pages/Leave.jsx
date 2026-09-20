import { useEffect, useMemo, useState } from "react";
import {
  createLeaveRequest,
  getEmployees,
  getLeaveRequests,
  getLeaveTypes,
  updateLeaveRequest,
} from "../services/api";

const INITIAL_FORM = {
  employee_id: "",
  leave_type_id: "",
  start_date: "",
  end_date: "",
  reason: "",
};

function formatDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateInput(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function calculateLeaveDays(startDate, endDate) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  const difference = end.getTime() - start.getTime();

  if (difference < 0) {
    return 0;
  }

  return Math.floor(
    difference / (1000 * 60 * 60 * 24)
  ) + 1;
}

function escapeCsvValue(value) {
  const text =
    value === null || value === undefined
      ? ""
      : String(value);

  const escapedText = text.replaceAll('"', '""');

  return '"' + escapedText + '"';
}

function exportLeaveRequestsToCsv(records) {
  const headers = [
    "Employee Code",
    "Employee Name",
    "Leave Type",
    "Start Date",
    "End Date",
    "Total Days",
    "Reason",
    "Request Status",
    "Approved By",
    "Approved At",
  ];

  const rows = records.map((record) => [
    record.employee_code,
    record.employee_name,
    record.leave_type_name,
    formatDate(record.start_date),
    formatDate(record.end_date),
    record.total_days,
    record.reason,
    record.request_status,
    record.approved_by_name,
    formatDate(record.approved_at),
  ]);

  const csvContent = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      row.map(escapeCsvValue).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "HR360_Leave_Requests.csv";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function Leave() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");

  const [employeeFilter, setEmployeeFilter] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");

  async function loadLeaveData(showInitialLoader = false) {
    try {
      if (showInitialLoader) {
        setLoading(true);
      }

      setError("");

      const [
        leaveRequestsResponse,
        leaveTypesResponse,
        employeesResponse,
      ] = await Promise.all([
        getLeaveRequests(),
        getLeaveTypes(),
        getEmployees(),
      ]);

      if (!leaveRequestsResponse.success) {
        throw new Error(
          "Leave requests API returned an unsuccessful response"
        );
      }

      if (!leaveTypesResponse.success) {
        throw new Error(
          "Leave types API returned an unsuccessful response"
        );
      }

      if (!employeesResponse.success) {
        throw new Error(
          "Employees API returned an unsuccessful response"
        );
      }

      setLeaveRequests(
        leaveRequestsResponse.data || []
      );

      setLeaveTypes(
        leaveTypesResponse.data || []
      );

      setEmployees(
        employeesResponse.data || []
      );
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Unable to load leave data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeaveData(true);
  }, []);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      setSuccessMessage("");

      await loadLeaveData(false);

      setSuccessMessage(
        "Leave data refreshed successfully."
      );
    } finally {
      setRefreshing(false);
    }
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setFormError("");
    setSuccessMessage("");
  }

  function openAddForm() {
    setEditingRequest(null);
    setFormData(INITIAL_FORM);
    setFormError("");
    setSuccessMessage("");
    setShowForm(true);
  }

  function openEditForm(request) {
    setEditingRequest(request);

    setFormData({
      employee_id: String(
        request.employee_id || ""
      ),
      leave_type_id: String(
        request.leave_type_id || ""
      ),
      start_date: formatDateInput(
        request.start_date
      ),
      end_date: formatDateInput(
        request.end_date
      ),
      reason: request.reason || "",
    });

    setFormError("");
    setSuccessMessage("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingRequest(null);
    setFormData(INITIAL_FORM);
    setFormError("");
  }

  function validateForm() {
    if (!formData.employee_id) {
      return "Please select an employee.";
    }

    if (!formData.leave_type_id) {
      return "Please select a leave type.";
    }

    if (!formData.start_date) {
      return "Please select a start date.";
    }

    if (!formData.end_date) {
      return "Please select an end date.";
    }

    if (formData.end_date < formData.start_date) {
      return "End date cannot be earlier than start date.";
    }

    const totalDays = calculateLeaveDays(
      formData.start_date,
      formData.end_date
    );

    if (totalDays <= 0) {
      return "Total leave days must be greater than zero.";
    }

    if (!formData.reason.trim()) {
      return "Please enter a reason for the leave request.";
    }

    if (formData.reason.trim().length < 3) {
      return "Leave reason must contain at least 3 characters.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    const totalDays = calculateLeaveDays(
      formData.start_date,
      formData.end_date
    );

    /*
     * Backend-required fields:
     * employee_id
     * leave_type_id
     * start_date
     * end_date
     * total_days
     */
    const payload = {
      employee_id: Number(formData.employee_id),
      leave_type_id: Number(formData.leave_type_id),
      start_date: formData.start_date,
      end_date: formData.end_date,
      total_days: Number(totalDays),
      reason: formData.reason.trim(),
    };

    // Final frontend safety check before API call.
    if (
      !payload.employee_id ||
      !payload.leave_type_id ||
      !payload.start_date ||
      !payload.end_date ||
      !payload.total_days
    ) {
      setFormError(
        "Employee, leave type, start date, end date and total leave days are required."
      );
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      setError("");
      setSuccessMessage("");

      console.log(
        "HR360 Leave Request Payload:",
        payload
      );

      if (editingRequest) {
        await updateLeaveRequest(
          editingRequest.leave_request_id,
          payload
        );

        setSuccessMessage(
          "Leave request updated successfully."
        );
      } else {
        await createLeaveRequest(payload);

        setSuccessMessage(
          "Leave request created successfully."
        );
      }

      setShowForm(false);
      setEditingRequest(null);
      setFormData(INITIAL_FORM);

      await loadLeaveData(false);
    } catch (err) {
      console.error(err);

      setFormError(
        err.message ||
          "Unable to save leave request."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter((request) => {
      const matchesEmployee =
        !employeeFilter ||
        String(request.employee_id) ===
          String(employeeFilter);

      const matchesLeaveType =
        !leaveTypeFilter ||
        String(request.leave_type_id) ===
          String(leaveTypeFilter);

      const matchesStatus =
        !statusFilter ||
        request.request_status === statusFilter;

      const requestStart =
        formatDateInput(request.start_date);

      const requestEnd =
        formatDateInput(request.end_date);

      const matchesDateFrom =
        !dateFromFilter ||
        requestEnd >= dateFromFilter;

      const matchesDateTo =
        !dateToFilter ||
        requestStart <= dateToFilter;

      return (
        matchesEmployee &&
        matchesLeaveType &&
        matchesStatus &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [
    leaveRequests,
    employeeFilter,
    leaveTypeFilter,
    statusFilter,
    dateFromFilter,
    dateToFilter,
  ]);

  const kpis = useMemo(() => {
    const total = leaveRequests.length;

    const pending = leaveRequests.filter(
      (request) =>
        request.request_status === "PENDING"
    ).length;

    const approved = leaveRequests.filter(
      (request) =>
        request.request_status === "APPROVED"
    ).length;

    const rejected = leaveRequests.filter(
      (request) =>
        request.request_status === "REJECTED"
    ).length;

    const totalDays = leaveRequests.reduce(
      (sum, request) =>
        sum + Number(request.total_days || 0),
      0
    );

    const employeesOnLeave = new Set(
      leaveRequests
        .filter(
          (request) =>
            request.request_status === "APPROVED"
        )
        .map((request) => request.employee_id)
    ).size;

    return {
      total,
      pending,
      approved,
      rejected,
      totalDays,
      employeesOnLeave,
    };
  }, [leaveRequests]);

  const activeFilterCount = [
    employeeFilter,
    leaveTypeFilter,
    statusFilter,
    dateFromFilter,
    dateToFilter,
  ].filter(Boolean).length;

  function clearFilters() {
    setEmployeeFilter("");
    setLeaveTypeFilter("");
    setStatusFilter("");
    setDateFromFilter("");
    setDateToFilter("");
  }

  const calculatedDays = calculateLeaveDays(
    formData.start_date,
    formData.end_date
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Leave Management</h1>
          <p>
            Manage employee leave requests, approvals
            and leave utilization.
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
            onClick={() =>
              exportLeaveRequestsToCsv(
                filteredLeaveRequests
              )
            }
            disabled={
              filteredLeaveRequests.length === 0
            }
          >
            ↓ Export CSV
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={openAddForm}
          >
            + Add Leave Request
          </button>
        </div>
      </div>

      {loading && (
        <div className="status-message">
          Loading leave data...
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="kpi-grid attendance-kpi-grid">
            <div className="kpi-card">
              <span>Total Requests</span>
              <strong>{kpis.total}</strong>
            </div>

            <div className="kpi-card">
              <span>Pending</span>
              <strong>{kpis.pending}</strong>
            </div>

            <div className="kpi-card">
              <span>Approved</span>
              <strong>{kpis.approved}</strong>
            </div>

            <div className="kpi-card">
              <span>Rejected</span>
              <strong>{kpis.rejected}</strong>
            </div>

            <div className="kpi-card">
              <span>Total Leave Days</span>
              <strong>
                {kpis.totalDays.toFixed(2)}
              </strong>
            </div>

            <div className="kpi-card">
              <span>Employees on Leave</span>
              <strong>
                {kpis.employeesOnLeave}
              </strong>
            </div>
          </div>

          <div className="filter-card">
            <div className="filter-grid">
              <div className="form-group">
                <label htmlFor="employeeFilter">
                  Employee
                </label>

                <select
                  id="employeeFilter"
                  value={employeeFilter}
                  onChange={(event) =>
                    setEmployeeFilter(
                      event.target.value
                    )
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

              <div className="form-group">
                <label htmlFor="leaveTypeFilter">
                  Leave Type
                </label>

                <select
                  id="leaveTypeFilter"
                  value={leaveTypeFilter}
                  onChange={(event) =>
                    setLeaveTypeFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All Leave Types
                  </option>

                  {leaveTypes.map((leaveType) => (
                    <option
                      key={leaveType.leave_type_id}
                      value={leaveType.leave_type_id}
                    >
                      {leaveType.leave_type_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="statusFilter">
                  Status
                </label>

                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All Statuses
                  </option>
                  <option value="PENDING">
                    Pending
                  </option>
                  <option value="APPROVED">
                    Approved
                  </option>
                  <option value="REJECTED">
                    Rejected
                  </option>
                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dateFromFilter">
                  From Date
                </label>

                <input
                  id="dateFromFilter"
                  type="date"
                  value={dateFromFilter}
                  onChange={(event) =>
                    setDateFromFilter(
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateToFilter">
                  To Date
                </label>

                <input
                  id="dateToFilter"
                  type="date"
                  value={dateToFilter}
                  onChange={(event) =>
                    setDateToFilter(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="attendance-filter-summary">
              <span>
                Showing{" "}
                <strong>
                  {filteredLeaveRequests.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {leaveRequests.length}
                </strong>{" "}
                leave requests
              </span>

              <span>
                {activeFilterCount} active filter
                {activeFilterCount === 1
                  ? ""
                  : "s"}
              </span>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  className="text-button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {showForm && (
            <div className="form-card">
              <div className="form-card-header">
                <div>
                  <h2>
                    {editingRequest
                      ? "Edit Leave Request"
                      : "Add Leave Request"}
                  </h2>

                  <p>
                    Enter the leave request details
                    below.
                  </p>
                </div>

                <button
                  type="button"
                  className="close-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  ×
                </button>
              </div>

              {formError && (
                <div className="form-validation-error">
                  {formError}
                </div>
              )}

              <form
                className="employee-form"
                onSubmit={handleSubmit}
              >
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="employee_id">
                      Employee *
                    </label>

                    <select
                      id="employee_id"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleFormChange}
                      disabled={saving}
                      required
                    >
                      <option value="">
                        Select employee
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

                  <div className="form-group">
                    <label htmlFor="leave_type_id">
                      Leave Type *
                    </label>

                    <select
                      id="leave_type_id"
                      name="leave_type_id"
                      value={formData.leave_type_id}
                      onChange={handleFormChange}
                      disabled={saving}
                      required
                    >
                      <option value="">
                        Select leave type
                      </option>

                      {leaveTypes.map((leaveType) => (
                        <option
                          key={leaveType.leave_type_id}
                          value={leaveType.leave_type_id}
                        >
                          {leaveType.leave_type_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="start_date">
                      Start Date *
                    </label>

                    <input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={handleFormChange}
                      disabled={saving}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="end_date">
                      End Date *
                    </label>

                    <input
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={handleFormChange}
                      disabled={saving}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label htmlFor="reason">
                      Reason *
                    </label>

                    <textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleFormChange}
                      rows="3"
                      placeholder="Enter reason for leave"
                      disabled={saving}
                      required
                    />
                  </div>
                </div>

                <div className="leave-days-preview">
                  <span>
                    Calculated Leave Days
                  </span>

                  <strong>
                    {calculatedDays > 0
                      ? calculatedDays
                      : "-"}
                  </strong>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-action-button"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : editingRequest
                        ? "Update Leave Request"
                        : "Create Leave Request"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="table-card">
            <div className="table-card-header">
              <div>
                <h2>Leave Requests</h2>
                <p>
                  Review and manage employee leave
                  requests.
                </p>
              </div>
            </div>

            {filteredLeaveRequests.length === 0 ? (
              <div className="empty-state">
                No leave requests found.
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Approved By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLeaveRequests.map(
                      (request) => (
                        <tr
                          key={
                            request.leave_request_id
                          }
                        >
                          <td>
                            <strong>
                              {request.employee_code}
                            </strong>

                            <span className="table-secondary-text">
                              {request.employee_name}
                            </span>
                          </td>

                          <td>
                            {request.leave_type_name}
                          </td>

                          <td>
                            {formatDate(
                              request.start_date
                            )}
                          </td>

                          <td>
                            {formatDate(
                              request.end_date
                            )}
                          </td>

                          <td>
                            {request.total_days}
                          </td>

                          <td>
                            {request.reason || "-"}
                          </td>

                          <td>
                            <span
                              className={`status-badge status-${String(
                                request.request_status
                              )
                                .toLowerCase()
                                .replaceAll(
                                  "_",
                                  "-"
                                )}`}
                            >
                              {request.request_status}
                            </span>
                          </td>

                          <td>
                            {request.approved_by_name ||
                              "-"}
                          </td>

                          <td>
                            <button
                              type="button"
                              className="table-action-button"
                              onClick={() =>
                                openEditForm(request)
                              }
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Leave;

