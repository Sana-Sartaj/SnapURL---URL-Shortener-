import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Link2, Zap, Copy, Check, ExternalLink, Clock, Shield,
  ChevronDown, ChevronUp, BarChart2, Trash2, TrendingUp
} from 'lucide-react';
import { urlApi } from '../utils/api.js';

// ── Stat Pill ─────────────────────────────────────────────────────
function StatPill({ label, value, color = 'var(--accent-light)' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '16px 24px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      minWidth: 120,
    }}>
      <span style={{
        fontSize: 24, fontWeight: 700, color,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '-0.04em',
      }}>
        {value ?? '—'}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
        {label}
      </span>
    </div>
  );
}

// ── Copy Button ────────────────────────────────────────────────────
function CopyButton({ text, style = {} }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`btn btn-secondary btn-sm ${copied ? 'copy-success' : ''}`}
      style={style}
    >
      {copied ? <Check size={14} color="var(--green)" /> : <Copy size={14} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── Result Card ────────────────────────────────────────────────────
function ResultCard({ result, onClear }) {
  return (
    <div className="animate-fade-in" style={{
      background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(124, 58, 237, 0.08) 100%)',
      border: '1px solid var(--accent)',
      borderRadius: 'var(--radius-lg)',
      padding: 24,
      boxShadow: '0 0 40px var(--accent-glow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--green)',
          boxShadow: '0 0 8px var(--green)',
        }} />
        <span style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>
          URL shortened successfully
        </span>
      </div>

      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 16,
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Zap size={16} color="var(--accent-light)" style={{ flexShrink: 0 }} />
          <a
            href={result.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--accent-light)',
              letterSpacing: '0.02em',
            }}
          >
            {result.shortUrl}
          </a>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <CopyButton text={result.shortUrl} />
          <a
            href={result.shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Redirects to:</span>
          <span style={{
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}>
            {result.originalUrl}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Short code:</span>
          <code style={{
            background: 'var(--accent-dim)',
            color: 'var(--accent-light)',
            padding: '1px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
          }}>
            {result.shortCode}
          </code>
          <Link
            to={`/analytics/${result.shortCode}`}
            className="btn btn-ghost btn-sm"
            style={{ marginLeft: 'auto' }}
          >
            <BarChart2 size={14} />
            Analytics
          </Link>
          <button onClick={onClear} className="btn btn-ghost btn-sm">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Recent URL Row ─────────────────────────────────────────────────
function RecentUrlRow({ url }) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--accent-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Link2 size={14} color="var(--accent-light)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            href={`${API_BASE}/${url.shortCode}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--accent-light)',
            }}
          >
            /{url.shortCode}
          </a>
          {url.title && (
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              {url.title}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 12, color: 'var(--text-muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          display: 'block',
        }}>
          {url.originalUrl}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span style={{
          color: 'var(--text-secondary)',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
        }}>
          {url.clickCount.toLocaleString()} clicks
        </span>
        <Link to={`/analytics/${url.shortCode}`} className="btn btn-ghost btn-sm">
          <BarChart2 size={13} />
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function HomePage() {
  const [url, setUrl]               = useState('');
  const [customAlias, setAlias]     = useState('');
  const [title, setTitle]           = useState('');
  const [expiresAt, setExpiresAt]   = useState('');
  const [showAdvanced, setAdvanced] = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [stats, setStats]           = useState(null);
  const [recent, setRecent]         = useState([]);

  // Load stats and recent URLs
  useEffect(() => {
    const load = async () => {
      try {
        const [s, r] = await Promise.all([
          urlApi.getStats().catch(() => null),
          urlApi.getRecent().catch(() => []),
        ]);
        setStats(s);
        setRecent(r);
      } catch { /* silent fail */ }
    };
    load();
  }, [result]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await urlApi.create({
        originalUrl: url.trim(),
        title: title.trim() || undefined,
        customAlias: customAlias.trim() || undefined,
        expiresAt: expiresAt || undefined,
      });
      setResult(data);
      setUrl('');
      setAlias('');
      setTitle('');
      setExpiresAt('');
    } catch (err) {
      setError(err.message || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero section */}
      <section style={{ padding: '80px 0 64px' }}>
        <div className="container-sm">
          {/* Badge */}
          <div style={{
            display: 'flex', justifyContent: 'center', marginBottom: 32
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              borderRadius: 100,
              padding: '6px 16px',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--green)',
                animation: 'pulse-glow 2s ease-in-out infinite',
              }} />
              <span style={{
                fontSize: 12, fontFamily: 'var(--font-mono)',
                color: 'var(--accent-light)', fontWeight: 500,
              }}>
                10,000 redirects/sec · Redis P50 &lt; 3ms
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: 20,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
          }}>
            URLs at{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--accent-light), #c084fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              scale
            </span>
          </h1>

          <p style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 18,
            marginBottom: 48,
            maxWidth: 500,
            margin: '0 auto 48px',
          }}>
            Built with Snowflake IDs, Redis caching, and rate limiting.
            The real-world distributed system behind every short link.
          </p>

          {/* Stats row */}
          {stats && (
            <div style={{
              display: 'flex', gap: 16, justifyContent: 'center',
              flexWrap: 'wrap', marginBottom: 48,
            }}>
              <StatPill label="URLs Created" value={stats.totalUrls?.toLocaleString()} color="var(--accent-light)" />
              <StatPill label="Total Redirects" value={stats.totalRedirects?.toLocaleString()} color="var(--green)" />
              <StatPill label="Cache Hit Rate" value={`${stats.cacheHitRate?.toFixed(1)}%`} color="var(--amber)" />
              <StatPill label="Avg Latency" value={stats.avgRedirectLatencyMs} color="var(--text-primary)" />
            </div>
          )}

          {/* Main form */}
          <div className="card" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
          }}>
            <form onSubmit={handleSubmit}>
              {/* URL input */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: 14, top: '50%',
                    transform: 'translateY(-50%)', pointerEvents: 'none',
                  }}>
                    <Link2 size={18} color="var(--text-muted)" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={e => { setUrl(e.target.value); setError(''); }}
                    placeholder="https://your-very-long-url.com/path/to/something"
                    className={`input ${error ? 'input-error' : ''}`}
                    style={{ paddingLeft: 44, fontSize: 15 }}
                    required
                    autoFocus
                  />
                </div>
                {error && (
                  <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>
                    {error}
                  </p>
                )}
              </div>

              {/* Advanced options toggle */}
              <button
                type="button"
                onClick={() => setAdvanced(v => !v)}
                className="btn btn-ghost btn-sm"
                style={{ marginBottom: showAdvanced ? 16 : 0 }}
              >
                {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Advanced options
              </button>

              {/* Advanced options */}
              {showAdvanced && (
                <div className="animate-fade-in" style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: 12, marginBottom: 16,
                }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Custom alias (optional)
                    </label>
                    <input
                      type="text"
                      value={customAlias}
                      onChange={e => setAlias(e.target.value)}
                      placeholder="my-project"
                      className="input"
                      style={{ fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="My awesome link"
                      className="input"
                      style={{ fontSize: 14 }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      Expires at (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={e => setExpiresAt(e.target.value)}
                      className="input"
                      style={{ fontSize: 14, colorScheme: 'dark' }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: showAdvanced ? 0 : 16 }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin" style={{
                      width: 16, height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                    }} />
                    Shortening...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Shorten URL
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result */}
          {result && (
            <div style={{ marginTop: 16 }}>
              <ResultCard result={result} onClear={() => setResult(null)} />
            </div>
          )}
        </div>
      </section>

      {/* Tech stack section */}
      <section style={{ padding: '48px 0', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <h2 style={{
            fontSize: 14, fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)', textAlign: 'center',
            marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            System Architecture
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {[
              {
                icon: '❄️', title: 'Snowflake IDs',
                desc: '41-bit timestamp + 10-bit machine ID + 12-bit sequence. Zero collisions across distributed nodes.',
                stat: '4,096 IDs/ms/node',
                color: 'var(--accent-light)',
              },
              {
                icon: '⚡', title: 'Redis Cache',
                desc: 'LRU cache with 24h TTL. Negative caching prevents DB hammering on 404s.',
                stat: '3ms P50 latency',
                color: 'var(--red)',
              },
              {
                icon: '🛡️', title: 'Rate Limiting',
                desc: 'Sliding window counter using Redis sorted sets. 10 creates/min, 200 redirects/min per IP.',
                stat: 'O(log N) overhead',
                color: 'var(--amber)',
              },
              {
                icon: '🗄️', title: 'PostgreSQL + HikariCP',
                desc: 'Connection pooling (20 max). Atomic click counter via UPDATE...SET count = count + 1.',
                stat: 'Flyway migrations',
                color: 'var(--green)',
              },
              {
                icon: '🔄', title: 'Async Analytics',
                desc: 'Clicks recorded in a dedicated thread pool (5-20 threads). Redirect latency unaffected.',
                stat: '1000-task queue',
                color: '#f472b6',
              },
              {
                icon: '☁️', title: 'AWS EC2 t3.micro',
                desc: 'Spring Boot JVM tuned for 2GB: -Xms256m -Xmx512m, G1GC. $0/month on free tier.',
                stat: '12 months free',
                color: '#fb923c',
              },
            ].map(({ icon, title, desc, stat, color }) => (
              <div key={title} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0,
                  height: 2, right: 0,
                  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                }} />
                <div style={{ fontSize: 24, marginBottom: 12 }}>{icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.6 }}>
                  {desc}
                </p>
                <code style={{
                  fontSize: 11, color, background: `${color}18`,
                  padding: '2px 8px', borderRadius: 4,
                  fontFamily: 'var(--font-mono)',
                }}>
                  {stat}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent URLs */}
      {recent.length > 0 && (
        <section style={{ padding: '48px 0', borderTop: '1px solid var(--border)' }}>
          <div className="container-sm">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Recent URLs</h2>
              <Link to="/dashboard" className="btn btn-ghost btn-sm">
                <TrendingUp size={14} />
                View all
              </Link>
            </div>
            <div className="card">
              {recent.map((url, i) => (
                <RecentUrlRow key={url.shortCode} url={url} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
