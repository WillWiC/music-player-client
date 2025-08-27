import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth';

const Callback: React.FC = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    // For implicit flow the access token is in the hash, for auth-code flow the server may redirect with query params
    const hash = window.location.hash;
    const query = window.location.search;
    let params = new URLSearchParams();
    if (hash) params = new URLSearchParams(hash.replace('#', '?'));
    else if (query) params = new URLSearchParams(query);

    const token = params.get('access_token');
    const expires = params.get('expires_in');
    const refresh = params.get('refresh_token');
    if (token) {
      const expiresIn = expires ? parseInt(expires, 10) : undefined;
      (setToken as any)(token, expiresIn, refresh ?? null);
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  }, [navigate, setToken]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="card">Logging in...</div>
    </div>
  );
};

export default Callback;
