import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useTheme } from '../../src/theme';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <NativeTabs tintColor={colors.primary}>
      {/* Tab Início (Home) */}
      <NativeTabs.Trigger name="index">
        <Label>Início</Label>
        <Icon sf="house.fill" drawable="home" />
      </NativeTabs.Trigger>

      {/* Tab Perfil (Profile) */}
      <NativeTabs.Trigger name="profile">
        <Label>Perfil</Label>
        <Icon sf="person.fill" drawable="person" />
      </NativeTabs.Trigger>

      {/* Tab Configurações (Settings) */}
      <NativeTabs.Trigger name="configuracoes">
        <Label>Configurações</Label>
        <Icon sf="gearshape" drawable="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
