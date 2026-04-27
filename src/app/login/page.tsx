'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        const data = await res.json();
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Fallo en la conexión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="bg-blobs">
        <div className="blob"></div>
        <div className="blob"></div>
        <div className="blob"></div>
      </div>

      <div className="login-container fade-in">
        <div className="login-card glass-card">
          <div className="login-header">
            <div className="logo-box">
              <ShieldCheck size={40} />
            </div>
            <h1 className="text-gradient">Registrador Web</h1>
            <p>Acceso seguro al sistema de ventas</p>
          </div>

          {error && <div className="login-error-msg">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="label">Usuario del Sistema</label>
              <div className="input-icon-wrapper">
                <User size={18} className="icon" />
                <input
                  type="text"
                  className="input-field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, worker..."
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Clave de Seguridad</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="icon" />
                <input
                  type="password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
              {isLoading ? 'Verificando...' : 'Entrar al Dashboard'}
            </button>
          </form>

          <footer className="login-footer">
            <p>© 2024 Registrador Web Premium</p>
          </footer>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: #04060b;
          overflow: hidden;
        }
        .bg-blobs {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .blob {
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          animation: blobFloat 20s infinite alternate;
        }
        .blob:nth-child(1) { background: hsla(184, 100%, 50%, 0.15); top: -10%; left: -10%; }
        .blob:nth-child(2) { background: hsla(345, 100%, 60%, 0.1); bottom: -10%; right: -10%; animation-delay: -5s; }
        .blob:nth-child(3) { background: hsla(258, 90%, 66%, 0.1); top: 40%; left: 30%; animation-delay: -10s; }

        @keyframes blobFloat {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(50px, 50px) scale(1.1); }
        }

        .login-container {
          width: 100%;
          max-width: 440px;
          padding: 2rem;
          position: relative;
          z-index: 1;
        }
        .login-card {
          padding: 3rem 2.5rem;
          border-top: 3px solid var(--neon-cyan);
        }
        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        .logo-box {
          width: 70px; height: 70px;
          margin: 0 auto 1.5rem;
          background: hsla(184, 100%, 50%, 0.1);
          border: 1px solid hsla(184, 100%, 50%, 0.2);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--neon-cyan);
          box-shadow: 0 0 30px hsla(184, 100%, 50%, 0.15);
        }
        .login-header h1 { font-size: 1.8rem; margin: 0; }
        .login-header p { color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem; }

        .login-error-msg {
          background: hsla(345, 100%, 60%, 0.1);
          color: var(--neon-pink);
          padding: 0.75rem;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: 0.85rem;
          border: 1px solid hsla(345, 100%, 60%, 0.2);
        }

        .login-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .input-icon-wrapper { position: relative; display: flex; align-items: center; }
        .input-icon-wrapper .icon { position: absolute; left: 1.25rem; color: var(--text-muted); transition: color 0.3s; }
        .input-icon-wrapper input { padding-left: 3rem; }
        .input-icon-wrapper input:focus ~ .icon { color: var(--neon-cyan); }

        .login-btn {
          height: 3.5rem;
          font-size: 1rem;
          margin-top: 0.5rem;
          background: linear-gradient(135deg, var(--neon-cyan), #0ea5e9);
        }

        .login-footer {
          margin-top: 2.5rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
