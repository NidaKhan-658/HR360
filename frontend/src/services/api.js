const API_BASE_URL = "http://localhost:5000/api";

export async function getAnalyticsOverview() {
  const response = await fetch(`${API_BASE_URL}/analytics/overview`);

  if (!response.ok) {
    throw new Error("Failed to fetch HR360 analytics overview");
  }

  return response.json();
}

export async function getEmployees() {
  const response = await fetch(`${API_BASE_URL}/employees`);

  if (!response.ok) {
    throw new Error("Failed to fetch employees");
  }

  return response.json();
}

export async function getDepartments() {
  const response = await fetch(`${API_BASE_URL}/departments`);

  if (!response.ok) {
    throw new Error("Failed to fetch departments");
  }

  return response.json();
}

export async function getJobRoles() {
  const response = await fetch(`${API_BASE_URL}/job-roles`);

  if (!response.ok) {
    throw new Error("Failed to fetch job roles");
  }

  return response.json();
}

export async function getWorkStatuses() {
  const response = await fetch(`${API_BASE_URL}/work-statuses`);

  if (!response.ok) {
    throw new Error("Failed to fetch work statuses");
  }

  return response.json();
}

// Employees Crud //

export async function createEmployee(employeeData) {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employeeData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create employee");
  }

  return data;
}

export async function updateEmployee(employeeId, employeeData) {
  const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employeeData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update employee");
  }

  return data;
}
export async function updateEmployeeEmploymentStatus(
  employeeId,
  employmentStatus
) {
  const response = await fetch(
    `${API_BASE_URL}/employees/${employeeId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        employment_status: employmentStatus,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to update employee employment status"
    );
  }

  return data;
}


// Attendance API //

export async function getAttendance() {
  const response = await fetch(`${API_BASE_URL}/attendance`);

  if (!response.ok) {
    throw new Error("Failed to fetch attendance records");
  }

  return response.json();
}

export async function getAttendanceById(attendanceId) {
  const response = await fetch(
    `${API_BASE_URL}/attendance/${attendanceId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch attendance record");
  }

  return response.json();
}

export async function getEmployeeAttendance(employeeId) {
  const response = await fetch(
    `${API_BASE_URL}/attendance/employee/${employeeId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch employee attendance");
  }

  return response.json();
}

export async function createAttendance(attendanceData) {
  const response = await fetch(`${API_BASE_URL}/attendance`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(attendanceData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create attendance record");
  }

  return data;
}

export async function updateAttendance(attendanceId, attendanceData) {
  const response = await fetch(
    `${API_BASE_URL}/attendance/${attendanceId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attendanceData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update attendance record");
  }

  return data;
}