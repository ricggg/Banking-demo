import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const statementTypes = [
  { value: 'monthly', label: 'Monthly Statement', icon: '📄', desc: 'Complete monthly transaction summary', color: '#2563eb', gradient: 'linear-gradient(135deg, #1e3c7d, #2563eb)' },
  { value: 'quarterly', label: 'Quarterly Statement', icon: '📊', desc: 'Quarterly financial overview', color: '#7c3aed', gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' },
  { value: 'annual', label: 'Annual Statement', icon: '📈', desc: 'Yearly financial summary', color: '#059669', gradient: 'linear-gradient(135deg, #059669, #10b981)' },
  { value: 'tax', label: 'Tax Statement', icon: '🧾', desc: 'Tax-related transaction summary', color: '#d97706', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)' },
];

const formatOptions = [
  { value: 'pdf', label: 'PDF', icon: '📄', desc: 'Portable Document', color: '#ef4444' },
  { value: 'csv', label: 'CSV', icon: '📋', desc: 'Spreadsheet Data', color: '#22c55e' },
  { value: 'excel', label: 'Excel', icon: '📊', desc: 'Excel Workbook', color: '#2563eb' },
];

const deliveryMethods = [
  { value: 'download', label: 'Download Now', icon: '⬇️', desc: 'Download to device', color: '#2563eb' },
  { value: 'email', label: 'Email', icon: '📧', desc: 'Send to email', color: '#7c3aed' },
  { value: 'both', label: 'Both', icon: '📤', desc: 'Download & Email', color: '#059669' },
];

const mockStatements = [
  { id: 1, type: 'Monthly Statement', period: '2024-12', date: '2025-01-01', size: '2.3 MB', status: 'Available', transactions: 45, icon: '📄' },
  { id: 2, type: 'Monthly Statement', period: '2024-11', date: '2024-12-01', size: '1.8 MB', status: 'Available', transactions: 38, icon: '📄' },
  { id: 3, type: 'Quarterly Statement', period: 'Q4 2024', date: '2025-01-01', size: '5.2 MB', status: 'Available', transactions: 128, icon: '📊' },
  { id: 4, type: 'Monthly Statement', period: '2024-10', date: '2024-11-01', size: '2.1 MB', status: 'Available', transactions: 42, icon: '📄' },
];

export default function EStatements({ user, account, isDarkMode }) {
  const [activeTab, setActiveTab] = useState('generate');
  const [form, setForm] = useState({
    statement_type: 'monthly', period: '', format: 'pdf',
    delivery_method: 'download', email: user?.email || '',
    include_images: false, password_protect: false, password: '',
  });
  const [statements, setStatements] = useState(mockStatements);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [animateIn, setAnimateIn] = useState(true);
  const [settings, setSettings] = useState({
    auto_generate: true, email_notifications: true,
    paperless: true, retention_period: '24',
  });

  const dark = isDarkMode;
  const c = {
    bg: dark ? '#0d0d0d' : '#f0f4f8',
    card: dark ? '#1a1a2e' : '#ffffff',
    cardBorder: dark ? '#2a2a4a' : '#e8ecf0',
    cardElevated: dark ? '#0f0f2a' : '#f8fafc',
    text: dark ? '#e8eaf6' : '#1a1a2a',
    textMuted: dark ? '#8892b0' : '#64748b',
    textLight: dark ? '#6b7280' : '#9ca3af',
    input: dark ? '#16213e' : '#ffffff',
    inputBorder: dark ? '#2a2a4a' : '#e2e8f0',
    sectionTitle: dark ? '#818cf8' : '#1e3c7d',
    accent: '#2563eb',
    success: '#22c55e',
    error: '#ef4444',
  };

  useEffect(() => {
    if (activeTab === 'history') fetchStatementHistory();
  }, [activeTab]);

  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, [activeTab]);

  const fetchStatementHistory = async () => {
    setLoadingHistory(true);
    setTimeout(() => { setStatements(mockStatements); setLoadingHistory(false); }, 1000);
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const getMaxPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const handleGenerate = async e => {
    e.preventDefault();
    setMessage(''); setMessageType(''); setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 3000));
      let msg = `✅ ${form.statement_type} statement generated successfully!`;
      if (form.delivery_method === 'email' || form.delivery_method === 'both')
        msg += ` A copy has been sent to ${form.email}.`;
      setMessage(msg); setMessageType('success');
      setStatements(prev => [{
        id: prev.length + 1,
        type: form.statement_type.charAt(0).toUpperCase() + form.statement_type.slice(1) + ' Statement',
        period: form.period, date: new Date().toISOString().split('T')[0],
        size: '2.1 MB', status: 'Available', transactions: Math.floor(Math.random() * 50) + 20, icon: '📄',
      }, ...prev]);
    } catch { setMessage('❌ Failed to generate statement.'); setMessageType('error'); }
    setLoading(false);
  };

  const handleDownload = async (st) => {
    setMessage('Preparing download...'); setMessageType('info');
    await new Promise(r => setTimeout(r, 1500));
    setMessage(`✅ Downloaded ${st.type} for ${st.period}`); setMessageType('success');
    setTimeout(() => { setMessage(''); setMessageType(''); }, 3000);
  };

  const handlePreview = async (st) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setPreviewData({
      ...st,
      summary: { opening_balance: 5420.50, closing_balance: 6180.25, total_deposits: 2840.00, total_withdrawals: 2080.25, total_fees: 15.00 },
      transactions: [
        { date: '2024-12-30', description: 'Salary Deposit', amount: 2500.00, type: 'credit' },
        { date: '2024-12-28', description: 'Online Purchase', amount: -89.99, type: 'debit' },
        { date: '2024-12-25', description: 'ATM Withdrawal', amount: -200.00, type: 'debit' },
      ],
    });
    setShowPreview(true); setLoading(false);
  };

  const handleEmailStatement = async (st) => {
    setMessage('Sending email...'); setMessageType('info');
    await new Promise(r => setTimeout(r, 2000));
    setMessage(`✅ ${st.type} emailed to ${user?.email || 'your email'}`); setMessageType('success');
    setTimeout(() => { setMessage(''); setMessageType(''); }, 3000);
  };

  const tabs = [
    { key: 'generate', label: 'Generate', icon: '📝' },
    { key: 'history', label: 'History', icon: '📚' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  const MsgBanner = ({ msg, type }) => {
    if (!msg) return null;
    const isOk = type === 'success';
    const isErr = type === 'error';
    return (
      <div style={{
        padding: '14px 18px', borderRadius: 12, fontWeight: 600, fontSize: 14,
        display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeSlideUp 0.3s ease',
        marginTop: 16,
        background: isErr ? 'rgba(239,68,68,0.12)' : isOk ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)',
        border: `1px solid ${isErr ? 'rgba(239,68,68,0.3)' : isOk ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
        color: isErr ? '#ef4444' : isOk ? '#22c55e' : '#60a5fa',
      }}>
        {isErr ? '⚠️' : isOk ? '✅' : 'ℹ️'} {msg}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: dark
        ? 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #0d0d0d 100%)'
        : 'linear-gradient(135deg, #1e3c7d 0%, #2563eb 50%, #1e3c7d 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '30px 20px 60px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.2)} }
        @keyframes cardPop { 0%{transform:scale(.95);opacity:0}70%{transform:scale(1.02)}100%{transform:scale(1);opacity:1} }
        @keyframes slideIn { from{width:0}to{width:80%} }
        @keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }
        .stmt-card:hover { transform: translateY(-3px); box-shadow: 0 12px 35px rgba(0,0,0,0.18) !important; }
        .type-card:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 25px rgba(0,0,0,0.12) !important; }
        .format-card:hover { transform: scale(1.03); }
        .tab-btn:hover { background: rgba(255,255,255,0.08) !important; }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.4) !important; }
        .modal-overlay { backdrop-filter: blur(8px); }
      `}</style>

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: 28, animation: 'fadeSlideUp 0.5s ease' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, margin: '0 auto 12px',
          border: '2px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>📄</div>
        <h1 style={{
          color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 6px',
          textShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}>e-Statements</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
          Generate, download & manage your account statements
        </p>
      </div>

      {/* ── Tab Navigation ── */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
        borderRadius: 16, padding: 4, marginBottom: 28,
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        animation: 'fadeSlideUp 0.5s ease 0.1s both',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className="tab-btn"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 24px', border: 'none', borderRadius: 12, cursor: 'pointer',
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #1e3c7d, #2563eb)'
                : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 700, fontSize: 14, transition: 'all 0.3s ease',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: activeTab === tab.key ? '0 4px 15px rgba(37,99,235,0.4)' : 'none',
            }}
          >
            <span style={{ fontSize: 15 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{
        maxWidth: 800, width: '100%',
        animation: animateIn ? 'fadeSlideUp 0.4s ease' : 'none',
      }}>

        {/* ═══════════════════════════════════
            TAB: GENERATE
            ═══════════════════════════════════ */}
        {activeTab === 'generate' && (
          <form onSubmit={handleGenerate}>

            {/* Statement Type */}
            <div style={{
              background: c.card, borderRadius: 20, padding: 28, marginBottom: 16,
              border: `1px solid ${c.cardBorder}`,
              boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 22, paddingBottom: 14,
                borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                }}>📋</div>
                <div>
                  <h3 style={{ margin: 0, color: c.sectionTitle, fontSize: 16, fontWeight: 700 }}>Statement Type</h3>
                  <p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Choose the statement you need</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                {statementTypes.map((type, i) => (
                  <label key={type.value} className="type-card" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: 20, borderRadius: 16, cursor: 'pointer',
                    background: form.statement_type === type.value
                      ? `${type.color}10` : c.cardElevated,
                    border: `2px solid ${form.statement_type === type.value ? type.color : c.cardBorder}`,
                    transition: 'all 0.3s ease', textAlign: 'center',
                    animation: `cardPop 0.4s ease ${i * 0.08}s both`,
                  }}>
                    <input type="radio" name="statement_type" value={type.value}
                      checked={form.statement_type === type.value} onChange={handleChange}
                      style={{ display: 'none' }} />
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, marginBottom: 10,
                      background: form.statement_type === type.value ? type.gradient : `${type.color}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      boxShadow: form.statement_type === type.value ? `0 6px 20px ${type.color}40` : 'none',
                      transition: 'all 0.3s',
                    }}>{type.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: c.text, marginBottom: 4 }}>{type.label}</div>
                    <div style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.4 }}>{type.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Period & Format */}
            <div style={{
              background: c.card, borderRadius: 20, padding: 28, marginBottom: 16,
              border: `1px solid ${c.cardBorder}`,
              boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 22, paddingBottom: 14,
                borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                }}>📅</div>
                <div>
                  <h3 style={{ margin: 0, color: dark ? '#a78bfa' : '#7c3aed', fontSize: 16, fontWeight: 700 }}>Period & Format</h3>
                  <p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Select time period and file format</p>
                </div>
              </div>

              {/* Period */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555' }}>
                  📅 Statement Period
                </label>
                <input type="month" name="period" value={form.period} onChange={handleChange}
                  required max={getMaxPeriod()}
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: 10,
                    border: `2px solid ${c.inputBorder}`, fontSize: 15, boxSizing: 'border-box',
                    background: c.input, color: c.text, outline: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                />
              </div>

              {/* Format */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555' }}>
                📁 File Format
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {formatOptions.map(f => (
                  <label key={f.value} className="format-card" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: 16, borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                    background: form.format === f.value ? `${f.color}10` : c.cardElevated,
                    border: `2px solid ${form.format === f.value ? f.color : c.cardBorder}`,
                    transition: 'all 0.2s ease',
                  }}>
                    <input type="radio" name="format" value={f.value}
                      checked={form.format === f.value} onChange={handleChange}
                      style={{ display: 'none' }} />
                    <span style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{f.label}</span>
                    <span style={{ fontSize: 11, color: c.textMuted }}>{f.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Delivery & Options */}
            <div style={{
              background: c.card, borderRadius: 20, padding: 28, marginBottom: 16,
              border: `1px solid ${c.cardBorder}`,
              boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 22, paddingBottom: 14,
                borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                }}>📤</div>
                <div>
                  <h3 style={{ margin: 0, color: dark ? '#34d399' : '#059669', fontSize: 16, fontWeight: 700 }}>Delivery & Options</h3>
                  <p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>How would you like to receive it?</p>
                </div>
              </div>

              {/* Delivery Method */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555' }}>
                🚀 Delivery Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                {deliveryMethods.map(m => (
                  <label key={m.value} className="format-card" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: 16, borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                    background: form.delivery_method === m.value ? `${m.color}10` : c.cardElevated,
                    border: `2px solid ${form.delivery_method === m.value ? m.color : c.cardBorder}`,
                    transition: 'all 0.2s ease',
                  }}>
                    <input type="radio" name="delivery_method" value={m.value}
                      checked={form.delivery_method === m.value} onChange={handleChange}
                      style={{ display: 'none' }} />
                    <span style={{ fontSize: 24, marginBottom: 6 }}>{m.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: c.text }}>{m.label}</span>
                    <span style={{ fontSize: 11, color: c.textMuted }}>{m.desc}</span>
                  </label>
                ))}
              </div>

              {/* Email */}
              {(form.delivery_method === 'email' || form.delivery_method === 'both') && (
                <div style={{ marginBottom: 20, animation: 'fadeSlideUp 0.3s ease' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555' }}>
                    📧 Email Address
                  </label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    required placeholder="your@email.com"
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 10,
                      border: `2px solid ${c.inputBorder}`, fontSize: 15, boxSizing: 'border-box',
                      background: c.input, color: c.text, outline: 'none',
                    }}
                  />
                </div>
              )}

              {/* Toggles */}
              {[
                { name: 'include_images', icon: '🖼️', label: 'Include check images', desc: 'Increases file size' },
                { name: 'password_protect', icon: '🔒', label: 'Password protect PDF', desc: 'Add encryption' },
              ].map(toggle => (
                <div key={toggle.name}
                  onClick={() => setForm({ ...form, [toggle.name]: !form[toggle.name] })}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', marginBottom: 10,
                    background: c.cardElevated, borderRadius: 14,
                    border: `1px solid ${form[toggle.name] ? '#2563eb' : c.cardBorder}`,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{toggle.icon}</span>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 14, color: c.text }}>{toggle.label}</span>
                      <p style={{ margin: 0, fontSize: 12, color: c.textMuted }}>{toggle.desc}</p>
                    </div>
                  </div>
                  <div style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: form[toggle.name] ? '#22c55e' : c.cardBorder,
                    position: 'relative', transition: 'all 0.3s',
                  }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 2,
                      left: form[toggle.name] ? 22 : 2,
                      transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </div>
              ))}

              {/* Password field */}
              {form.password_protect && (
                <div style={{ marginTop: 10, animation: 'fadeSlideUp 0.3s ease', paddingLeft: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555' }}>
                    🔑 PDF Password
                  </label>
                  <input type="password" name="password" value={form.password} onChange={handleChange}
                    required placeholder="Enter password for protection"
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 10,
                      border: `2px solid ${c.inputBorder}`, fontSize: 15, boxSizing: 'border-box',
                      background: c.input, color: c.text, outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button type="submit" className="action-btn" disabled={loading} style={{
              width: '100%', padding: 16,
              background: loading ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff', border: 'none', borderRadius: 14,
              fontWeight: 700, fontSize: 16,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,94,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s ease',
            }}>
              {loading ? (
                <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Generating Statement...</>
              ) : (<>📄 Generate Statement</>)}
            </button>

            <MsgBanner msg={message} type={messageType} />
          </form>
        )}

        {/* ═══════════════════════════════════
            TAB: HISTORY
            ═══════════════════════════════════ */}
        {activeTab === 'history' && (
          <div style={{
            background: c.card, borderRadius: 20, padding: 28,
            border: `1px solid ${c.cardBorder}`,
            boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 22, paddingBottom: 14,
              borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
              }}>📚</div>
              <div>
                <h3 style={{ margin: 0, color: dark ? '#fbbf24' : '#d97706', fontSize: 16, fontWeight: 700 }}>Statement History</h3>
                <p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>View and download past statements</p>
              </div>
            </div>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{
                  width: 48, height: 48, border: `4px solid ${c.cardBorder}`,
                  borderTop: '4px solid #2563eb', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
                }} />
                <p style={{ fontWeight: 600, color: c.textMuted }}>Loading statements...</p>
              </div>
            ) : statements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: c.cardElevated, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 36, animation: 'float 3s ease-in-out infinite',
                  border: `1px solid ${c.cardBorder}`,
                }}>📭</div>
                <h3 style={{ color: c.text, fontWeight: 700, margin: '0 0 8px' }}>No Statements Yet</h3>
                <p style={{ color: c.textMuted, fontSize: 14 }}>Generate your first statement using the Generate tab.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {statements.map((st, i) => (
                  <div key={st.id} className="stmt-card" style={{
                    background: c.cardElevated, borderRadius: 16, padding: 22,
                    border: `1px solid ${c.cardBorder}`,
                    transition: 'all 0.3s ease', cursor: 'default',
                    animation: `cardPop 0.4s ease ${i * 0.08}s both`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 42, height: 42, borderRadius: 12,
                          background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                          boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                        }}>{st.icon}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: c.text }}>{st.type}</div>
                          <div style={{ fontSize: 13, color: c.textMuted }}>Period: {st.period}</div>
                        </div>
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: 50, padding: '4px 12px',
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
                        <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 11 }}>{st.status}</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                      {[
                        { label: 'Generated', value: st.date, icon: '📅' },
                        { label: 'File Size', value: st.size, icon: '💾' },
                        { label: 'Transactions', value: st.transactions, icon: '🔢' },
                      ].map((info, j) => (
                        <div key={j} style={{
                          background: dark ? '#16213e' : '#f0f4f8', borderRadius: 10, padding: '10px 12px',
                          border: `1px solid ${c.cardBorder}`,
                        }}>
                          <div style={{ fontSize: 10, color: c.textMuted, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {info.icon} {info.label}
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{info.value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      {[
                        { label: '📥 Download', onClick: () => handleDownload(st), bg: 'linear-gradient(135deg, #1e3c7d, #2563eb)', shadow: 'rgba(37,99,235,0.25)' },
                        { label: '👁️ Preview', onClick: () => handlePreview(st), outline: true, color: '#2563eb' },
                        { label: '📧 Email', onClick: () => handleEmailStatement(st), bg: 'linear-gradient(135deg, #059669, #10b981)', shadow: 'rgba(16,185,129,0.25)' },
                      ].map((btn, k) => (
                        <button key={k} onClick={btn.onClick} style={{
                          flex: 1, padding: '10px 12px',
                          background: btn.outline ? 'transparent' : btn.bg,
                          color: btn.outline ? btn.color : '#fff',
                          border: btn.outline ? `2px solid ${btn.color}` : 'none',
                          borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: btn.outline ? 'none' : `0 4px 12px ${btn.shadow}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}>{btn.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <MsgBanner msg={message} type={messageType} />
          </div>
        )}

        {/* ═══════════════════════════════════
            TAB: SETTINGS
            ═══════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div style={{
            background: c.card, borderRadius: 20, padding: 28,
            border: `1px solid ${c.cardBorder}`,
            boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 22, paddingBottom: 14,
              borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              }}>⚙️</div>
              <div>
                <h3 style={{ margin: 0, color: dark ? '#a5b4fc' : '#6366f1', fontSize: 16, fontWeight: 700 }}>Statement Preferences</h3>
                <p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Manage automatic generation & notifications</p>
              </div>
            </div>

            {[
              { key: 'auto_generate', icon: '🔄', label: 'Auto-generate monthly', desc: 'Create statements automatically each month' },
              { key: 'email_notifications', icon: '🔔', label: 'Email notifications', desc: 'Get notified when statements are ready' },
              { key: 'paperless', icon: '🌿', label: 'Go paperless', desc: 'Receive statements electronically only' },
            ].map((item, i) => (
              <div key={item.key}
                onClick={() => setSettings({ ...settings, [item.key]: !settings[item.key] })}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 18, marginBottom: 10, borderRadius: 14,
                  background: c.cardElevated, border: `1px solid ${c.cardBorder}`,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  animation: `fadeSlideUp 0.3s ease ${i * 0.05}s both`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: c.textMuted }}>{item.desc}</div>
                  </div>
                </div>
                <div style={{
                  width: 48, height: 26, borderRadius: 13,
                  background: settings[item.key] ? '#22c55e' : c.cardBorder,
                  position: 'relative', transition: 'all 0.3s',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: settings[item.key] ? 24 : 2,
                    transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
            ))}

            {/* Retention Period */}
            <div style={{ marginTop: 16, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555' }}>
                📦 Retention Period
              </label>
              <select value={settings.retention_period}
                onChange={e => setSettings({ ...settings, retention_period: e.target.value })}
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 10,
                  border: `2px solid ${c.inputBorder}`, fontSize: 15, boxSizing: 'border-box',
                  background: c.input, color: c.text, outline: 'none', cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center', paddingRight: 40,
                }}>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
                <option value="60">5 years</option>
                <option value="84">7 years</option>
              </select>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: c.textMuted }}>
                How long to keep statements available for download
              </p>
            </div>

            <button onClick={() => {
              setMessage('✅ Settings saved successfully!'); setMessageType('success');
              setTimeout(() => { setMessage(''); setMessageType(''); }, 3000);
            }} className="action-btn" style={{
              width: '100%', padding: 15,
              background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
              color: '#fff', border: 'none', borderRadius: 14,
              fontWeight: 700, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s ease',
            }}>💾 Save Settings</button>

            <MsgBanner msg={message} type={messageType} />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════
          PREVIEW MODAL
          ═══════════════════════════════════ */}
      {showPreview && previewData && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.6)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, animation: 'fadeSlideUp 0.2s ease',
        }}>
          <div style={{
            background: c.card, borderRadius: 24, padding: 36,
            maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'auto',
            position: 'relative', border: `1px solid ${c.cardBorder}`,
            boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
            animation: 'fadeSlideUp 0.3s ease',
          }}>
            {/* Close */}
            <button onClick={() => setShowPreview(false)} style={{
              position: 'absolute', top: 16, right: 16,
              background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${c.cardBorder}`, fontSize: 18, cursor: 'pointer',
              color: c.textMuted, width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}
            >✕</button>

            {/* Header */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `2px solid ${c.cardBorder}` }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: c.text }}>
                📄 Statement Preview
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: c.textMuted }}>Period: {previewData.period}</p>
            </div>

            {/* Summary Cards */}
            <h4 style={{ color: c.sectionTitle, fontSize: 14, fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              📊 Account Summary
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Opening Balance', value: `$${previewData.summary.opening_balance.toLocaleString()}`, color: c.text },
                { label: 'Closing Balance', value: `$${previewData.summary.closing_balance.toLocaleString()}`, color: c.text },
                { label: 'Total Deposits', value: `+$${previewData.summary.total_deposits.toLocaleString()}`, color: '#22c55e' },
                { label: 'Total Withdrawals', value: `-$${previewData.summary.total_withdrawals.toLocaleString()}`, color: '#ef4444' },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: 16, background: c.cardElevated, borderRadius: 14,
                  border: `1px solid ${c.cardBorder}`,
                  animation: `fadeSlideUp 0.3s ease ${i * 0.05}s both`,
                }}>
                  <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Transactions */}
            <h4 style={{ color: c.sectionTitle, fontSize: 14, fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              📋 Recent Transactions
            </h4>
            <div style={{
              background: c.cardElevated, borderRadius: 14, overflow: 'hidden',
              border: `1px solid ${c.cardBorder}`, marginBottom: 24,
            }}>
              {previewData.transactions.map((tx, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 18px',
                  borderBottom: i < previewData.transactions.length - 1 ? `1px solid ${c.cardBorder}` : 'none',
                  animation: `fadeSlideUp 0.3s ease ${i * 0.08}s both`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: tx.type === 'credit' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      border: `1px solid ${tx.type === 'credit' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                    }}>{tx.type === 'credit' ? '📈' : '📉'}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{tx.description}</div>
                      <div style={{ fontSize: 12, color: c.textMuted }}>{tx.date}</div>
                    </div>
                  </div>
                  <span style={{
                    fontWeight: 800, fontSize: 15,
                    color: tx.type === 'credit' ? '#22c55e' : '#ef4444',
                  }}>
                    {tx.type === 'credit' ? '+' : ''}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => handleDownload(previewData)} style={{
                flex: 2, padding: 14,
                background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontWeight: 700, fontSize: 15, cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>📥 Download Full Statement</button>
              <button onClick={() => setShowPreview(false)} style={{
                flex: 1, padding: 14,
                background: 'transparent', color: c.textMuted,
                border: `2px solid ${c.cardBorder}`, borderRadius: 12,
                fontWeight: 700, fontSize: 15, cursor: 'pointer',
              }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}