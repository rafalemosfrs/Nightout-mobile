import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';

  if (isPrimary) {
    return (
      <TouchableOpacity
        style={[styles.container, disabled && styles.disabled, style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={disabled ? [colors.backgroundCard, colors.backgroundCard] : [colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color={colors.text} />
          ) : (
            <Text style={[styles.text, styles.textPrimary, textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (isSecondary) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          styles.secondaryContainer,
          disabled && styles.disabled,
          style
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={colors.secondary} />
        ) : (
          <Text style={[styles.text, styles.textSecondary, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (isOutline) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          styles.outlineContainer,
          disabled && styles.disabled,
          style
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={[styles.text, styles.textOutline, textStyle]}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  secondaryContainer: {
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  textPrimary: {
    color: colors.text,
  },
  textSecondary: {
    color: colors.text,
  },
  textOutline: {
    color: colors.primary,
  },
});