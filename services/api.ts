import type {
  Artista,
  ArtistaCadastroPayload,
  ArtistaCadastroResponse,
  AuthResponse,
  CasaDeShow,
  CasaDeShowCadastroPayload,
  CasaDeShowCadastroResponse,
  Cliente,
  ClienteCadastroPayload,
  ClienteCadastroResponse,
  Evento,
  EventoDTO,
  EventoListResponse,
  LoginPayload,
  PaginatedResponse,
  PropostaCasa,
  PropostaCasaDTO,
  PropostaCasaResponse,
  UpdatePropostaPayload,
  UUID,
} from '../types/api';
import { eventsApi, usersApi } from './apiClient';

function assertRequiredString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Campo obrigatorio invalido: ${field}.`);
  }
}

function assertEmail(value: unknown) {
  assertRequiredString(value, 'email');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
    throw new Error('Informe um email valido.');
  }
}

function assertNumber(value: unknown, field: string) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Campo numerico invalido: ${field}.`);
  }
}

function assertNumericValue(value: unknown, field: string) {
  const numericValue = typeof value === 'string' ? Number(value) : value;

  if (typeof numericValue !== 'number' || Number.isNaN(numericValue)) {
    throw new Error(`Campo numerico invalido: ${field}.`);
  }
}

function unwrapList<T>(response: T[] | PaginatedResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.data || response.items || response.eventos || response.propostas || [];
}

function validateLoginPayload(payload: LoginPayload) {
  assertEmail(payload.email);
  assertRequiredString(payload.senha, 'senha');
}

function validateClientePayload(payload: ClienteCadastroPayload) {
  assertRequiredString(payload.nome, 'nome');
  assertEmail(payload.email);
  assertRequiredString(payload.senha, 'senha');
  assertRequiredString(payload.telefone, 'telefone');
  assertRequiredString(payload.apelido, 'apelido');
  assertRequiredString(payload.preferencias, 'preferencias');

  if (
    payload.data_nascimento !== undefined &&
    payload.data_nascimento !== null &&
    String(payload.data_nascimento).trim() === ''
  ) {
    throw new Error('Campo obrigatorio invalido: data_nascimento.');
  }
}

function validateArtistaPayload(payload: ArtistaCadastroPayload) {
  assertRequiredString(payload.nome, 'nome');
  assertEmail(payload.email);
  assertRequiredString(payload.senha, 'senha');
  assertRequiredString(payload.telefone, 'telefone');
  assertRequiredString(payload.nome_artista, 'nome_artista');
  assertRequiredString(payload.genero_musical, 'genero_musical');
  assertNumber(payload.cache_min, 'cache_min');
  assertRequiredString(payload.descricao, 'descricao');
  assertRequiredString(payload.portifolio, 'portifolio');
}

function validateCasaPayload(payload: CasaDeShowCadastroPayload) {
  assertRequiredString(payload.nome, 'nome');
  assertEmail(payload.email);
  assertRequiredString(payload.senha, 'senha');
  assertRequiredString(payload.telefone, 'telefone');
  assertRequiredString(payload.nome_fantasia, 'nome_fantasia');
  assertRequiredString(payload.cnpj, 'cnpj');
  assertNumericValue(payload.capacidade, 'capacidade');
  assertRequiredString(payload.endereco, 'endereco');
  assertRequiredString(payload.bairro, 'bairro');
  assertRequiredString(payload.estado, 'estado');
  assertRequiredString(payload.cep, 'cep');
}

function validateEventoPayload(payload: EventoDTO) {
  assertRequiredString(payload.id_usuario, 'id_usuario');
  assertRequiredString(payload.titulo, 'titulo');
  assertRequiredString(payload.descricao, 'descricao');
  assertRequiredString(payload.data_inicio, 'data_inicio');
  assertRequiredString(payload.data_fim, 'data_fim');
  assertRequiredString(payload.local, 'local');
}

function validatePropostaPayload(payload: PropostaCasaDTO) {
  assertRequiredString(payload.id_artista, 'id_artista');
  assertRequiredString(payload.id_evento, 'id_evento');
  assertRequiredString(payload.data_proposta, 'data_proposta');
  assertRequiredString(payload.id_casa_show, 'id_casa_show');
  assertRequiredString(payload.data_evento, 'data_evento');
  assertNumericValue(payload.valor_ofertado, 'valor_ofertado');
  assertRequiredString(payload.termos, 'termos');
}

export const authService = {
  async login(payload: LoginPayload) {
    validateLoginPayload(payload);
    return usersApi.post<AuthResponse, LoginPayload>('/auth/login', payload, {
      auth: false,
    });
  },
};

export const usersService = {
  async registerClient(payload: ClienteCadastroPayload) {
    validateClientePayload(payload);
    return usersApi.post<ClienteCadastroResponse, ClienteCadastroPayload>(
      '/cliente/cadastro',
      payload,
      { auth: false }
    );
  },
  async registerArtist(payload: ArtistaCadastroPayload) {
    validateArtistaPayload(payload);
    return usersApi.post<ArtistaCadastroResponse, ArtistaCadastroPayload>(
      '/artista/cadastro',
      payload,
      { auth: false }
    );
  },
  async registerCasaShow(payload: CasaDeShowCadastroPayload) {
    validateCasaPayload(payload);
    return usersApi.post<CasaDeShowCadastroResponse, CasaDeShowCadastroPayload>(
      '/casaDeShow/cadastro',
      payload,
      { auth: false }
    );
  },
  listArtists() {
    return usersApi.get<Artista[]>('/artista/');
  },
  getArtist(id: UUID) {
    return usersApi.get<Artista>(`/artista/${id}`);
  },
  updateArtist(id: UUID, payload: Partial<Artista>) {
    return usersApi.put<Artista, Partial<Artista>>(`/artista/${id}`, payload);
  },
  listCasasShow() {
    return usersApi.get<CasaDeShow[]>('/casaDeShow/');
  },
  getCasaShow(id: UUID) {
    return usersApi.get<CasaDeShow>(`/casaDeShow/${id}`);
  },
  updateCasaShow(id: UUID, payload: Partial<CasaDeShow>) {
    return usersApi.put<CasaDeShow, Partial<CasaDeShow>>(`/casaDeShow/${id}`, payload);
  },
  listClientes() {
    return usersApi.get<Cliente[]>('/cliente/');
  },
  getCliente(id: UUID) {
    return usersApi.get<Cliente>(`/cliente/${id}`);
  },
  updateCliente(id: UUID, payload: Partial<Cliente>) {
    return usersApi.put<Cliente, Partial<Cliente>>(`/cliente/${id}`, payload);
  },
};

export const eventService = {
  async create(payload: EventoDTO) {
    validateEventoPayload(payload);
    return eventsApi.post<Evento, EventoDTO>('evento/', payload);
  },
  async list(params?: { page?: number; pageSize?: number }) {
    const response = await eventsApi.get<EventoListResponse>('evento/', { params });
    return unwrapList<Evento>(response);
  },
  listRaw(params?: { page?: number; pageSize?: number }) {
    return eventsApi.get<EventoListResponse>('evento/', { params });
  },
  listByCasaShow(idCasaShow: UUID) {
    return eventsApi.get<Evento[]>(`evento/casa/${idCasaShow}`);
  },
  getById(id: UUID) {
    return eventsApi.get<Evento>(`evento/${id}`);
  },
  update(id: UUID, payload: Partial<EventoDTO>) {
    return eventsApi.put<Evento, Partial<EventoDTO>>(`/${id}`, payload);
  },
};

export const proposalService = {
  async create(payload: PropostaCasaDTO) {
    validatePropostaPayload(payload);
    return eventsApi.post<PropostaCasaResponse, PropostaCasaDTO>('propostaCasa/', payload);
  },
  list() {
    return eventsApi.get<PropostaCasa[]>('propostaCasa/');
  },
  listByCasaShow(idCasaShow: UUID) {
    return eventsApi.get<PropostaCasa[]>(`propostaCasa/casa/${idCasaShow}`);
  },
  listByArtist(idArtista: UUID) {
    return eventsApi.get<PropostaCasa[]>(`propostaCasa/artista/${idArtista}`);
  },
  getById(id: UUID) {
    return eventsApi.get<PropostaCasa>(`/${id}`);
  },
  update(id: UUID, payload: UpdatePropostaPayload) {
    return eventsApi.put<PropostaCasa, UpdatePropostaPayload>(`propostaCasa/${id}`, payload);
  },
};

export function loginRequest(payload: LoginPayload) {
  return authService.login(payload);
}

export function registerClientRequest(payload: ClienteCadastroPayload) {
  return usersService.registerClient(payload);
}

export function registerArtistRequest(payload: ArtistaCadastroPayload) {
  return usersService.registerArtist(payload);
}

export function registerCasaShowRequest(payload: CasaDeShowCadastroPayload) {
  return usersService.registerCasaShow(payload);
}

export { eventsApi, usersApi } from './apiClient';