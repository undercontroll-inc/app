import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  access: "authToken",
  refresh: "refreshToken",
  user: "userData",
};

let accessToken = null;
let refreshToken = null;
let userData = null;

export async function hydrateAuth() {
  const [token, refresh, storedUser] = await Promise.all([
    AsyncStorage.getItem(KEYS.access),
    AsyncStorage.getItem(KEYS.refresh),
    AsyncStorage.getItem(KEYS.user),
  ]);

  accessToken = token;
  refreshToken = refresh;

  try {
    userData = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    userData = null;
  }

  return { accessToken, refreshToken, userData };
}

export function getToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function getUserData() {
  return userData;
}

export function isLoggedIn() {
  return !!accessToken;
}

export async function saveTokens(nextAccessToken, nextRefreshToken) {
  accessToken = nextAccessToken;
  refreshToken = nextRefreshToken;
  await Promise.all([
    AsyncStorage.setItem(KEYS.access, nextAccessToken),
    AsyncStorage.setItem(KEYS.refresh, nextRefreshToken),
  ]);
}

export async function saveUserData(nextUser) {
  userData = nextUser;
  if (nextUser == null) {
    await AsyncStorage.removeItem(KEYS.user);
    return;
  }
  await AsyncStorage.setItem(KEYS.user, JSON.stringify(nextUser));
}

export async function clearAuth() {
  accessToken = null;
  refreshToken = null;
  userData = null;
  await AsyncStorage.multiRemove([KEYS.access, KEYS.refresh, KEYS.user]);
}
