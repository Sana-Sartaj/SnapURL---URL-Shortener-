import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Zap, LayoutDashboard, Home, Activity, Github } from 'lucide-react';

export default function Layout() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
        background: scrolled ? 'rgba(10, 10, 15, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'all 200ms',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {/* Logo */}
          <NavLink to="/" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            textDecoration: 'none', color: 'var(--text-primary)'
          }}>
            <div style={{
              width: 36, height: 36,
              background: 'var(--accent)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}>
              <Zap size={20} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.03em' }}>
              Snap<span style={{ color: 'var(--accent-light)' }}>URL</span>
            </span>
          </NavLink>

          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NavItem to="/" icon={<Home size={16} />} label="Shorten" end />
            <NavItem to="/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" />
            <div style={{
              width: 1, height: 24,
              background: 'var(--border)',
              margin: '0 8px'
            }} />
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
              style={{ gap: 6 }}
            >
              <Github size={16} />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Source</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 0',
        marginTop: 64,
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="var(--accent)" />
            <span style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
              SnapURL · Spring Boot + Redis + PostgreSQL
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[
              { label: 'Snowflake IDs', color: 'var(--accent-light)' },
              { label: 'Redis Cache', color: 'var(--green)' },
              { label: '10k req/s', color: 'var(--amber)' },
            ].map(({ label, color }) => (
              <span key={label} style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color,
                background: 'rgba(255,255,255,0.04)',
                padding: '2px 8px',
                borderRadius: 4,
                border: `1px solid ${color}33`,
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 'var(--radius-md)',
        fontSize: 14,
        fontWeight: 500,
        textDecoration: 'none',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: isActive ? 'var(--bg-hover)' : 'transparent',
        border: isActive ? '1px solid var(--border-light)' : '1px solid transparent',
        transition: 'all 200ms',
      })}
    >
      {icon}
      {label}
    </NavLink>
  );
}
