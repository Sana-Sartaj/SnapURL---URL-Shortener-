import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  ArrowLeft, BarChart2, Link2, ExternalLink, Copy, Check,
  Clock, TrendingUp, Monitor, Smartphone, Tablet, Bot, Zap
} from 'lucide-react';
import { urlApi } from '../utils/api.js';

const DEVICE_COLORS = {
  DESKTOP: 'var(--accent-light)',
  MOBILE:  'var(--green)',
  TABLET:  'var(--amber)',
  BOT:     'var(--text-muted)',
  UNKNOWN: '#555577',
};

const DEVICE_ICONS = {
  DESKTOP: <Monitor size={14} />,
  MOBILE:  <Smartphone size={14} />,
  TABLET:  <Tablet size={14} />,
  BOT:     <Bot size={14} />,
};

// ── Custom Tooltip for Charts ──────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-hover)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 14px',
      fontSize: 13,
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{
          color: p.color || 'var(--text-primary)',
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
        }}>
          {Number(p.value).toLocaleString()} clicks
        </div>
      ))}
    </div>
  );
}

// ── Stat Box ───────────────────────────────────────────────────────
function StatBox({ label, value, icon, color = 'var(--accent-light)' }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: `${color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {React.cloneElement(icon, { size: 16, color })}
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
        <div style={{
          fontSize: 20, fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color, letterSpacing: '-0.03em',
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// ── Device Pie ─────────────────────────────────────────────────────
function DevicePie({ data }) {
  const chartData = Object.entries(data || {}).map(([name, value]) => ({
    name, value: Number(value),
  }));

  if (!chartData.length) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
      No device data yet
    </div>
  );

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%" cy="50%"
            innerRadius={50} outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={DEVICE_COLORS[entry.name] || '#555577'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-light)',
              borderRadius: 8, fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {chartData.map(({ name, value }) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 2,
              background: DEVICE_COLORS[name] || '#555577',
              flexShrink: 0,
            }} />
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {DEVICE_ICONS[name]}
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{name}</span>
            </span>
            <span style={{
              fontSize: 13, fontFamily: 'var(--font-mono)',
              color: 'var(--text-primary)', fontWeight: 600,
            }}>
              {value.toLocaleString()}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              ({total ? ((value / total) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Analytics Page ────────────────────────────────────────────
export default function AnalyticsPage() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [copied, setCopied] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await urlApi.getAnalytics(shortCode);
        setData(result);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shortCode]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${API_BASE}/${shortCode}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ padding: '80px 0', textAlign: 'center' }}>
      <div className="animate-spin" style={{
        width: 32, height: 32, margin: '0 auto',
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
      }} />
      <div style={{ color: 'var(--text-muted)', marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        Loading analytics...
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: '80px 0', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
      <div style={{ color: 'var(--red)', marginBottom: 8 }}>{error}</div>
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginTop: 16 }}>
        <ArrowLeft size={14} /> Go back
      </button>
    </div>
  );

  // Fill missing days with zeros for the chart
  const clicksByDay = (data?.clicksByDay || []).map(d => ({
    date: d.date,
    clicks: Number(d.count),
  }));

  const totalThisWeek = clicksByDay
    .slice(-7)
    .reduce((s, d) => s + d.clicks, 0);

  const peakDay = clicksByDay.reduce((max, d) =>
    d.clicks > (max?.clicks ?? 0) ? d : max, null
  );

  return (
    <div style={{ padding: '48px 0' }}>
      <div className="container">

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          <span style={{ color: 'var(--border-light)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>
            {shortCode}
          </span>
        </div>

        {/* URL header card */}
        <div className="card" style={{
          marginBottom: 32,
          background: 'linear-gradient(135deg, var(--bg-card), rgba(124,58,237,0.07))',
          border: '1px solid var(--border-light)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: 'var(--accent-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BarChart2 size={18} color="var(--accent-light)" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h1 style={{
                      fontSize: 22, fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--accent-light)',
                    }}>
                      /{shortCode}
                    </h1>
                    <button onClick={handleCopy} className="btn btn-ghost btn-sm">
                      {copied ? <Check size={13} color="var(--green)" /> : <Copy size={13} />}
                    </button>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Created {data?.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    }) : '—'}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                maxWidth: 520,
              }}>
                <Link2 size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <span style={{
                  fontSize: 12, color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {data?.originalUrl}
                </span>
                <a
                  href={data?.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flexShrink: 0, color: 'var(--text-muted)' }}
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div style={{
              textAlign: 'right',
              padding: '8px 20px',
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-lg)',
            }}>
              <div style={{
                fontSize: 40, fontWeight: 800,
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-light)',
                letterSpacing: '-0.04em',
              }}>
                {(data?.totalClicks ?? 0).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>total clicks</div>
            </div>
          </div>
        </div>

        {/* Stat boxes row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12, marginBottom: 32,
        }}>
          <StatBox
            label="This Week"
            value={totalThisWeek.toLocaleString()}
            icon={<TrendingUp />}
            color="var(--green)"
          />
          <StatBox
            label="Peak Day Clicks"
            value={peakDay ? peakDay.clicks.toLocaleString() : '0'}
            icon={<Zap />}
            color="var(--amber)"
          />
          <StatBox
            label="Avg / Day"
            value={clicksByDay.length
              ? Math.round(
                  clicksByDay.reduce((s, d) => s + d.clicks, 0) / clicksByDay.length
                ).toLocaleString()
              : '0'}
            icon={<BarChart2 />}
            color="var(--accent-light)"
          />
          <StatBox
            label="Days Tracked"
            value={clicksByDay.length.toString()}
            icon={<Clock />}
            color="#f472b6"
          />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>

          {/* Area chart */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
              Clicks Over Time
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                (last 30 days)
              </span>
            </h3>
            {clicksByDay.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48, fontSize: 13 }}>
                No click data yet. Share your link to start tracking.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={clicksByDay} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <defs>
                    <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={d => {
                      const date = new Date(d);
                      return `${date.getMonth()+1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="var(--accent-light)"
                    strokeWidth={2}
                    fill="url(#clickGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: 'var(--accent-light)', stroke: 'var(--bg-card)', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Device breakdown */}
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
              Device Breakdown
            </h3>
            <DevicePie data={data?.deviceBreakdown} />
          </div>
        </div>

        {/* Bar chart for last 14 days */}
        {clicksByDay.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>
              Daily Clicks — Bar View
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                (last {Math.min(clicksByDay.length, 14)} days)
              </span>
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={clicksByDay.slice(-14)}
                margin={{ top: 4, right: 4, bottom: 4, left: -20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={d => {
                    const date = new Date(d);
                    return `${date.getMonth()+1}/${date.getDate()}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="clicks"
                  fill="var(--accent)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* System note */}
        <div style={{
          marginTop: 24,
          padding: '14px 18px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Zap size={14} color="var(--accent-light)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Analytics written asynchronously via dedicated thread pool — zero impact on redirect latency.
            Device detection via User-Agent parsing. IPs anonymized (last octet zeroed) for GDPR compliance.
          </span>
        </div>

      </div>
    </div>
  );
}
