
const API_URL =
  process.env.NEXT_PUBLIC_API_URL 

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    throw new Error(
      `Invalid API response for ${path}. Check the backend URL and route.`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export function getDashboard() {
  return request("/api/parking/dashboard");
}

export function getParkingStatus() {
  return request("/api/parking/status");
}

export function getParkingHistory() {
  return request("/api/parking/history");
}

export function vehicleEntry(vehicleNumber, vehicleType) {
  return request("/api/parking/entry", {
    method: "POST",
    body: JSON.stringify({ vehicleNumber, vehicleType }),
  });
}

export function vehicleExit(vehicleNumber) {
  return request("/api/parking/exit", {
    method: "POST",
    body: JSON.stringify({ vehicleNumber }),
  });
}
