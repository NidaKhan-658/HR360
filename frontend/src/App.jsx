import { useEffect, useState } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import { getAnalyticsOverview } from "./services/api";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import "./App.css";


function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOverview() {
      try {
        const response = await getAnalyticsOverview();

        if (!response.success) {
          throw new Error("Analytics API returned an unsuccessful response");
        }

        setOverview(response.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

  return (
    <div>
      <h1>HR360 Dashboard</h1>
      <p>Human Resource Management & Analytics System</p>

      {loading && <p>Loading dashboard data...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && overview && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <span>Total Employees</span>
            <strong>{overview.total_employees}</strong>
          </div>

          <div className="kpi-card">
            <span>Employed Employees</span>
            <strong>{overview.employed_employees}</strong>
          </div>

          <div className="kpi-card">
            <span>Employees on Leave</span>
            <strong>{overview.employees_on_leave}</strong>
          </div>

          <div className="kpi-card">
            <span>Employees on PIP</span>
            <strong>{overview.employees_on_pip}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div>
      <h1>{title}</h1>
      <p>This HR360 module is ready for implementation.</p>
    </div>
  );
}

function App() {
  const navigation = [
    { label: "Dashboard", path: "/" },
    { label: "Employees", path: "/employees" },
    { label: "Attendance", path: "/attendance" },
    { label: "Leave", path: "/leave" },
    { label: "Performance", path: "/performance" },
    { label: "Training", path: "/training" },
    { label: "Recruitment", path: "/recruitment" },
    { label: "Analytics", path: "/analytics" },
  ];

  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">HR</div>
            <div>
              <h2>HR360</h2>
              <span>People Analytics</span>
            </div>
          </div>

          <nav className="navigation">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="main-area">
          <header className="topbar">
            <div>
              <strong>Human Resource Management System</strong>
            </div>

            <div className="user-area">
              <span>HR Business User</span>
              <div className="user-avatar">HR</div>
            </div>
          </header>

          <main className="page-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leave" element={<Leave />} />
              <Route
                path="/performance"
                element={<PlaceholderPage title="Performance Management" />}
              />
              <Route
                path="/training"
                element={<PlaceholderPage title="Training Management" />}
              />
              <Route
                path="/recruitment"
                element={<PlaceholderPage title="Recruitment" />}
              />
              <Route
                path="/analytics"
                element={<PlaceholderPage title="Analytics" />}
              />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;