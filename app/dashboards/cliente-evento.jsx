import React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} from '../../constants/theme';

const EVENTO_DETALHE = {
  titulo: 'Festa',
  descricao:
    'Festa com DJ da casa, DJ guedes, tocando em todos os fones da juventude.',
  data: '29 de fev.',
  horario: '22:00',
  ingresso: 'A combinar',
  local: 'Av. Bezerra de Menezes',
  imagem:
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
};

export default function ClienteEventoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.85}
            onPress={() => router.push('/dashboards/cliente')}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>Detalhes do Evento</Text>

          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.85}
            onPress={() => router.push('/profile-costumer')}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.eventCard}>
          <Image
            source={{ uri: EVENTO_DETALHE.imagem }}
            style={styles.eventImage}
            resizeMode="cover"
          />

          <View style={styles.eventContent}>
            <Text style={styles.eventTitle}>{EVENTO_DETALHE.titulo}</Text>

            <Text style={styles.eventDescription}>
              {EVENTO_DETALHE.descricao}
            </Text>

            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={colors.primary}
              />
              <Text style={styles.sectionTitle}>Informações do evento</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <View style={styles.infoIconBox}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.infoLabel}>Data</Text>
                <Text style={styles.infoValue}>{EVENTO_DETALHE.data}</Text>
                <Text style={styles.infoHint}>Programe-se para não perder</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIconBoxSuccess}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={colors.success}
                  />
                </View>

                <Text style={styles.infoLabel}>Horário</Text>
                <Text style={styles.infoValue}>{EVENTO_DETALHE.horario}</Text>
                <Text style={styles.infoHint}>Chegue com antecedência</Text>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoIconBoxPurple}>
                  <MaterialCommunityIcons
                    name="ticket-confirmation-outline"
                    size={18}
                    color={colors.secondary}
                  />
                </View>

                <Text style={styles.infoLabel}>Ingresso</Text>
                <Text style={styles.infoValue}>{EVENTO_DETALHE.ingresso}</Text>
                <Text style={styles.infoHint}>Consulte mais detalhes</Text>
              </View>
            </View>

            <View style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>

              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Local do evento</Text>
                <Text style={styles.locationText}>{EVENTO_DETALHE.local}</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.contactButton}
              onPress={() => router.push('/profile-costumer')}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.text} />
              <Text style={styles.contactButtonText}>Entre em contato</Text>
            </TouchableOpacity>
          </View>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  eventCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.medium,
  },
  eventImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#101728',
  },
  eventContent: {
    padding: spacing.lg,
  },
  eventTitle: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  eventDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
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
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  infoCard: {
    width: '31.5%',
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    minHeight: 128,
    ...shadows.small,
  },
  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  infoIconBoxSuccess: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  infoIconBoxPurple: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(157, 78, 221, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  infoHint: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 13,
  },
  locationCard: {
    backgroundColor: '#101728',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 102, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  locationText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  contactButton: {
    height: 50,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    ...shadows.medium,
  },
  contactButtonText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '700',
    marginLeft: 8,
  },
});