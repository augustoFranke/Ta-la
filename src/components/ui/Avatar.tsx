import React from 'react';
import { Image, View, Text } from 'react-native';
import { useTheme } from '../../theme';

interface AvatarProps {
  url?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ url, name, size = 48 }: AvatarProps) {
  const { colors } = useTheme();

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {url ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      ) : (
        <Text
          style={{
            fontSize: size * 0.4,
            fontWeight: 'bold',
            color: colors.textSecondary,
          }}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}
