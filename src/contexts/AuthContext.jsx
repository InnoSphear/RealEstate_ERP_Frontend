import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      API.get('/auth/me')
        .then((res) => {
          const userData = {
            ...res.data,
            branch: res.data.branch_id || res.data.branch,
            tenant: res.data.tenant,
            role_slug: res.data.role_slug,
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          if (userData.tenant?._id) {
            localStorage.setItem('tenant', userData.tenant._id);
          }
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    const userData = {
      _id: data._id,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
      role_slug: data.role_slug,
      tenant: data.tenant,
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
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    setUser(null);
    window.location.href = '/login';
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role_slug);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
