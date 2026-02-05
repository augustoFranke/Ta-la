import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useTheme } from '../../src/theme';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <NativeTabs tintColor={colors.primary}>
      <NativeTabs.Trigger name="index">
        <Label>Início</Label>
        <Icon sf="house.fill" drawable="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="discover">
        <Label>Descobrir</Label>
        <Icon sf="location.fill" drawable="location" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>Perfil</Label>
        <Icon sf="person.fill" drawable="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
