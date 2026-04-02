import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const depositMethods = [
  { value: 'mobile', label: 'Mobile Deposit', icon: '📱', desc: 'Take photos of your cheque with your device', gradient: 'linear-gradient(135deg, #2563eb, #1e3c7d)' },
  { value: 'atm', label: 'ATM Deposit', icon: '🏧', desc: 'Deposit at any of our ATM locations', gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)' },
  { value: 'branch', label: 'Branch Deposit', icon: '🏦', desc: 'Visit a branch for assisted deposit', gradient: 'linear-gradient(135deg, #059669, #10b981)' },
];

const chequeTypes = [
  { value: 'personal', label: 'Personal Cheque', fee: 'Free', icon: '👤' },
  { value: 'business', label: 'Business Cheque', fee: 'Free', icon: '💼' },
  { value: 'government', label: 'Government Cheque', fee: 'Free', icon: '🏛️' },
  { value: 'certified', label: 'Certified Cheque', fee: 'Free', icon: '✅' },
  { value: 'money_order', label: 'Money Order', fee: 'Free', icon: '💵' },
  { value: 'foreign', label: 'Foreign Cheque', fee: '$15.00', icon: '🌐' },
];

const mockDeposits = [
  {
    id: 1,
    cheque_number: '001234',
    amount: 1250.00,
    bank: 'Chase Bank',
    date: '2025-01-05',
    status: 'Completed',
    method: 'Mobile Deposit',
    processing_time: '1 business day',
  },
  {
    id: 2,
    cheque_number: '005678',
    amount: 890.50,
    bank: 'Bank of America',
    date: '2025-01-03',
    status: 'Processing',
    method: 'Mobile Deposit',
    processing_time: '2-3 business days',
  },
  {
    id: 3,
    cheque_number: '009876',
    amount: 2100.00,
    bank: 'Wells Fargo',
    date: '2025-01-01',
    status: 'On Hold',
    method: 'ATM Deposit',
    processing_time: '5-7 business days',
  },
];

/* ───────── Animated Input (matches LocalTransfer) ───────── */
function AnimatedInput({ label, icon, error, hint, dark, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 4 }}>
      {label && (
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 8, fontSize: 13, fontWeight: 600,
          color: focused ? '#2563eb' : dark ? '#8892b0' : '#555',
          transition: 'color 0.2s ease',
        }}>
          {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          {...props}
          onFocus={e => { setFocused(true); props.onFocus && props.onFocus(e); }}
          onBlur={e => { setFocused(false); props.onBlur && props.onBlur(e); }}
          style={{
            width: '100%', padding: '13px 16px', borderRadius: 10,
            border: `2px solid ${error ? '#ef4444' : focused ? '#2563eb' : dark ? '#2a2a4a' : '#e5e7eb'}`,
            fontSize: 15, boxSizing: 'border-box', outline: 'none',
            transition: 'all 0.25s ease',
            background: props.readOnly ? (dark ? '#0f0f2a' : '#f8fafc') : (dark ? '#16213e' : '#fff'),
            color: dark ? '#e8eaf6' : '#1a1a1a',
            boxShadow: focused ? '0 0 0 4px rgba(37,99,235,0.08)' : '0 1px 3px rgba(0,0,0,0.06)',
            ...props.style,
          }}
        />
        {focused && (
          <div style={{
            position: 'absolute', bottom: -1, left: '10%', width: '80%', height: 2,
            background: 'linear-gradient(90deg, #2563eb, #1e3c7d)',
            borderRadius: 2, animation: 'slideIn 0.3s ease',
          }} />
        )}
      </div>
      {hint && !error && <p style={{ margin: '5px 0 0', fontSize: 12, color: dark ? '#6b7280' : '#9ca3af' }}>{hint}</p>}
      {error && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#ef4444' }}>⚠️ {error}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function ChequeDeposit({ user, account, onTransactionSuccess, isDarkMode }) {

  const getAccountNumber = () => {
    if (account && (account.account_number || account.accountNumber)) {
      return account.account_number || account.accountNumber;
    }
    try {
      const storedUser = JSON.parse(localStorage.getItem('bankingUser'));
      if (storedUser?.account_number) return storedUser.account_number;
      if (storedUser?.accountNumber) return storedUser.accountNumber;
    } catch (e) {}
    return '';
  };

  const [activeTab, setActiveTab] = useState('deposit');
  const [animateIn, setAnimateIn] = useState(true);
  const [form, setForm] = useState({
    to_account: getAccountNumber(),
    deposit_method: 'mobile',
    cheque_type: 'personal',
    cheque_number: '',
    bank_name: '',
    drawer_name: '',
    amount: '',
    date_on_cheque: '',
    description: '',
    front_image: null,
    back_image: null,
    endorse_required: true,
  });

  const [deposits, setDeposits] = useState(mockDeposits);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [depositDetails, setDepositDetails] = useState(null);
  const [dragActive, setDragActive] = useState({ front: false, back: false });
  const [imagePreview, setImagePreview] = useState({ front: null, back: null });

  useEffect(() => {
    setForm(f => ({ ...f, to_account: getAccountNumber() }));
    if (activeTab === 'history') fetchDepositHistory();
  }, [account, activeTab]);

  // Animate tab transitions
  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, [activeTab]);

  const fetchDepositHistory = async () => {
    try {
      setLoadingHistory(true);
      setTimeout(() => { setDeposits(mockDeposits); setLoadingHistory(false); }, 1000);
    } catch (error) {
      console.error('Error fetching deposit history:', error);
      setLoadingHistory(false);
    }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageUpload = (file, side) => {
    if (file && file.type.startsWith('image/')) {
      setForm({ ...form, [`${side}_image`]: file });
      const reader = new FileReader();
      reader.onload = e => setImagePreview(prev => ({ ...prev, [side]: e.target.result }));
      reader.readAsDataURL(file);
    } else {
      setMessage('Please upload a valid image file (JPG, PNG, etc.)');
      setMessageType('error');
    }
  };

  const handleDrag = (e, side) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(prev => ({ ...prev, [side]: true }));
    } else if (e.type === 'dragleave') {
      setDragActive(prev => ({ ...prev, [side]: false }));
    }
  };

  const handleDrop = (e, side) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(prev => ({ ...prev, [side]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0], side);
    }
  };

  const validateForm = () => {
    if (!form.cheque_number) { setMessage('Please enter the cheque number.'); setMessageType('error'); return false; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setMessage('Please enter a valid amount.'); setMessageType('error'); return false; }
    if (form.deposit_method === 'mobile' && (!form.front_image || !form.back_image)) {
      setMessage('Please upload both front and back images of the cheque.');
      setMessageType('error');
      return false;
    }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage(''); setMessageType('');
    if (!validateForm()) return;
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

      const newDeposit = {
        id: deposits.length + 1,
        cheque_number: form.cheque_number,
        amount: parseFloat(form.amount),
        bank: form.bank_name,
        date: new Date().toISOString().split('T')[0],
        status: 'Processing',
        method: form.deposit_method.charAt(0).toUpperCase() + form.deposit_method.slice(1) + ' Deposit',
        processing_time: form.deposit_method === 'mobile' ? '1-2 business days' : '2-3 business days',
        reference: 'CHQ' + Math.floor(Math.random() * 1000000000),
      };

      setDepositDetails(newDeposit);
      setDeposits(prev => [newDeposit, ...prev]);
      setShowSuccess(true);

      setForm(f => ({
        ...f,
        cheque_type: 'personal', cheque_number: '', bank_name: '', drawer_name: '',
        amount: '', date_on_cheque: '', description: '',
        front_image: null, back_image: null, endorse_required: true,
        to_account: getAccountNumber(),
      }));
      setImagePreview({ front: null, back: null });

      if (onTransactionSuccess) setTimeout(() => onTransactionSuccess(), 1000);
    } catch (error) {
      setMessage('Deposit failed. Please check your details and try again.');
      setMessageType('error');
    }
    setLoading(false);
  };

  const getStatusColor = status => {
    switch (status.toLowerCase()) {
      case 'completed': return '#22c55e';
      case 'processing': return '#f59e0b';
      case 'on hold': return '#ef4444';
      case 'rejected': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusBg = status => {
    switch (status.toLowerCase()) {
      case 'completed': return 'rgba(34,197,94,0.12)';
      case 'processing': return 'rgba(245,158,11,0.12)';
      case 'on hold': return 'rgba(239,68,68,0.12)';
      case 'rejected': return 'rgba(220,38,38,0.12)';
      default: return 'rgba(107,114,128,0.12)';
    }
  };

  const selectedChequeType = chequeTypes.find(t => t.value === form.cheque_type);
  const selectedMethod = depositMethods.find(m => m.value === form.deposit_method);
  const amount = parseFloat(form.amount) || 0;
  const fee = selectedChequeType?.fee === 'Free' ? 0 : 15;

  const dark = isDarkMode;
  const colors = {
    bg: dark ? '#0d0d0d' : '#f0f4f8',
    card: dark ? '#1a1a2e' : '#ffffff',
    cardBorder: dark ? '#2a2a4a' : '#e8ecf0',
    text: dark ? '#e8eaf6' : '#1a1a2a',
    textMuted: dark ? '#8892b0' : '#64748b',
    input: dark ? '#16213e' : '#ffffff',
    inputBorder: dark ? '#2a2a4a' : '#e2e8f0',
    sectionTitle: dark ? '#818cf8' : '#1e3c7d',
    accent: '#2563eb',
    accentDark: '#1e3c7d',
    success: '#22c55e',
    error: '#ef4444',
  };

  /* ════════════════════════════════════════════
     SUCCESS SCREEN
     ════════════════════════════════════════════ */
  if (showSuccess && depositDetails) {
    return (
      <div style={{
        minHeight: '100vh',
        background: dark ? '#0d0d0d' : '#f0f4f8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <style>{`
          @keyframes successPop {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
          }
        `}</style>

        <div style={{
          background: colors.card, borderRadius: 24,
          boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
          padding: 40, maxWidth: 520, width: '100%',
          textAlign: 'center',
          border: `1px solid ${colors.cardBorder}`,
          animation: 'fadeSlideUp 0.5s ease',
        }}>
          {/* Icon */}
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 40,
            animation: 'successPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: '0 10px 30px rgba(34,197,94,0.4)',
          }}>📝</div>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#22c55e', margin: '0 0 6px' }}>
            Deposit Submitted!
          </h2>
          <p style={{ color: colors.textMuted, margin: '0 0 28px', fontSize: 15 }}>
            Your cheque deposit has been submitted successfully
          </p>

          {/* Reference Badge */}
          <div style={{
            background: dark ? '#0a0a1a' : '#f0fdf4', borderRadius: 12,
            padding: '10px 20px', marginBottom: 24, display: 'inline-block',
            border: '1px solid rgba(34,197,94,0.3)',
          }}>
            <span style={{ color: colors.textMuted, fontSize: 12 }}>Reference: </span>
            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>{depositDetails.reference}</span>
          </div>

          {/* Details */}
          <div style={{
            background: dark ? '#0f0f2a' : '#f8fafc', borderRadius: 16,
            padding: 24, marginBottom: 20, textAlign: 'left',
            border: `1px solid ${colors.cardBorder}`,
          }}>
            {[
              { label: '📊 Status', value: depositDetails.status, color: getStatusColor(depositDetails.status) },
              { label: '🔢 Cheque Number', value: depositDetails.cheque_number },
              { label: '💰 Amount', value: `$${depositDetails.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: '#22c55e' },
              { label: '🏦 Bank', value: depositDetails.bank },
              { label: '📱 Method', value: depositDetails.method },
              { label: '⏳ Processing Time', value: depositDetails.processing_time },
              { label: '📅 Deposit Date', value: depositDetails.date },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0',
                borderBottom: i < 6 ? `1px solid ${dark ? '#2a2a4a' : '#f0f0f0'}` : 'none',
                animation: `fadeSlideUp 0.4s ease ${i * 0.05}s both`,
              }}>
                <span style={{ color: colors.textMuted, fontSize: 13 }}>{row.label}</span>
                <span style={{
                  fontWeight: 600, fontSize: 13,
                  color: row.color || colors.text, textAlign: 'right',
                }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Next Steps */}
          <div style={{
            background: dark ? 'rgba(37,99,235,0.08)' : '#eff6ff',
            borderRadius: 14, padding: 18, marginBottom: 24, textAlign: 'left',
            border: `1px solid ${dark ? 'rgba(37,99,235,0.2)' : '#bfdbfe'}`,
          }}>
            <p style={{ margin: '0 0 10px', fontWeight: 700, color: dark ? '#60a5fa' : '#1e40af', fontSize: 14 }}>
              📋 Next Steps
            </p>
            <div style={{ fontSize: 13, color: dark ? '#93c5fd' : '#1e40af', lineHeight: 1.8 }}>
              • Keep your original cheque until funds are available<br />
              • Funds will be available according to our hold policy<br />
              • You'll receive email notifications about status updates
            </div>
          </div>

          {/* Status Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: getStatusBg(depositDetails.status),
            border: `1px solid ${getStatusColor(depositDetails.status)}33`,
            borderRadius: 50, padding: '8px 20px', marginBottom: 24,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: getStatusColor(depositDetails.status),
              animation: 'pulse 1.5s infinite',
            }} />
            <span style={{ color: getStatusColor(depositDetails.status), fontWeight: 600, fontSize: 14 }}>
              {depositDetails.status}
            </span>
          </div>

          <button
            onClick={() => setShowSuccess(false)}
            style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: 16, cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.target.style.transform = 'translateY(0)'}
          >
            + Deposit Another Cheque
          </button>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     MAIN RENDER
     ════════════════════════════════════════════ */
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
        @keyframes slideIn { from { width: 0; } to { width: 80%; } }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
        @keyframes shimmer {
          from { background-position: -200% center; }
          to { background-position: 200% center; }
        }
        .deposit-card:hover { transform: translateY(-1px); }
        input::placeholder { color: #9ca3af; }
        select option { background: white; color: #1a1a1a; }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.4) !important; }
        .action-btn:active { transform: translateY(0); }
        .cancel-btn:hover { background: rgba(255,255,255,0.15) !important; }
        .method-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important; }
        .history-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.12) !important; }
      `}</style>

      {/* ───────── Header ───────── */}
      <div style={{
        textAlign: 'center', marginBottom: 28,
        animation: 'fadeSlideUp 0.5s ease',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, margin: '0 auto 12px',
          border: '2px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>📝</div>
        <h1 style={{
          color: '#fff', fontSize: 26, fontWeight: 800,
          margin: '0 0 6px', textShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}>Cheque Deposit</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
          Deposit cheques quickly & securely
        </p>
      </div>

      {/* ───────── Tabs ───────── */}
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 4, marginBottom: 28,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        maxWidth: 400, width: '100%',
      }}>
        {[
          { key: 'deposit', label: 'Make Deposit', icon: '📝' },
          { key: 'history', label: 'Deposit History', icon: '📋' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '12px 20px', border: 'none',
              borderRadius: 12, fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: 14, cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: activeTab === tab.key
                ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: activeTab === tab.key
                ? '#fff' : 'rgba(255,255,255,0.6)',
              backdropFilter: activeTab === tab.key ? 'blur(10px)' : 'none',
              boxShadow: activeTab === tab.key
                ? '0 2px 10px rgba(0,0,0,0.15)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ───────── Content ───────── */}
      <div style={{
        maxWidth: 720, width: '100%',
        animation: animateIn ? 'fadeSlideUp 0.4s ease' : 'none',
      }}>

        {/* ═══════════════ DEPOSIT TAB ═══════════════ */}
        {activeTab === 'deposit' ? (
          <form onSubmit={handleSubmit}>

            {/* ── Card 1 : Deposit Method ── */}
            <div className="deposit-card" style={{
              background: colors.card, borderRadius: 20, padding: 28,
              marginBottom: 16,
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}>
              {/* Section Header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 22, paddingBottom: 14,
                borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                }}>📥</div>
                <div>
                  <h3 style={{ margin: 0, color: dark ? '#a78bfa' : '#7c3aed', fontSize: 16, fontWeight: 700 }}>
                    Deposit Method
                  </h3>
                  <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
                    Choose how you'd like to deposit
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
              }}>
                {depositMethods.map(method => {
                  const isSelected = form.deposit_method === method.value;
                  return (
                    <label
                      key={method.value}
                      className="method-card"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: 16, borderRadius: 14, cursor: 'pointer',
                        background: isSelected
                          ? (dark ? 'rgba(37,99,235,0.12)' : '#eff6ff')
                          : (dark ? '#0f0f2a' : '#f8fafc'),
                        border: `2px solid ${isSelected ? '#2563eb' : dark ? '#2a2a4a' : '#e8ecf0'}`,
                        transition: 'all 0.25s ease',
                        boxShadow: isSelected ? '0 4px 15px rgba(37,99,235,0.15)' : 'none',
                      }}
                    >
                      <input
                        type="radio" name="deposit_method"
                        value={method.value}
                        checked={isSelected}
                        onChange={handleChange}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: isSelected ? method.gradient : (dark ? '#1a1a2e' : '#fff'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, flexShrink: 0,
                        border: isSelected ? 'none' : `1px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                        transition: 'all 0.25s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                      }}>
                        {method.icon}
                      </div>
                      <div>
                        <div style={{
                          fontWeight: 700, fontSize: 14,
                          color: isSelected ? (dark ? '#60a5fa' : '#1e3c7d') : colors.text,
                          marginBottom: 2,
                        }}>{method.label}</div>
                        <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.4 }}>
                          {method.desc}
                        </div>
                      </div>
                      {isSelected && (
                        <div style={{
                          marginLeft: 'auto', width: 22, height: 22,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #2563eb, #1e3c7d)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, color: '#fff', flexShrink: 0,
                        }}>✓</div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Card 2 : Account Information ── */}
            <div className="deposit-card" style={{
              background: colors.card, borderRadius: 20, padding: 28,
              marginBottom: 16,
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s ease',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 22, paddingBottom: 14,
                borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                }}>💳</div>
                <div>
                  <h3 style={{ margin: 0, color: dark ? '#818cf8' : '#1e3c7d', fontSize: 16, fontWeight: 700 }}>
                    Account Information
                  </h3>
                  <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
                    Cheque will be deposited to this account
                  </p>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 8, fontSize: 13, fontWeight: 600,
                  color: dark ? '#8892b0' : '#555',
                }}>💳 Deposit To Account</label>
                <input
                  type="text" name="to_account"
                  value={form.to_account} readOnly
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: 10,
                    border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                    fontSize: 15, boxSizing: 'border-box',
                    background: dark ? '#0f0f2a' : '#f8fafc',
                    color: dark ? '#e8eaf6' : '#1a1a2a',
                    cursor: 'not-allowed', fontWeight: 600,
                  }}
                />
              </div>
            </div>

            {/* ── Card 3 : Cheque Details ── */}
            <div className="deposit-card" style={{
              background: colors.card, borderRadius: 20, padding: 28,
              marginBottom: 16,
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s ease',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 22, paddingBottom: 14,
                borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #059669, #10b981)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                }}>📄</div>
                <div>
                  <h3 style={{ margin: 0, color: dark ? '#34d399' : '#059669', fontSize: 16, fontWeight: 700 }}>
                    Cheque Details
                  </h3>
                  <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
                    Enter cheque information exactly as shown
                  </p>
                </div>
              </div>

              {/* Row 1 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16, marginBottom: 16,
              }}>
                {/* Cheque Type Dropdown */}
                <div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 8, fontSize: 13, fontWeight: 600,
                    color: dark ? '#8892b0' : '#555',
                  }}>📋 Cheque Type</label>
                  <select
                    name="cheque_type" value={form.cheque_type}
                    onChange={handleChange} required
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 10,
                      border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                      fontSize: 15, boxSizing: 'border-box',
                      background: dark ? '#16213e' : '#ffffff',
                      color: dark ? '#e8eaf6' : '#1a1a2a',
                      cursor: 'pointer', outline: 'none', appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                      paddingRight: 40,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    {chequeTypes.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.icon} {t.label} ({t.fee})
                      </option>
                    ))}
                  </select>
                </div>

                <AnimatedInput
                  dark={dark} label="Cheque Number" icon="🔢"
                  type="text" name="cheque_number"
                  value={form.cheque_number}
                  onChange={handleChange} required
                  placeholder="Enter cheque number"
                />
              </div>

              {/* Row 2 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16, marginBottom: 16,
              }}>
                {/* Amount */}
                <div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 8, fontSize: 13, fontWeight: 600,
                    color: dark ? '#8892b0' : '#555',
                  }}>💵 Amount (USD)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      fontWeight: 700, color: dark ? '#6b7280' : '#9ca3af', fontSize: 16,
                    }}>$</span>
                    <input
                      type="number" name="amount"
                      value={form.amount} onChange={handleChange}
                      required min="0.01" step="0.01" placeholder="0.00"
                      style={{
                        width: '100%', padding: '13px 16px 13px 28px', borderRadius: 10,
                        border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                        fontSize: 18, fontWeight: 700, boxSizing: 'border-box',
                        background: dark ? '#16213e' : '#ffffff',
                        color: dark ? '#e8eaf6' : '#1a1a2a',
                        outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      }}
                    />
                  </div>
                </div>

                <AnimatedInput
                  dark={dark} label="Bank Name" icon="🏦"
                  type="text" name="bank_name"
                  value={form.bank_name}
                  onChange={handleChange} required
                  placeholder="Enter issuing bank name"
                />
              </div>

              {/* Row 3 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16, marginBottom: 16,
              }}>
                {/* Date on Cheque */}
                <div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 8, fontSize: 13, fontWeight: 600,
                    color: dark ? '#8892b0' : '#555',
                  }}>📅 Date on Cheque</label>
                  <input
                    type="date" name="date_on_cheque"
                    value={form.date_on_cheque} onChange={handleChange}
                    required
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 10,
                      border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                      fontSize: 15, boxSizing: 'border-box',
                      background: dark ? '#16213e' : '#ffffff',
                      color: dark ? '#e8eaf6' : '#1a1a2a',
                      outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  />
                </div>

                <AnimatedInput
                  dark={dark} label="Drawer Name" icon="👤"
                  type="text" name="drawer_name"
                  value={form.drawer_name}
                  onChange={handleChange} required
                  placeholder="Who wrote the cheque"
                  hint="Person or company name on the cheque"
                />
              </div>

              {/* Description */}
              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 8, fontSize: 13, fontWeight: 600,
                  color: dark ? '#8892b0' : '#555',
                }}>
                  📝 Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span>
                </label>
                <textarea
                  name="description" value={form.description}
                  onChange={handleChange}
                  placeholder="Add any additional notes..."
                  rows={3}
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: 10,
                    border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                    fontSize: 14, boxSizing: 'border-box',
                    background: dark ? '#16213e' : '#ffffff',
                    color: dark ? '#e8eaf6' : '#1a1a2a',
                    outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                />
              </div>
            </div>

            {/* ── Card 4 : Cheque Images (Mobile only) ── */}
            {form.deposit_method === 'mobile' && (
              <div className="deposit-card" style={{
                background: colors.card, borderRadius: 20, padding: 28,
                marginBottom: 16,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s ease',
                animation: 'fadeSlideUp 0.3s ease',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 22, paddingBottom: 14,
                  borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                  }}>📷</div>
                  <div>
                    <h3 style={{ margin: 0, color: dark ? '#fbbf24' : '#d97706', fontSize: 16, fontWeight: 700 }}>
                      Cheque Images
                    </h3>
                    <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
                      Take clear photos of both sides
                    </p>
                  </div>
                </div>

                <div style={{
                  background: dark ? 'rgba(245,158,11,0.06)' : '#fffbeb',
                  borderRadius: 10, padding: 12, marginBottom: 20,
                  border: `1px solid ${dark ? 'rgba(245,158,11,0.2)' : '#fde68a'}`,
                  fontSize: 13, color: dark ? '#fbbf24' : '#92400e',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  💡 Make sure all text is readable and the cheque is well-lit.
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 20,
                }}>
                  {/* Front Image */}
                  {['front', 'back'].map(side => (
                    <div key={side}>
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        marginBottom: 8, fontSize: 13, fontWeight: 600,
                        color: dark ? '#8892b0' : '#555',
                      }}>
                        {side === 'front' ? '📄' : '✍️'}
                        {side === 'front' ? ' Front of Cheque' : ' Back of Cheque (Endorsed)'}
                      </label>
                      <div
                        onDragEnter={e => handleDrag(e, side)}
                        onDragLeave={e => handleDrag(e, side)}
                        onDragOver={e => handleDrag(e, side)}
                        onDrop={e => handleDrop(e, side)}
                        style={{
                          border: `2px dashed ${
                            dragActive[side] ? '#2563eb'
                            : imagePreview[side] ? '#22c55e'
                            : dark ? '#2a2a4a' : '#d1d5db'
                          }`,
                          borderRadius: 14, padding: 24, textAlign: 'center',
                          background: dragActive[side]
                            ? (dark ? 'rgba(37,99,235,0.08)' : '#eff6ff')
                            : imagePreview[side]
                              ? (dark ? 'rgba(34,197,94,0.05)' : '#f0fdf4')
                              : (dark ? '#0f0f2a' : '#f9fafb'),
                          cursor: 'pointer',
                          minHeight: 140,
                          transition: 'all 0.25s ease',
                        }}
                      >
                        {imagePreview[side] ? (
                          <div style={{ position: 'relative' }}>
                            <img
                              src={imagePreview[side]}
                              alt={`${side} of cheque`}
                              style={{
                                maxWidth: '100%', maxHeight: 150,
                                borderRadius: 8,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setForm({ ...form, [`${side}_image`]: null });
                                setImagePreview(prev => ({ ...prev, [side]: null }));
                              }}
                              style={{
                                position: 'absolute', top: -8, right: -8,
                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                color: '#fff', border: 'none', borderRadius: '50%',
                                width: 28, height: 28, cursor: 'pointer',
                                fontSize: 14, fontWeight: 700,
                                boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >×</button>
                            <p style={{
                              margin: '8px 0 0', fontSize: 12, color: '#22c55e', fontWeight: 600,
                            }}>✅ Image uploaded</p>
                          </div>
                        ) : (
                          <div>
                            <div style={{
                              width: 48, height: 48, borderRadius: '50%',
                              background: dark ? '#1a1a2e' : '#f0f4f8',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              margin: '0 auto 12px', fontSize: 22,
                              border: `1px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                            }}>📷</div>
                            <p style={{
                              fontSize: 14, fontWeight: 600,
                              color: colors.text, margin: '0 0 4px',
                            }}>Drop image here or click to upload</p>
                            <p style={{
                              fontSize: 12, color: colors.textMuted, margin: '0 0 12px',
                            }}>
                              {side === 'back' ? 'Must be signed/endorsed' : 'JPG, PNG (max 10MB)'}
                            </p>
                            <input
                              type="file" accept="image/*"
                              onChange={e => e.target.files[0] && handleImageUpload(e.target.files[0], side)}
                              style={{ display: 'none' }}
                              id={`${side}-upload`}
                            />
                            <label
                              htmlFor={`${side}-upload`}
                              style={{
                                display: 'inline-block', padding: '8px 20px',
                                background: 'linear-gradient(135deg, #2563eb, #1e3c7d)',
                                color: '#fff', borderRadius: 8,
                                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                                transition: 'all 0.2s ease',
                              }}
                            >Choose File</label>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Endorse Checkbox */}
                <div style={{
                  marginTop: 20, padding: '14px 18px',
                  background: dark ? '#0f0f2a' : '#f8fafc',
                  borderRadius: 12,
                  border: `1px solid ${form.endorse_required
                    ? (dark ? 'rgba(34,197,94,0.3)' : '#bbf7d0')
                    : (dark ? '#2a2a4a' : '#e5e7eb')}`,
                  transition: 'all 0.2s ease',
                }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', fontSize: 14, fontWeight: 500,
                    color: colors.text,
                  }}>
                    <input
                      type="checkbox" name="endorse_required"
                      checked={form.endorse_required}
                      onChange={handleChange}
                      style={{
                        width: 18, height: 18, accentColor: '#22c55e',
                        cursor: 'pointer',
                      }}
                    />
                    <span>✍️ I confirm that I have endorsed the back of the cheque</span>
                  </label>
                </div>
              </div>
            )}

            {/* ── Card 5 : Deposit Summary (gradient) ── */}
            <div style={{
              background: dark
                ? 'linear-gradient(135deg, #1a1a2e, #0f0f2a)'
                : 'linear-gradient(135deg, #1e3c7d, #2563eb)',
              borderRadius: 20, padding: 24, marginBottom: 20,
              boxShadow: '0 8px 32px rgba(37,99,235,0.3)',
              animation: 'fadeSlideUp 0.4s ease 0.2s both',
            }}>
              <h3 style={{
                color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600,
                margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '1px',
              }}>📋 Deposit Summary</h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 10, marginBottom: 16,
              }}>
                {[
                  { label: 'Method', value: selectedMethod?.label, icon: selectedMethod?.icon },
                  { label: 'Cheque Type', value: selectedChequeType?.label, icon: selectedChequeType?.icon },
                  { label: 'Cheque #', value: form.cheque_number || '—', icon: '🔢' },
                  { label: 'Bank', value: form.bank_name || '—', icon: '🏦' },
                  { label: 'Amount', value: `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💰' },
                  { label: 'Fee', value: fee === 0 ? 'Free' : `$${fee.toFixed(2)}`, icon: '🏷️' },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '10px 14px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{
                      color: '#fff', fontWeight: 700, fontSize: 13,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 14, padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Net Deposit</span>
                <span style={{
                  color: '#fff', fontWeight: 800, fontSize: 26,
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}>
                  ${(amount - fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div style={{
                padding: '14px 18px', borderRadius: 12, marginBottom: 16,
                fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 10,
                animation: 'fadeSlideUp 0.3s ease',
                background: messageType === 'error' ? 'rgba(239,68,68,0.12)'
                  : messageType === 'success' ? 'rgba(34,197,94,0.12)'
                  : 'rgba(59,130,246,0.12)',
                border: `1px solid ${
                  messageType === 'error' ? 'rgba(239,68,68,0.3)'
                  : messageType === 'success' ? 'rgba(34,197,94,0.3)'
                  : 'rgba(59,130,246,0.3)'
                }`,
                color: messageType === 'error' ? '#ef4444'
                  : messageType === 'success' ? '#22c55e' : '#60a5fa',
              }}>
                {messageType === 'error' ? '⚠️' : messageType === 'success' ? '✅' : 'ℹ️'}
                {message}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button" className="cancel-btn"
                onClick={() => window.history.back()}
                style={{
                  flex: 1, padding: '15px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: 14, fontWeight: 700, fontSize: 15,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)',
                }}
              >← Cancel</button>
              <button
                type="submit" className="action-btn"
                disabled={loading}
                style={{
                  flex: 2, padding: '15px',
                  background: loading
                    ? 'rgba(255,255,255,0.2)'
                    : 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff', border: 'none', borderRadius: 14,
                  fontWeight: 700, fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,94,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 18, height: 18,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%', display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    Processing Deposit...
                  </>
                ) : (
                  <>📝 Submit Deposit</>
                )}
              </button>
            </div>
          </form>

        ) : (

          /* ═══════════════ HISTORY TAB ═══════════════ */
          <div style={{
            background: colors.card, borderRadius: 20, padding: 28,
            border: `1px solid ${colors.cardBorder}`,
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
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              }}>📋</div>
              <div>
                <h3 style={{ margin: 0, color: dark ? '#818cf8' : '#1e3c7d', fontSize: 16, fontWeight: 700 }}>
                  Deposit History
                </h3>
                <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
                  Track your cheque deposits
                </p>
              </div>
            </div>

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: 50 }}>
                <div style={{
                  width: 44, height: 44,
                  border: `3px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                  borderTop: '3px solid #2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 16px',
                }} />
                <p style={{ color: colors.textMuted, fontSize: 14 }}>Loading deposit history...</p>
              </div>
            ) : deposits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 50 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: dark ? '#0f0f2a' : '#f8fafc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 32,
                  border: `1px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                }}>📝</div>
                <p style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: '0 0 8px' }}>
                  No deposits found
                </p>
                <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
                  Your cheque deposit history will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {deposits.map((deposit, idx) => (
                  <div
                    key={deposit.id}
                    className="history-card"
                    style={{
                      border: `1px solid ${dark ? '#2a2a4a' : '#e8ecf0'}`,
                      borderRadius: 16, padding: 22,
                      background: dark ? '#0f0f2a' : '#f8fafc',
                      transition: 'all 0.25s ease',
                      animation: `fadeSlideUp 0.4s ease ${idx * 0.08}s both`,
                    }}
                  >
                    {/* Top Row */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'flex-start', marginBottom: 16,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                        }}>📄</div>
                        <div>
                          <div style={{
                            fontWeight: 700, fontSize: 16, color: colors.text,
                            marginBottom: 2,
                          }}>
                            Cheque #{deposit.cheque_number}
                          </div>
                          <div style={{ color: colors.textMuted, fontSize: 13 }}>
                            {deposit.bank}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontWeight: 800, fontSize: 18, color: '#22c55e',
                          marginBottom: 6,
                        }}>
                          ${deposit.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 12px', borderRadius: 50,
                          fontSize: 12, fontWeight: 700,
                          color: getStatusColor(deposit.status),
                          background: getStatusBg(deposit.status),
                          border: `1px solid ${getStatusColor(deposit.status)}33`,
                        }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: getStatusColor(deposit.status),
                          }} />
                          {deposit.status}
                        </div>
                      </div>
                    </div>

                    {/* Detail Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 12,
                    }}>
                      {[
                        { label: '📅 Deposit Date', value: deposit.date },
                        { label: '📱 Method', value: deposit.method },
                        { label: '⏳ Processing', value: deposit.processing_time },
                      ].map((item, i) => (
                        <div key={i} style={{
                          background: dark ? '#1a1a2e' : '#ffffff',
                          borderRadius: 10, padding: '10px 14px',
                          border: `1px solid ${dark ? '#2a2a4a' : '#e8ecf0'}`,
                        }}>
                          <div style={{
                            fontSize: 11, color: colors.textMuted, marginBottom: 4,
                          }}>{item.label}</div>
                          <div style={{
                            fontWeight: 600, fontSize: 13, color: colors.text,
                          }}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Hold Notice */}
                    {deposit.status === 'On Hold' && (
                      <div style={{
                        background: dark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
                        border: `1px solid ${dark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`,
                        borderRadius: 10, padding: 14, marginTop: 14,
                        fontSize: 13, color: dark ? '#fca5a5' : '#991b1b',
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                      }}>
                        <span>⚠️</span>
                        <span>
                          <strong>Hold Notice:</strong> This deposit is on hold for verification.
                          Please contact customer service if you have questions.
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}