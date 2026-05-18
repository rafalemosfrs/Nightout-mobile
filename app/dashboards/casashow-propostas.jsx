<<<<<<< HEAD
import React, { useMemo, useState } from 'react';
import {
=======
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
>>>>>>> integraçãoPerfil
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
<<<<<<< HEAD
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
=======
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Button from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { eventService, proposalService, usersService } from '../../services/api';
import {
  formatCurrency,
  formatDateTime,
  getEventId,
  normalizeEvent,
} from '../../utils/casaShowData';
>>>>>>> integraçãoPerfil
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

<<<<<<< HEAD
const STATUS_OPTIONS = ['TODAS', 'ACEITA', 'PENDENTE'];

const MOCK_PROPOSTAS = [
  {
    id: 'prop-001',
    data: 'NOV. 24',
    titulo: 'Terapia sem fim com Nattan',
    local: 'Av. Bezerra de Menezes',
    horario: '22:00',
    valor: 'R$ 30.000',
    status: 'ACEITA',
  },
  {
    id: 'prop-002',
    data: 'NOV. 24',
    titulo: 'Festa',
    local: 'Av. Bezerra de Menezes',
    horario: '22:00',
    valor: 'R$ 30.000',
    status: 'ACEITA',
  },
  {
    id: 'prop-003',
    data: 'NOV. 24',
    titulo: 'After com Nattan',
    local: 'Av. Bezerra de Menezes',
    horario: '22:00',
    valor: 'R$ 30.000',
    status: 'PENDENTE',
  },
];

function getStatusStyles(status) {
  if (status === 'ACEITA') {
    return {
      badge: styles.statusAcceptedBadge,
      text: styles.statusAcceptedText,
    };
  }

  return {
    badge: styles.statusPendingBadge,
    text: styles.statusPendingText,
  };
}

export default function CasaShowPropostasScreen() {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('TODAS');
  const [showFilters, setShowFilters] = useState(false);

  const filteredPropostas = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return MOCK_PROPOSTAS.filter((proposta) => {
      const matchesStatus =
        selectedStatus === 'TODAS' || proposta.status === selectedStatus;

      const matchesSearch =
        !normalizedSearch ||
        proposta.titulo.toLowerCase().includes(normalizedSearch) ||
        proposta.local.toLowerCase().includes(normalizedSearch) ||
        proposta.status.toLowerCase().includes(normalizedSearch) ||
        proposta.valor.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [search, selectedStatus]);
 
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
=======
function getArtistId(artist) {
  return artist?.id_usuario || artist?.id || artist?.uuid;
}

function getArtistName(artist) {
  return artist?.nome_artista || artist?.nome || artist?.email || 'Artista';
}

export default function CasaShowPropostasScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams();
  const initialEventId = params?.id_evento ? String(params.id_evento) : '';
  const [events, setEvents] = useState([]);
  const [artists, setArtists] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [valorOfertado, setValorOfertado] = useState('');
  const [termos, setTermos] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    if (!session?.id) return;

    try {
      setError('');
      const [eventsResponse, artistsResponse] = await Promise.all([
        eventService.listByCasaShow(session.id),
        usersService.listArtists(),
      ]);

      setEvents(Array.isArray(eventsResponse) ? eventsResponse.map(normalizeEvent) : []);
      setArtists(Array.isArray(artistsResponse) ? artistsResponse : []);
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar dados para proposta.');
    } finally {
      setLoading(false);
    }
  }, [session?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedEvent = useMemo(
    () => events.find((eventItem) => getEventId(eventItem) === selectedEventId),
    [events, selectedEventId]
  );

  const selectedArtist = useMemo(
    () => artists.find((artist) => getArtistId(artist) === selectedArtistId),
    [artists, selectedArtistId]
  );

  async function handleCreateProposal() {
    setFormError('');

    if (!selectedEvent) {
      setFormError('Selecione o evento da proposta.');
      return;
    }

    if (!selectedArtist) {
      setFormError('Selecione o artista que recebera a proposta.');
      return;
    }

    const numericValue = Number(valorOfertado.replace(/\./g, '').replace(',', '.'));

    if (!numericValue || Number.isNaN(numericValue) || numericValue <= 0) {
      setFormError('Informe um valor ofertado valido.');
      return;
    }

    if (!termos.trim()) {
      setFormError('Informe os termos da proposta.');
      return;
    }

    if (!session?.id) {
      setFormError('Sessao invalida. Faca login novamente para enviar propostas.');
      return;
    }

    try {
      setSubmitting(true);
      await proposalService.create({
        id_artista: getArtistId(selectedArtist),
        id_evento: getEventId(selectedEvent),
        data_proposta: new Date().toISOString(),
        id_casa_show: session.id,
        data_evento: selectedEvent.data_inicio,
        valor_ofertado: numericValue.toFixed(2),
        status: 'DISPONÍVEL',
        termos: termos.trim(),
      });

      Alert.alert('Sucesso', 'Proposta enviada com sucesso.');
      router.push('/dashboards/casashow');
    } catch (requestError) {
      setFormError(requestError.message || 'Nao foi possivel enviar a proposta.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
>>>>>>> integraçãoPerfil
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/dashboards/casashow')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

<<<<<<< HEAD
          <Text style={styles.topBarTitle}>Propostas</Text>
=======
          <Text style={styles.topBarTitle}>Nova Proposta</Text>
>>>>>>> integraçãoPerfil

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
<<<<<<< HEAD
            onPress={() => router.push('/profile')}
=======
            onPress={() => router.push('/profile-casa-show')}
>>>>>>> integraçãoPerfil
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

<<<<<<< HEAD
        <View style={styles.heroCard}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>
              Novas propostas enviadas para artistas
            </Text>

            <Text style={styles.heroSubtitle}>
              Visualize, filtre e acompanhe as propostas enviadas pela casa.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newProposalButton}
            activeOpacity={0.85}
            onPress={() => router.push('/dashboards/casashow-eventos')}
          >
            <Ionicons name="add" size={18} color={colors.text} />
            <Text style={styles.newProposalButtonText}>Nova Proposta</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{MOCK_PROPOSTAS.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {MOCK_PROPOSTAS.filter((item) => item.status === 'ACEITA').length}
            </Text>
            <Text style={styles.summaryLabel}>Aceitas</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>
              {MOCK_PROPOSTAS.filter((item) => item.status === 'PENDENTE').length}
            </Text>
            <Text style={styles.summaryLabel}>Pendentes</Text>
          </View>
        </View>

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
                  placeholder="Buscar por data, local ou status..."
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
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}

          <View style={styles.proposalsList}>
            {filteredPropostas.length > 0 ? (
              filteredPropostas.map((proposta) => {
                const statusStyles = getStatusStyles(proposta.status);

                return (
                  <TouchableOpacity
                    key={proposta.id}
                    style={styles.proposalCard}
                    activeOpacity={0.85}
                    onPress={() => router.push('/dashboards/casashow-eventos')}
                  >
                    <View style={styles.dateBox}>
                      <Text style={styles.dateMonth}>
                        {proposta.data.split(' ')[0]}
                      </Text>
                      <Text style={styles.dateDay}>
                        {proposta.data.split(' ')[1]}
                      </Text>
                    </View>

                    <View style={styles.proposalContent}>
                      <Text style={styles.proposalTitle} numberOfLines={1}>
                        {proposta.titulo}
                      </Text>

                      <View style={styles.metaRow}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.metaText}>{proposta.local}</Text>
                      </View>

                      <View style={styles.proposalFooter}>
                        <View style={styles.metaRow}>
                          <Ionicons
                            name="time-outline"
                            size={14}
                            color={colors.textSecondary}
                          />
                          <Text style={styles.metaText}>{proposta.horario}</Text>
                        </View>

                        <Text style={styles.proposalValue}>{proposta.valor}</Text>
                      </View>
                    </View>

                    <View style={[styles.statusBadge, statusStyles.badge]}>
                      <Text style={[styles.statusText, statusStyles.text]}>
                        {proposta.status === 'ACEITA' ? 'Aceita' : 'Pendente'}
                      </Text>
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
                <Text style={styles.emptyStateTitle}>
                  Nenhuma proposta encontrada
                </Text>
                <Text style={styles.emptyStateText}>
                  Ajuste a busca ou altere os filtros para visualizar propostas.
                </Text>
              </View>
            )}
          </View>
=======
        {error ? (
          <TouchableOpacity style={styles.errorCard} activeOpacity={0.85} onPress={loadData}>
            <Ionicons name="warning-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.heroCard}>
          <MaterialCommunityIcons
            name="file-document-edit-outline"
            size={30}
            color={colors.primary}
          />
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle}>Criar proposta</Text>
            <Text style={styles.heroSubtitle}>
              Selecione um evento, escolha um artista e envie os termos.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Evento</Text>

          {events.length > 0 ? (
            events.map((eventItem) => {
              const eventId = getEventId(eventItem);
              const isSelected = selectedEventId === eventId;

              return (
                <TouchableOpacity
                  key={eventId}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedEventId(eventId)}
                >
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{eventItem.titulo}</Text>
                    <Text style={styles.optionSubtitle}>
                      {formatDateTime(eventItem.data_inicio)}
                    </Text>
                  </View>

                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Nenhum evento cadastrado para esta casa.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Artista</Text>

          {artists.length > 0 ? (
            artists.map((artist) => {
              const artistId = getArtistId(artist);
              const isSelected = selectedArtistId === artistId;

              return (
                <TouchableOpacity
                  key={artistId}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedArtistId(artistId)}
                >
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>{getArtistName(artist)}</Text>
                    <Text style={styles.optionSubtitle}>
                      {artist.genero_musical || 'Genero nao informado'}
                    </Text>
                  </View>

                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Nenhum artista retornado pela API.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Detalhes da proposta</Text>

          <Text style={styles.fieldLabel}>Valor ofertado</Text>
          <TextInput
            style={styles.input}
            placeholder="1500,00"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={valorOfertado}
            onChangeText={(value) => {
              setValorOfertado(value);
              setFormError('');
            }}
          />

          {valorOfertado ? (
            <Text style={styles.helperText}>
              {formatCurrency(Number(valorOfertado.replace(/\./g, '').replace(',', '.')))}
            </Text>
          ) : null}

          <Text style={styles.fieldLabel}>Termos</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Cache, horario de chegada, duracao do show, estrutura..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            value={termos}
            onChangeText={(value) => {
              setTermos(value);
              setFormError('');
            }}
          />

          {selectedEvent ? (
            <Text style={styles.helperText}>
              Data do evento: {formatDateTime(selectedEvent.data_inicio)}
            </Text>
          ) : null}

          {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

          <Button
            title="Enviar Proposta"
            onPress={handleCreateProposal}
            loading={submitting}
            style={styles.submitButton}
          />
>>>>>>> integraçãoPerfil
        </View>
      </ScrollView>
    </SafeAreaView>
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
<<<<<<< HEAD
=======
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
>>>>>>> integraçãoPerfil
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
<<<<<<< HEAD
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
=======
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  heroCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  heroInfo: {
    flex: 1,
    marginLeft: spacing.md,
>>>>>>> integraçãoPerfil
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text,
<<<<<<< HEAD
    marginBottom: 6,
=======
    marginBottom: 4,
>>>>>>> integraçãoPerfil
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
<<<<<<< HEAD
  newProposalButton: {
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
  newProposalButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryCard: {
    width: '31.5%',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
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
=======
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  optionCard: {
    minHeight: 64,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
  },
  optionInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  optionTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: spacing.sm,
  },
  input: {
>>>>>>> integraçãoPerfil
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
<<<<<<< HEAD
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
    alignItems: 'center',
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
    marginRight: spacing.sm,
  },
  proposalTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
});
=======
    backgroundColor: '#1B2233',
    paddingHorizontal: 14,
    color: colors.text,
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 14,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  formErrorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
>>>>>>> integraçãoPerfil
