function asPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function getRawEventId(evento) {
  return evento?.id_evento || evento?.id || evento?.uuid;
}

function isEventLikeObject(value) {
  const source = asPlainObject(value);

  return Boolean(
    getRawEventId(source) ||
      source.titulo ||
      source.data_inicio ||
      source.data_evento ||
      source.local
  );
}

function unwrapEventPayload(evento = {}) {
  const source = asPlainObject(evento);
  const data = asPlainObject(source.data);
  const candidates = [
    source.evento,
    source.Evento,
    source.event,
    source.Event,
    data.evento,
    data.Evento,
    data.event,
    data.Event,
    data,
  ];

  return candidates.find(isEventLikeObject) || source;
}

export function getEventId(evento) {
  const source = unwrapEventPayload(evento);

  return getRawEventId(source) || getRawEventId(evento);
}

export function getProposalId(proposta) {
  return proposta?.id_proposta || proposta?.id || proposta?.uuid;
}

export function parseApiDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value) {
  const date = parseApiDate(value);

  if (!date) return 'Data nao informada';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateOnly(value) {
  const date = parseApiDate(value);

  if (!date) return 'Data nao informada';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatTimeOnly(value) {
  const date = parseApiDate(value);

  if (!date) return '--:--';

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

export function isFutureOrToday(value) {
  const date = parseApiDate(value);
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date.getTime() >= today.getTime();
}

export function normalizeStatus(value) {
  return String(value || 'PENDENTE').toUpperCase();
}

export function isAcceptedProposal(value) {
  return ['ACEITA', 'ACEITO', 'APROVADA', 'APROVADO', 'CONFIRMADO'].includes(
    normalizeStatus(value)
  );
}

export function getCasaAddress(casa = {}) {
  return [casa.endereco, casa.bairro, casa.estado].filter(Boolean).join(', ');
}

export function normalizeCasa(casa = {}, session = {}) {
  const usuario = casa.usuario || {};

  return {
    ...casa,
    id_usuario: casa.id_usuario || casa.id || session.id_usuario || session.id || '',
    nome_fantasia: casa.nome_fantasia || casa.nome || session.nome || 'Casa de Show',
    responsavel: usuario.nome || casa.nome || session.nome || 'Responsavel',
    email: usuario.email || casa.email || session.email || '',
    telefone: usuario.telefone || casa.telefone || '',
    endereco: casa.endereco || '',
    bairro: casa.bairro || '',
    estado: casa.estado || '',
    cnpj: casa.cnpj || '',
  };
}

export function normalizeEvent(evento = {}) {
  const fallback = asPlainObject(evento);
  const source = unwrapEventPayload(fallback);
  const dataInicio = source.data_inicio || fallback.data_inicio || source.data_evento || fallback.data_evento || '';
  const dataFim = source.data_fim || fallback.data_fim || '';

  return {
    ...fallback,
    ...source,
    id_evento: getRawEventId(source) || getRawEventId(fallback),
    id_usuario: source.id_usuario || fallback.id_usuario || source.id_casa_show || fallback.id_casa_show || '',
    titulo: source.titulo || fallback.titulo || 'Evento sem titulo',
    descricao: source.descricao || fallback.descricao || '',
    data_inicio: dataInicio,
    data_fim: dataFim,
    local: source.local || fallback.local || source.endereco || fallback.endereco || 'Local nao informado',
    status: source.status || fallback.status || (isFutureOrToday(dataInicio) ? 'ATIVO' : 'FINALIZADO'),
    propostasCasa: Array.isArray(source.propostasCasa)
      ? source.propostasCasa
      : Array.isArray(fallback.propostasCasa)
        ? fallback.propostasCasa
        : [],
    eventoArtistas: Array.isArray(source.eventoArtistas)
      ? source.eventoArtistas
      : Array.isArray(fallback.eventoArtistas)
        ? fallback.eventoArtistas
        : [],
  };
}

export function normalizeProposal(proposta = {}) {
  const evento = proposta.evento || proposta.Evento || {};
  const artista = proposta.artista || proposta.Artista || {};
  const casa = proposta.casaDeShow || proposta.casa || evento.casaDeShow || {};
  const eventDate = proposta.data_evento || evento.data_inicio || proposta.data_inicio || '';

  return {
    ...proposta,
    id_proposta: getProposalId(proposta),
    id_evento: proposta.id_evento || getEventId(evento),
    id_artista: proposta.id_artista || artista.id_usuario || artista.id || '',
    id_casa_show: proposta.id_casa_show || casa.id_usuario || casa.id || '',
    artista_nome:
      artista.nome_artista ||
      artista.nome ||
      proposta.nome_artista ||
      proposta.artista_nome ||
      'Artista',
    evento_titulo: evento.titulo || proposta.titulo || 'Evento',
    evento_local: evento.local || proposta.local || 'Local nao informado',
    data_evento: eventDate,
    valor_ofertado: Number(proposta.valor_ofertado || proposta.valor || 0),
    status: normalizeStatus(proposta.status),
    termos: proposta.termos || '',
  };
}
