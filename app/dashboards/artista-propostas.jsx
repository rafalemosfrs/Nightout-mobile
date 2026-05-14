import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '../../components/Button';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

const USE_API = false;
const PAGE_SIZE = 10;

const STATUS_OPTIONS = ['TODAS', 'DISPONÍVEL', 'PENDENTE', 'ACEITA', 'RECUSADA'];

const PROPOSTA_ARTISTA_ENDPOINT = '/proposta-artista';

const MOCK_PROPOSTAS_ARTISTA = [
  {
    id_proposta_artista: 'pa-001',
    id_casa: 'casa-001',
    id_evento: 'evt-001',
    data_proposta: '2026-02-10T14:30:00.000Z',
    data_evento: '2026-02-24T22:00:00.000Z',
    valor_ofertado: 30000,
    status: 'DISPONÍVEL',
    termos:
      'Show de 90 minutos, camarim com água e alimentação, pagamento de 50% na confirmação e 50% no dia do evento.',
    aceito: null,
    casa: {
      nome_fantasia: 'Living Music Hall',
      endereco: 'Av. Beira Mar, 1200',
      bairro: 'Meireles',
      estado: 'CE',
    },
    evento: {
      titulo: 'Sunrise Beachclub com Nattan',
      local: 'Av. Beira Mar, 1200',
    },
  },
  {
    id_proposta_artista: 'pa-002',
    id_casa: 'casa-002',
    id_evento: 'evt-002',
    data_proposta: '2026-02-12T10:00:00.000Z',
    data_evento: '2026-02-27T23:30:00.000Z',
    valor_ofertado: 18000,
    status: 'PENDENTE',
    termos:
      'Apresentação principal da noite, estrutura de som fornecida pela casa e deslocamento por conta do contratante.',
    aceito: null,
    casa: {
      nome_fantasia: 'Arena Fortaleza',
      endereco: 'Av. Washington Soares, 900',
      bairro: 'Edson Queiroz',
      estado: 'CE',
    },
    evento: {
      titulo: 'Baile Funk Premium',
      local: 'Arena Fortaleza',
    },
  },
  {
    id_proposta_artista: 'pa-003',
    id_casa: 'casa-003',
    id_evento: 'evt-003',
    data_proposta: '2026-01-28T18:45:00.000Z',
    data_evento: '2026-03-03T21:00:00.000Z',
    valor_ofertado: 42000,
    status: 'ACEITA',
    termos:
      'Contrato fechado para evento corporativo, com equipe técnica local e passagem de som às 17h.',
    aceito: true,
    casa: {
      nome_fantasia: 'Centro de Eventos Night Out',
      endereco: 'Rua das Luzes, 380',
      bairro: 'Praia de Iracema',
      estado: 'CE',
    },
    evento: {
      titulo: 'Especial de Carnaval',
      local: 'Centro de Eventos Night Out',
    },
  },
  {
    id_proposta_artista: 'pa-004',
    id_casa: 'casa-004',
    id_evento: 'evt-004',
    data_proposta: '2026-02-02T12:10:00.000Z',
    data_evento: '2026-03-08T20:30:00.000Z',
    valor_ofertado: 12000,
    status: 'RECUSADA',
    termos:
      'Proposta recusada por conflito de agenda. Mantida apenas para histórico do artista.',
    aceito: false,
    casa: {
      nome_fantasia: 'Lounge Music Bar',
      endereco: 'Rua PI, 240',
      bairro: 'Aldeota',
      estado: 'CE',
    },
    evento: {
      titulo: 'After NightOut',
      local: 'Lounge Music Bar',
    },
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  if (!value) return '--';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '--';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getDateBadge(value) {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) {
    return { month: '--', day: '--' };
  }

  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(date)
    .replace('.', '')
    .toUpperCase();

  return {
    month: `${month}.`,
    day: String(date.getDate()).padStart(2, '0'),
  };
}

function normalizeStatus(status, aceito) {
  if (aceito === true) return 'ACEITA';
  if (aceito === false) return 'RECUSADA';

  const normalizedStatus = String(status || 'DISPONÍVEL').trim().toUpperCase();

  if (['ACEITA', 'ACEITO', 'CONFIRMADA', 'CONFIRMADO'].includes(normalizedStatus)) {
    return 'ACEITA';
  }

  if (
    ['RECUSADA', 'RECUSADO', 'REJEITADA', 'REJEITADO', 'CANCELADA'].includes(
      normalizedStatus
    )
  ) {
    return 'RECUSADA';
  }

  if (['PENDENTE', 'EM_ANALISE', 'EM ANÁLISE'].includes(normalizedStatus)) {
    return 'PENDENTE';
  }

  return 'DISPONÍVEL';
}

function normalizePropostaArtista(payload = {}) {
  const status = normalizeStatus(payload.status, payload.aceito);
  const evento = payload.evento || {};
  const casa = payload.casa || {};

  const idCasa = payload.id_casa || casa.id_usuario || casa.id || '';
  const idEvento = payload.id_evento || evento.id_evento || evento.id || '';

  return {
    id: payload.id_proposta_artista || payload.id || `proposta-${Date.now()}`,
    id_proposta_artista: payload.id_proposta_artista || payload.id || '',
    id_casa: idCasa,
    id_evento: idEvento,

    casaNome:
      casa.nome_fantasia ||
      casa.nome ||
      payload.nome_casa ||
      (idCasa ? `Casa ${idCasa}` : 'Casa de show não informada'),

    titulo: evento.titulo || payload.titulo || 'Evento sem título',

    local:
      evento.local ||
      payload.local ||
      [casa.endereco, casa.bairro, casa.estado].filter(Boolean).join(' • ') ||
      'Local não informado',

    data_proposta: payload.data_proposta || payload.created_at || null,
    data_evento: payload.data_evento || evento.data_inicio || null,
    valor_ofertado: Number(payload.valor_ofertado || payload.valor || 0),
    status,
    termos: payload.termos || 'Termos não informados pela casa de show.',

    aceito:
      typeof payload.aceito === 'boolean'
        ? payload.aceito
        : status === 'ACEITA'
          ? true
          : status === 'RECUSADA'
            ? false
            : null,

    raw: payload,
  };
}

async function listarPropostasArtista({ page = 1, pageSize = PAGE_SIZE } = {}) {
  if (!USE_API) {
    return MOCK_PROPOSTAS_ARTISTA.map(normalizePropostaArtista);
  }

  throw new Error(
    `Integração pendente: ${PROPOSTA_ARTISTA_ENDPOINT}?page=${page}&pageSize=${pageSize}`
  );
}

async function atualizarStatusPropostaArtista(proposta, nextStatus) {
  const payload = {
    status: nextStatus,
    aceito: nextStatus === 'ACEITA' ? true : nextStatus === 'RECUSADA' ? false : null,
  };

  if (!USE_API) {
    return {
      ...proposta,
      ...payload,
    };
  }

  throw new Error(
    `Integração pendente: PUT ${PROPOSTA_ARTISTA_ENDPOINT}/${proposta.id_proposta_artista}`
  );
}

function getStatusLabel(status) {
  switch (status) {
    case 'ACEITA':
      return 'Aceita';
    case 'RECUSADA':
      return 'Recusada';
    case 'PENDENTE':
      return 'Pendente';
    default:
      return 'Disponível';
  }
}

function canRespondToProposal(status) {
  return ['DISPONÍVEL', 'PENDENTE'].includes(status);
}

function getStatusStyles(status) {
  switch (status) {
    case 'ACEITA':
      return {
        badge: styles.statusAcceptedBadge,
        text: styles.statusAcceptedText,
      };
    case 'RECUSADA':
      return {
        badge: styles.statusRejectedBadge,
        text: styles.statusRejectedText,
      };
    case 'PENDENTE':
      return {
        badge: styles.statusPendingBadge,
        text: styles.statusPendingText,
      };
    default:
      return {
        badge: styles.statusAvailableBadge,
        text: styles.statusAvailableText,
      };
  }
}

export default function ArtistaPropostasScreen() {
  const [propostas, setPropostas] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('TODAS');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadPropostas() {
    try {
      setLoading(true);
      setErrorMessage('');

      const response = await listarPropostasArtista({
        page: 1,
        pageSize: PAGE_SIZE,
      });

      setPropostas(Array.isArray(response) ? response : []);
    } catch (error) {
      console.log('Erro ao carregar propostas do artista:', error);
      setErrorMessage('Não foi possível carregar as propostas agora.');
      setPropostas(MOCK_PROPOSTAS_ARTISTA.map(normalizePropostaArtista));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPropostas();
  }, []);

  const summary = useMemo(() => {
    const total = propostas.length;
    const disponiveis = propostas.filter((item) => item.status === 'DISPONÍVEL').length;
    const pendentes = propostas.filter((item) => item.status === 'PENDENTE').length;
    const aceitas = propostas.filter((item) => item.status === 'ACEITA').length;
    const recusadas = propostas.filter((item) => item.status === 'RECUSADA').length;

    const valorEmAberto = propostas
      .filter((item) => ['DISPONÍVEL', 'PENDENTE'].includes(item.status))
      .reduce((totalValue, item) => totalValue + Number(item.valor_ofertado || 0), 0);

    return {
      total,
      disponiveis,
      pendentes,
      aceitas,
      recusadas,
      valorEmAberto,
    };
  }, [propostas]);

  const filteredPropostas = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...propostas]
      .filter((proposta) => {
        const matchesStatus =
          selectedStatus === 'TODAS' || proposta.status === selectedStatus;

        const matchesSearch =
          !normalizedSearch ||
          proposta.titulo.toLowerCase().includes(normalizedSearch) ||
          proposta.casaNome.toLowerCase().includes(normalizedSearch) ||
          proposta.local.toLowerCase().includes(normalizedSearch) ||
          proposta.status.toLowerCase().includes(normalizedSearch) ||
          String(proposta.valor_ofertado).includes(normalizedSearch);

        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        const aDate = new Date(a.data_evento).getTime();
        const bDate = new Date(b.data_evento).getTime();

        return aDate - bDate;
      });
  }, [propostas, search, selectedStatus]);

  async function handleUpdateProposalStatus(proposta, nextStatus) {
    if (!canRespondToProposal(proposta.status)) {
      return;
    }

    try {
      setUpdatingId(proposta.id);

      const updatedProposal = await atualizarStatusPropostaArtista(proposta, nextStatus);
      const normalizedUpdatedProposal = normalizePropostaArtista(updatedProposal);

      setPropostas((prevState) =>
        prevState.map((item) =>
          item.id === proposta.id ? normalizedUpdatedProposal : item
        )
      );

      setSelectedProposal((current) =>
        current?.id === proposta.id ? normalizedUpdatedProposal : current
      );

      Alert.alert(
        'Proposta atualizada',
        nextStatus === 'ACEITA'
          ? 'A proposta foi aceita com sucesso.'
          : 'A proposta foi recusada.'
      );
    } catch (error) {
      console.log('Erro ao atualizar proposta:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a proposta agora.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/dashboards/artista')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Propostas do Artista</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Propostas recebidas de casas de show</Text>

            <Text style={styles.heroSubtitle}>
              Visualize, filtre e responda as propostas enviadas para você.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            activeOpacity={0.85}
            onPress={loadPropostas}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.text} />
            <Text style={styles.refreshButtonText}>Atualizar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.total}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.disponiveis}</Text>
            <Text style={styles.summaryLabel}>Disponíveis</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.aceitas}</Text>
            <Text style={styles.summaryLabel}>Aceitas</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{summary.recusadas}</Text>
            <Text style={styles.summaryLabel}>Recusadas</Text>
          </View>
        </View>

        <View style={styles.valueCard}>
          <View style={styles.valueIcon}>
            <Ionicons name="cash-outline" size={20} color={colors.success} />
          </View>

          <View style={styles.valueInfo}>
            <Text style={styles.valueLabel}>Valor em aberto</Text>
            <Text style={styles.valueAmount}>{formatCurrency(summary.valorEmAberto)}</Text>
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.listTitle}>Lista de Propostas</Text>
            </View>

            <View style={styles.actionsColumn}>
              <View style={styles.searchBox}>
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.searchIcon}
                />

                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por evento, casa, local ou status..."
                  placeholderTextColor={colors.textMuted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <TouchableOpacity
                style={styles.filterButton}
                activeOpacity={0.85}
                onPress={() => setShowFilters((prevState) => !prevState)}
              >
                <Ionicons name="options-outline" size={18} color={colors.text} />
                <Text style={styles.filterButtonText}>Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showFilters ? (
            <View style={styles.filtersContainer}>
              {STATUS_OPTIONS.map((status) => {
                const isSelected = selectedStatus === status;

                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextSelected,
                      ]}
                    >
                      {status === 'TODAS' ? 'TODAS' : getStatusLabel(status).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando propostas...</Text>
            </View>
          ) : (
            <View style={styles.proposalsList}>
              {filteredPropostas.length > 0 ? (
                filteredPropostas.map((proposta) => {
                  const statusStyles = getStatusStyles(proposta.status);
                  const dateBadge = getDateBadge(proposta.data_evento);
                  const isUpdating = updatingId === proposta.id;

                  return (
                    <TouchableOpacity
                      key={proposta.id}
                      style={styles.proposalCard}
                      activeOpacity={0.85}
                      onPress={() => setSelectedProposal(proposta)}
                    >
                      <View style={styles.dateBox}>
                        <Text style={styles.dateMonth}>{dateBadge.month}</Text>
                        <Text style={styles.dateDay}>{dateBadge.day}</Text>
                      </View>

                      <View style={styles.proposalContent}>
                        <View style={styles.proposalTopRow}>
                          <Text style={styles.proposalTitle} numberOfLines={1}>
                            {proposta.titulo}
                          </Text>

                          <View style={[styles.statusBadge, statusStyles.badge]}>
                            <Text style={[styles.statusText, statusStyles.text]}>
                              {getStatusLabel(proposta.status)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.metaRow}>
                          <MaterialCommunityIcons
                            name="office-building-outline"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {proposta.casaNome}
                          </Text>
                        </View>

                        <View style={styles.metaRow}>
                          <Ionicons
                            name="location-outline"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.metaText} numberOfLines={1}>
                            {proposta.local}
                          </Text>
                        </View>

                        <View style={styles.proposalFooter}>
                          <View style={styles.metaRowNoMargin}>
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.metaText}>
                              {formatDateTime(proposta.data_evento)}
                            </Text>
                          </View>

                          <Text style={styles.proposalValue}>
                            {formatCurrency(proposta.valor_ofertado)}
                          </Text>
                        </View>

                        {canRespondToProposal(proposta.status) ? (
                          <View style={styles.cardActionsRow}>
                            <TouchableOpacity
                              style={[styles.actionPill, styles.rejectPill]}
                              activeOpacity={0.85}
                              disabled={isUpdating}
                              onPress={() =>
                                handleUpdateProposalStatus(proposta, 'RECUSADA')
                              }
                            >
                              <Text style={[styles.actionPillText, styles.rejectPillText]}>
                                Recusar
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.actionPill, styles.acceptPill]}
                              activeOpacity={0.85}
                              disabled={isUpdating}
                              onPress={() =>
                                handleUpdateProposalStatus(proposta, 'ACEITA')
                              }
                            >
                              {isUpdating ? (
                                <ActivityIndicator size="small" color={colors.text} />
                              ) : (
                                <Text
                                  style={[styles.actionPillText, styles.acceptPillText]}
                                >
                                  Aceitar
                                </Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons
                    name="file-search-outline"
                    size={46}
                    color={colors.textMuted}
                  />
                  <Text style={styles.emptyStateTitle}>Nenhuma proposta encontrada</Text>
                  <Text style={styles.emptyStateText}>
                    Ajuste a busca ou altere os filtros para visualizar outras propostas.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedProposal}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedProposal(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalhes da Proposta</Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedProposal(null)}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedProposal ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.detailTitle}>{selectedProposal.titulo}</Text>

                <DetailRow label="Casa de show" value={selectedProposal.casaNome} />
                <DetailRow label="Local" value={selectedProposal.local} />
                <DetailRow
                  label="Data do evento"
                  value={formatDateTime(selectedProposal.data_evento)}
                />
                <DetailRow
                  label="Data da proposta"
                  value={formatDateTime(selectedProposal.data_proposta)}
                />
                <DetailRow
                  label="Valor ofertado"
                  value={formatCurrency(selectedProposal.valor_ofertado)}
                  highlight
                />
                <DetailRow
                  label="ID da proposta"
                  value={selectedProposal.id_proposta_artista || selectedProposal.id}
                />
                <DetailRow label="ID da casa" value={selectedProposal.id_casa || '--'} />
                <DetailRow
                  label="ID do evento"
                  value={selectedProposal.id_evento || '--'}
                />

                <View style={styles.termsBox}>
                  <Text style={styles.termsLabel}>Termos</Text>
                  <Text style={styles.termsText}>{selectedProposal.termos}</Text>
                </View>

                {canRespondToProposal(selectedProposal.status) ? (
                  <View style={styles.modalButtonsRow}>
                    <View style={styles.modalButtonWrapper}>
                      <Button
                        title="Recusar"
                        variant="outline"
                        onPress={() =>
                          handleUpdateProposalStatus(selectedProposal, 'RECUSADA')
                        }
                        loading={updatingId === selectedProposal.id}
                      />
                    </View>

                    <View style={styles.modalButtonWrapper}>
                      <Button
                        title="Aceitar"
                        onPress={() =>
                          handleUpdateProposalStatus(selectedProposal, 'ACEITA')
                        }
                        loading={updatingId === selectedProposal.id}
                      />
                    </View>
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value, highlight = false }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>
        {value || '--'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  topBarTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  heroTextContainer: {
    marginBottom: spacing.md,
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 6,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  refreshButton: {
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    ...shadows.small,
  },
  refreshButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryCard: {
    width: '48.5%',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  valueCard: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.small,
  },
  valueIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  valueInfo: {
    flex: 1,
  },
  valueLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  valueAmount: {
    ...typography.h3,
    color: colors.success,
    marginTop: 2,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginLeft: spacing.sm,
    flex: 1,
  },
  listCard: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.small,
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  listTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
  },
  actionsColumn: {
    flexDirection: 'column',
  },
  searchBox: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  filterButton: {
    height: 44,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  filterButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  filterChipSelected: {
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  proposalsList: {
    marginTop: spacing.xs,
  },
  proposalCard: {
    backgroundColor: '#101728',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  dateBox: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dateMonth: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  dateDay: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
    lineHeight: 22,
  },
  proposalContent: {
    flex: 1,
  },
  proposalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  proposalTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaRowNoMargin: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 6,
    flexShrink: 1,
  },
  proposalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  proposalValue: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusAcceptedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  statusAcceptedText: {
    color: colors.success,
  },
  statusPendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
  },
  statusPendingText: {
    color: '#F59E0B',
  },
  statusAvailableBadge: {
    backgroundColor: 'rgba(0, 102, 255, 0.16)',
  },
  statusAvailableText: {
    color: colors.primary,
  },
  statusRejectedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  statusRejectedText: {
    color: colors.error,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  actionPill: {
    minHeight: 34,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPillText: {
    ...typography.caption,
    fontWeight: '700',
  },
  acceptPill: {
    backgroundColor: colors.primary,
  },
  acceptPillText: {
    color: colors.text,
  },
  rejectPill: {
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  rejectPillText: {
    color: colors.error,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyStateTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: 6,
  },
  emptyStateText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  modalCard: {
    maxHeight: '88%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  detailTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailRow: {
    backgroundColor: '#101728',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailValue: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
  },
  detailValueHighlight: {
    color: colors.success,
  },
  termsBox: {
    backgroundColor: '#101728',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  termsLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    marginBottom: 6,
  },
  termsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  modalButtonWrapper: {
    flex: 1,
  },
});