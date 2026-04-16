import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '../../components/Button';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from '../../constants/theme';

const USER_ID_MOCK = 'casa-show-001';
const STATUS_OPTIONS = ['ATIVO', 'CANCELADO', 'FINALIZADO'];
const EVENTS_STORAGE_KEY = '@nightout:casashow-events';

const INITIAL_FORM = {
  id_evento: '',
  id_usuario: USER_ID_MOCK,
  titulo: '',
  descricao: '',
  data_inicio: '',
  data_fim: '',
  local: '',
  status: 'ATIVO',
  foto_evento: null,
  propostasCasa: [],
  propostasArtista: [],
  eventoArtistas: [],
};

const MOCK_EVENTS = [
  {
    id_evento: 'evt-001',
    id_usuario: USER_ID_MOCK,
    titulo: 'Sunrise Beachclub com Nattan',
    descricao: 'Evento principal da casa com show ao vivo, DJs convidados e área VIP.',
    data_inicio: '2026-02-24T22:00:00.000Z',
    data_fim: '2026-02-25T04:00:00.000Z',
    local: 'Av. Beira Mar, 1200',
    status: 'ATIVO',
    foto_evento: null,
    propostasCasa: [],
    propostasArtista: [],
    eventoArtistas: [],
  },
  {
    id_evento: 'evt-002',
    id_usuario: USER_ID_MOCK,
    titulo: 'Baile Funk Premium',
    descricao: 'Noite temática com line-up local e estrutura especial de iluminação.',
    data_inicio: '2026-02-27T23:30:00.000Z',
    data_fim: '2026-02-28T05:00:00.000Z',
    local: 'Living Music Hall',
    status: 'ATIVO',
    foto_evento: null,
    propostasCasa: [],
    propostasArtista: [],
    eventoArtistas: [],
  },
  {
    id_evento: 'evt-003',
    id_usuario: USER_ID_MOCK,
    titulo: 'Especial de Carnaval',
    descricao: 'Evento sazonal já encerrado, mantido aqui só para visualização.',
    data_inicio: '2026-02-14T23:00:00.000Z',
    data_fim: '2026-02-15T03:00:00.000Z',
    local: 'Centro de Eventos Night Out',
    status: 'FINALIZADO',
    foto_evento: null,
    propostasCasa: [],
    propostasArtista: [],
    eventoArtistas: [],
  },
];

function formatDateTime(isoString) {
  if (!isoString) return '--';

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) return '--';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function parsePtBrDateTimeToIso(value) {
  const sanitized = value.trim();
  const match = sanitized.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:,)?\s+(\d{2}):(\d{2})$/
  );

  if (!match) return null;

  const [, day, month, year, hour, minute] = match;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function getStatusStyles(status) {
  switch (status) {
    case 'ATIVO':
      return {
        badge: styles.statusActiveBadge,
        text: styles.statusActiveText,
      };
    case 'FINALIZADO':
      return {
        badge: styles.statusFinishedBadge,
        text: styles.statusFinishedText,
      };
    case 'CANCELADO':
      return {
        badge: styles.statusCancelledBadge,
        text: styles.statusCancelledText,
      };
    default:
      return {
        badge: styles.statusDefaultBadge,
        text: styles.statusDefaultText,
      };
  }
}

function normalizeEventItem(item) {
  return {
    ...item,
    foto_evento: item?.foto_evento || null,
    propostasCasa: item?.propostasCasa || [],
    propostasArtista: item?.propostasArtista || [],
    eventoArtistas: item?.eventoArtistas || [],
  };
}

export default function CasaShowEventosScreen() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('TODOS');
  const [showFilters, setShowFilters] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);

  useEffect(() => {
    async function loadPersistedEvents() {
      try {
        const storedEvents = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);

        if (storedEvents) {
          const parsedEvents = JSON.parse(storedEvents);
          const safeEvents = Array.isArray(parsedEvents)
            ? parsedEvents.map(normalizeEventItem)
            : MOCK_EVENTS;

          setEvents(safeEvents);
        } else {
          setEvents(MOCK_EVENTS);
        }
      } catch (error) {
        console.log('Erro ao carregar eventos salvos:', error);
        setEvents(MOCK_EVENTS);
      } finally {
        setHasHydratedStorage(true);
      }
    }

    loadPersistedEvents();
  }, []);

  useEffect(() => {
    async function persistEvents() {
      if (!hasHydratedStorage) return;

      try {
        await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      } catch (error) {
        console.log('Erro ao salvar eventos localmente:', error);
      }
    }

    persistEvents();
  }, [events, hasHydratedStorage]);

  const summary = useMemo(() => {
    const total = events.length;
    const ativos = events.filter((item) => item.status === 'ATIVO').length;
    const finalizados = events.filter((item) => item.status === 'FINALIZADO').length;
    const cancelados = events.filter((item) => item.status === 'CANCELADO').length;

    return { total, ativos, finalizados, cancelados };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...events]
      .filter((item) => {
        const matchesStatus =
          selectedStatus === 'TODOS' || item.status === selectedStatus;

        const matchesSearch =
          !normalizedSearch ||
          item.titulo.toLowerCase().includes(normalizedSearch) ||
          item.local.toLowerCase().includes(normalizedSearch) ||
          item.status.toLowerCase().includes(normalizedSearch);

        return matchesStatus && matchesSearch;
      })
      .sort(
        (a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
      );
  }, [events, search, selectedStatus]);

  function updateFormField(field, value) {
    setForm((prevState) => ({
      ...prevState,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    setFormError('');
  }

  function openCreateModal() {
    resetForm();
    setIsModalVisible(true);
  }

  function closeCreateModal() {
    setIsModalVisible(false);
    setFormError('');
  }

  async function handlePickEventImage() {
    try {
      if (Platform.OS !== 'web') {
        const permissionResult =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
          Alert.alert(
            'Permissão necessária',
            'Precisamos de acesso à galeria para selecionar a foto do evento.'
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const previewUri = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : asset.uri;

      updateFormField('foto_evento', {
        previewUri,
        base64: asset.base64 || null,
        fileName: asset.fileName || `evento-${Date.now()}.jpg`,
        mimeType,
        width: asset.width || null,
        height: asset.height || null,
      });
    } catch (error) {
      console.log('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  }

  async function handleCreateEvent() {
    setFormError('');

    if (!form.titulo.trim()) {
      setFormError('Informe o título do evento.');
      return;
    }

    if (!form.descricao.trim()) {
      setFormError('Informe a descrição do evento.');
      return;
    }

    if (!form.data_inicio.trim()) {
      setFormError('Informe a data e hora de início.');
      return;
    }

    if (!form.data_fim.trim()) {
      setFormError('Informe a data e hora de fim.');
      return;
    }

    if (!form.local.trim()) {
      setFormError('Informe o local do evento.');
      return;
    }

    const parsedStart = parsePtBrDateTimeToIso(form.data_inicio);
    const parsedEnd = parsePtBrDateTimeToIso(form.data_fim);

    if (!parsedStart) {
      setFormError('A data de início deve estar no formato DD/MM/AAAA HH:mm.');
      return;
    }

    if (!parsedEnd) {
      setFormError('A data de fim deve estar no formato DD/MM/AAAA HH:mm.');
      return;
    }

    if (new Date(parsedStart).getTime() >= new Date(parsedEnd).getTime()) {
      setFormError('A data de fim precisa ser maior que a data de início.');
      return;
    }

    try {
      setIsSubmitting(true);

      const newEvent = normalizeEventItem({
        id_evento: `evt-${Date.now()}`,
        id_usuario: form.id_usuario || USER_ID_MOCK,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim(),
        data_inicio: parsedStart,
        data_fim: parsedEnd,
        local: form.local.trim(),
        status: form.status,
        foto_evento: form.foto_evento || null,
        propostasCasa: form.propostasCasa || [],
        propostasArtista: form.propostasArtista || [],
        eventoArtistas: form.eventoArtistas || [],
      });

      setEvents((prevState) => [newEvent, ...prevState]);
      closeCreateModal();
      resetForm();

      Alert.alert('Sucesso', 'Evento criado localmente com foto persistida.');
    } catch (error) {
      console.log('Erro ao criar evento:', error);
      setFormError('Não foi possível criar o evento agora.');
    } finally {
      setIsSubmitting(false);
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
            onPress={() => router.push('/dashboards/casashow')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Eventos da Casa de Show</Text>

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
            <Text style={styles.heroTitle}>Eventos da Casa de Show</Text>
            <Text style={styles.heroSubtitle}>
              Crie novos eventos e gerencie tudo em um só lugar.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.newEventButton}
            activeOpacity={0.85}
            onPress={openCreateModal}
          >
            <Ionicons name="add" size={18} color={colors.text} />
            <Text style={styles.newEventButtonText}>Novo Evento</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.ativos}</Text>
            <Text style={styles.statLabel}>Ativos</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.finalizados}</Text>
            <Text style={styles.statLabel}>Finalizados</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary.cancelados}</Text>
            <Text style={styles.statLabel}>Cancelados</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Lista de Eventos</Text>

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
                  placeholder="Buscar por título, local ou status"
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
              {['TODOS', ...STATUS_OPTIONS].map((status) => {
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

          <View style={styles.eventsList}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((eventItem) => {
                const statusStyles = getStatusStyles(eventItem.status);

                return (
                  <View key={eventItem.id_evento} style={styles.eventCard}>
                    <View style={styles.eventDateBox}>
                      {eventItem.foto_evento?.previewUri ? (
                        <Image
                          source={{ uri: eventItem.foto_evento.previewUri }}
                          style={styles.eventThumb}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color={colors.primary}
                        />
                      )}
                    </View>

                    <View style={styles.eventContent}>
                      <View style={styles.eventTopRow}>
                        <Text style={styles.eventTitle}>{eventItem.titulo}</Text>

                        <View style={[styles.statusBadge, statusStyles.badge]}>
                          <Text style={[styles.statusText, statusStyles.text]}>
                            {eventItem.status}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.eventDescription} numberOfLines={2}>
                        {eventItem.descricao}
                      </Text>

                      <View style={styles.metaRow}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.metaText}>{eventItem.local}</Text>
                      </View>

                      <View style={styles.metaRow}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.metaText}>
                          {formatDateTime(eventItem.data_inicio)} até{' '}
                          {formatDateTime(eventItem.data_fim)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="calendar-blank"
                  size={46}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyStateTitle}>Nenhum evento encontrado</Text>
                <Text style={styles.emptyStateText}>
                  Ajuste a busca, troque o filtro ou crie um novo evento.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeCreateModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Evento da Casa</Text>

              <TouchableOpacity activeOpacity={0.8} onPress={closeCreateModal}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.fieldLabel}>Foto do Evento</Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.uploadBox}
                onPress={handlePickEventImage}
              >
                {form.foto_evento?.previewUri ? (
                  <>
                    <Image
                      source={{ uri: form.foto_evento.previewUri }}
                      style={styles.uploadPreview}
                      resizeMode="cover"
                    />
                    <Text style={styles.uploadTitle}>Toque para trocar a foto</Text>
                    <Text style={styles.uploadSubtitle}>
                      A imagem será salva localmente junto com o evento
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="image-outline" size={34} color={colors.primary} />
                    <Text style={styles.uploadTitle}>Clique para adicionar foto</Text>
                    <Text style={styles.uploadSubtitle}>PNG, JPG até 5MB</Text>
                  </>
                )}
              </TouchableOpacity>

              {form.foto_evento?.previewUri ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.removeImageButton}
                  onPress={() => updateFormField('foto_evento', null)}
                >
                  <Text style={styles.removeImageButtonText}>Remover foto</Text>
                </TouchableOpacity>
              ) : null}

              <Text style={styles.fieldLabel}>Título do Evento</Text>
              <TextInput
                style={styles.input}
                placeholder="Sunrise Beachclub com Nattan"
                placeholderTextColor={colors.textMuted}
                value={form.titulo}
                onChangeText={(value) => updateFormField('titulo', value)}
              />

              <Text style={styles.fieldLabel}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva o evento, atrações, regras, etc."
                placeholderTextColor={colors.textMuted}
                value={form.descricao}
                onChangeText={(value) => updateFormField('descricao', value)}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Data / Hora de Início</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="24/02/2026 22:00"
                    placeholderTextColor={colors.textMuted}
                    value={form.data_inicio}
                    onChangeText={(value) => updateFormField('data_inicio', value)}
                  />
                </View>

                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>Data / Hora de Fim</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="25/02/2026 04:00"
                    placeholderTextColor={colors.textMuted}
                    value={form.data_fim}
                    onChangeText={(value) => updateFormField('data_fim', value)}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Local</Text>
              <TextInput
                style={styles.input}
                placeholder="Endereço ou descrição do local"
                placeholderTextColor={colors.textMuted}
                value={form.local}
                onChangeText={(value) => updateFormField('local', value)}
              />

              <Text style={styles.fieldLabel}>Status</Text>
              <View style={styles.statusOptionsRow}>
                {STATUS_OPTIONS.map((status) => {
                  const isSelected = form.status === status;

                  return (
                    <TouchableOpacity
                      key={status}
                      activeOpacity={0.85}
                      style={[
                        styles.statusOption,
                        isSelected && styles.statusOptionSelected,
                      ]}
                      onPress={() => updateFormField('status', status)}
                    >
                      <Text
                        style={[
                          styles.statusOptionText,
                          isSelected && styles.statusOptionTextSelected,
                        ]}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

              <View style={styles.modalButtonsRow}>
                <View style={styles.modalButtonWrapper}>
                  <Button
                    title="Cancelar"
                    variant="outline"
                    onPress={closeCreateModal}
                  />
                </View>

                <View style={styles.modalButtonWrapper}>
                  <Button
                    title="Criar Evento"
                    onPress={handleCreateEvent}
                    loading={isSubmitting}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  newEventButton: {
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
  newEventButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    ...typography.bodySmall,
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
  listTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginBottom: spacing.md,
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
  eventsList: {
    marginTop: spacing.xs,
  },
  eventCard: {
    backgroundColor: '#101728',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  eventDateBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 102, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  eventThumb: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  eventContent: {
    flex: 1,
  },
  eventTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  eventTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  eventDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusActiveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
  },
  statusActiveText: {
    color: colors.success,
  },
  statusFinishedBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
  },
  statusFinishedText: {
    color: '#8B9CFF',
  },
  statusCancelledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  statusCancelledText: {
    color: colors.error,
  },
  statusDefaultBadge: {
    backgroundColor: 'rgba(160, 174, 192, 0.14)',
  },
  statusDefaultText: {
    color: colors.textSecondary,
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
    maxHeight: '90%',
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
  modalScrollContent: {
    paddingBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: spacing.sm,
  },
  uploadBox: {
    minHeight: 150,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#2A3A5E',
    borderStyle: 'dashed',
    backgroundColor: '#101728',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  uploadPreview: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  uploadTitle: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: 4,
    textAlign: 'center',
  },
  uploadSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  removeImageButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  removeImageButtonText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '700',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfField: {
    width: '48.5%',
  },
  statusOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  statusOption: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101728',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  statusOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
  },
  statusOptionText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  statusOptionTextSelected: {
    color: colors.primary,
  },
  formErrorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  modalButtonWrapper: {
    width: '48%',
  },
});