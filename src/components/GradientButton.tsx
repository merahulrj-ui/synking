import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';

interface Props {
  title: string;
  onPress: () => void;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'vip' | 'guardian';
}

export const GradientButton: React.FC<Props> = ({
  title,
  onPress,
  icon,
  style,
  textStyle,
  variant = 'primary',
}) => {
  const gradientColors =
    variant === 'vip'
      ? Colors.synkVip
      : variant === 'guardian'
      ? (['#25D366', '#128C7E'] as const)
      : Colors.synkGradient;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.container, style]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.text, variant === 'vip' && { color: '#000' }, textStyle]}>
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 0.2,
  },
});
