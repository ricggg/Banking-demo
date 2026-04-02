import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../config';

const providers = [
  { key: 'electric', label: 'Electric Company', desc: 'Electricity Bill', icon: '⚡', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { key: 'water', label: 'Water Utility', desc: 'Water & Sewer', icon: '💧', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { key: 'gas', label: 'Gas Company', desc: 'Natural Gas', icon: '🔥', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  { key: 'internet', label: 'Internet Provider', desc: 'Internet & Cable', icon: '📶', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
  { key: 'mobile', label: 'Mobile Carrier', desc: 'Phone Service', icon: '📱', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  { key: 'insurance', label: 'Insurance Company', desc: 'Auto/Home Insurance', icon: '🛡️', color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
];

// ── Step Indicator ──
function StepIndicator({ currentStep }) {
  const steps = [
    { num: 0, label: 'Select Provider', icon: '🏢' },
    { num: 1, label: 'Payment Details', icon: '📋' },
    { num: 2, label: 'Verify OTP', icon: '🔐' },
    { num: 3, label: 'Completed', icon: '✅' },
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 32, width: '100%', maxWidth: 600,
    }}>
      {steps.map((step, index) => (
        <React.Fragment key={step.num}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700,
              background: currentStep >= step.num
                ? 'linear-gradient(135deg, #1e3c7d, #2563eb)'
                : 'rgba(255,255,255,0.1)',
              color: currentStep >= step.num ? '#fff' : 'rgba(255,255,255,0.4)',
              border: currentStep >= step.num
                ? '2px solid rgba(255,255,255,0.4)'
                : '2px solid rgba(255,255,255,0.15)',
              transition: 'all 0.4s ease',
              boxShadow: currentStep >= step.num ? '0 4px 15px rgba(37,99,235,0.4)' : 'none',
              transform: currentStep === step.num ? 'scale(1.1)' : 'scale(1)',
            }}>
              {currentStep > step.num ? '✓' : step.icon}
            </div>
            <span style={{
              fontSize: 10, whiteSpace: 'nowrap',
              color: currentStep >= step.num ? '#fff' : 'rgba(255,255,255,0.4)',
              fontWeight: currentStep === step.num ? 700 : 400,
              transition: 'all 0.3s ease',
            }}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: '0 6px', marginBottom: 22,
              background: currentStep > step.num
                ? 'linear-gradient(90deg, #2563eb, #1e3c7d)'
                : 'rgba(255,255,255,0.15)',
              borderRadius: 2, transition: 'all 0.5s ease',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Animated Input ──
function AnimatedInput({ label, icon, error, hint, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 4 }}>
      {label && (
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
          fontSize: 13, fontWeight: 600,
          color: focused ? '#2563eb' : '#555',
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
            border: `2px solid ${error ? '#ef4444' : focused ? '#2563eb' : '#e5e7eb'}`,
            fontSize: 15, boxSizing: 'border-box', outline: 'none',
            transition: 'all 0.25s ease',
            background: props.readOnly ? '#f8fafc' : '#fff',
            color: '#1a1a1a',
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
      {hint && !error && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#9ca3af' }}>{hint}</p>}
      {error && <p style={{ margin: '5px 0 0', fontSize: 12, color: '#ef4444' }}>⚠️ {error}</p>}
    </div>
  );
}

export default function BillPayments({ user, account, onTransactionSuccess, isDarkMode, onSendOTP }) {

  const getAccountNumber = () => {
    if (account && (account.account_number || account.accountNumber))
      return account.account_number || account.accountNumber;
    try {
      const s = JSON.parse(localStorage.getItem('bankingUser') || localStorage.getItem('userInfo') || '{}');
      return s.account_number || s.accountNumber || '1234567890';
    } catch { return '1234567890'; }
  };

  const getUserId = () => {
    if (user && (user.user_id || user.id)) return user.user_id || user.id;
    try {
      const s = JSON.parse(localStorage.getItem('bankingUser') || localStorage.getItem('userInfo') || '{}');
      return s.user_id || s.id || '12345';
    } catch { return '12345'; }
  };

  const getBalance = () => (account && account.balance) ? parseFloat(account.balance) : 15750.50;

  const [selectedProvider, setSelectedProvider] = useState(null);
  const [form, setForm] = useState({
    from_account: getAccountNumber(),
    customer_id: '', amount: '', pay_date: 'now',
    schedule_date: '', memo: '', recurring: false,
  });

  const [step, setStep] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpExpired, setOtpExpired] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sessionToken, setSessionToken] = useState('');
  const [animateIn, setAnimateIn] = useState(true);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);

  useEffect(() => { setForm(f => ({ ...f, from_account: getAccountNumber() })); }, [account]);

  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer(prev => { if (prev <= 1) { setOtpExpired(true); return 0; } return prev - 1; });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, [step]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleProviderSelect = provider => {
    setSelectedProvider(provider);
    setStep(1);
    setMessage('');
    setOtpSent(false);
    setShowSuccess(false);
    setForm(f => ({ ...f, customer_id: '', amount: '', pay_date: 'now', schedule_date: '', memo: '', recurring: false }));
  };

  const validateForm = () => {
    const { from_account, customer_id, amount, pay_date, schedule_date } = form;
    if (!from_account || !customer_id || !amount) { setMessage('Please fill in all required fields'); setMessageType('error'); return false; }
    if (parseFloat(amount) <= 0) { setMessage('Amount must be greater than 0'); setMessageType('error'); return false; }
    if (pay_date === 'schedule' && !schedule_date) { setMessage('Please select a payment date'); setMessageType('error'); return false; }
    if ((parseFloat(amount) + 1.00) > getBalance()) { setMessage('Insufficient funds including $1.00 processing fee'); setMessageType('error'); return false; }
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    setMessage(''); setMessageType(''); setLoading(true);

    try {
      const newToken = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      setSessionToken(newToken);

      const payload = {
        ...form, to_account: form.customer_id,
        provider: selectedProvider?.label || '', provider_key: selectedProvider?.key || '',
      };

      if (onSendOTP) {
        setMessage('Sending OTP...'); setMessageType('info');
        await onSendOTP(payload);
        setOtpSent(true); setStep(2); setOtpTimer(300); setOtpExpired(false);
        setMessage('OTP sent to your email!'); setMessageType('success');
      } else {
        const response = await axios.post(
          `${config.API_BASE_URL}/request-otp.php`,
          { user_id: getUserId(), session_token: newToken, transaction_data: { ...payload, transaction_type: 'billpayment', timestamp: Date.now() } },
          { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
        );
        if (response.data.success) {
          setOtpSent(true); setStep(2); setOtpTimer(300); setOtpExpired(false);
          setMessage('OTP sent to your email!'); setMessageType('success');
          if (response.data.otp) alert(`Development Mode OTP: ${response.data.otp}`);
        } else {
          setMessage(response.data.message || 'Failed to send OTP.'); setMessageType('error');
        }
      }
    } catch (error) {
      setMessage('Failed to send OTP. Please check your connection.'); setMessageType('error');
      setRetryCount(p => p + 1);
    }
    setLoading(false);
  };

  const handleOtpDigit = (index, value) => {
    const nd = [...otpDigits];
    nd[index] = value.replace(/\D/g, '').slice(-1);
    setOtpDigits(nd); setOtp(nd.join(''));
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleOtpSubmit = async e => {
    e.preventDefault();
    if (otp.length !== 6) { setMessage('Please enter all 6 digits'); setMessageType('error'); return; }
    if (otpExpired || otpTimer <= 0) { setMessage('OTP expired. Request a new one.'); setMessageType('error'); return; }

    setMessage(''); setIsProcessing(true);
    setMessage('Processing your bill payment...'); setMessageType('info');

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/verify-otp.php`,
        {
          user_id: getUserId(), otp_code: otp, session_token: sessionToken,
          transaction_data: {
            ...form, to_account: form.customer_id,
            provider: selectedProvider.label, provider_key: selectedProvider.key,
          },
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
      );

      const result = response.data;
      if (result.success) {
        setStep(3); setShowSuccess(true);
        setTransactionDetails({
          ...form, provider: selectedProvider.label, provider_icon: selectedProvider.icon,
          provider_key: selectedProvider.key, date: new Date().toLocaleString(), status: 'Paid',
          reference: result.transaction_id || 'BILL' + Math.floor(Math.random() * 1000000000),
          amount_transferred: result.amount_transferred || form.amount,
          new_balance: result.new_balance, fee: 1.00,
          total_charged: (parseFloat(form.amount) + 1.00).toFixed(2),
        });
        resetForm();
        if (onTransactionSuccess) onTransactionSuccess();
        if (result.new_balance) localStorage.setItem('accountBalance', result.new_balance.toString());
      } else {
        handleTransferError(result);
      }
    } catch (error) {
      if (error.response?.data?.error_code) handleTransferError(error.response.data);
      else { setMessage('Network error. Please try again.'); setMessageType('error'); }
      setRetryCount(p => p + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransferError = (result) => {
    const errors = {
      OTP_EXPIRED: ['OTP expired. Request a new one.', () => { setStep(1); setOtpSent(false); setOtp(''); setOtpDigits(['','','','','','']); }],
      INVALID_OTP: ['Invalid OTP. Try again.', () => { setOtp(''); setOtpDigits(['','','','','','']); }],
      INSUFFICIENT_FUNDS: ['Insufficient funds including $1.00 fee.', () => setStep(1)],
      DATA_MISMATCH: ['Data mismatch. Please start over.', resetForm],
      DUPLICATE_TRANSACTION: ['Duplicate transaction detected.', null],
      ACCOUNT_NOT_FOUND: ['Invalid customer ID.', () => setStep(1)],
    };
    const [msg, action] = errors[result.error_code] || [result.message || 'Payment failed.', null];
    setMessage(msg); setMessageType('error');
    if (action) action();
  };

  const verifyTransaction = async (txnId) => {
    try { await axios.get(`${config.API_BASE_URL}/verify-transaction.php?id=${txnId}`); } catch {}
  };

  const resetForm = () => {
    setForm({ from_account: getAccountNumber(), customer_id: '', amount: '', pay_date: 'now', schedule_date: '', memo: '', recurring: false });
    setStep(0); setSelectedProvider(null); setOtpSent(false); setOtp('');
    setOtpDigits(['','','','','','']); setOtpTimer(0); setOtpExpired(false);
    setMessage(''); setMessageType(''); setRetryCount(0); setSessionToken(''); setShowSuccess(false);
  };

  const requestNewOTP = () => {
    setOtp(''); setOtpDigits(['','','','','','']); setOtpExpired(false);
    setMessage(''); setStep(1); setOtpSent(false);
  };

  const fee = 1.00;
  const amount = parseFloat(form.amount) || 0;
  const total = amount + fee;
  const balance = getBalance();
  const isOverBalance = total > balance;

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
    cardElevated: dark ? '#0f0f2a' : '#f8fafc',
  };

  // ══════════════════════════════════════
  //  SUCCESS SCREEN
  // ══════════════════════════════════════
  if (showSuccess && transactionDetails) {
    return (
      <div style={{
        minHeight: '100vh',
        background: dark ? '#0d0d0d' : '#f0f4f8',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <style>{`
          @keyframes successPop { 0%{transform:scale(.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1} }
          @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.2)} }
        `}</style>
        <div style={{
          background: colors.card, borderRadius: 24,
          boxShadow: '0 25px 80px rgba(0,0,0,0.2)', padding: 40,
          maxWidth: 520, width: '100%', textAlign: 'center',
          border: `1px solid ${colors.cardBorder}`,
          animation: 'fadeSlideUp 0.5s ease',
        }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 40,
            animation: 'successPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: '0 10px 30px rgba(34,197,94,0.4)',
          }}>✅</div>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#22c55e', margin: '0 0 6px' }}>
            Payment Successful!
          </h2>
          <p style={{ color: colors.textMuted, margin: '0 0 28px', fontSize: 15 }}>
            Your bill has been paid successfully
          </p>

          {/* Reference Badge */}
          <div style={{
            background: dark ? '#0a0a1a' : '#f0fdf4', borderRadius: 12,
            padding: '10px 20px', marginBottom: 24, display: 'inline-block',
            border: '1px solid rgba(34,197,94,0.3)',
          }}>
            <span style={{ color: colors.textMuted, fontSize: 12 }}>Reference: </span>
            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>{transactionDetails.reference}</span>
          </div>

          {/* Transaction Details */}
          <div style={{
            background: dark ? '#0f0f2a' : '#f8fafc', borderRadius: 16, padding: 24,
            marginBottom: 24, textAlign: 'left', border: `1px solid ${colors.cardBorder}`,
          }}>
            {[
              { label: '📅 Date', value: transactionDetails.date },
              { label: '🏦 From Account', value: transactionDetails.from_account },
              { label: `${transactionDetails.provider_icon} Provider`, value: transactionDetails.provider },
              { label: '🔢 Customer ID', value: transactionDetails.customer_id },
              { label: '💰 Amount', value: `$${parseFloat(transactionDetails.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
              { label: '🏷️ Processing Fee', value: '$1.00' },
              { label: '💸 Total Charged', value: `$${transactionDetails.total_charged}`, highlight: true },
              { label: '📅 Payment Date', value: transactionDetails.pay_date === 'now' ? 'Immediate' : transactionDetails.schedule_date },
              transactionDetails.memo && { label: '📝 Memo', value: transactionDetails.memo },
              transactionDetails.recurring && { label: '🔁 Recurring', value: 'Yes' },
              transactionDetails.new_balance && { label: '💳 New Balance', value: `$${parseFloat(transactionDetails.new_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '10px 0', gap: 12,
                borderBottom: i < 7 ? `1px solid ${dark ? '#2a2a4a' : '#f0f0f0'}` : 'none',
                animation: `fadeSlideUp 0.4s ease ${i * 0.05}s both`,
              }}>
                <span style={{ color: colors.textMuted, fontSize: 13, flexShrink: 0 }}>{row.label}</span>
                <span style={{
                  fontWeight: 600, fontSize: 13, textAlign: 'right',
                  color: row.highlight ? '#ef4444' : row.label.includes('Balance') ? '#22c55e' : colors.text,
                }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Status Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 50, padding: '8px 20px', marginBottom: 24,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
            <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 14 }}>Paid</span>
          </div>

          <button onClick={resetForm} style={{
            width: '100%', padding: 14,
            background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
            color: '#fff', border: 'none', borderRadius: 12,
            fontWeight: 700, fontSize: 16, cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
            transition: 'all 0.2s ease',
          }}
            onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.target.style.transform = 'translateY(0)'}
          >
            + New Payment
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════
  //  MAIN RENDER
  // ══════════════════════════════════════
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
        @keyframes slideIn { from{width:0}to{width:80%} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.2)} }
        @keyframes otpPop { 0%{transform:scale(.9)}50%{transform:scale(1.05)}100%{transform:scale(1)} }
        @keyframes cardPop { 0%{transform:scale(.95);opacity:0}70%{transform:scale(1.02)}100%{transform:scale(1);opacity:1} }
        .transfer-card:hover { transform: translateY(-1px); }
        .provider-card:hover { transform: translateY(-3px) !important; box-shadow: 0 12px 35px rgba(0,0,0,0.18) !important; }
        input::placeholder { color: #9ca3af; }
        select option { background: white; color: #1a1a1a; }
        .otp-input:focus { border-color: #2563eb !important; transform: scale(1.05); }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.4) !important; }
        .cancel-btn:hover { background: rgba(255,255,255,0.15) !important; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28, animation: 'fadeSlideUp 0.5s ease' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, margin: '0 auto 12px',
          border: '2px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>💵</div>
        <h1 style={{
          color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 6px',
          textShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}>Bill Payments</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
          Pay your bills quickly & securely
        </p>
      </div>

      <StepIndicator currentStep={step} />

      <div style={{
        maxWidth: 700, width: '100%',
        animation: animateIn ? 'fadeSlideUp 0.4s ease' : 'none',
      }}>

        {/* ═══ STEP 0: PROVIDER SELECT ═══ */}
        {step === 0 && (
          <div style={{
            background: colors.card, borderRadius: 20, padding: 28,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
            animation: 'fadeSlideUp 0.4s ease',
          }}>
            {/* Section Header */}
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
              }}>🏢</div>
              <div>
                <h3 style={{ margin: 0, color: colors.sectionTitle, fontSize: 16, fontWeight: 700 }}>
                  Select Service Provider
                </h3>
                <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
                  Choose your bill provider to get started
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 14,
            }}>
              {providers.map((provider, i) => (
                <div
                  key={provider.key}
                  className="provider-card"
                  onClick={() => handleProviderSelect(provider)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: colors.cardElevated,
                    border: `2px solid ${colors.cardBorder}`,
                    borderRadius: 16, padding: 18, cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    animation: `cardPop 0.4s ease ${i * 0.08}s both`,
                  }}
                >
                  <div style={{
                    width: 46, height: 46, borderRadius: 12,
                    background: provider.gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                    boxShadow: `0 4px 15px ${provider.color}40`,
                  }}>
                    {provider.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: colors.text, marginBottom: 2 }}>
                      {provider.label}
                    </div>
                    <div style={{ fontSize: 12, color: colors.textMuted }}>{provider.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STEP 1: PAYMENT FORM ═══ */}
        {step === 1 && selectedProvider && (
          <form onSubmit={handleSubmit}>

            {/* Selected Provider Banner */}
            <div style={{
              background: selectedProvider.gradient,
              borderRadius: 20, padding: '20px 28px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: `0 8px 25px ${selectedProvider.color}40`,
              animation: 'fadeSlideUp 0.3s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, border: '1px solid rgba(255,255,255,0.3)',
                }}>{selectedProvider.icon}</div>
                <div>
                  <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: '0 0 2px' }}>{selectedProvider.label}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: 0 }}>{selectedProvider.desc}</p>
                </div>
              </div>
              <button type="button" onClick={() => setStep(0)} style={{
                background: 'rgba(255,255,255,0.2)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10,
                padding: '8px 16px', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                backdropFilter: 'blur(10px)', transition: 'all 0.2s',
              }}>
                🔄 Change
              </button>
            </div>

            {/* Account & Payment Info */}
            <div className="transfer-card" style={{
              background: colors.card, borderRadius: 20, padding: 28, marginBottom: 16,
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s ease',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 14,
                borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                }}>🏦</div>
                <div>
                  <h3 style={{ margin: 0, color: colors.sectionTitle, fontSize: 16, fontWeight: 700 }}>Payment Information</h3>
                  <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>Enter account and payment details</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555' }}>
                    💳 From Account
                  </label>
                  <input type="text" value={form.from_account} readOnly style={{
                    width: '100%', padding: '13px 16px', borderRadius: 10,
                    border: `2px solid ${colors.inputBorder}`, fontSize: 15, boxSizing: 'border-box',
                    background: dark ? '#0f0f2a' : '#f8fafc', color: colors.text,
                    cursor: 'not-allowed', fontWeight: 600,
                  }} />
                  <p style={{ margin: '5px 0 0', fontSize: 11, color: dark ? '#6b7280' : '#9ca3af' }}>
                    💰 Balance: ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <AnimatedInput label="Customer ID / Account #" icon="🔢"
                  type="text" value={form.customer_id}
                  onChange={e => setForm({ ...form, customer_id: e.target.value })}
                  required placeholder="Your account with provider"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {/* Amount */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555' }}>
                    💵 Amount (USD)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: dark ? '#6b7280' : '#9ca3af', fontSize: 16 }}>$</span>
                    <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                      required min="1" step="0.01" placeholder="0.00"
                      style={{
                        width: '100%', padding: '13px 16px 13px 28px', borderRadius: 10,
                        border: `2px solid ${isOverBalance ? '#ef4444' : dark ? '#2a2a4a' : '#e5e7eb'}`,
                        fontSize: 18, fontWeight: 700, boxSizing: 'border-box',
                        background: dark ? '#16213e' : '#ffffff', color: dark ? '#e8eaf6' : '#1a1a2a',
                        outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      }}
                    />
                  </div>
                  {isOverBalance && (
                    <p style={{ margin: '5px 0 0', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>⚠️ Insufficient funds (incl. $1 fee)</p>
                  )}
                </div>

                {/* Payment Date */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555' }}>
                    📅 Payment Date
                  </label>
                  <div style={{ display: 'flex', gap: 10, marginBottom: form.pay_date === 'schedule' ? 10 : 0 }}>
                    {[{ value: 'now', label: '⚡ Pay Now' }, { value: 'schedule', label: '📅 Schedule' }].map(opt => (
                      <label key={opt.value} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 6, padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                        background: form.pay_date === opt.value
                          ? (dark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)')
                          : (dark ? '#16213e' : '#fff'),
                        border: `2px solid ${form.pay_date === opt.value ? '#2563eb' : (dark ? '#2a2a4a' : '#e5e7eb')}`,
                        transition: 'all 0.2s ease', fontWeight: 600, fontSize: 13,
                        color: form.pay_date === opt.value ? '#2563eb' : colors.text,
                      }}>
                        <input type="radio" name="pay_date" value={opt.value}
                          checked={form.pay_date === opt.value} onChange={handleChange}
                          style={{ display: 'none' }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                  {form.pay_date === 'schedule' && (
                    <input type="date" name="schedule_date" value={form.schedule_date}
                      onChange={handleChange} required min={new Date().toISOString().split('T')[0]}
                      style={{
                        width: '100%', padding: '13px 16px', borderRadius: 10,
                        border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`, fontSize: 14,
                        boxSizing: 'border-box', background: dark ? '#16213e' : '#fff',
                        color: colors.text, outline: 'none',
                        animation: 'fadeSlideUp 0.3s ease',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Recurring + Memo */}
              <div style={{ marginTop: 16 }}>
                <label onClick={() => setForm({ ...form, recurring: !form.recurring })} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  background: dark ? '#0f0f2a' : '#f8fafc', borderRadius: 12,
                  border: `1px solid ${form.recurring ? '#2563eb' : colors.cardBorder}`,
                  cursor: 'pointer', transition: 'all 0.2s ease', marginBottom: 12,
                }}>
                  <div style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: form.recurring ? '#22c55e' : colors.cardBorder,
                    position: 'relative', transition: 'all 0.3s',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      position: 'absolute', top: 2,
                      left: form.recurring ? 20 : 2,
                      transition: 'all 0.3s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>🔁 Recurring Payment</span>
                    <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>Automatically pay this bill monthly</p>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555' }}>
                  📝 Memo <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span>
                </label>
                <textarea name="memo" value={form.memo} onChange={handleChange}
                  placeholder="Add a note for this payment..."
                  rows={2}
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: 10,
                    border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`, fontSize: 14,
                    boxSizing: 'border-box', background: dark ? '#16213e' : '#fff',
                    color: colors.text, outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                />
              </div>
            </div>

            {/* Payment Summary */}
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
                margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 1,
              }}>📋 Payment Summary</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { label: 'Provider', value: selectedProvider.label, icon: selectedProvider.icon },
                  { label: 'Account', value: form.from_account, icon: '💳' },
                  { label: 'Customer ID', value: form.customer_id || '—', icon: '🔢' },
                  { label: 'Date', value: form.pay_date === 'now' ? 'Immediate' : (form.schedule_date || '—'), icon: '📅' },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.1)', borderRadius: 10,
                    padding: '10px 14px', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>{item.icon} {item.label}</div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div style={{
                background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 20px',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Amount</span>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Processing Fee</span>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>$1.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Total Amount</span>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 26, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                    ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div style={{
                padding: '14px 18px', borderRadius: 12, marginBottom: 16, fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeSlideUp 0.3s ease',
                background: messageType === 'error' ? 'rgba(239,68,68,0.12)' : messageType === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)',
                border: `1px solid ${messageType === 'error' ? 'rgba(239,68,68,0.3)' : messageType === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
                color: messageType === 'error' ? '#ef4444' : messageType === 'success' ? '#22c55e' : '#60a5fa',
              }}>
                {messageType === 'error' ? '⚠️' : messageType === 'success' ? '✅' : 'ℹ️'}
                {message}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="cancel-btn" onClick={() => setStep(0)} style={{
                flex: 1, padding: 15, background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '2px solid rgba(255,255,255,0.3)', borderRadius: 14,
                fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s',
                backdropFilter: 'blur(10px)',
              }}>← Back</button>
              <button type="submit" className="action-btn" disabled={loading || isOverBalance} style={{
                flex: 2, padding: 15,
                background: loading ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #22c55e, #16a34a)',
                color: '#fff', border: 'none', borderRadius: 14,
                fontWeight: 700, fontSize: 15,
                cursor: loading || isOverBalance ? 'not-allowed' : 'pointer',
                opacity: isOverBalance ? 0.5 : 1, transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,94,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {loading ? (
                  <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Sending OTP...</>
                ) : (<>📧 Send OTP to Email</>)}
              </button>
            </div>
          </form>
        )}

        {/* ═══ STEP 2: OTP ═══ */}
        {step === 2 && (
          <div style={{ animation: 'fadeSlideUp 0.4s ease' }}>
            <div style={{
              background: colors.card, borderRadius: 24, padding: 36,
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 10px 40px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 32,
                boxShadow: '0 8px 25px rgba(37,99,235,0.35)',
                animation: 'pulse 2s infinite',
              }}>📧</div>

              <h2 style={{ color: colors.text, fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>Check Your Email</h2>
              <p style={{ color: colors.textMuted, fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
                Enter the 6-digit code sent to your email to confirm your bill payment.
              </p>

              {/* Mini summary */}
              <div style={{
                background: dark ? '#0f0f2a' : '#f8fafc', borderRadius: 14, padding: 16,
                marginBottom: 24, border: `1px solid ${colors.cardBorder}`, textAlign: 'left',
              }}>
                {[
                  { label: 'Provider', value: selectedProvider?.label, icon: selectedProvider?.icon },
                  { label: 'Customer ID', value: form.customer_id, icon: '🔢' },
                  { label: 'Total', value: `$${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💰', highlight: true },
                ].map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '8px 0',
                    borderBottom: i < 2 ? `1px solid ${dark ? '#2a2a4a' : '#f0f0f0'}` : 'none',
                  }}>
                    <span style={{ color: dark ? '#6b7280' : '#9ca3af', fontSize: 13 }}>{r.icon} {r.label}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: r.highlight ? '#2563eb' : colors.text }}>{r.value}</span>
                  </div>
                ))}
              </div>

              {/* Timer */}
              {otpTimer > 0 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: otpTimer < 60 ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.08)',
                  border: `1px solid ${otpTimer < 60 ? 'rgba(239,68,68,0.3)' : 'rgba(37,99,235,0.2)'}`,
                  borderRadius: 50, padding: '8px 20px', marginBottom: 24, fontSize: 14, fontWeight: 600,
                  color: otpTimer < 60 ? '#ef4444' : dark ? '#818cf8' : '#1e3c7d',
                }}>
                  <span style={{ animation: 'pulse 1s infinite' }}>⏱️</span>
                  Expires in {formatTime(otpTimer)}
                </div>
              )}

              {/* OTP Inputs */}
              <form onSubmit={handleOtpSubmit}>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
                  {otpDigits.map((digit, index) => (
                    <input key={index}
                      ref={el => otpRefs.current[index] = el}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={e => handleOtpDigit(index, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(index, e)}
                      className="otp-input"
                      style={{
                        width: 52, height: 60, textAlign: 'center', fontSize: 24, fontWeight: 800,
                        borderRadius: 12,
                        border: `2px solid ${digit ? '#2563eb' : dark ? '#2a2a4a' : '#e5e7eb'}`,
                        background: digit ? (dark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.05)') : (dark ? '#16213e' : '#fff'),
                        color: colors.text, outline: 'none', transition: 'all 0.2s ease',
                        boxShadow: digit ? '0 0 0 4px rgba(37,99,235,0.1)' : 'none',
                        animation: digit ? 'otpPop 0.2s ease' : 'none',
                      }}
                    />
                  ))}
                </div>

                {/* Message */}
                {message && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeSlideUp 0.3s ease',
                    background: messageType === 'error' ? 'rgba(239,68,68,0.1)' : messageType === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                    border: `1px solid ${messageType === 'error' ? 'rgba(239,68,68,0.3)' : messageType === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
                    color: messageType === 'error' ? '#ef4444' : messageType === 'success' ? '#22c55e' : '#60a5fa',
                  }}>
                    {messageType === 'error' ? '⚠️' : messageType === 'success' ? '✅' : 'ℹ️'}
                    {message}
                  </div>
                )}

                {/* Confirm Button */}
                <button type="submit" className="action-btn"
                  disabled={isProcessing || otp.length !== 6 || otpExpired}
                  style={{
                    width: '100%', padding: 16,
                    background: (isProcessing || otp.length !== 6 || otpExpired)
                      ? (dark ? '#2a2a4a' : '#e5e7eb')
                      : 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                    color: (isProcessing || otp.length !== 6 || otpExpired) ? (dark ? '#6b7280' : '#9ca3af') : '#fff',
                    border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 16,
                    cursor: (isProcessing || otp.length !== 6 || otpExpired) ? 'not-allowed' : 'pointer',
                    marginBottom: 12, transition: 'all 0.2s ease',
                    boxShadow: (isProcessing || otp.length !== 6 || otpExpired) ? 'none' : '0 4px 20px rgba(37,99,235,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {isProcessing ? (
                    <><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Processing Payment...</>
                  ) : (<>🔐 Confirm Payment</>)}
                </button>

                {/* Secondary Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" onClick={requestNewOTP}
                    disabled={loading || otpTimer > 240}
                    style={{
                      flex: 1, padding: 12, background: 'transparent',
                      color: dark ? '#818cf8' : '#1e3c7d',
                      border: `2px solid ${dark ? '#3b4fd8' : '#1e3c7d'}`,
                      borderRadius: 12, fontWeight: 600, fontSize: 13,
                      cursor: (loading || otpTimer > 240) ? 'not-allowed' : 'pointer',
                      opacity: (loading || otpTimer > 240) ? 0.5 : 1, transition: 'all 0.2s',
                    }}>🔄 Resend OTP</button>
                  <button type="button" onClick={() => setStep(1)} style={{
                    flex: 1, padding: 12, background: 'transparent',
                    color: dark ? '#6b7280' : '#64748b',
                    border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                    borderRadius: 12, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                  }}>← Go Back</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}