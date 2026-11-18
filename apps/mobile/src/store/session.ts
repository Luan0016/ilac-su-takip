import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export type Session = { accessToken: string; refreshToken: string; user: { id: string; email: string } };

const KEY = 'session';

type State = {
  session: Session | null;
  setSession: (s: Session) => Promise<void>;
  clear: () => Promise<void>;
  hydrate: () => Promise<void>;
};

// Tokens live only in the OS keystore (expo-secure-store), never in SQLite or logs.
export const useSession = create<State>((set) => ({
  session: null,
  setSession: async (session) => {
    set({ session });
    await SecureStore.setItemAsync(KEY, JSON.stringify(session));
  },
  clear: async () => {
    set({ session: null });
    await SecureStore.deleteItemAsync(KEY);
  },
  hydrate: async () => {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return;
    try {
      set({ session: JSON.parse(raw) as Session });
    } catch {
      await SecureStore.deleteItemAsync(KEY);
    }
  },
}));
