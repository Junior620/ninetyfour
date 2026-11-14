import * as SecureStore from "expo-secure-store";

/**
 * Tokens of the MatchLab session, kept in the iOS Keychain / Android Keystore only.
 * Stored as separate items: some iOS releases refuse a single value above ~2 KB.
 */
export type Tokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number | null;
};
const KEYS = {
  access: "matchlab.access",
  refresh: "matchlab.refresh",
  expires: "matchlab.expires",
} as const;
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export async function readTokens(): Promise<Tokens | null> {
  const [access, refresh, expires] = await Promise.all([
    SecureStore.getItemAsync(KEYS.access, options),
    SecureStore.getItemAsync(KEYS.refresh, options),
    SecureStore.getItemAsync(KEYS.expires, options),
  ]);
  if (!access || !refresh) return null;
  return {
    access_token: access,
    refresh_token: refresh,
    expires_at: expires ? Number(expires) : null,
  };
}
export async function writeTokens(tokens: Tokens) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.access, tokens.access_token, options),
    SecureStore.setItemAsync(KEYS.refresh, tokens.refresh_token, options),
    SecureStore.setItemAsync(
      KEYS.expires,
      String(tokens.expires_at ?? ""),
      options,
    ),
  ]);
}
export async function clearTokens() {
  await Promise.all(
    Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k, options)),
  );
}
