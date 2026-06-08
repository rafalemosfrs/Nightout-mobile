function asPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function isNonEmptyObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
}

function firstNonEmptyObject(...values) {
  return values.find(isNonEmptyObject) || {};
}

function getFirstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');
}

function getRawEventId(evento) {
  return getFirstValue(
    evento?.id_evento,
    evento?.idEvento,
    evento?.id,
    evento?.uuid
  );
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
  return getFirstValue(
    proposta?.id_proposta,
    proposta?.id_proposta_casa,
    proposta?.idPropostaCasa,
    proposta?.id_propostaCasa,
    proposta?.idProposta,
    proposta?.proposta_id,
    proposta?.propostaCasa_id,
    proposta?.id,
    proposta?.uuid
  );
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
  return String(value || 'PENDENTE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
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
  const usuario = asPlainObject(casa.usuario);

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

  const dataInicio =
    source.data_inicio ||
    fallback.data_inicio ||
    source.data_evento ||
    fallback.data_evento ||
    '';

  const dataFim = source.data_fim || fallback.data_fim || '';

  const genero =
    source.genero ??
    fallback.genero ??
    source.genero_musical ??
    fallback.genero_musical ??
    '';

  return {
    ...fallback,
    ...source,
    id_evento: getRawEventId(source) || getRawEventId(fallback),
    id_usuario:
      source.id_usuario ||
      fallback.id_usuario ||
      source.id_casa_show ||
      fallback.id_casa_show ||
      '',
    titulo: source.titulo || fallback.titulo || 'Evento sem titulo',
    descricao: source.descricao || fallback.descricao || '',
    genero,
    data_inicio: dataInicio,
    data_fim: dataFim,
    local:
      source.local ||
      fallback.local ||
      source.endereco ||
      fallback.endereco ||
      'Local nao informado',
    status:
      source.status ||
      fallback.status ||
      (isFutureOrToday(dataInicio) ? 'ATIVO' : 'FINALIZADO'),
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
  const source = asPlainObject(proposta);

  const evento = firstNonEmptyObject(
    source.evento,
    source.Evento,
    source.event,
    source.Event
  );

  const artista = firstNonEmptyObject(
    source.artista,
    source.Artista
  );

  const casa = firstNonEmptyObject(
    source.casaDeShow,
    source.CasaDeShow,
    source.casa,
    evento.casaDeShow,
    evento.CasaDeShow,
    evento.casa
  );

  const usuarioCasa = asPlainObject(casa.usuario);
  const usuarioArtista = asPlainObject(artista.usuario);

  const eventDate =
    source.data_evento ||
    source.dataEvento ||
    evento.data_inicio ||
    evento.data_evento ||
    source.data_inicio ||
    '';

  const genero =
    evento.genero ??
    source.genero ??
    evento.genero_musical ??
    source.genero_musical ??
    '';

  return {
    ...source,
    id_proposta: getProposalId(source),
    id_evento: source.id_evento || source.idEvento || getEventId(evento),
    id_artista:
      source.id_artista ||
      source.idArtista ||
      artista.id_usuario ||
      artista.id ||
      '',
    id_casa_show:
      source.id_casa_show ||
      source.idCasaShow ||
      casa.id_usuario ||
      casa.id ||
      '',
    id_usuario: source.id_usuario || source.idUsuario || casa.id_usuario || casa.id || '',
    artista_nome:
      artista.nome_artista ||
      artista.nome ||
      usuarioArtista.nome ||
      source.nome_artista ||
      source.artista_nome ||
      'Artista',
    casa_nome:
      casa.nome_fantasia ||
      casa.nome ||
      usuarioCasa.nome ||
      source.casa_nome ||
      source.nome_casa ||
      source.casa_show_nome ||
      'Casa de show',
    evento_titulo:
      evento.titulo ||
      source.titulo ||
      source.evento_titulo ||
      source.nome_evento ||
      'Evento',
    evento_local:
      evento.local ||
      source.local ||
      source.evento_local ||
      source.local_evento ||
      evento.endereco ||
      'Local nao informado',
    genero,
    data_proposta: source.data_proposta || source.dataProposta || '',
    data_evento: eventDate,
    valor_ofertado: Number(source.valor_ofertado || source.valorOfertado || source.valor || 0),
    status: normalizeStatus(source.status),
    termos: source.termos || '',
  };
}