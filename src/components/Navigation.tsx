'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Shield, LayoutDashboard, User } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isLoginPage) {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(data => {
          if (data.authenticated) {
            setUser(data.user);
          }
        })
        .catch(() => {});
    }
  }, [isLoginPage]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  if (isLoginPage) return null;

  return (
    <header className={`sticky-nav ${scrolled ? 'scrolled' : ''}`}>
      <nav className="nav-container">
        <div className="nav-logo">
          <h1 className="text-gradient">Registrador <span style={{ color: 'var(--text-primary)' }}>Web</span></h1>
        </div>

        <div className="nav-links">
          <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          
          {user?.role === 'ADMIN' && (
            <Link href="/admin" className={`nav-item ${pathname === '/admin' ? 'active-admin' : ''}`}>
              <Shield size={18} />
              <span>Administración</span>
            </Link>
          )}
        </div>

        <div className="nav-user">
          {user && (
            <div className="user-profile">
              <div className="user-info">
                <span className="user-label">Sesión de</span>
                <span className="user-name">{user.username}</span>
              </div>
              <button onClick={handleLogout} className="logout-btn" title="Cerrar Sesión">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </nav>

      <style jsx>{`
        .sticky-nav {
          position: sticky;
          top: 0;
          z-index: 1000;
          padding: 1rem 0;
          transition: all 0.4s ease;
          margin-bottom: 2rem;
        }
        .sticky-nav.scrolled {
          background: rgba(6, 9, 18, 0.8);
          backdrop-filter: blur(12px);
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--surface-border);
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .nav-container {
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nav-logo h1 {
          font-size: 1.4rem;
          font-weight: 800;
          margin: 0;
        }
        .nav-links {
          display: flex;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.4rem;
          border-radius: 12px;
          border: 1px solid var(--surface-border);
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          color: var(--text-secondary);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }
        .nav-item:hover {
          color: white;
          background: rgba(255, 255, 255, 0.05);
        }
        .nav-item.active {
          color: var(--neon-cyan);
          background: hsla(var(--cyan-primary), 0.1);
        }
        .nav-item.active-admin {
          color: var(--neon-pink);
          background: hsla(var(--pink-primary), 0.1);
        }
        .user-profile {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: var(--surface);
          padding: 0.4rem 0.4rem 0.4rem 1rem;
          border-radius: 10px;
          border: 1px solid var(--surface-border);
        }
        .user-info {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .user-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
        }
        .user-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--neon-cyan);
        }
        .logout-btn {
          background: rgba(255, 51, 102, 0.1);
          color: var(--neon-pink);
          border: none;
          padding: 0.6rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logout-btn:hover {
          background: var(--neon-pink);
          color: white;
          transform: scale(1.05);
        }
      `}</style>
    </header>
  );
}
