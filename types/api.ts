export type UUID = string;
export type ISODateTimeString = string;

export type UsuarioTipo = 'CLIENTE' | 'ARTISTA' | 'CASASHOW';

export interface UserSession {
  email: string;
  id: UUID;
  nome: string;
  tipo: UsuarioTipo;
  token: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface AuthResponse {
  id: UUID;
  message: string;
  token: string;
  tipo: UsuarioTipo;
  nome: string;
  email: string;
}

export interface ClienteCadastroPayload {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  apelido: string;
  preferencias: string;
  data_nascimento: ISODateTimeString | string;
}

export interface Cliente {
  id?: UUID;
  id_usuario?: UUID;
  nome?: string;
  email?: string;
  telefone?: string;
  apelido?: string;
  preferencias?: string;
  data_nascimento?: ISODateTimeString | string;
  tipo?: UsuarioTipo;
}

export interface ClienteCadastroResponse {
  message: 'Cliente cadastrado com sucesso!' | string;
  cliente: Cliente;
}

export interface ArtistaCadastroPayload {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  nome_artista: string;
  genero_musical: string;
  cache_min: number;
  descricao: string;
  portifolio: string;
}

export interface Artista {
  id?: UUID;
  id_usuario?: UUID;
  nome?: string;
  email?: string;
  telefone?: string;
  nome_artista?: string;
  genero_musical?: string;
  cache_min?: number;
  descricao?: string;
  portifolio?: string;
  tipo?: UsuarioTipo;
}

export interface ArtistaCadastroResponse {
  message: 'Artista cadastrado com sucesso!' | string;
  usuario: Artista;
}

export interface CasaDeShowCadastroPayload {
  nome: string;
  email: string;
  senha: string;
  telefone: string;
  nome_fantasia: string;
  cnpj: string;
  capacidade: number | string;
  endereco: string;
  bairro: string;
  estado: string;
  cep: string;
  geo_lat?: number | string;
  geo_lng?: number | string;
}

export interface CasaDeShow {
  id?: UUID;
  id_usuario?: UUID;
  nome?: string;
  email?: string;
  telefone?: string;
  nome_fantasia?: string;
  cnpj?: string;
  capacidade?: number | string;
  endereco?: string;
  bairro?: string;
  estado?: string;
  cep?: string;
  geo_lat?: number | string;
  geo_lng?: number | string;
  tipo?: UsuarioTipo;
  usuario?: {
    nome?: string;
    email?: string;
    telefone?: string;
    tipo?: UsuarioTipo;
  };
}

export interface CasaDeShowCadastroResponse {
  message: 'Casa de show cadastrada com sucesso!' | string;
  casa: CasaDeShow;
}

export type EventoStatus = 'ATIVO' | 'FINALIZADO' | 'CANCELADO' | string;

export interface EventoCreatePayload {
  id_usuario: UUID;
  titulo: string;
  descricao: string;
  data_inicio: ISODateTimeString;
  data_fim: ISODateTimeString;
  local: string;
  status?: EventoStatus;
}

export type EventoDTO = EventoCreatePayload;

export interface Evento {
  id?: UUID;
  id_evento?: UUID;
  titulo: string;
  descricao?: string;
  data_inicio: ISODateTimeString;
  data_fim?: ISODateTimeString;
  local: string;
  status?: EventoStatus;
  foto_evento?: string | null;
  id_casa_show?: UUID;
  id_usuario?: UUID;
  casaDeShow?: CasaDeShow;
  eventoArtistas?: EventoArtista[];
  propostasCasa?: PropostaCasa[];
  propostasArtista?: unknown[];
}

export interface EventoArtista {
  id?: UUID;
  id_evento?: UUID;
  id_artista?: UUID;
  status?: string;
  artista?: Artista;
}

export interface PaginatedResponse<T> {
  data?: T[];
  items?: T[];
  eventos?: T[];
  propostas?: T[];
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
}

export type EventoListResponse = Evento[] | PaginatedResponse<Evento>;

export type PropostaStatus =
  | 'PENDENTE'
  | 'ACEITA'
  | 'RECUSADA'
  | 'CANCELADA'
  | string;

export interface PropostaCasaDTO {
  id_artista: UUID;
  id_evento: UUID;
  data_proposta: ISODateTimeString;
  id_casa_show: UUID;
  data_evento: ISODateTimeString;
  valor_ofertado: number | string;
  status?: PropostaStatus;
  termos: string;
}

export interface PropostaCasa {
  id?: UUID;
  id_proposta?: UUID;
  id_artista: UUID;
  id_casa_show?: UUID;
  id_usuario?: UUID;
  id_evento: UUID;
  data_proposta?: ISODateTimeString;
  valor_ofertado: number | string;
  data_evento: ISODateTimeString;
  termos?: string;
  status?: PropostaStatus;
  artista?: Artista;
  evento?: Evento;
  casaDeShow?: CasaDeShow;
  casa?: CasaDeShow;
}

export interface PropostaCasaResponse {
  message: 'Proposta casa criada com sucesso' | string;
  propostaCasa: PropostaCasa;
}

export interface UpdatePropostaPayload {
  status?: PropostaStatus;
  valor_ofertado?: number | string;
  termos?: string;
}

export interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}
