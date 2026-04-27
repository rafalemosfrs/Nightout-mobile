const API_BASE_URL = "https://night-out-api.onrender.com";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.message || "Erro ao comunicar com a API.");
  }

  return data;
}

export function loginRequest(payload) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerClientRequest(payload) {
  return request("/cliente/cadastro", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerArtistRequest(payload) {
  return request("/artista/cadastro", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registerCasaShowRequest(payload) {
  return request("/casadeshow/cadastro", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCasaShowDashboardRequest(token) {
  return request("/casadeshow/dashboard", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}
