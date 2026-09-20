import { useEffect, useMemo, useState } from "react";
import { getEmployees } from "../services/api";

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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    }

    loadEmployees();
  }, []);

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

  return (
    <div className="employees-page">
      <div className="page-header">
        <div>
          <h1>Employees</h1>
          <p>
            Employee master data and department-specific activity status.
          </p>
        </div>

        <div className="employee-count">
          {filteredEmployees.length} employee
          {filteredEmployees.length !== 1 ? "s" : ""}
        </div>
      </div>

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
                        {employee.department_active_status || "NOT ACTIVE"}
                      </span>
                    </td>

                    <td>{employee.joining_date || "-"}</td>

                    <td>
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
        </div>
      )}
    </div>
  );
}

export default Employees;