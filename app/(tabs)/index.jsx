import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, MapPin, Star } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../../constants/theme';

function DashboardCard({ icon: Icon, title, subtitle, color, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[colors.backgroundCard, colors.backgroundLight]}
        style={styles.cardGradient}
      >
        <View style={[styles.cardIcon, { backgroundColor: color + '22' }]}>
          <Icon size={28} color={color} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.backgroundLight, colors.background]}
          style={styles.header}
        >
          <Text style={styles.greeting}>Bem-vindo ao</Text>
          <Text style={styles.appName}>NightOut</Text>
          <Text style={styles.headerSubtitle}>
            Explore eventos, artistas e casas de show
          </Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navegação rápida</Text>
          <View style={styles.cardGrid}>
            <DashboardCard
              icon={Calendar}
              title="Eventos"
              subtitle="Veja os próximos eventos"
              color={colors.primary}
              onPress={() => router.push('/(tabs)/events')}
            />
            <DashboardCard
              icon={MapPin}
              title="Locais"
              subtitle="Descubra casas de show"
              color={colors.secondary}
              onPress={() => router.push('/(tabs)/venues')}
            />
            <DashboardCard
              icon={Star}
              title="Perfil"
              subtitle="Gerencie sua conta"
              color={colors.success}
              onPress={() => router.push('/(tabs)/profile')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Em breve</Text>
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonText}>
              Feed de eventos e novidades em breve...
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  greeting: {
    ...typography.body,
    color: colors.textSecondary,
  },
  appName: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  cardGradient: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  comingSoonCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  comingSoonText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
