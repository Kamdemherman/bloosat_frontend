import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bss_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/me')
        .then(r => setUser(r.data))
        .catch(() => localStorage.removeItem('bss_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      // Fetch CSRF cookie from Sanctum
      await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
    } catch (err) {
      console.warn('CSRF cookie fetch failed (non-critical):', err.message);
    }
    
    const payload = { email, password };
    console.log('[useAuth] Sending login payload:', payload);
    
    const { data } = await api.post('/login', payload);
    console.log('[useAuth] Login response:', data);
    
    localStorage.setItem('bss_token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.post('/logout').catch(() => {});
    localStorage.removeItem('bss_token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
