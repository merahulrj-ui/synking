import { Platform, NativeModules } from 'react-native';

class ActiveChatTracker {
  private activeId: string | null = null;
  private listeners: Set<(id: string | null) => void> = new Set();

  public setActiveChat(id: string | null) {
    this.activeId = id || null;
    this.notifyListeners(this.activeId);

    if (Platform.OS === 'android' && NativeModules.TelecomModule?.setActiveChatUserId) {
      NativeModules.TelecomModule.setActiveChatUserId(id || '').catch(() => {});
    }
  }

  public getActiveChat(): string | null {
    return this.activeId;
  }

  public isChatActive(targetId?: string | null): boolean {
    if (!targetId || !this.activeId) return false;
    const cleanActive = String(this.activeId).trim();
    const cleanTarget = String(targetId).trim();

    if (cleanActive === cleanTarget) return true;
    if (cleanActive.toLowerCase() === cleanTarget.toLowerCase()) return true;

    const digitsActive = cleanActive.replace(/\D/g, '').slice(-10);
    const digitsTarget = cleanTarget.replace(/\D/g, '').slice(-10);
    if (digitsActive && digitsTarget && digitsActive.length >= 7 && digitsActive === digitsTarget) {
      return true;
    }

    return false;
  }

  public subscribe(listener: (id: string | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(id: string | null) {
    this.listeners.forEach((cb) => {
      try {
        cb(id);
      } catch (e) {}
    });
  }
}

export const activeChatTracker = new ActiveChatTracker();
