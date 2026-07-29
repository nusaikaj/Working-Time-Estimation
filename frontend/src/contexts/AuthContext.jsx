import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'wte_token';
const USER_KEY = 'wte_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // On first load, if a token exists, re-validate it against the server so
  // a stale/expired token in localStorage never silently grants access.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsBootstrapping(false);
      return;
    }
    authService
      .me()
      .then((res) => {
        setUser(res.data);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setUser(null);
      })
      .finally(() => setIsBootstrapping(false));
  }, []);

  const persistSession = useCallback(({ user: nextUser, token }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (credentials) => {
      const res = await authService.login(credentials);
      persistSession(res.data);
      return res.data.user;
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      const res = await authService.register(payload);
      persistSession(res.data);
      return res.data.user;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // Reflects a profile edit (name/avatar) immediately in the navbar etc.
  // without forcing a re-login — the server response is already the source
  // of truth, this just mirrors it into local state + storage.
  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      isPM: user?.role === 'PM',
      isEngineer: user?.role === 'ENGINEER',
      login,
      register,
      logout,
      updateUser,
    }),
    [user, isBootstrapping, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
