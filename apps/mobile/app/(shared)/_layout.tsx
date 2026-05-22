import React from 'react';
import { Stack } from 'expo-router';

export default function SharedLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
