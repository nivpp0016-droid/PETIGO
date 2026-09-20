const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token");
}

async function request(
  endpoint,
  options = {}
) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers
    }
  );

  let data;
  try {
    data = await response.json();
  } catch {
    data = { error: response.statusText || "Request failed" };
  }

  if (
    response.status === 401 &&
    token &&
    (data.error === "Invalid or expired token" || data.error === "Authentication required")
  ) {
    logout();
    window.location.reload();
  }

  if (!response.ok) {
    throw new Error(
      data.error || "Request failed"
    );
  }

  return data;
}

// Authentication
export async function register(
  name,
  email,
  password
) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password
    })
  });
}

export async function login(
  email,
  password
) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password
    })
  });
}

// Parcel boxes
export async function getBoxes() {
  return request("/api/boxes");
}

export async function getActivities() {
  return request("/api/boxes/activity");
}

// Generate delivery OTP
export async function generateOTP(
  boxId
) {
  return request("/api/otp/generate", {
    method: "POST",
    body: JSON.stringify({
      boxId
    })
  });
}

// Verify delivery OTP
export async function verifyOTP(
  boxId,
  otp
) {
  return request("/api/otp/verify", {
    method: "POST",
    body: JSON.stringify({
      boxId,
      otp
    })
  });
}

// Device status
export async function getDeviceStatus(
  boxId
) {
  return request(
    `/api/boxes/${boxId}`
  );
}

// Remote unlock
export async function unlockBox(
  boxId
) {
  return request(
    `/api/boxes/${boxId}/unlock`,
    {
      method: "POST"
    }
  );
}

// Logout
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// Current user
export function getStoredUser() {
  const savedUser =
    localStorage.getItem("user");

  try {
    return savedUser
      ? JSON.parse(savedUser)
      : null;
  } catch {
    return null;
  }
}

export async function getDeliveries() {
  return request("/api/boxes/deliveries");
}