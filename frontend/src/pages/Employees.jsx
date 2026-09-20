import { useEffect, useMemo, useState } from "react";
import {
  createEmployee,
  getDepartments,
  getEmployees,
  getJobRoles,
  getWorkStatuses,
  updateEmployee,
  updateEmployeeEmploymentStatus,
} from "../services/api";

const initialForm = {
  employee_code: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  department_id: "",
  role_id: "",
  work_status_id: "",
  employment_status: "EMPLOYED",
  joining_date: "",
  salary_amount: "",
  salary_status: "PAID",
};

const PAGE_SIZE = 10;

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [workStatuses, setWorkStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [employeeToDeactivate, setEmployeeToDeactivate] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState("");
  const [workStatusFilter, setWorkStatusFilter] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("");

  const [sortConfig, setSortConfig] = useState({
    key: "employee_code",
    direction: "asc",
  });

  // =========================================================
  // 27H - PAGINATION
  // =========================================================

  const [currentPage, setCurrentPage] = useState(1);

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [
          employeesResponse,
          departmentsResponse,
          jobRolesResponse,
          workStatusesResponse,
        ] = await Promise.all([
          getEmployees(),
          getDepartments(),
          getJobRoles(),
          getWorkStatuses(),
        ]);

        setEmployees(employeesResponse.data || []);
        setDepartments(departmentsResponse.data || []);
        setJobRoles(jobRolesResponse.data || []);
        setWorkStatuses(workStatusesResponse.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Unable to load employee data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // =========================================================
  // FORM HANDLING
  // =========================================================

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openAddEmployeeForm() {
    setEditingEmployee(null);
    setFormData(initialForm);
    setFormError("");
    setSuccessMessage("");
    setShowForm(true);
  }

  function openEditEmployeeForm(employee) {
    setEditingEmployee(employee);
    setFormError("");
    setSuccessMessage("");

    setFormData({
      employee_code: employee.employee_code || "",
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department_id: employee.department_id || "",
      role_id: employee.role_id || "",
      work_status_id: employee.work_status_id || "",
      employment_status: employee.employment_status || "EMPLOYED",
      joining_date: employee.joining_date
        ? employee.joining_date.substring(0, 10)
        : "",
      salary_amount: employee.salary_amount || "",
      salary_status: employee.salary_status || "PAID",
    });

    setShowForm(true);
  }

  function closeEmployeeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingEmployee(null);
    setFormData(initialForm);
    setFormError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError("");
      setSuccessMessage("");

      if (!formData.first_name.trim()) {
        throw new Error("First name is required.");
      }

      if (!formData.last_name.trim()) {
        throw new Error("Last name is required.");
      }

      if (!formData.email.trim()) {
        throw new Error("Email is required.");
      }

      if (!formData.department_id) {
        throw new Error("Department is required.");
      }

      if (!formData.role_id) {
        throw new Error("Role is required.");
      }

      if (!formData.work_status_id) {
        throw new Error("Work status is required.");
      }

      const payload = {
        ...formData,
        department_id: Number(formData.department_id),
        role_id: Number(formData.role_id),
        work_status_id: Number(formData.work_status_id),
        salary_amount:
          formData.salary_amount === ""
            ? null
            : Number(formData.salary_amount),
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee.employee_id, payload);

        setSuccessMessage(
          "Employee details updated successfully."
        );
      } else {
        await createEmployee(payload);

        setSuccessMessage(
          "Employee added successfully."
        );
      }

      const employeesResponse = await getEmployees();
      setEmployees(employeesResponse.data || []);

      setCurrentPage(1);
      setShowForm(false);
      setEditingEmployee(null);
      setFormData(initialForm);
    } catch (err) {
      console.error(err);
      setFormError(err.message || "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // VIEW EMPLOYEE
  // =========================================================

  function openEmployeeDetails(employee) {
    setSelectedEmployee(employee);
  }

  function closeEmployeeDetails() {
    setSelectedEmployee(null);
  }

  // =========================================================
  // DEACTIVATE EMPLOYEE
  // =========================================================

  function openDeactivateModal(employee) {
    setEmployeeToDeactivate(employee);
    setShowDeactivateModal(true);
  }

  function closeDeactivateModal() {
    if (deactivating) {
      return;
    }

    setShowDeactivateModal(false);
    setEmployeeToDeactivate(null);
  }

  async function handleDeactivate() {
    if (!employeeToDeactivate) {
      return;
    }

    try {
      setDeactivating(true);
      setError("");
      setSuccessMessage("");

      await updateEmployeeEmploymentStatus(
        employeeToDeactivate.employee_id,
        "RESIGNED"
      );

      const employeesResponse = await getEmployees();
      const updatedEmployees = employeesResponse.data || [];

      setEmployees(updatedEmployees);

      setSuccessMessage(
        `${employeeToDeactivate.first_name} ${employeeToDeactivate.last_name} has been deactivated successfully.`
      );

      setShowDeactivateModal(false);
      setEmployeeToDeactivate(null);

      // Recalculate the page if the last record was removed
      setCurrentPage((previousPage) => {
        const newTotalPages = Math.max(
          1,
          Math.ceil(updatedEmployees.length / PAGE_SIZE)
        );

        return Math.min(previousPage, newTotalPages);
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to deactivate employee.");
    } finally {
      setDeactivating(false);
    }
  }

  // =========================================================
  // EMPLOYEE SUMMARY
  // =========================================================

  const employeeSummary = useMemo(() => {
    return {
      total: employees.length,

      employed: employees.filter(
        (employee) => employee.employment_status === "EMPLOYED"
      ).length,

      onLeave: employees.filter(
        (employee) =>
          employee.employment_status === "ON_LEAVE" ||
          employee.work_status === "ON_LEAVE"
      ).length,

      onBench: employees.filter(
        (employee) => employee.work_status === "ON_BENCH"
      ).length,

      onPip: employees.filter(
        (employee) => employee.work_status === "PIP"
      ).length,

      inTraining: employees.filter(
        (employee) => employee.work_status === "TRAINING"
      ).length,

      active: employees.filter(
        (employee) =>
          employee.department_active_status === "ACTIVE"
      ).length,

      inactive: employees.filter(
        (employee) =>
          employee.department_active_status !== "ACTIVE"
      ).length,
    };
  }, [employees]);

  // =========================================================
  // FILTERING
  // =========================================================

  const filteredEmployees = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return employees.filter((employee) => {
      const employeeName =
        `${employee.first_name || ""} ${employee.last_name || ""}`
          .trim()
          .toLowerCase();

      const matchesSearch =
        !search ||
        employeeName.includes(search) ||
        String(employee.employee_code || "")
          .toLowerCase()
          .includes(search) ||
        String(employee.email || "")
          .toLowerCase()
          .includes(search) ||
        String(employee.department_name || "")
          .toLowerCase()
          .includes(search) ||
        String(employee.role_name || "")
          .toLowerCase()
          .includes(search);

      const matchesDepartment =
        !departmentFilter ||
        String(employee.department_id) === String(departmentFilter) ||
        employee.department_name === departmentFilter;

      const matchesEmploymentStatus =
        !employmentStatusFilter ||
        employee.employment_status === employmentStatusFilter;

      const matchesWorkStatus =
        !workStatusFilter ||
        employee.work_status === workStatusFilter;

      const matchesActiveStatus =
        !activeStatusFilter ||
        employee.department_active_status === activeStatusFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesEmploymentStatus &&
        matchesWorkStatus &&
        matchesActiveStatus
      );
    });
  }, [
    employees,
    searchTerm,
    departmentFilter,
    employmentStatusFilter,
    workStatusFilter,
    activeStatusFilter,
  ]);

  // =========================================================
  // SORTING - 27G
  // =========================================================

  const sortedEmployees = useMemo(() => {
    const sorted = [...filteredEmployees];

    sorted.sort((a, b) => {
      let valueA = "";
      let valueB = "";

      switch (sortConfig.key) {
        case "employee_code":
          valueA = a.employee_code || "";
          valueB = b.employee_code || "";
          break;

        case "employee_name":
          valueA =
            `${a.first_name || ""} ${a.last_name || ""}`.trim();
          valueB =
            `${b.first_name || ""} ${b.last_name || ""}`.trim();
          break;

        case "department_name":
          valueA = a.department_name || "";
          valueB = b.department_name || "";
          break;

        case "role_name":
          valueA = a.role_name || "";
          valueB = b.role_name || "";
          break;

        case "work_status":
          valueA = a.work_status || "";
          valueB = b.work_status || "";
          break;

        case "employment_status":
          valueA = a.employment_status || "";
          valueB = b.employment_status || "";
          break;

        case "department_active_status":
          valueA = a.department_active_status || "";
          valueB = b.department_active_status || "";
          break;

        default:
          valueA = "";
          valueB = "";
      }

      const normalizedA = String(valueA).toLowerCase();
      const normalizedB = String(valueB).toLowerCase();

      if (normalizedA < normalizedB) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (normalizedA > normalizedB) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });

    return sorted;
  }, [filteredEmployees, sortConfig]);

  function handleSort(key) {
    setSortConfig((previous) => {
      if (previous.key === key) {
        return {
          key,
          direction:
            previous.direction === "asc" ? "desc" : "asc",
        };
      }

      return {
        key,
        direction: "asc",
      };
    });

    // Start from first page after changing sort
    setCurrentPage(1);
  }

  function renderSortIndicator(key) {
    if (sortConfig.key !== key) {
      return (
        <span className="sort-indicator inactive">
          ↕
        </span>
      );
    }

    return (
      <span className="sort-indicator">
        {sortConfig.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  // =========================================================
  // PAGINATION - 27H
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(sortedEmployees.length / PAGE_SIZE)
  );

  // Make sure the current page is always valid.
  useEffect(() => {
    setCurrentPage((previousPage) =>
      Math.min(Math.max(previousPage, 1), totalPages)
    );
  }, [totalPages]);

  // Reset pagination whenever filtering changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    departmentFilter,
    employmentStatusFilter,
    workStatusFilter,
    activeStatusFilter,
  ]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    return sortedEmployees.slice(startIndex, endIndex);
  }, [sortedEmployees, currentPage]);

  const startRecord =
    sortedEmployees.length === 0
      ? 0
      : (currentPage - 1) * PAGE_SIZE + 1;

  const endRecord = Math.min(
    currentPage * PAGE_SIZE,
    sortedEmployees.length
  );

  function goToPage(pageNumber) {
    const safePage = Math.min(
      Math.max(pageNumber, 1),
      totalPages
    );

    setCurrentPage(safePage);
  }

  function goToPreviousPage() {
    setCurrentPage((previousPage) =>
      Math.max(previousPage - 1, 1)
    );
  }

  function goToNextPage() {
    setCurrentPage((previousPage) =>
      Math.min(previousPage + 1, totalPages)
    );
  }

  // =========================================================
  // FILTER RESET
  // =========================================================

  function clearFilters() {
    setSearchTerm("");
    setDepartmentFilter("");
    setEmploymentStatusFilter("");
    setWorkStatusFilter("");
    setActiveStatusFilter("");
    setCurrentPage(1);
  }

  const hasActiveFilters =
    searchTerm ||
    departmentFilter ||
    employmentStatusFilter ||
    workStatusFilter ||
    activeStatusFilter;

  // =========================================================
  // STATUS CLASS
  // =========================================================

  function getStatusClass(status) {
    if (status === "ACTIVE") {
      return "status-badge active-status";
    }

    if (
      status === "ON_LEAVE" ||
      status === "PIP" ||
      status === "TRAINING"
    ) {
      return "status-badge attention";
    }

    return "status-badge inactive-status";
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="employees-page">
      {/* PAGE HEADER */}

      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p>
            Manage employee records, employment status and
            workforce activity.
          </p>
        </div>

        <button
          type="button"
          className="primary-action-button"
          onClick={openAddEmployeeForm}
        >
          + Add Employee
        </button>
      </div>

      {/* SUCCESS */}

      {successMessage && (
        <div className="employee-success-message">
          {successMessage}
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="employee-form-error">
          {error}
        </div>
      )}

      {/* EMPLOYEE SUMMARY */}

      <div className="employee-summary-grid">
        <div className="employee-summary-card">
          <span>Total Employees</span>
          <strong>{employeeSummary.total}</strong>
          <small>All employee records</small>
        </div>

        <div className="employee-summary-card">
          <span>Employed</span>
          <strong>{employeeSummary.employed}</strong>
          <small>Employment status</small>
        </div>

        <div className="employee-summary-card">
          <span>Active</span>
          <strong>{employeeSummary.active}</strong>
          <small>Department-specific active rule</small>
        </div>

        <div className="employee-summary-card">
          <span>Inactive</span>
          <strong>{employeeSummary.inactive}</strong>
          <small>Outside active criteria</small>
        </div>

        <div className="employee-summary-card">
          <span>On Leave</span>
          <strong>{employeeSummary.onLeave}</strong>
          <small>Employees currently on leave</small>
        </div>

        <div className="employee-summary-card">
          <span>On Bench</span>
          <strong>{employeeSummary.onBench}</strong>
          <small>Active bench employees</small>
        </div>

        <div className="employee-summary-card">
          <span>On PIP</span>
          <strong>{employeeSummary.onPip}</strong>
          <small>Performance improvement</small>
        </div>

        <div className="employee-summary-card">
          <span>Training</span>
          <strong>{employeeSummary.inTraining}</strong>
          <small>Employees in training</small>
        </div>
      </div>

      {/* FILTERS */}

      <div className="employee-filter-toolbar">
        <input
          type="text"
          placeholder="Search employee, code, email, department..."
          value={searchTerm}
          onChange={(event) =>
            setSearchTerm(event.target.value)
          }
        />

        <select
          value={departmentFilter}
          onChange={(event) =>
            setDepartmentFilter(event.target.value)
          }
        >
          <option value="">All Departments</option>

          {departments.map((department) => (
            <option
              key={department.department_id}
              value={department.department_id}
            >
              {department.department_name}
            </option>
          ))}
        </select>

        <select
          value={employmentStatusFilter}
          onChange={(event) =>
            setEmploymentStatusFilter(event.target.value)
          }
        >
          <option value="">All Employment Status</option>
          <option value="EMPLOYED">EMPLOYED</option>
          <option value="PROBATION">PROBATION</option>
          <option value="ON_LEAVE">ON_LEAVE</option>
          <option value="RESIGNED">RESIGNED</option>
          <option value="TERMINATED">TERMINATED</option>
          <option value="RETIRED">RETIRED</option>
        </select>

        <select
          value={workStatusFilter}
          onChange={(event) =>
            setWorkStatusFilter(event.target.value)
          }
        >
          <option value="">All Work Status</option>

          {workStatuses.map((status) => (
            <option
              key={status.work_status_id}
              value={status.status_name}
            >
              {status.status_name}
            </option>
          ))}
        </select>

        <select
          value={activeStatusFilter}
          onChange={(event) =>
            setActiveStatusFilter(event.target.value)
          }
        >
          <option value="">All Active Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="NOT ACTIVE">NOT ACTIVE</option>
        </select>

        <button
          type="button"
          className="clear-filters-button"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          Clear Filters
        </button>
      </div>

      {/* FILTER SUMMARY */}

      <div className="employee-filter-summary">
        {hasActiveFilters
          ? `Showing ${sortedEmployees.length} matching employee${
              sortedEmployees.length === 1 ? "" : "s"
            }`
          : `Showing all ${sortedEmployees.length} employees`}
      </div>

      {/* EMPLOYEE TABLE */}

      <div className="table-wrapper">
        <table className="data-table employee-table">
          <thead>
            <tr>
              <th>
                <button
                  type="button"
                  className="table-sort-button"
                  onClick={() =>
                    handleSort("employee_code")
                  }
                >
                  Employee Code
                  {renderSortIndicator("employee_code")}
                </button>
              </th>

              <th>
                <button
                  type="button"
                  className="table-sort-button"
                  onClick={() =>
                    handleSort("employee_name")
                  }
                >
                  Employee
                  {renderSortIndicator("employee_name")}
                </button>
              </th>

              <th>
                <button
                  type="button"
                  className="table-sort-button"
                  onClick={() =>
                    handleSort("department_name")
                  }
                >
                  Department
                  {renderSortIndicator("department_name")}
                </button>
              </th>

              <th>
                <button
                  type="button"
                  className="table-sort-button"
                  onClick={() =>
                    handleSort("role_name")
                  }
                >
                  Role
                  {renderSortIndicator("role_name")}
                </button>
              </th>

              <th>
                <button
                  type="button"
                  className="table-sort-button"
                  onClick={() =>
                    handleSort("work_status")
                  }
                >
                  Work Status
                  {renderSortIndicator("work_status")}
                </button>
              </th>

              <th>
                <button
                  type="button"
                  className="table-sort-button"
                  onClick={() =>
                    handleSort("employment_status")
                  }
                >
                  Employment
                  {renderSortIndicator("employment_status")}
                </button>
              </th>

              <th>
                <button
                  type="button"
                  className="table-sort-button"
                  onClick={() =>
                    handleSort("department_active_status")
                  }
                >
                  Active Status
                  {renderSortIndicator(
                    "department_active_status"
                  )}
                </button>
              </th>

              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8">
                  Loading employees...
                </td>
              </tr>
            ) : paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan="8">
                  No employees found matching the selected
                  criteria.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((employee) => (
                <tr key={employee.employee_id}>
                  <td>
                    <strong>
                      {employee.employee_code}
                    </strong>
                  </td>

                  <td>
                    <strong>
                      {employee.first_name}{" "}
                      {employee.last_name}
                    </strong>

                    <span className="table-secondary-text">
                      {employee.email}
                    </span>
                  </td>

                  <td>
                    {employee.department_name || "-"}
                  </td>

                  <td>
                    {employee.role_name || "-"}
                  </td>

                  <td>
                    {employee.work_status ? (
                      <span className="status-badge neutral">
                        {employee.work_status}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>
                    <span
                      className={
                        employee.employment_status ===
                        "EMPLOYED"
                          ? "status-badge active-status"
                          : "status-badge inactive-status"
                      }
                    >
                      {employee.employment_status || "-"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={getStatusClass(
                        employee.department_active_status
                      )}
                    >
                      {employee.department_active_status ||
                        "NOT ACTIVE"}
                    </span>
                  </td>

                  <td>
                    <div className="employee-action-buttons">
                      <button
                        type="button"
                        className="view-employee-button"
                        onClick={() =>
                          openEmployeeDetails(employee)
                        }
                      >
                        View
                      </button>

                      <button
                        type="button"
                        className="edit-employee-button"
                        onClick={() =>
                          openEditEmployeeForm(employee)
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="deactivate-employee-button"
                        onClick={() =>
                          openDeactivateModal(employee)
                        }
                        disabled={
                          employee.employment_status !==
                          "EMPLOYED"
                        }
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* =====================================================
          27H PAGINATION CONTROLS
          ===================================================== */}

      {!loading && sortedEmployees.length > 0 && (
        <div className="employee-pagination">
          <div className="pagination-summary">
            Showing <strong>{startRecord}</strong>–{" "}
            <strong>{endRecord}</strong> of{" "}
            <strong>{sortedEmployees.length}</strong> employees
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-button"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <div className="pagination-pages">
              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={
                    currentPage === pageNumber
                      ? "pagination-page active"
                      : "pagination-page"
                  }
                  onClick={() =>
                    goToPage(pageNumber)
                  }
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="pagination-button"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD / EDIT EMPLOYEE MODAL
          ===================================================== */}

      {showForm && (
        <div className="employee-form-overlay">
          <div className="employee-form-modal">
            <div className="employee-form-header">
              <div>
                <h2>
                  {editingEmployee
                    ? "Edit Employee"
                    : "Add Employee"}
                </h2>

                <p>
                  {editingEmployee
                    ? "Update employee information and workforce details."
                    : "Enter the employee information required for HR360."}
                </p>
              </div>

              <button
                type="button"
                className="close-modal-button"
                onClick={closeEmployeeForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="employee-form-error">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="employee-form-grid">
                <div className="form-field">
                  <label htmlFor="employee_code">
                    Employee Code
                  </label>

                  <input
                    id="employee_code"
                    name="employee_code"
                    type="text"
                    value={formData.employee_code}
                    onChange={handleFormChange}
                    placeholder="EMP001"
                    disabled={Boolean(editingEmployee)}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="first_name">
                    First Name *
                  </label>

                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={handleFormChange}
                    placeholder="First name"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="last_name">
                    Last Name *
                  </label>

                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={handleFormChange}
                    placeholder="Last name"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="email">
                    Email *
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="employee@company.com"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="phone">
                    Phone
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="Phone number"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="department_id">
                    Department *
                  </label>

                  <select
                    id="department_id"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">
                      Select department
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department.department_id}
                        value={department.department_id}
                      >
                        {department.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="role_id">
                    Role *
                  </label>

                  <select
                    id="role_id"
                    name="role_id"
                    value={formData.role_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">
                      Select role
                    </option>

                    {jobRoles.map((role) => (
                      <option
                        key={role.role_id}
                        value={role.role_id}
                      >
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="work_status_id">
                    Work Status *
                  </label>

                  <select
                    id="work_status_id"
                    name="work_status_id"
                    value={formData.work_status_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">
                      Select work status
                    </option>

                    {workStatuses.map((status) => (
                      <option
                        key={status.work_status_id}
                        value={status.work_status_id}
                      >
                        {status.status_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="employment_status">
                    Employment Status
                  </label>

                  <select
                    id="employment_status"
                    name="employment_status"
                    value={formData.employment_status}
                    onChange={handleFormChange}
                  >
                    <option value="EMPLOYED">
                      EMPLOYED
                    </option>

                    <option value="PROBATION">
                      PROBATION
                    </option>

                    <option value="ON_LEAVE">
                      ON_LEAVE
                    </option>

                    <option value="RESIGNED">
                      RESIGNED
                    </option>

                    <option value="TERMINATED">
                      TERMINATED
                    </option>

                    <option value="RETIRED">
                      RETIRED
                    </option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="joining_date">
                    Joining Date
                  </label>

                  <input
                    id="joining_date"
                    name="joining_date"
                    type="date"
                    value={formData.joining_date}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="salary_amount">
                    Salary Amount
                  </label>

                  <input
                    id="salary_amount"
                    name="salary_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salary_amount}
                    onChange={handleFormChange}
                    placeholder="Salary amount"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="salary_status">
                    Salary Status
                  </label>

                  <select
                    id="salary_status"
                    name="salary_status"
                    value={formData.salary_status}
                    onChange={handleFormChange}
                  >
                    <option value="PAID">
                      PAID
                    </option>

                    <option value="PENDING">
                      PENDING
                    </option>

                    <option value="HOLD">
                      HOLD
                    </option>
                  </select>
                </div>
              </div>

              <div className="employee-form-actions">
                <button
                  type="button"
                  className="cancel-form-button"
                  onClick={closeEmployeeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-employee-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingEmployee
                    ? "Update Employee"
                    : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          EMPLOYEE DETAILS MODAL
          ===================================================== */}

      {selectedEmployee && (
        <div className="employee-details-overlay">
          <div className="employee-details-panel">
            <div className="employee-details-header">
              <div>
                <h2>
                  {selectedEmployee.first_name}{" "}
                  {selectedEmployee.last_name}
                </h2>

                <p>
                  {selectedEmployee.employee_code}
                </p>
              </div>

              <button
                type="button"
                className="close-modal-button"
                onClick={closeEmployeeDetails}
              >
                ×
              </button>
            </div>

            <div className="employee-details-grid">
              <div>
                <span>Employee Code</span>
                <strong>
                  {selectedEmployee.employee_code ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Full Name</span>
                <strong>
                  {selectedEmployee.first_name}{" "}
                  {selectedEmployee.last_name}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {selectedEmployee.email || "-"}
                </strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>
                  {selectedEmployee.phone || "-"}
                </strong>
              </div>

              <div>
                <span>Department</span>
                <strong>
                  {selectedEmployee.department_name ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Role</span>
                <strong>
                  {selectedEmployee.role_name || "-"}
                </strong>
              </div>

              <div>
                <span>Work Status</span>
                <strong>
                  {selectedEmployee.work_status || "-"}
                </strong>
              </div>

              <div>
                <span>Employment Status</span>
                <strong>
                  {selectedEmployee.employment_status ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Active Status</span>
                <strong>
                  {selectedEmployee.department_active_status ||
                    "NOT ACTIVE"}
                </strong>
              </div>

              <div>
                <span>Joining Date</span>
                <strong>
                  {selectedEmployee.joining_date
                    ? selectedEmployee.joining_date.substring(
                        0,
                        10
                      )
                    : "-"}
                </strong>
              </div>

              <div>
                <span>Salary Amount</span>
                <strong>
                  {selectedEmployee.salary_amount ??
                    "-"}
                </strong>
              </div>

              <div>
                <span>Salary Status</span>
                <strong>
                  {selectedEmployee.salary_status || "-"}
                </strong>
              </div>
            </div>

            <div className="employee-details-actions">
              <button
                type="button"
                className="edit-employee-button"
                onClick={() => {
                  closeEmployeeDetails();
                  openEditEmployeeForm(selectedEmployee);
                }}
              >
                Edit Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DEACTIVATION MODAL
          ===================================================== */}

      {showDeactivateModal &&
        employeeToDeactivate && (
          <div className="deactivation-overlay">
            <div className="deactivation-modal">
              <div className="deactivation-header">
                <h2>Deactivate Employee</h2>

                <button
                  type="button"
                  className="close-modal-button"
                  onClick={closeDeactivateModal}
                  disabled={deactivating}
                >
                  ×
                </button>
              </div>

              <p>
                Are you sure you want to deactivate{" "}
                <strong>
                  {employeeToDeactivate.first_name}{" "}
                  {employeeToDeactivate.last_name}
                </strong>
                ?
              </p>

              <div className="deactivation-warning">
                This action will change the employee's
                employment status to <strong>RESIGNED</strong>.
                The employee record will remain in HR360 for
                historical and reporting purposes.
              </div>

              <div className="deactivation-actions">
                <button
                  type="button"
                  className="cancel-form-button"
                  onClick={closeDeactivateModal}
                  disabled={deactivating}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="confirm-deactivation-button"
                  onClick={handleDeactivate}
                  disabled={deactivating}
                >
                  {deactivating
                    ? "Deactivating..."
                    : "Confirm Deactivation"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

export default Employees;