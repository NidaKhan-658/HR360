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

function getStatusClass(status) {
  if (!status) {
    return "status-badge neutral";
  }

  const normalizedStatus = String(status).toUpperCase();

  if (
    normalizedStatus === "ACTIVE" ||
    normalizedStatus === "EMPLOYED" ||
    normalizedStatus === "WORKING" ||
    normalizedStatus === "ONLINE"
  ) {
    return "status-badge active";
  }

  if (
    normalizedStatus === "PIP" ||
    normalizedStatus === "TRAINING" ||
    normalizedStatus === "ON_LEAVE" ||
    normalizedStatus === "ON_BENCH"
  ) {
    return "status-badge attention";
  }

  if (
    normalizedStatus === "RESIGNED" ||
    normalizedStatus === "TERMINATED" ||
    normalizedStatus === "RETIRED" ||
    normalizedStatus === "NOT ACTIVE"
  ) {
    return "status-badge inactive";
  }

  return "status-badge neutral";
}

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [workStatuses, setWorkStatuses] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [savingEmployee, setSavingEmployee] = useState(false);

  const [deactivatingEmployee, setDeactivatingEmployee] = useState(null);
  const [deactivationStatus, setDeactivationStatus] = useState("RESIGNED");
  const [deactivationLoading, setDeactivationLoading] = useState(false);

  const [formData, setFormData] = useState({
    employee_code: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department_id: "",
    role_id: "",
    work_status_id: "",
    employment_status: "EMPLOYED",
    salary_amount: "",
    salary_status: "PAID",
    joining_date: "",
  });

  async function loadEmployees() {
    try {
      const response = await getEmployees();

      if (!response.success) {
        throw new Error("Employees API returned an unsuccessful response");
      }

      setEmployees(response.data || []);
    } catch (err) {
      console.error(err);
      setError("Unable to load employee data.");
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setError("");

        const [
          employeesResponse,
          departmentsResponse,
          rolesResponse,
          workStatusesResponse,
        ] = await Promise.all([
          getEmployees(),
          getDepartments(),
          getJobRoles(),
          getWorkStatuses(),
        ]);

        if (!employeesResponse.success) {
          throw new Error("Failed to load employees");
        }

        if (!departmentsResponse.success) {
          throw new Error("Failed to load departments");
        }

        if (!rolesResponse.success) {
          throw new Error("Failed to load job roles");
        }

        if (!workStatusesResponse.success) {
          throw new Error("Failed to load work statuses");
        }

        setEmployees(employeesResponse.data || []);
        setDepartments(departmentsResponse.data || []);
        setJobRoles(rolesResponse.data || []);
        setWorkStatuses(workStatusesResponse.data || []);
      } catch (err) {
        console.error(err);
        setError("Unable to load employee management data.");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  const employeeSummary = useMemo(() => {
    const total = employees.length;

    const employed = employees.filter(
      (employee) => employee.employment_status === "EMPLOYED"
    ).length;

    const probation = employees.filter(
      (employee) => employee.employment_status === "PROBATION"
    ).length;

    const onLeave = employees.filter(
      (employee) => employee.employment_status === "ON_LEAVE"
    ).length;

    const onPip = employees.filter(
      (employee) => String(employee.work_status).toUpperCase() === "PIP"
    ).length;

    const onBench = employees.filter(
      (employee) =>
        String(employee.work_status).toUpperCase() === "ON_BENCH"
    ).length;

    const active = employees.filter(
      (employee) =>
        String(employee.department_active_status).toUpperCase() ===
        "ACTIVE"
    ).length;

    const inactive = employees.filter(
      (employee) =>
        String(employee.department_active_status).toUpperCase() ===
        "NOT ACTIVE"
    ).length;

    return {
      total,
      employed,
      probation,
      onLeave,
      onPip,
      onBench,
      active,
      inactive,
    };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) {
      return employees;
    }

    return employees.filter((employee) =>
      [
        employee.employee_code,
        employee.first_name,
        employee.last_name,
        employee.email,
        employee.department_name,
        employee.role_name,
        employee.work_status,
        employee.employment_status,
        employee.salary_status,
        employee.department_active_status,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(searchText)
        )
    );
  }, [employees, search]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setFormData({
      employee_code: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      department_id: "",
      role_id: "",
      work_status_id: "",
      employment_status: "EMPLOYED",
      salary_amount: "",
      salary_status: "PAID",
      joining_date: "",
    });
  }

  function handleOpenAddForm() {
    resetForm();
    setEditingEmployee(null);
    setFormError("");
    setSuccessMessage("");
    setShowAddForm(true);
  }

  function handleEditEmployee(employee) {
    const department = departments.find(
      (item) =>
        String(item.department_name).toLowerCase() ===
        String(employee.department_name).toLowerCase()
    );

    const role = jobRoles.find(
      (item) =>
        String(item.role_name).toLowerCase() ===
        String(employee.role_name).toLowerCase()
    );

    const workStatus = workStatuses.find(
      (item) =>
        String(item.status_name).toLowerCase() ===
        String(employee.work_status).toLowerCase()
    );

    setFormData({
      employee_code: employee.employee_code || "",
      first_name: employee.first_name || "",
      last_name: employee.last_name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      department_id: department?.department_id
        ? String(department.department_id)
        : "",
      role_id: role?.role_id ? String(role.role_id) : "",
      work_status_id: workStatus?.work_status_id
        ? String(workStatus.work_status_id)
        : "",
      employment_status: employee.employment_status || "EMPLOYED",
      salary_amount: employee.salary_amount || "",
      salary_status: employee.salary_status || "PAID",
      joining_date: employee.joining_date
        ? String(employee.joining_date).substring(0, 10)
        : "",
    });

    setEditingEmployee(employee);
    setSelectedEmployee(null);
    setFormError("");
    setSuccessMessage("");
    setShowAddForm(true);
  }

  async function handleSaveEmployee(event) {
    event.preventDefault();

    try {
      setSavingEmployee(true);
      setFormError("");
      setSuccessMessage("");

      const employeeData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        department_id: Number(formData.department_id),
        role_id: Number(formData.role_id),
        work_status_id: formData.work_status_id
          ? Number(formData.work_status_id)
          : null,
        employment_status: formData.employment_status,
        joining_date: formData.joining_date,
        salary_amount: formData.salary_amount
          ? Number(formData.salary_amount)
          : null,
        salary_status: formData.salary_status || null,
      };

      let response;

      if (editingEmployee) {
        response = await updateEmployee(
          editingEmployee.employee_id,
          employeeData
        );
      } else {
        response = await createEmployee({
          employee_code: formData.employee_code.trim(),
          ...employeeData,
        });
      }

      if (!response.success) {
        throw new Error(
          response.message || "Unable to save employee"
        );
      }

      setSuccessMessage(
        editingEmployee
          ? "Employee updated successfully."
          : "Employee created successfully."
      );

      setShowAddForm(false);
      setEditingEmployee(null);
      resetForm();

      await loadEmployees();
    } catch (err) {
      console.error(err);
      setFormError(
        err.message || "Unable to save employee. Please try again."
      );
    } finally {
      setSavingEmployee(false);
    }
  }

  function handleCancelForm() {
    setShowAddForm(false);
    setEditingEmployee(null);
    setFormError("");
    resetForm();
  }

  function handleOpenDeactivation(employee) {
    setDeactivatingEmployee(employee);
    setDeactivationStatus("RESIGNED");
    setSuccessMessage("");
  }

  function handleCancelDeactivation() {
    if (deactivationLoading) {
      return;
    }

    setDeactivatingEmployee(null);
    setDeactivationStatus("RESIGNED");
  }

  async function handleConfirmDeactivation() {
    if (!deactivatingEmployee) {
      return;
    }

    try {
      setDeactivationLoading(true);
      setError("");

      const response = await updateEmployeeEmploymentStatus(
        deactivatingEmployee.employee_id,
        deactivationStatus
      );

      if (!response.success) {
        throw new Error(
          response.message || "Failed to deactivate employee"
        );
      }

      setSuccessMessage(
        `${deactivatingEmployee.first_name} ${deactivatingEmployee.last_name} was marked as ${deactivationStatus}.`
      );

      setDeactivatingEmployee(null);
      setSelectedEmployee(null);

      await loadEmployees();
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Unable to update employee status."
      );
    } finally {
      setDeactivationLoading(false);
    }
  }

  return (
    <div className="employees-page">
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p>
            Employee master data and department-specific activity status.
          </p>
        </div>

        <div className="employee-header-actions">
          <div className="employee-count">
            {filteredEmployees.length} employee
            {filteredEmployees.length !== 1 ? "s" : ""}
          </div>

          <button
            type="button"
            className="add-employee-button"
            onClick={handleOpenAddForm}
          >
            + Add Employee
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="employee-success-message">
          {successMessage}
        </div>
      )}

      <div className="employee-summary-grid">
        <div className="employee-summary-card">
          <span>Total Employees</span>
          <strong>{employeeSummary.total}</strong>
          <small>All employee records</small>
        </div>

        <div className="employee-summary-card">
          <span>Employed</span>
          <strong>{employeeSummary.employed}</strong>
          <small>Current employees</small>
        </div>

        <div className="employee-summary-card">
          <span>Probation</span>
          <strong>{employeeSummary.probation}</strong>
          <small>Employees on probation</small>
        </div>

        <div className="employee-summary-card">
          <span>On Leave</span>
          <strong>{employeeSummary.onLeave}</strong>
          <small>Employment status</small>
        </div>

        <div className="employee-summary-card">
          <span>On PIP</span>
          <strong>{employeeSummary.onPip}</strong>
          <small>Performance improvement</small>
        </div>

        <div className="employee-summary-card">
          <span>On Bench</span>
          <strong>{employeeSummary.onBench}</strong>
          <small>Work status</small>
        </div>

        <div className="employee-summary-card">
          <span>Active</span>
          <strong>{employeeSummary.active}</strong>
          <small>Department rule based</small>
        </div>

        <div className="employee-summary-card">
          <span>Inactive</span>
          <strong>{employeeSummary.inactive}</strong>
          <small>Department rule based</small>
        </div>
      </div>

      {showAddForm && (
        <div className="add-employee-panel">
          <div className="add-employee-header">
            <div>
              <h2>
                {editingEmployee ? "Edit Employee" : "Add Employee"}
              </h2>

              <p>
                {editingEmployee
                  ? "Update the employee master information."
                  : "Enter the employee master information."}
              </p>
            </div>

            <button
              type="button"
              className="close-form-button"
              onClick={handleCancelForm}
              disabled={savingEmployee}
            >
              Close
            </button>
          </div>

          {formError && (
            <div className="employee-form-error">
              {formError}
            </div>
          )}

          <form onSubmit={handleSaveEmployee}>
            <div className="employee-form-grid">
              <div className="form-field">
                <label htmlFor="employee_code">Employee Code</label>

                <input
                  id="employee_code"
                  name="employee_code"
                  type="text"
                  value={formData.employee_code}
                  onChange={handleFormChange}
                  disabled={Boolean(editingEmployee)}
                  required
                />

                {editingEmployee && (
                  <small className="form-help-text">
                    Employee code cannot be changed.
                  </small>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="first_name">First Name</label>

                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="last_name">Last Name</label>

                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">Email</label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="phone">Phone</label>

                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="department_id">Department</label>

                <select
                  id="department_id"
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select Department</option>

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
                <label htmlFor="role_id">Role</label>

                <select
                  id="role_id"
                  name="role_id"
                  value={formData.role_id}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select Role</option>

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
                <label htmlFor="work_status_id">Work Status</label>

                <select
                  id="work_status_id"
                  name="work_status_id"
                  value={formData.work_status_id}
                  onChange={handleFormChange}
                >
                  <option value="">Select Work Status</option>

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
                  <option value="EMPLOYED">EMPLOYED</option>
                  <option value="PROBATION">PROBATION</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                  <option value="RESIGNED">RESIGNED</option>
                  <option value="TERMINATED">TERMINATED</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="salary_amount">Salary Amount</label>

                <input
                  id="salary_amount"
                  name="salary_amount"
                  type="number"
                  min="0"
                  value={formData.salary_amount}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-field">
                <label htmlFor="salary_status">Salary Status</label>

                <select
                  id="salary_status"
                  name="salary_status"
                  value={formData.salary_status}
                  onChange={handleFormChange}
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="ON_HOLD">ON_HOLD</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="joining_date">Joining Date</label>

                <input
                  id="joining_date"
                  name="joining_date"
                  type="date"
                  value={formData.joining_date}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>

            <div className="employee-form-actions">
              <button
                type="button"
                className="cancel-form-button"
                onClick={handleCancelForm}
                disabled={savingEmployee}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-employee-button"
                disabled={savingEmployee}
              >
                {savingEmployee
                  ? "Saving..."
                  : editingEmployee
                    ? "Update Employee"
                    : "Save Employee"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="active-rule-info">
        <div className="active-rule-title">
          Department Active Status Rules
        </div>

        <div className="active-rule-list">
          <span>
            <strong>HR:</strong> EMPLOYED
          </span>

          <span>
            <strong>Operations:</strong> WORKING or ONLINE
          </span>

          <span>
            <strong>Finance:</strong> Salary PAID
          </span>
        </div>
      </div>

      <div className="employee-toolbar">
        <input
          type="text"
          placeholder="Search employee, department, role, status..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading && <p>Loading employees...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && (
        <div className="employee-table-wrapper">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Work Status</th>
                <th>Employment Status</th>
                <th>Salary Status</th>
                <th>Department Active Status</th>
                <th>Joining Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="9">No employees found.</td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr
                    key={employee.employee_id}
                    onClick={() => setSelectedEmployee(employee)}
                    className="employee-row-clickable"
                  >
                    <td>
                      <strong>
                        {employee.first_name} {employee.last_name}
                      </strong>

                      <span className="employee-code">
                        {employee.employee_code}
                      </span>
                    </td>

                    <td>{employee.department_name || "-"}</td>

                    <td>{employee.role_name || "-"}</td>

                    <td>
                      <span
                        className={getStatusClass(employee.work_status)}
                      >
                        {employee.work_status || "-"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={getStatusClass(
                          employee.employment_status
                        )}
                      >
                        {employee.employment_status || "-"}
                      </span>
                    </td>

                    <td>{employee.salary_status || "-"}</td>

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

                    <td>{employee.joining_date || "-"}</td>

                    <td>
                      <div className="employee-action-buttons">
                        <button
                          type="button"
                          className="view-employee-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedEmployee(employee);
                          }}
                        >
                          View
                        </button>

                        <button
                          type="button"
                          className="edit-employee-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditEmployee(employee);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="deactivate-employee-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenDeactivation(employee);
                          }}
                          disabled={
                            employee.employment_status !== "EMPLOYED" &&
                            employee.employment_status !== "PROBATION"
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
      )}

      {selectedEmployee && (
        <div className="employee-details-panel">
          <div className="employee-details-header">
            <div>
              <h2>
                {selectedEmployee.first_name}{" "}
                {selectedEmployee.last_name}
              </h2>

              <span className="employee-code">
                {selectedEmployee.employee_code}
              </span>
            </div>

            <button
              type="button"
              className="close-details-button"
              onClick={() => setSelectedEmployee(null)}
            >
              Close
            </button>
          </div>

          <div className="employee-details-grid">
            <div className="detail-item">
              <span>Email</span>
              <strong>{selectedEmployee.email || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Phone</span>
              <strong>{selectedEmployee.phone || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Department</span>
              <strong>{selectedEmployee.department_name || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Role</span>
              <strong>{selectedEmployee.role_name || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Work Status</span>
              <strong>
                <span
                  className={getStatusClass(selectedEmployee.work_status)}
                >
                  {selectedEmployee.work_status || "-"}
                </span>
              </strong>
            </div>

            <div className="detail-item">
              <span>Employment Status</span>
              <strong>
                <span
                  className={getStatusClass(
                    selectedEmployee.employment_status
                  )}
                >
                  {selectedEmployee.employment_status || "-"}
                </span>
              </strong>
            </div>

            <div className="detail-item">
              <span>Salary Status</span>
              <strong>{selectedEmployee.salary_status || "-"}</strong>
            </div>

            <div className="detail-item">
              <span>Department Active Status</span>
              <strong>
                <span
                  className={getStatusClass(
                    selectedEmployee.department_active_status
                  )}
                >
                  {selectedEmployee.department_active_status ||
                    "NOT ACTIVE"}
                </span>
              </strong>
            </div>

            <div className="detail-item">
              <span>Joining Date</span>
              <strong>{selectedEmployee.joining_date || "-"}</strong>
            </div>
          </div>

          {(selectedEmployee.employment_status === "EMPLOYED" ||
            selectedEmployee.employment_status === "PROBATION") && (
            <div className="employee-details-actions">
              <button
                type="button"
                className="deactivate-employee-button"
                onClick={() => handleOpenDeactivation(selectedEmployee)}
              >
                Deactivate Employee
              </button>
            </div>
          )}
        </div>
      )}

      {deactivatingEmployee && (
        <div className="deactivation-overlay">
          <div className="deactivation-modal">
            <div className="deactivation-header">
              <h2>Deactivate Employee</h2>

              <button
                type="button"
                className="close-modal-button"
                onClick={handleCancelDeactivation}
                disabled={deactivationLoading}
              >
                ×
              </button>
            </div>

            <p>
              You are changing the employment status of{" "}
              <strong>
                {deactivatingEmployee.first_name}{" "}
                {deactivatingEmployee.last_name}
              </strong>
              .
            </p>

            <div className="form-field">
              <label htmlFor="deactivation_status">
                New Employment Status
              </label>

              <select
                id="deactivation_status"
                value={deactivationStatus}
                onChange={(event) =>
                  setDeactivationStatus(event.target.value)
                }
                disabled={deactivationLoading}
              >
                <option value="RESIGNED">RESIGNED</option>
                <option value="TERMINATED">TERMINATED</option>
                <option value="RETIRED">RETIRED</option>
              </select>
            </div>

            <div className="deactivation-warning">
              The employee record will be retained. Only the employment
              status will be changed.
            </div>

            <div className="deactivation-actions">
              <button
                type="button"
                className="cancel-form-button"
                onClick={handleCancelDeactivation}
                disabled={deactivationLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-deactivation-button"
                onClick={handleConfirmDeactivation}
                disabled={deactivationLoading}
              >
                {deactivationLoading
                  ? "Updating..."
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