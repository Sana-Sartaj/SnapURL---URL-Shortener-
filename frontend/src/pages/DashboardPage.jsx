import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2, TrendingUp, Clock, ExternalLink, Trash2,
  Copy, Check, RefreshCw, Link2, Search, Filter,
  ChevronUp, ChevronDown, Activity, Database, Zap, Shield
} from 'lucide-react';
import { urlApi } from '../utils/api.js';

// ── Metric Card ────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon, color, glow }) {
  return (
    <div className="card" style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative', overflow: 'hidden',
      boxShadow: glow ? `0 0 32px ${color}30` : 'none',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {React.cloneElement(icon, { size: 16, color })}
        </div>
      </div>
      <div>
        <div style={{
          fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)',
          color, letterSpacing: '-0.04em',
        }}>
          {value ?? <span className="skeleton" style={{ display: 'inline-block', width: 80, height: 32 }} />}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
        )}
      </div>
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────
function StatusBadge({ isActive, expiresAt }) {
  if (!isActive) return <span className="badge badge-red">Inactive</span>;
  if (expiresAt && new Date(expiresAt) < new Date())
    return <span className="badge badge-amber">Expired</span>;
  return <span className="badge badge-green">Active</span>;
}

// ── Copy Cell ──────────────────────────────────────────────────────
function CopyCell({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handle} className="btn btn-ghost btn-sm" style={{ gap: 4 }}>
      {copied ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
    </button>
  );
}

// ── URL Table Row ──────────────────────────────────────────────────
function UrlRow({ url, onDelete }) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const shortUrl = `${API_BASE}/${url.shortCode}`;
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Deactivate /${url.shortCode}?`)) return;
    setDeleting(true);
    try {
      await urlApi.delete(url.shortCode);
      onDelete(url.shortCode);
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Link2 size={12} color="var(--accent-light)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <a
                href={shortUrl}
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
              <CopyCell text={shortUrl} />
            </div>
            {url.title && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{url.title}</div>
            )}
          </div>
        </div>
      </td>
      <td style={{ padding: '12px 16px', maxWidth: 260 }}>
        <div style={{
          fontSize: 12, color: 'var(--text-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }} title={url.originalUrl}>
          {url.originalUrl}
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13, fontWeight: 600,
          color: url.clickCount > 0 ? 'var(--green)' : 'var(--text-muted)',
        }}>
          {url.clickCount?.toLocaleString()}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <StatusBadge isActive={url.isActive} expiresAt={url.expiresAt} />
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {url.createdAt ? new Date(url.createdAt).toLocaleDateString() : '—'}
        </span>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <Link
            to={`/analytics/${url.shortCode}`}
            className="btn btn-ghost btn-sm"
            data-tooltip="Analytics"
          >
            <BarChart2 size={13} />
          </Link>
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            data-tooltip="Open"
          >
            <ExternalLink size={13} />
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting || !url.isActive}
            className="btn btn-ghost btn-sm"
            data-tooltip="Deactivate"
            style={{ color: 'var(--red)' }}
          >
            {deleting
              ? <div className="animate-spin" style={{ width: 13, height: 13, border: '2px solid var(--border)', borderTopColor: 'var(--red)', borderRadius: '50%' }} />
              : <Trash2 size={13} />
            }
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── System Info Panel ──────────────────────────────────────────────
function SystemPanel({ stats }) {
  const items = [
    {
      label: 'Snowflake Machine ID',
      value: stats?.snowflakeMachineId ?? '—',
      icon: <Zap size={14} color="var(--accent-light)" />,
    },
    {
      label: 'Redis Cache Hit Rate',
      value: stats ? `${Number(stats.cacheHitRate).toFixed(1)}%` : '—',
      icon: <Database size={14} color="var(--green)" />,
    },
    {
      label: 'Avg Redirect Latency',
      value: stats?.avgRedirectLatencyMs ?? '—',
      icon: <Activity size={14} color="var(--amber)" />,
    },
    {
      label: 'Rate Limit (creates/min)',
      value: '10 / IP',
      icon: <Shield size={14} color="#f472b6" />,
    },
  ];

  return (
    <div className="card" style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
        System Status
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {items.map(({ label, value, icon }) => (
          <div key={label} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {icon}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
              <div style={{
                fontSize: 14, fontWeight: 600,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-primary)',
              }}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sort Header ────────────────────────────────────────────────────
function SortHeader({ label, field, sortField, sortDir, onSort }) {
  const active = sortField === field;
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        padding: '10px 16px',
        textAlign: 'left',
        fontSize: 12,
        fontWeight: 600,
        color: active ? 'var(--accent-light)' : 'var(--text-muted)',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active
          ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
          : <ChevronDown size={12} style={{ opacity: 0.3 }} />
        }
      </span>
    </th>
  );
}

// ── Main Dashboard Page ────────────────────────────────────────────
export default function DashboardPage() {
  const [urls, setUrls]         = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all'); // all | active | inactive
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir]   = useState('desc');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [urlData, statsData] = await Promise.all([
        urlApi.getRecent(),
        urlApi.getStats(),
      ]);
      setUrls(urlData);
      setStats(statsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh stats every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      urlApi.getStats().then(setStats).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (shortCode) => {
    setUrls(prev => prev.map(u =>
      u.shortCode === shortCode ? { ...u, isActive: false } : u
    ));
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  // Filter + search + sort
  const displayed = urls
    .filter(u => {
      if (filter === 'active' && !u.isActive) return false;
      if (filter === 'inactive' && u.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          u.shortCode.toLowerCase().includes(q) ||
          u.originalUrl.toLowerCase().includes(q) ||
          (u.title || '').toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === 'createdAt') {
        av = new Date(av || 0); bv = new Date(bv || 0);
      } else if (sortField === 'clickCount') {
        av = Number(av || 0); bv = Number(bv || 0);
      } else {
        av = String(av || ''); bv = String(bv || '');
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div style={{ padding: '48px 0' }}>
      <div className="container">

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16,
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Dashboard</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Manage your URLs · Real-time metrics · System health
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => load(true)}
              className="btn btn-secondary btn-sm"
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <Link to="/" className="btn btn-primary btn-sm">
              <Zap size={14} />
              New URL
            </Link>
          </div>
        </div>

        {/* Metrics grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16, marginBottom: 32,
        }}>
          <MetricCard
            label="Active URLs"
            value={stats?.totalUrls?.toLocaleString()}
            icon={<Link2 />}
            color="var(--accent-light)"
            glow
          />
          <MetricCard
            label="Total Redirects"
            value={stats?.totalRedirects?.toLocaleString()}
            sub="All time"
            icon={<Activity />}
            color="var(--green)"
          />
          <MetricCard
            label="Last 24 Hours"
            value={stats?.clicksLast24h?.toLocaleString()}
            sub="Redirects"
            icon={<Clock />}
            color="var(--amber)"
          />
          <MetricCard
            label="Last Hour"
            value={stats?.clicksLastHour?.toLocaleString()}
            sub="Redirects"
            icon={<TrendingUp />}
            color="#f472b6"
          />
        </div>

        {/* System panel */}
        <SystemPanel stats={stats} />

        {/* URL Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

          {/* Table toolbar */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={14} style={{
                position: 'absolute', left: 10, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Search URLs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input"
                style={{ paddingLeft: 32, fontSize: 13, height: 36 }}
              />
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilter(val)}
                  className="btn btn-sm"
                  style={{
                    background: filter === val ? 'var(--accent-dim)' : 'transparent',
                    border: `1px solid ${filter === val ? 'var(--accent)' : 'var(--border)'}`,
                    color: filter === val ? 'var(--accent-light)' : 'var(--text-muted)',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {displayed.length} URL{displayed.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <SortHeader label="Short Code"   field="shortCode"  {...{sortField, sortDir, onSort: handleSort}} />
                  <SortHeader label="Destination"  field="originalUrl"{...{sortField, sortDir, onSort: handleSort}} />
                  <SortHeader label="Clicks"       field="clickCount" {...{sortField, sortDir, onSort: handleSort}} />
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    Status
                  </th>
                  <SortHeader label="Created"      field="createdAt"  {...{sortField, sortDir, onSort: handleSort}} />
                  <th style={{ padding: '10px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }} />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} style={{ padding: '14px 16px' }}>
                          <div className="skeleton" style={{ height: 16, width: j === 0 ? 80 : j === 1 ? 200 : 60, borderRadius: 4 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : displayed.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{
                      padding: '48px 16px', textAlign: 'center',
                      color: 'var(--text-muted)', fontSize: 14,
                    }}>
                      {search ? 'No URLs match your search.' : 'No URLs yet. '}
                      {!search && <Link to="/" style={{ color: 'var(--accent-light)' }}>Create your first one →</Link>}
                    </td>
                  </tr>
                ) : (
                  displayed.map(url => (
                    <UrlRow key={url.shortCode} url={url} onDelete={handleDelete} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Architecture note */}
        <div style={{
          marginTop: 32, padding: '20px 24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.8,
        }}>
          <span style={{ color: 'var(--accent-light)', marginRight: 8 }}>▶</span>
          <strong style={{ color: 'var(--text-secondary)' }}>Hot path:</strong>{' '}
          Client → Nginx → Spring Boot → Redis (3ms HIT) → 302 Redirect
          <span style={{ margin: '0 12px', opacity: 0.4 }}>|</span>
          <strong style={{ color: 'var(--text-secondary)' }}>Cold path:</strong>{' '}
          Cache MISS → PostgreSQL (80ms) → Cache WARM → 302 Redirect
          <span style={{ margin: '0 12px', opacity: 0.4 }}>|</span>
          <strong style={{ color: 'var(--text-secondary)' }}>Analytics:</strong>{' '}
          Async thread pool (never blocks redirect)
        </div>
      </div>
    </div>
  );
}
