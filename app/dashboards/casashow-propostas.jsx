import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function getArtistId(artist) {
  return artist?.id_usuario || artist?.id || artist?.uuid;
}

function getArtistName(artist) {
  return artist?.nome_artista || artist?.nome || artist?.email || 'Artista';
}

function getArtistSubtitle(artist) {
  return artist?.genero_musical || artist?.genero || 'Genero nao informado';
}

function eventMatchesSearch(eventItem, search) {
  const normalizedSearch = normalizeText(search);

  if (!normalizedSearch) return true;

  return (
    normalizeText(eventItem?.titulo).includes(normalizedSearch) ||
    normalizeText(eventItem?.descricao).includes(normalizedSearch) ||
    normalizeText(eventItem?.local).includes(normalizedSearch) ||
    normalizeText(eventItem?.genero).includes(normalizedSearch)
  );
}

function artistMatchesSearch(artist, search) {
  const normalizedSearch = normalizeText(search);

  if (!normalizedSearch) return true;

  return (
    normalizeText(getArtistName(artist)).includes(normalizedSearch) ||
    normalizeText(getArtistSubtitle(artist)).includes(normalizedSearch) ||
    normalizeText(artist?.email).includes(normalizedSearch)
  );
}

export default function CasaShowPropostasScreen() {
  const { session } = useAuth();
  const params = useLocalSearchParams();
  const initialEventId = params?.id_evento ? String(params.id_evento) : '';

  const [events, setEvents] = useState([]);
  const [artists, setArtists] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [artistSearch, setArtistSearch] = useState('');
  const [valorOfertado, setValorOfertado] = useState('');
  const [termos, setTermos] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const casaShowId = useMemo(
    () => session?.id_usuario || session?.id || '',
    [session]
  );

  const loadData = useCallback(async () => {
    if (!casaShowId) {
      setError('Sessão inválida.');
      setLoading(false);
      return;
    }

    try {
      setError('');

      console.log('CASA SHOW ID PARA CRIAR PROPOSTA:', casaShowId);

      const [eventsResponse, artistsResponse] = await Promise.all([
        eventService.listByCasaShow(casaShowId),
        usersService.listArtists(),
      ]);

      console.log('EVENTOS DA CASA PARA PROPOSTA:', JSON.stringify(eventsResponse, null, 2));
      console.log('ARTISTAS PARA PROPOSTA:', JSON.stringify(artistsResponse, null, 2));

      setEvents(Array.isArray(eventsResponse) ? eventsResponse.map(normalizeEvent) : []);
      setArtists(Array.isArray(artistsResponse) ? artistsResponse : []);
    } catch (requestError) {
      console.log('ERRO AO CARREGAR DADOS PARA PROPOSTA:', requestError);

      setError(requestError?.message || 'Nao foi possivel carregar dados para proposta.');
      setEvents([]);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  }, [casaShowId]);

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

  const filteredEvents = useMemo(() => {
    const sortedEvents = [...events].sort((a, b) => {
      const dateA = new Date(a.data_inicio || 0).getTime() || 0;
      const dateB = new Date(b.data_inicio || 0).getTime() || 0;

      return dateA - dateB;
    });

    return sortedEvents.filter((eventItem) => eventMatchesSearch(eventItem, eventSearch));
  }, [events, eventSearch]);

  const filteredArtists = useMemo(() => {
    return [...artists]
      .sort((a, b) => getArtistName(a).localeCompare(getArtistName(b)))
      .filter((artist) => artistMatchesSearch(artist, artistSearch));
  }, [artists, artistSearch]);

  function handleSelectEvent(eventId) {
    setSelectedEventId(eventId);
    setFormError('');
  }

  function handleSelectArtist(artistId) {
    setSelectedArtistId(artistId);
    setFormError('');
  }

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

    if (!casaShowId) {
      setFormError('Sessao invalida. Faca login novamente para enviar propostas.');
      return;
    }

    try {
      setSubmitting(true);

      await proposalService.create({
        id_artista: getArtistId(selectedArtist),
        id_evento: getEventId(selectedEvent),
        data_proposta: new Date().toISOString(),
        id_casa_show: casaShowId,
        data_evento: selectedEvent.data_inicio,
        valor_ofertado: numericValue.toFixed(2),
        status: 'DISPONÍVEL',
        termos: termos.trim(),
      });

      Alert.alert('Sucesso', 'Proposta enviada com sucesso.');
      router.push('/dashboards/casashow');
    } catch (requestError) {
      setFormError(requestError?.message || 'Nao foi possivel enviar a proposta.');
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/dashboards/casashow')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Nova Proposta</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/profile-casa-show')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

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
              Pesquise o evento, escolha o artista e envie os termos da proposta.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Evento</Text>
          </View>

          {selectedEvent ? (
            <View style={styles.selectedBox}>
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedLabel}>Evento selecionado</Text>
                <Text style={styles.selectedTitle}>{selectedEvent.titulo}</Text>
                <Text style={styles.selectedSubtitle}>
                  {formatDateTime(selectedEvent.data_inicio)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.clearButton}
                activeOpacity={0.85}
                onPress={() => setSelectedEventId('')}
              >
                <Ionicons name="close-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar evento por nome, local ou gênero"
              placeholderTextColor={colors.textMuted}
              value={eventSearch}
              onChangeText={setEventSearch}
            />
            {eventSearch ? (
              <TouchableOpacity activeOpacity={0.85} onPress={() => setEventSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {events.length > 0 ? (
            <>
              <Text style={styles.resultCount}>
                {filteredEvents.length} evento(s) encontrado(s)
              </Text>

              <ScrollView
                style={styles.searchResultsBox}
                contentContainerStyle={styles.searchResultsContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((eventItem) => {
                    const eventId = getEventId(eventItem);
                    const isSelected = selectedEventId === eventId;

                    return (
                      <TouchableOpacity
                        key={eventId}
                        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                        activeOpacity={0.85}
                        onPress={() => handleSelectEvent(eventId)}
                      >
                        <View style={styles.optionInfo}>
                          <Text style={styles.optionTitle}>{eventItem.titulo}</Text>

                          <View style={styles.optionMetaRow}>
                            <Ionicons
                              name="time-outline"
                              size={13}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.optionSubtitle}>
                              {formatDateTime(eventItem.data_inicio)}
                            </Text>
                          </View>

                          <View style={styles.optionMetaRow}>
                            <Ionicons
                              name="location-outline"
                              size={13}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.optionSubtitle}>
                              {eventItem.local || 'Local nao informado'}
                            </Text>
                          </View>
                        </View>

                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                        ) : (
                          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>
                    Nenhum evento encontrado com essa busca.
                  </Text>
                )}
              </ScrollView>
            </>
          ) : (
            <Text style={styles.emptyText}>Nenhum evento cadastrado para esta casa.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Artista</Text>
          </View>

          {selectedArtist ? (
            <View style={styles.selectedBox}>
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedLabel}>Artista selecionado</Text>
                <Text style={styles.selectedTitle}>{getArtistName(selectedArtist)}</Text>
                <Text style={styles.selectedSubtitle}>{getArtistSubtitle(selectedArtist)}</Text>
              </View>

              <TouchableOpacity
                style={styles.clearButton}
                activeOpacity={0.85}
                onPress={() => setSelectedArtistId('')}
              >
                <Ionicons name="close-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar artista por nome ou gênero"
              placeholderTextColor={colors.textMuted}
              value={artistSearch}
              onChangeText={setArtistSearch}
            />
            {artistSearch ? (
              <TouchableOpacity activeOpacity={0.85} onPress={() => setArtistSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {artists.length > 0 ? (
            <>
              <Text style={styles.resultCount}>
                {filteredArtists.length} artista(s) encontrado(s)
              </Text>

              <ScrollView
                style={styles.searchResultsBox}
                contentContainerStyle={styles.searchResultsContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                {filteredArtists.length > 0 ? (
                  filteredArtists.map((artist) => {
                    const artistId = getArtistId(artist);
                    const isSelected = selectedArtistId === artistId;

                    return (
                      <TouchableOpacity
                        key={artistId}
                        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                        activeOpacity={0.85}
                        onPress={() => handleSelectArtist(artistId)}
                      >
                        <View style={styles.optionInfo}>
                          <Text style={styles.optionTitle}>{getArtistName(artist)}</Text>

                          <View style={styles.optionMetaRow}>
                            <Ionicons
                              name="musical-notes-outline"
                              size={13}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.optionSubtitle}>
                              {getArtistSubtitle(artist)}
                            </Text>
                          </View>
                        </View>

                        {isSelected ? (
                          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                        ) : (
                          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>
                    Nenhum artista encontrado com essa busca.
                  </Text>
                )}
              </ScrollView>
            </>
          ) : (
            <Text style={styles.emptyText}>Nenhum artista retornado pela API.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Detalhes da proposta</Text>
          </View>

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

          {selectedArtist ? (
            <Text style={styles.helperText}>
              Artista: {getArtistName(selectedArtist)}
            </Text>
          ) : null}

          {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

          <Button
            title="Enviar Proposta"
            onPress={handleCreateProposal}
            loading={submitting}
            style={styles.submitButton}
          />
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
  },
  heroTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 4,
  },
  heroSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...shadows.small,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
  },
  selectedBox: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 102, 255, 0.35)',
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  selectedLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  selectedTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  selectedSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  clearButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    marginLeft: spacing.sm,
    paddingVertical: 10,
  },
  resultCount: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  searchResultsBox: {
    maxHeight: 260,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  searchResultsContent: {
    paddingBottom: spacing.xs,
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
  optionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  optionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 6,
    flexShrink: 1,
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: spacing.sm,
  },
  input: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
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