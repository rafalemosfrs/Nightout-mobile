const BASE_URL = 'https://api.nightout.com.br/eventos';

export async function fetchEvents() {
  const response = await fetch(`${BASE_URL}`);
  if (!response.ok) {
    throw new Error(`Erro ao buscar eventos (${response.status} ${response.statusText})`);
  }
  return response.json();
}

export async function fetchEventById(id) {
  const response = await fetch(`${BASE_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Erro ao buscar evento ${id} (${response.status} ${response.statusText})`);
  }
  return response.json();
}
