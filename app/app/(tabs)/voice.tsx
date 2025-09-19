import React from 'react';
import { StyleSheet } from 'react-native';
import VoiceChat from '@/components/VoiceChat';
import { ThemedView } from '@/components/themed-view';

export default function VoiceScreen() {
  return (
    <ThemedView style={styles.container}>
      <VoiceChat />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
