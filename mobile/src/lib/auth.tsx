import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as api from "./api";
import { forgetLab, restoreLabCache } from "./lab";
import { clearOutbox } from "./outbox";

type Status = "loading" | "signedOut" | "signedIn";
type Auth = {
  status: Status;
  /** Why the user is back on the login screen (expired session…). */
  notice: string;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const OWNER = "matchlab.owner";
const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    api.setSessionLostHandler(() => {
      setNotice("Votre session MatchLab a expiré. Reconnectez-vous.");
      setStatus("signedOut");
    });
    (async () => {
      const tokens = await api.currentTokens();
      if (tokens) await restoreLabCache();
      setStatus(tokens ? "signedIn" : "signedOut");
    })();
    return () => api.setSessionLostHandler(null);
  }, []);

  const value: Auth = {
    status,
    notice,
    async signIn(email, password) {
      await api.signIn(email, password);
      // Saves waiting from an expired session are kept for the same account only.
      const owner = email.trim().toLowerCase();
      const previous = await AsyncStorage.getItem(OWNER).catch(() => null);
      if (previous !== owner) await Promise.all([forgetLab(), clearOutbox()]);
      await AsyncStorage.setItem(OWNER, owner).catch(() => undefined);
      setNotice("");
      setStatus("signedIn");
    },
    async signOut() {
      await api.signOut();
      // No club data, photo or waiting save stays on the phone after signing out.
      await Promise.all([forgetLab(), clearOutbox(), AsyncStorage.removeItem(OWNER)]);
      setStatus("signedOut");
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth outside AuthProvider");
  return auth;
}
