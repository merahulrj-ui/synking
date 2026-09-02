import '@expo/metro-runtime';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { AppRegistry } from 'react-native';
import CallApp from './src/components/CallApp';

// 1. Standard Dating App for MainActivity (locked behind PIN/Fingerprint)
renderRootComponent(App);

// 2. Standalone CallApp for CallActivity (only opens on Lock Screen for calls)
AppRegistry.registerComponent('CallApp', () => CallApp);
