
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* =========================
   Common API Helper
========================= */

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();

  return {
    success: false,
    message:
      text || `Request failed with status ${response.status}`,
  };
};

/* =========================
   Authentication Headers
========================= */

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
};

/* =========================
   Logout
========================= */

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "/login";
};

/* =========================
   Authentication
========================= */

// Login
export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  /*
   * Save token automatically after successful login.
   * This is important because all protected APIs
   * use the token from localStorage.
   */
  if (data.token) {
    localStorage.setItem("token", data.token);
  }

  if (data.user) {
    localStorage.setItem(
      "user",
      JSON.stringify(data.user)
    );
  }

  return data;
};

// Register
export const registerUser = async (
  name,
  email,
  password
) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || "Registration failed"
    );
  }

  return data;
};

// Get currently logged-in user
export const getCurrentUser = async () => {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await parseResponse(response);

  if (response.status === 401) {
    logout();
    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch user"
    );
  }

  return data;
};

/* =========================
   Monitored Accounts
========================= */

export const getMonitoredAccounts = async () => {
  const response = await fetch(`${API_URL}/monitor`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await parseResponse(response);

  if (response.status === 401) {
    logout();
    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch accounts"
    );
  }

  return data;
};

/* =========================
   Breaches
========================= */

export const getBreaches = async () => {
  const response = await fetch(`${API_URL}/breaches`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await parseResponse(response);

  if (response.status === 401) {
    logout();
    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch breaches"
    );
  }

  return data;
};

export const createBreach = async ({
  monitoredAccountId,
  source,
  breachName,
  breachDate,
  dataExposed,
  severity,
  description,
}) => {
  const response = await fetch(`${API_URL}/breaches`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      monitoredAccountId,
      source,
      breachName,
      breachDate: breachDate || null,
      dataExposed,
      severity,
      description,
    }),
  });

  const data = await parseResponse(response);

  if (response.status === 401) {
    logout();
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const error = new Error(data.message || "Failed to create breach");
    error.fields = data.fields || [];
    throw error;
  }

  return data;
};

/* =========================
   AI Security Analysis
========================= */

export const analyzeBreachWithAI = async (breachId) => {
  const response = await fetch(
    `${API_URL}/ai/analyze`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        breachId,
      }),
    }
  );

  const data = await parseResponse(response);

  if (response.status === 401) {
    logout();
    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message || "AI analysis failed"
    );
  }

  return data;
};

/* =========================
   Alerts
========================= */

// Get all alerts
export const getAlerts = async () => {
  const response = await fetch(`${API_URL}/alerts`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await parseResponse(response);

  if (response.status === 401) {
    logout();
    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch alerts"
    );
  }

  return data;
};

// Mark single alert as read
export const markAlertAsRead = async (id) => {
  if (!id) {
    throw new Error("Alert ID is required");
  }

  const response = await fetch(
    `${API_URL}/alerts/${id}/read`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  const data = await parseResponse(response);

  if (response.status === 401) {
    logout();
    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to mark alert as read"
    );
  }

  return data;
};

// Mark all alerts as read
export const markAllAlertsAsRead = async () => {
  const response = await fetch(
    `${API_URL}/alerts/read-all`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  const data = await parseResponse(response);

  if (response.status === 401) {
    logout();
    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to mark all alerts as read"
    );
  }

  return data;
};

/* =========================
   Audit Logs
========================= */

export const getAuditLogs = async () => {
  const response = await fetch(`${API_URL}/audit`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await parseResponse(response);

  if (response.status === 401) {
    logout();
    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch audit logs"
    );
  }

  return data;
};

/* =========================
   Overall Risk
========================= */

export const getOverallRisk = async () => {
  const response = await fetch(
    `${API_URL}/risk/overall`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const data = await parseResponse(response);

  if (response.status === 401) {
    logout();
    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch overall risk"
    );
  }

  return data;
};
// Delete monitored account
export const deleteMonitoredAccount = async (id) => {
  const response = await fetch(`${API_URL}/monitor/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await parseResponse(response);

  if (response.status === 401) {
    logout();
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to delete monitored account"
    );
  }

  return data;
};

export const checkMonitoredAccount = async (id) => {
  const response = await fetch(
    `${API_URL}/monitor/${id}/check`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );

  const data = await parseResponse(response);

  if (response.status === 401) {
    logout();
    throw new Error(
      "Session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Failed to check monitored account"
    );
  }

  return data;
};

export const getBreachById = async (id) => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `http://localhost:5000/api/breaches/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to fetch breach details"
    );
  }

  return data;
};