import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getRoleSlug = (data) => data.role?.slug || data.role_slug;

  const refreshUser = useCallback(async () => {
    try {
      const res = await API.get('/auth/me');
      const userData = {
        ...res.data,
        branch: res.data.branch_id || res.data.branch,
        tenant: res.data.tenant,
        role_slug: getRoleSlug(res.data),
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      if (userData.tenant?._id) {
        localStorage.setItem('tenant', userData.tenant._id);
      }
      return userData;
    } catch {
      const stored = localStorage.getItem('user');
      if (!stored) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenant');
        setUser(null);
        return null;
      }
      try {
        const parsed = JSON.parse(stored);
        const fixed = { ...parsed, role_slug: getRoleSlug(parsed) };
        setUser(fixed);
        return fixed;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tenant');
        setUser(null);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        const fixed = { ...parsed, role_slug: getRoleSlug(parsed) };
        setUser(fixed);
        refreshUser().finally(() => setLoading(false));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [refreshUser]);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    const roleSlug = getRoleSlug(data);
    const userData = {
      _id: data._id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      role_slug: roleSlug,
      tenant: data.tenant,
      profile_photo: data.profile_photo,
      branch: data.branch,
      token: data.token,
    };
    localStorage.setItem('token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    if (data.tenant?._id) {
      localStorage.setItem('tenant', data.tenant._id);
    }
    setUser(userData);
    return data;
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch { /* ignore logout errors */ }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    const slug = user.role_slug || user.role?.slug;
    return roles.includes(slug);
  };

  const hasPermission = (module, action = 'read') => {
    if (!user) return false;
    const slug = user.role_slug || user.role?.slug;
    if (slug === 'admin') return true;
    if (slug === 'manager') return true;
    const perms = user.role?.permissions;
    if (!perms || perms.length === 0) return false;
    if (typeof perms[0] === 'string') return false;
    return perms.some(p => p?.module === module && p?.action === action);
  };

  const hasAnyPermission = (module, actions = []) => {
    if (!user) return false;
    const slug = user.role_slug || user.role?.slug;
    if (slug === 'admin') return true;
    return actions.some(action => hasPermission(module, action));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole, hasPermission, hasAnyPermission, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
