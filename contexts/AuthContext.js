import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import { setOnUnauthorized } from "../providers/api";
import { authService } from "../services/AuthService";
import {
  clearAuth,
  hydrateAuth,
  saveTokens,
  saveUserData,
} from "../utils/auth";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const session = await hydrateAuth();
        if (!active) return;
        if (session.accessToken && session.userData) {
          setUser(session.userData);
        } else if (session.accessToken && !session.userData) {
          await clearAuth();
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();
    return () => {
      active = false;
    };
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setUser(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      setUser(null);
      router.replace("/");
    });
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password);
    if (!result.success) {
      return { success: false, error: result.error || "Credenciais inválidas" };
    }

    const { accessToken, refreshToken, user: nextUser } = result.data || {};
    if (!accessToken || !refreshToken) {
      return { success: false, error: "Resposta de autenticação inválida" };
    }

    await saveTokens(accessToken, refreshToken);
    await saveUserData(nextUser ?? null);
    setUser(nextUser ?? null);
    return { success: true, user: nextUser };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
