import React from 'react';
import { View, Text, Modal, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { InteractionType, INTERACTION_LABELS } from '../../types/database';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ConfirmationDialogProps {
  visible: boolean;
  userName: string;
  interactionType: InteractionType;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmationDialog({
  visible,
  userName,
  interactionType,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmationDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Enviar {INTERACTION_LABELS[interactionType]} para {userName}?
          </Text>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Cancelar"
              variant="outline"
              onPress={onCancel}
              style={styles.button}
              disabled={loading}
            />
            <Button
              title="Enviar"
              onPress={onConfirm}
              style={styles.button}
              loading={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: SCREEN_WIDTH - 48,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
  },
});
