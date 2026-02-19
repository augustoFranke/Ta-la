import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface MatchCelebrationProps {
  visible: boolean;
  currentUserName: string;
  currentUserPhotoUrl: string | null;
  matchedUserName: string;
  matchedUserPhotoUrl: string | null;
  onDismiss: () => void;
}

export function MatchCelebration({
  visible,
  currentUserName,
  currentUserPhotoUrl,
  matchedUserName,
  matchedUserPhotoUrl,
  onDismiss,
}: MatchCelebrationProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Avatar pair */}
          <View style={styles.avatarPair}>
            <Avatar
              url={currentUserPhotoUrl}
              name={currentUserName}
              size={90}
            />
            <View style={styles.secondAvatar}>
              <Avatar
                url={matchedUserPhotoUrl}
                name={matchedUserName}
                size={90}
              />
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.primary }]}>
            Voces combinaram!
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {currentUserName} e {matchedUserName}
          </Text>

          {/* Continue button */}
          <Button
            title="Continuar"
            onPress={onDismiss}
            style={styles.button}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  avatarPair: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  secondAvatar: {
    marginLeft: -20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    minWidth: 200,
  },
});
