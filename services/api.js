const API_BASE_URL = "https://night-out-api-usuarios.onrender.com";

async function requestToBase(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
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

async function request(path, options = {}) {
  return requestToBase(API_BASE_URL, path, options);
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

export function getClients(token) {
  return request("/cliente?page=1&pageSize=1000", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getClientById(id, token) {
  return request(`/cliente/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getArtists(token) {
  return request("/artista?page=1&pageSize=1000", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getArtistProposals(token) {
  return requestToBase(
    EVENTS_API_BASE_URL,
    "/propostaArtista?page=1&pageSize=1000",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

export function getEvents(token) {
  return requestToBase(EVENTS_API_BASE_URL, "/evento?page=1&pageSize=1000", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getCasaShows(token) {
  return request("/casadeshow?page=1&pageSize=1000", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}