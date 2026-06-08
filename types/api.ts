export type UUID = string;
export type ISODateTimeString = string;

export type UsuarioTipo = 'CLIENTE' | 'ARTISTA' | 'CASASHOW';

export interface UserSession {
  email: string;
  id: UUID;
  nome: string;
  tipo: UsuarioTipo;
  token: string;
  preferencias?: string;
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
  preferencias?: string;
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
  usuario?: {
    nome?: string;
    email?: string;
    telefone?: string;
    tipo?: UsuarioTipo;
  };
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
  cache_min: string;
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
  cache_min?: string;
  descricao?: string;
  portifolio?: string;
  tipo?: UsuarioTipo;
  usuario?: {
    nome?: string;
    email?: string;
    telefone?: string;
    tipo?: UsuarioTipo;
  };
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
  genero: string;
  data_inicio: ISODateTimeString;
  data_fim: ISODateTimeString;
  local: string;
  status?: EventoStatus;
}

export type EventoDTO = EventoCreatePayload;

export interface Evento {
  id?: UUID;
  id_evento?: UUID;
  idEvento?: UUID;
  uuid?: UUID;
  titulo: string;
  descricao?: string;
  genero?: string;
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
  idEvento?: UUID;
  id_artista?: UUID;
  idArtista?: UUID;
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
  uuid?: UUID;

  /**
   * Campos possíveis de ID da proposta.
   * Mantive vários nomes porque a API pode retornar o identificador
   * com nomes diferentes dependendo do endpoint.
   */
  id_proposta?: UUID;
  idProposta?: UUID;
  id_proposta_casa?: UUID;
  idPropostaCasa?: UUID;
  id_propostaCasa?: UUID;
  proposta_id?: UUID;
  propostaCasa_id?: UUID;

  id_artista: UUID;
  idArtista?: UUID;

  id_casa_show?: UUID;
  idCasaShow?: UUID;

  id_usuario?: UUID;
  idUsuario?: UUID;

  id_evento: UUID;
  idEvento?: UUID;

  data_proposta?: ISODateTimeString;
  dataProposta?: ISODateTimeString;

  valor_ofertado: number | string;
  valorOfertado?: number | string;
  valor?: number | string;

  data_evento: ISODateTimeString;
  dataEvento?: ISODateTimeString;

  termos?: string;
  status?: PropostaStatus;

  artista?: Artista;
  Artista?: Artista;

  evento?: Evento;
  Evento?: Evento;
  event?: Evento;
  Event?: Evento;

  casaDeShow?: CasaDeShow;
  CasaDeShow?: CasaDeShow;
  casa?: CasaDeShow;

  casa_nome?: string;
  nome_casa?: string;
  casa_show_nome?: string;

  artista_nome?: string;
  nome_artista?: string;

  evento_titulo?: string;
  nome_evento?: string;

  evento_local?: string;
  local_evento?: string;
  local?: string;

  genero?: string;
  genero_musical?: string;
}

export interface PropostaCasaResponse {
  message: 'Proposta casa criada com sucesso' | string;
  propostaCasa: PropostaCasa;
}

export interface UpdatePropostaPayload {
  status?: PropostaStatus;
  valor_ofertado?: number | string;
  valorOfertado?: number | string;
  termos?: string;
}

export interface ApiErrorPayload {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}