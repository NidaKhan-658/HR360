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