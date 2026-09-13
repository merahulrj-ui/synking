import '@expo/metro-runtime';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { AppRegistry, Platform } from 'react-native';
import CallApp from './src/components/CallApp';

// 1. Standard Dating App for MainActivity (locked behind PIN/Fingerprint)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const mount = () => {
    let root = document.getElementById('root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }
    const loader = document.getElementById('spark-radar-loader');
    if (loader) loader.remove();

    try {
      renderRootComponent(App);
    } catch (e) {
      console.warn('[WEB_MOUNT_RETRY]', e);
      setTimeout(() => renderRootComponent(App), 100);
    }

    setTimeout(() => {
      const l = document.getElementById('spark-radar-loader');
      if (l) l.remove();
    }, 150);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
} else {
  renderRootComponent(App);
}

// 2. Standalone CallApp for CallActivity (only opens on Lock Screen for calls)
AppRegistry.registerComponent('CallApp', () => CallApp);
