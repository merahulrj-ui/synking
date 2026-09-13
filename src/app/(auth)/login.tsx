import React from 'react';
import { useRouter } from 'expo-router';
import { AuthLandingScreen } from '../../components/AuthLandingScreen';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <AuthLandingScreen
      onSuccess={() => {
        router.replace('/(tabs)');
      }}
      showCloseButton={false}
    />
  );
}

