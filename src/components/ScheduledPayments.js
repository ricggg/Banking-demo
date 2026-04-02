import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../config';

const paymentTypes = [
  { value: 'transfer', label: 'Bank Transfer', icon: '🔄', desc: 'Transfer to another account', gradient: 'linear-gradient(135deg, #1e3c7d, #2563eb)' },
  { value: 'bill', label: 'Bill Payment', icon: '💵', desc: 'Pay bills automatically', gradient: 'linear-gradient(135deg, #059669, #10b981)' },
  { value: 'loan', label: 'Loan Payment', icon: '🏦', desc: 'Loan installments', gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' },
  { value: 'investment', label: 'Investment', icon: '📈', desc: 'Investment contributions', gradient: 'linear-gradient(135deg, #ea580c, #f97316)' },
];

const frequencyOptions = [
  { value: 'once', label: 'One-time Payment', icon: '1️⃣' },
  { value: 'weekly', label: 'Weekly', icon: '📆' },
  { value: 'biweekly', label: 'Bi-weekly', icon: '📅' },
  { value: 'monthly', label: 'Monthly', icon: '🗓️' },
  { value: 'quarterly', label: 'Quarterly', icon: '📊' },
  { value: 'yearly', label: 'Yearly', icon: '🎯' },
];

// ==========================================
// Step Indicator Component
// ==========================================
function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: 'Payment Details', icon: '📋' },
    { num: 2, label: 'Verify OTP', icon: '🔐' },
    { num: 3, label: 'Completed', icon: '✅' },
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
      width: '100%',
      maxWidth: 500,
    }}>
      {steps.map((step, index) => (
        <React.Fragment key={step.num}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 700,
              background: currentStep >= step.num
                ? 'linear-gradient(135deg, #1e3c7d, #2563eb)'
                : 'rgba(255,255,255,0.1)',
              color: currentStep >= step.num ? '#fff' : 'rgba(255,255,255,0.4)',
              border: currentStep >= step.num
                ? '2px solid rgba(255,255,255,0.4)'
                : '2px solid rgba(255,255,255,0.15)',
              transition: 'all 0.4s ease',
              boxShadow: currentStep >= step.num
                ? '0 4px 15px rgba(37,99,235,0.4)'
                : 'none',
              transform: currentStep === step.num ? 'scale(1.1)' : 'scale(1)',
            }}>
              {currentStep > step.num ? '✓' : step.icon}
            </div>
            <span style={{
              fontSize: 11,
              color: currentStep >= step.num ? '#fff' : 'rgba(255,255,255,0.4)',
              fontWeight: currentStep === step.num ? 700 : 400,
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
            }}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div style={{
              flex: 1,
              height: 2,
              margin: '0 8px',
              marginBottom: 24,
              background: currentStep > step.num
                ? 'linear-gradient(90deg, #2563eb, #1e3c7d)'
                : 'rgba(255,255,255,0.15)',
              borderRadius: 2,
              transition: 'all 0.5s ease',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ==========================================
// Animated Input Component
// ==========================================
function AnimatedInput({ label, icon, error, hint, dark, ...props }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 4 }}>
      {label && (
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
          fontSize: 13,
          fontWeight: 600,
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
          onFocus={(e) => { setFocused(true); props.onFocus && props.onFocus(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur && props.onBlur(e); }}
          style={{
            width: '100%',
            padding: '13px 16px',
            borderRadius: 10,
            border: `2px solid ${error ? '#ef4444' : focused ? '#2563eb' : dark ? '#2a2a4a' : '#e5e7eb'}`,
            fontSize: 15,
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'all 0.25s ease',
            background: props.readOnly
              ? dark ? '#0f0f2a' : '#f8fafc'
              : dark ? '#16213e' : '#fff',
            color: dark ? '#e8eaf6' : '#1a1a1a',
            boxShadow: focused
              ? '0 0 0 4px rgba(37,99,235,0.08)'
              : '0 1px 3px rgba(0,0,0,0.06)',
            ...props.style,
          }}
        />
        {focused && (
          <div style={{
            position: 'absolute',
            bottom: -1,
            left: '10%',
            width: '80%',
            height: 2,
            background: 'linear-gradient(90deg, #2563eb, #1e3c7d)',
            borderRadius: 2,
            animation: 'slideIn 0.3s ease',
          }} />
        )}
      </div>
      {hint && !error && (
        <p style={{ margin: '5px 0 0', fontSize: 12, color: '#9ca3af' }}>{hint}</p>
      )}
      {error && (
        <p style={{ margin: '5px 0 0', fontSize: 12, color: '#ef4444' }}>⚠️ {error}</p>
      )}
    </div>
  );
}

// ==========================================
// Main Component
// ==========================================
export default function ScheduledPayments({ user, account, onTransactionSuccess, isDarkMode }) {
  const getAccountNumber = () => {
    if (account && (account.account_number || account.accountNumber)) {
      return account.account_number || account.accountNumber;
    }
    try {
      const storedUser = JSON.parse(localStorage.getItem('bankingUser') || '{}');
      if (storedUser?.account_number) return storedUser.account_number;
      if (storedUser?.accountNumber) return storedUser.accountNumber;
    } catch (e) {}
    return '';
  };

  const getUserId = () => {
    if (user && (user.user_id || user.id)) return user.user_id || user.id;
    try {
      const storedUser = JSON.parse(
        localStorage.getItem('bankingUser') ||
        localStorage.getItem('userInfo') || '{}'
      );
      return storedUser.user_id || storedUser.id || '12345';
    } catch (e) {
      return '12345';
    }
  };

  const [activeTab, setActiveTab] = useState('create');
  const [form, setForm] = useState({
    from_account: getAccountNumber(),
    payment_type: 'transfer',
    recipient_name: '',
    to_account: '',
    amount: '',
    start_date: '',
    end_date: '',
    frequency: 'once',
    description: '',
    auto_deduct: true,
    notification: true,
  });

  const [step, setStep] = useState(1);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [scheduledPayments, setScheduledPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [resendTimer, setResendTimer] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(true);

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

  useEffect(() => {
    setForm(f => ({ ...f, from_account: getAccountNumber() }));
    if (activeTab === 'manage') fetchScheduledPayments();
  }, [account, activeTab]);

  useEffect(() => {
    let interval;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) { setCanResend(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, [step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMinDate = () => new Date().toISOString().split('T')[0];

  const fetchScheduledPayments = async () => {
    try {
      setLoadingPayments(true);
      setTimeout(() => {
        setScheduledPayments([
          {
            id: 1,
            type: 'Bill Payment',
            icon: '💵',
            recipient: 'Electric Company',
            amount: 120.50,
            next_date: '2025-01-15',
            frequency: 'Monthly',
            status: 'Active',
          },
          {
            id: 2,
            type: 'Bank Transfer',
            icon: '🔄',
            recipient: 'John Doe - *****1234',
            amount: 500.00,
            next_date: '2025-01-20',
            frequency: 'One-time',
            status: 'Pending',
          },
        ]);
        setLoadingPayments(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching scheduled payments:', error);
      setLoadingPayments(false);
    }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    setLoading(true);
    try {
      await axios.post(
        `${config.API_BASE_URL}/request-otp.php`,
        {
          user_id: getUserId(),
          transaction_data: { ...form, transaction_type: 'scheduled_payment' },
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setOtpSent(true);
      setStep(2);
      setMessage('OTP sent to your email!');
      setMessageType('success');
      setResendTimer(120);
      setCanResend(false);
    } catch (error) {
      setMessage('Failed to send OTP. Try again.');
      setMessageType('error');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setMessage('');
    setMessageType('');
    try {
      await axios.post(
        `${config.API_BASE_URL}/request-otp.php`,
        {
          user_id: getUserId(),
          transaction_data: { ...form, transaction_type: 'scheduled_payment' },
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setMessage('New OTP sent to your email!');
      setMessageType('success');
      setResendTimer(120);
      setCanResend(false);
      setOtp('');
      setOtpDigits(['', '', '', '', '', '']);
    } catch (error) {
      setMessage('Failed to resend OTP. Please try again.');
      setMessageType('error');
    }
    setResendLoading(false);
  };

  const handleOtpDigit = (index, value) => {
    const newDigits = [...otpDigits];
    newDigits[index] = value.replace(/\D/g, '').slice(-1);
    setOtpDigits(newDigits);
    setOtp(newDigits.join(''));
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async e => {
    e.preventDefault();
    if (otp.length !== 6) {
      setMessage('Please enter all 6 digits');
      setMessageType('error');
      return;
    }
    setMessage('');
    setMessageType('');
    setIsProcessing(true);
    setMessage('Scheduling your payment...');
    setMessageType('info');
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/verify-otp.php`,
        { user_id: getUserId(), otp_code: otp },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setMessage(response.data.message || 'Scheduled payment created successfully!');
      setMessageType('success');
      setOtpSent(false);
      setStep(3);
      setShowSuccess(true);
      setTransactionDetails({
        ...form,
        date: new Date().toLocaleString(),
        status: 'Scheduled',
        reference: 'SCH' + Math.floor(Math.random() * 1000000000),
      });
      resetForm();
      if (onTransactionSuccess) setTimeout(() => onTransactionSuccess(), 1000);
    } catch (error) {
      setMessage('Invalid or expired OTP.');
      setMessageType('error');
    }
    setIsProcessing(false);
  };

  const handleCancelPayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to cancel this scheduled payment?')) {
      try {
        setScheduledPayments(prev => prev.filter(p => p.id !== paymentId));
        setMessage('Scheduled payment cancelled successfully.');
        setMessageType('success');
      } catch (error) {
        setMessage('Failed to cancel payment. Please try again.');
        setMessageType('error');
      }
    }
  };

  const resetForm = () => {
    setForm({
      from_account: getAccountNumber(),
      payment_type: 'transfer',
      recipient_name: '',
      to_account: '',
      amount: '',
      start_date: '',
      end_date: '',
      frequency: 'once',
      description: '',
      auto_deduct: true,
      notification: true,
    });
    setStep(1);
    setOtpSent(false);
    setOtp('');
    setOtpDigits(['', '', '', '', '', '']);
    setResendTimer(120);
    setCanResend(false);
    setMessage('');
    setMessageType('');
    setShowSuccess(false);
  };

  const selectedPaymentType = paymentTypes.find(t => t.value === form.payment_type);
  const selectedFrequency = frequencyOptions.find(f => f.value === form.frequency);
  const amount = parseFloat(form.amount) || 0;
  const balance = parseFloat(account?.balance || 15750.50);

  // ==========================================
  // SUCCESS SCREEN
  // ==========================================
  if (showSuccess && transactionDetails) {
    return (
      <div style={{
        minHeight: '100vh',
        background: dark ? '#0d0d0d' : '#f0f4f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
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
          background: colors.card,
          borderRadius: 24,
          boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
          padding: 40,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          border: `1px solid ${colors.cardBorder}`,
          animation: 'fadeSlideUp 0.5s ease',
        }}>
          {/* Success Icon */}
          <div style={{
            width: 90,
            height: 90,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 40,
            animation: 'successPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: '0 10px 30px rgba(34,197,94,0.4)',
          }}>
            📅
          </div>

          <h2 style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#22c55e',
            margin: '0 0 6px',
          }}>
            Payment Scheduled!
          </h2>
          <p style={{ color: colors.textMuted, margin: '0 0 28px', fontSize: 15 }}>
            Your payment has been scheduled successfully
          </p>

          {/* Reference Badge */}
          <div style={{
            background: dark ? '#0a0a1a' : '#f0fdf4',
            borderRadius: 12,
            padding: '10px 20px',
            marginBottom: 24,
            display: 'inline-block',
            border: '1px solid rgba(34,197,94,0.3)',
          }}>
            <span style={{ color: colors.textMuted, fontSize: 12 }}>Reference: </span>
            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>
              {transactionDetails.reference}
            </span>
          </div>

          {/* Transaction Details */}
          <div style={{
            background: dark ? '#0f0f2a' : '#f8fafc',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            textAlign: 'left',
            border: `1px solid ${colors.cardBorder}`,
          }}>
            {[
              { label: '📅 Scheduled Date', value: transactionDetails.date },
              { label: `${selectedPaymentType?.icon || '🔄'} Payment Type`, value: selectedPaymentType?.label || transactionDetails.payment_type },
              { label: '💳 From Account', value: transactionDetails.from_account },
              { label: '🔢 To Account', value: transactionDetails.to_account },
              transactionDetails.recipient_name && { label: '👤 Recipient', value: transactionDetails.recipient_name },
              { label: '💰 Amount', value: `$${parseFloat(transactionDetails.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
              { label: '🔁 Frequency', value: selectedFrequency?.label || transactionDetails.frequency },
              { label: '📆 Start Date', value: transactionDetails.start_date },
              transactionDetails.end_date && { label: '📆 End Date', value: transactionDetails.end_date },
              transactionDetails.description && { label: '📝 Description', value: transactionDetails.description },
            ].filter(Boolean).map((row, i, arr) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '10px 0',
                borderBottom: i < arr.length - 1 ? `1px solid ${dark ? '#2a2a4a' : '#f0f0f0'}` : 'none',
                gap: 12,
                animation: `fadeSlideUp 0.4s ease ${i * 0.05}s both`,
              }}>
                <span style={{ color: colors.textMuted, fontSize: 13, flexShrink: 0 }}>{row.label}</span>
                <span style={{
                  fontWeight: 600,
                  color: row.label.includes('Amount') ? '#22c55e' : colors.text,
                  fontSize: 13,
                  textAlign: 'right',
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(34,197,94,0.12)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 50,
            padding: '8px 20px',
            marginBottom: 24,
          }}>
            <div style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              animation: 'pulse 1.5s infinite',
            }} />
            <span style={{ color: '#22c55e', fontWeight: 600, fontSize: 14 }}>
              Scheduled
            </span>
          </div>

          <button
            onClick={resetForm}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.target.style.transform = 'translateY(0)'}
          >
            + Schedule Another Payment
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div style={{
      minHeight: '100vh',
      background: dark
        ? 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #0d0d0d 100%)'
        : 'linear-gradient(135deg, #1e3c7d 0%, #2563eb 50%, #1e3c7d 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '30px 20px 60px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes slideIn {
          from { width: 0; }
          to { width: 80%; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
        @keyframes shimmer {
          from { background-position: -200% center; }
          to { background-position: 200% center; }
        }
        @keyframes otpPop {
          0% { transform: scale(0.9); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .sched-card:hover { transform: translateY(-1px); }
        input::placeholder, textarea::placeholder { color: #9ca3af; }
        select option { background: white; color: #1a1a1a; }
        .otp-input:focus { border-color: #2563eb !important; transform: scale(1.05); }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.4) !important; }
        .action-btn:active { transform: translateY(0); }
        .cancel-btn:hover { background: rgba(255,255,255,0.15) !important; }
        .tab-btn:hover { background: rgba(255,255,255,0.15) !important; }
        .payment-card:hover { border-color: #2563eb !important; transform: translateY(-2px); }
      `}</style>

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: 28,
        animation: 'fadeSlideUp 0.5s ease',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 30,
          margin: '0 auto 12px',
          border: '2px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          📅
        </div>
        <h1 style={{
          color: '#fff',
          fontSize: 26,
          fontWeight: 800,
          margin: '0 0 6px',
          textShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}>
          Scheduled Payments
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 14,
          margin: 0,
        }}>
          Automate your payments with ease
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: 4,
        marginBottom: 28,
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        {[
          { key: 'create', label: '✨ Create Payment', icon: '📋' },
          { key: 'manage', label: '📂 Manage Payments', icon: '⚙️' },
        ].map(tab => (
          <button
            key={tab.key}
            className="tab-btn"
            onClick={() => { setActiveTab(tab.key); setMessage(''); }}
            style={{
              padding: '12px 28px',
              border: 'none',
              borderRadius: 12,
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #1e3c7d, #2563eb)'
                : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.6)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: activeTab === tab.key
                ? '0 4px 15px rgba(37,99,235,0.4)'
                : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== CREATE TAB ==================== */}
      {activeTab === 'create' && (
        <div style={{
          maxWidth: 680,
          width: '100%',
          animation: animateIn ? 'fadeSlideUp 0.4s ease' : 'none',
        }}>
          {/* Step Indicator */}
          <StepIndicator currentStep={step} />

          {/* ==================== STEP 1: FORM ==================== */}
          {step === 1 && (
            <form onSubmit={handleSubmit}>

              {/* Card 1: Payment Details */}
              <div className="sched-card" style={{
                background: colors.card,
                borderRadius: 20,
                padding: 28,
                marginBottom: 16,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: dark
                  ? '0 8px 32px rgba(0,0,0,0.3)'
                  : '0 4px 20px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}>
                {/* Section Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 22,
                  paddingBottom: 14,
                  borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 16,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                  }}>
                    💳
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: colors.sectionTitle, fontSize: 16, fontWeight: 700 }}>
                      Payment Details
                    </h3>
                    <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
                      Configure your scheduled payment
                    </p>
                  </div>
                </div>

                {/* From Account */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 8, fontSize: 13, fontWeight: 600,
                    color: dark ? '#8892b0' : '#555',
                  }}>
                    💳 From Account
                  </label>
                  <input
                    type="text"
                    value={form.from_account}
                    readOnly
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 10,
                      border: `2px solid ${colors.inputBorder}`,
                      fontSize: 15, boxSizing: 'border-box',
                      background: dark ? '#0f0f2a' : '#f8fafc',
                      color: colors.text, cursor: 'not-allowed', fontWeight: 600,
                    }}
                  />
                  <p style={{ margin: '5px 0 0', fontSize: 11, color: dark ? '#6b7280' : '#9ca3af' }}>
                    💰 Balance: ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                {/* Payment Type Cards */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 12, fontSize: 13, fontWeight: 600,
                    color: dark ? '#8892b0' : '#555',
                  }}>
                    📋 Payment Type
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 10,
                  }}>
                    {paymentTypes.map(type => (
                      <label
                        key={type.value}
                        className="payment-card"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '16px 12px',
                          borderRadius: 14,
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          border: form.payment_type === type.value
                            ? '2px solid #2563eb'
                            : `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                          background: form.payment_type === type.value
                            ? dark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.05)'
                            : dark ? '#0f0f2a' : '#fafafa',
                          boxShadow: form.payment_type === type.value
                            ? '0 4px 15px rgba(37,99,235,0.2)'
                            : '0 1px 3px rgba(0,0,0,0.04)',
                          textAlign: 'center',
                        }}
                      >
                        <input
                          type="radio"
                          name="payment_type"
                          value={type.value}
                          checked={form.payment_type === type.value}
                          onChange={handleChange}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: form.payment_type === type.value
                            ? type.gradient : dark ? '#1a1a2e' : '#f0f4f8',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 18,
                          marginBottom: 8,
                          boxShadow: form.payment_type === type.value
                            ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                          transition: 'all 0.2s ease',
                        }}>
                          {type.icon}
                        </div>
                        <span style={{
                          fontWeight: 700, fontSize: 12,
                          color: form.payment_type === type.value
                            ? colors.accent : colors.text,
                          marginBottom: 2,
                        }}>
                          {type.label}
                        </span>
                        <span style={{
                          fontSize: 10, color: colors.textMuted, lineHeight: 1.3,
                        }}>
                          {type.desc}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Recipient Info */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16,
                  marginBottom: 16,
                }}>
                  <AnimatedInput
                    label="Recipient Name"
                    icon="👤"
                    type="text"
                    name="recipient_name"
                    value={form.recipient_name}
                    onChange={handleChange}
                    required
                    placeholder="Enter recipient's name"
                    dark={dark}
                  />
                  <AnimatedInput
                    label="To Account Number"
                    icon="🔢"
                    type="text"
                    name="to_account"
                    value={form.to_account}
                    onChange={handleChange}
                    required
                    placeholder="Enter account number"
                    dark={dark}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 8, fontSize: 13, fontWeight: 600,
                    color: dark ? '#8892b0' : '#555',
                  }}>
                    💵 Amount (USD)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 14, top: '50%',
                      transform: 'translateY(-50%)',
                      fontWeight: 700, color: dark ? '#6b7280' : '#9ca3af', fontSize: 16,
                    }}>$</span>
                    <input
                      type="number"
                      name="amount"
                      value={form.amount}
                      onChange={handleChange}
                      required
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      style={{
                        width: '100%', padding: '13px 16px 13px 28px',
                        borderRadius: 10,
                        border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                        fontSize: 18, fontWeight: 700, boxSizing: 'border-box',
                        background: dark ? '#16213e' : '#ffffff',
                        color: colors.text, outline: 'none',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Schedule Settings */}
              <div className="sched-card" style={{
                background: colors.card,
                borderRadius: 20,
                padding: 28,
                marginBottom: 16,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: dark
                  ? '0 8px 32px rgba(0,0,0,0.3)'
                  : '0 4px 20px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s ease',
              }}>
                {/* Section Header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 22, paddingBottom: 14,
                  borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 16,
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                  }}>
                    ⏰
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: dark ? '#34d399' : '#059669', fontSize: 16, fontWeight: 700 }}>
                      Schedule Settings
                    </h3>
                    <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
                      Set frequency and dates
                    </p>
                  </div>
                </div>

                {/* Frequency Selector */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 8, fontSize: 13, fontWeight: 600,
                    color: dark ? '#8892b0' : '#555',
                  }}>
                    🔁 Payment Frequency
                  </label>
                  <select
                    name="frequency"
                    value={form.frequency}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 10,
                      border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                      fontSize: 15, boxSizing: 'border-box',
                      background: dark ? '#16213e' : '#ffffff',
                      color: colors.text, cursor: 'pointer', outline: 'none',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                      paddingRight: 40,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  >
                    {frequencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: form.frequency !== 'once'
                    ? 'repeat(auto-fit, minmax(200px, 1fr))' : '1fr',
                  gap: 16,
                  marginBottom: 18,
                }}>
                  <AnimatedInput
                    label="Start Date"
                    icon="📆"
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    required
                    min={getMinDate()}
                    dark={dark}
                  />
                  {form.frequency !== 'once' && (
                    <AnimatedInput
                      label="End Date (Optional)"
                      icon="📆"
                      type="date"
                      name="end_date"
                      value={form.end_date}
                      onChange={handleChange}
                      min={form.start_date || getMinDate()}
                      dark={dark}
                    />
                  )}
                </div>

                {/* Description */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 8, fontSize: 13, fontWeight: 600,
                    color: dark ? '#8892b0' : '#555',
                  }}>
                    📝 Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Add any notes for this scheduled payment..."
                    rows={3}
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 10,
                      border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                      fontSize: 14, boxSizing: 'border-box',
                      background: dark ? '#16213e' : '#ffffff',
                      color: colors.text, outline: 'none',
                      resize: 'vertical', fontFamily: 'inherit',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                  />
                </div>

                {/* Toggle Switches */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  {[
                    { name: 'auto_deduct', label: 'Automatically deduct from account', icon: '⚡', checked: form.auto_deduct },
                    { name: 'notification', label: 'Send payment notifications', icon: '🔔', checked: form.notification },
                  ].map(toggle => (
                    <label
                      key={toggle.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderRadius: 12,
                        cursor: 'pointer',
                        background: toggle.checked
                          ? dark ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.05)'
                          : dark ? '#0f0f2a' : '#fafafa',
                        border: `1px solid ${toggle.checked
                          ? 'rgba(37,99,235,0.3)' : dark ? '#2a2a4a' : '#e5e7eb'}`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{
                        width: 44, height: 24, borderRadius: 12,
                        background: toggle.checked
                          ? 'linear-gradient(135deg, #1e3c7d, #2563eb)' : dark ? '#2a2a4a' : '#d1d5db',
                        position: 'relative', transition: 'all 0.3s ease',
                        boxShadow: toggle.checked ? '0 2px 8px rgba(37,99,235,0.3)' : 'none',
                      }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute', top: 3,
                          left: toggle.checked ? 23 : 3,
                          transition: 'left 0.3s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }} />
                        <input
                          type="checkbox"
                          name={toggle.name}
                          checked={toggle.checked}
                          onChange={handleChange}
                          style={{ display: 'none' }}
                        />
                      </div>
                      <span style={{ fontSize: 16 }}>{toggle.icon}</span>
                      <span style={{
                        fontSize: 14, fontWeight: 600,
                        color: toggle.checked ? colors.accent : colors.textMuted,
                        transition: 'color 0.2s ease',
                      }}>
                        {toggle.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Card 3: Payment Summary */}
              <div style={{
                background: dark
                  ? 'linear-gradient(135deg, #1a1a2e, #0f0f2a)'
                  : 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                borderRadius: 20,
                padding: 24,
                marginBottom: 20,
                boxShadow: '0 8px 32px rgba(37,99,235,0.3)',
                animation: 'fadeSlideUp 0.4s ease 0.2s both',
              }}>
                <h3 style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: 13, fontWeight: 600,
                  margin: '0 0 16px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}>
                  📋 Payment Summary
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 16,
                }}>
                  {[
                    { label: 'Type', value: selectedPaymentType?.label || '—', icon: selectedPaymentType?.icon || '🔄' },
                    { label: 'From', value: form.from_account, icon: '💳' },
                    { label: 'To', value: form.to_account || '—', icon: '🔢' },
                    { label: 'Frequency', value: selectedFrequency?.label || '—', icon: '🔁' },
                    { label: 'Start', value: form.start_date || '—', icon: '📆' },
                    { label: 'Fee', value: '$0.00', icon: '🏷️' },
                  ].map((item, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 10,
                      padding: '10px 14px',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>
                        {item.icon} {item.label}
                      </div>
                      <div style={{
                        color: '#fff', fontWeight: 700, fontSize: 13,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Total Amount</span>
                  <span style={{
                    color: '#fff', fontWeight: 800, fontSize: 26,
                    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                  }}>
                    ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: 12,
                  marginBottom: 16,
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  animation: 'fadeSlideUp 0.3s ease',
                  background: messageType === 'error'
                    ? 'rgba(239,68,68,0.12)'
                    : messageType === 'success'
                    ? 'rgba(34,197,94,0.12)'
                    : 'rgba(59,130,246,0.12)',
                  border: `1px solid ${messageType === 'error' ? 'rgba(239,68,68,0.3)' : messageType === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  color: messageType === 'error' ? '#ef4444' : messageType === 'success' ? '#22c55e' : '#60a5fa',
                }}>
                  {messageType === 'error' ? '⚠️' : messageType === 'success' ? '✅' : 'ℹ️'}
                  {message}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => window.history.back()}
                  style={{
                    flex: 1,
                    padding: '15px',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  ← Cancel
                </button>
                <button
                  type="submit"
                  className="action-btn"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '15px',
                    background: loading
                      ? 'rgba(255,255,255,0.2)'
                      : 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,94,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {loading ? (
                    <>
                      <span style={{
                        width: 18, height: 18,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid white',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      Sending OTP...
                    </>
                  ) : (
                    <>📧 Send OTP to Email</>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ==================== STEP 2: OTP ==================== */}
          {step === 2 && (
            <div style={{ animation: 'fadeSlideUp 0.4s ease' }}>
              <div style={{
                background: colors.card,
                borderRadius: 24,
                padding: 36,
                border: `1px solid ${colors.cardBorder}`,
                boxShadow: dark
                  ? '0 20px 60px rgba(0,0,0,0.4)'
                  : '0 10px 40px rgba(0,0,0,0.08)',
                textAlign: 'center',
              }}>
                {/* OTP Icon */}
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px', fontSize: 32,
                  boxShadow: '0 8px 25px rgba(37,99,235,0.35)',
                  animation: 'pulse 2s infinite',
                }}>
                  📧
                </div>

                <h2 style={{
                  color: colors.text, fontSize: 22,
                  fontWeight: 800, margin: '0 0 8px',
                }}>
                  Check Your Email
                </h2>
                <p style={{
                  color: colors.textMuted, fontSize: 14,
                  margin: '0 0 24px', lineHeight: 1.6,
                }}>
                  We've sent a 6-digit verification code to your email.
                  Enter it below to confirm your scheduled payment.
                </p>

                {/* Mini Transaction Summary */}
                <div style={{
                  background: dark ? '#0f0f2a' : '#f8fafc',
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 24,
                  border: `1px solid ${colors.cardBorder}`,
                  textAlign: 'left',
                }}>
                  {[
                    { label: 'Recipient', value: form.recipient_name, icon: '👤' },
                    { label: 'Type', value: selectedPaymentType?.label, icon: selectedPaymentType?.icon },
                    { label: 'Amount', value: `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💰', highlight: true },
                  ].map((row, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: i < 2 ? `1px solid ${dark ? '#2a2a4a' : '#f0f0f0'}` : 'none',
                    }}>
                      <span style={{ color: dark ? '#6b7280' : '#9ca3af', fontSize: 13 }}>
                        {row.icon} {row.label}
                      </span>
                      <span style={{
                        fontWeight: 700, fontSize: 13,
                        color: row.highlight ? '#2563eb' : colors.text,
                      }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Timer */}
                {resendTimer > 0 && !canResend && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: resendTimer < 30
                      ? 'rgba(239,68,68,0.1)'
                      : 'rgba(37,99,235,0.08)',
                    border: `1px solid ${resendTimer < 30 ? 'rgba(239,68,68,0.3)' : 'rgba(37,99,235,0.2)'}`,
                    borderRadius: 50,
                    padding: '8px 20px',
                    marginBottom: 24,
                    fontSize: 14,
                    fontWeight: 600,
                    color: resendTimer < 30 ? '#ef4444' : dark ? '#818cf8' : '#1e3c7d',
                    transition: 'all 0.3s ease',
                  }}>
                    <span style={{ animation: 'pulse 1s infinite' }}>⏱️</span>
                    Resend in {formatTime(resendTimer)}
                  </div>
                )}

                {/* OTP Digit Boxes */}
                <form onSubmit={handleOtpSubmit}>
                  <div style={{
                    display: 'flex', gap: 10,
                    justifyContent: 'center', marginBottom: 28,
                  }}>
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => otpRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpDigit(index, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(index, e)}
                        className="otp-input"
                        style={{
                          width: 52, height: 60,
                          textAlign: 'center',
                          fontSize: 24, fontWeight: 800,
                          borderRadius: 12,
                          border: `2px solid ${digit
                            ? '#2563eb'
                            : dark ? '#2a2a4a' : '#e5e7eb'}`,
                          background: digit
                            ? dark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.05)'
                            : dark ? '#16213e' : '#ffffff',
                          color: colors.text,
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          boxShadow: digit ? '0 0 0 4px rgba(37,99,235,0.1)' : 'none',
                          animation: digit ? 'otpPop 0.2s ease' : 'none',
                        }}
                      />
                    ))}
                  </div>

                  {/* Message */}
                  {message && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: 10,
                      marginBottom: 16,
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      animation: 'fadeSlideUp 0.3s ease',
                      background: messageType === 'error'
                        ? 'rgba(239,68,68,0.1)'
                        : messageType === 'success'
                        ? 'rgba(34,197,94,0.1)'
                        : 'rgba(59,130,246,0.1)',
                      border: `1px solid ${messageType === 'error' ? 'rgba(239,68,68,0.3)' : messageType === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
                      color: messageType === 'error' ? '#ef4444' : messageType === 'success' ? '#22c55e' : '#60a5fa',
                    }}>
                      {messageType === 'error' ? '⚠️' : messageType === 'success' ? '✅' : 'ℹ️'}
                      {message}
                    </div>
                  )}

                  {/* Confirm Button */}
                  <button
                    type="submit"
                    className="action-btn"
                    disabled={isProcessing || otp.length !== 6}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: (isProcessing || otp.length !== 6)
                        ? dark ? '#2a2a4a' : '#e5e7eb'
                        : 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                      color: (isProcessing || otp.length !== 6)
                        ? dark ? '#6b7280' : '#9ca3af'
                        : '#fff',
                      border: 'none',
                      borderRadius: 14,
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: (isProcessing || otp.length !== 6) ? 'not-allowed' : 'pointer',
                      marginBottom: 12,
                      transition: 'all 0.2s ease',
                      boxShadow: (isProcessing || otp.length !== 6)
                        ? 'none'
                        : '0 4px 20px rgba(37,99,235,0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {isProcessing ? (
                      <>
                        <span style={{
                          width: 18, height: 18,
                          border: '2px solid rgba(255,255,255,0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: 'spin 0.8s linear infinite',
                        }} />
                        Scheduling Payment...
                      </>
                    ) : (
                      <>🔐 Confirm Schedule</>
                    )}
                  </button>

                  {/* Secondary Buttons */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendLoading || !canResend}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'transparent',
                        color: dark ? '#818cf8' : '#1e3c7d',
                        border: `2px solid ${dark ? '#3b4fd8' : '#1e3c7d'}`,
                        borderRadius: 12,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: (resendLoading || !canResend) ? 'not-allowed' : 'pointer',
                        opacity: (resendLoading || !canResend) ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      {resendLoading ? (
                        <>
                          <span style={{
                            width: 14, height: 14,
                            border: '2px solid rgba(129,140,248,0.3)',
                            borderTop: '2px solid #818cf8',
                            borderRadius: '50%',
                            display: 'inline-block',
                            animation: 'spin 0.8s linear infinite',
                          }} />
                          Sending...
                        </>
                      ) : '🔄 Resend OTP'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep(1); setOtpSent(false); setMessage(''); }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: 'transparent',
                        color: dark ? '#6b7280' : '#64748b',
                        border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                        borderRadius: 12,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      ← Go Back
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== MANAGE TAB ==================== */}
      {activeTab === 'manage' && (
        <div style={{
          maxWidth: 680,
          width: '100%',
          animation: 'fadeSlideUp 0.4s ease',
        }}>
          <div style={{
            background: colors.card,
            borderRadius: 20,
            padding: 28,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: dark
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 4px 20px rgba(0,0,0,0.06)',
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
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16,
                boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
              }}>
                📂
              </div>
              <div>
                <h3 style={{ margin: 0, color: dark ? '#a78bfa' : '#7c3aed', fontSize: 16, fontWeight: 700 }}>
                  Your Scheduled Payments
                </h3>
                <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
                  View and manage your automated payments
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loadingPayments ? (
              <div style={{ textAlign: 'center', padding: 50 }}>
                <div style={{
                  width: 50, height: 50,
                  border: `4px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                  borderTop: '4px solid #2563eb',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px',
                }} />
                <p style={{ color: colors.textMuted, fontSize: 15, fontWeight: 600 }}>
                  Loading scheduled payments...
                </p>
              </div>
            ) : scheduledPayments.length === 0 ? (
              /* Empty State */
              <div style={{
                textAlign: 'center',
                padding: '50px 20px',
              }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: dark ? '#0f0f2a' : '#f0f4f8',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px', fontSize: 36,
                  border: `2px dashed ${dark ? '#2a2a4a' : '#d1d5db'}`,
                }}>
                  📅
                </div>
                <h3 style={{
                  margin: '0 0 8px',
                  fontSize: 18, fontWeight: 700,
                  color: colors.text,
                }}>
                  No Scheduled Payments
                </h3>
                <p style={{
                  color: colors.textMuted, fontSize: 14,
                  margin: '0 0 24px', lineHeight: 1.6,
                }}>
                  Create your first scheduled payment using the "Create Payment" tab.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  style={{
                    padding: '12px 28px',
                    background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.target.style.transform = 'translateY(0)'}
                >
                  ✨ Create Payment
                </button>
              </div>
            ) : (
              /* Payment Cards */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {scheduledPayments.map((payment, index) => (
                  <div
                    key={payment.id}
                    style={{
                      borderRadius: 16,
                      padding: 20,
                      background: dark ? '#0f0f2a' : '#fafafa',
                      border: `1px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                      transition: 'all 0.25s ease',
                      animation: `fadeSlideUp 0.4s ease ${index * 0.1}s both`,
                    }}
                  >
                    {/* Top Row */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 16,
                    }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: payment.status === 'Active'
                            ? 'linear-gradient(135deg, #059669, #10b981)'
                            : 'linear-gradient(135deg, #d97706, #f59e0b)',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 20,
                          boxShadow: payment.status === 'Active'
                            ? '0 4px 12px rgba(16,185,129,0.3)'
                            : '0 4px 12px rgba(245,158,11,0.3)',
                        }}>
                          {payment.icon || '📋'}
                        </div>
                        <div>
                          <div style={{
                            fontWeight: 700, fontSize: 16,
                            color: colors.text, marginBottom: 2,
                          }}>
                            {payment.type}
                          </div>
                          <div style={{
                            color: colors.textMuted, fontSize: 13,
                          }}>
                            {payment.recipient}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{
                          fontWeight: 800, fontSize: 20,
                          color: dark ? '#818cf8' : '#1e3c7d',
                          marginBottom: 4,
                        }}>
                          ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '3px 10px',
                          borderRadius: 50,
                          fontSize: 11,
                          fontWeight: 700,
                          background: payment.status === 'Active'
                            ? 'rgba(34,197,94,0.12)'
                            : 'rgba(245,158,11,0.12)',
                          color: payment.status === 'Active' ? '#22c55e' : '#f59e0b',
                          border: `1px solid ${payment.status === 'Active'
                            ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                        }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: payment.status === 'Active' ? '#22c55e' : '#f59e0b',
                          }} />
                          {payment.status}
                        </div>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 10,
                      marginBottom: 16,
                    }}>
                      <div style={{
                        background: dark ? '#1a1a2e' : '#f0f4f8',
                        borderRadius: 10, padding: '10px 14px',
                      }}>
                        <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                          📆 Next Payment
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>
                          {payment.next_date}
                        </div>
                      </div>
                      <div style={{
                        background: dark ? '#1a1a2e' : '#f0f4f8',
                        borderRadius: 10, padding: '10px 14px',
                      }}>
                        <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                          🔁 Frequency
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>
                          {payment.frequency}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => handleCancelPayment(payment.id)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'rgba(239,68,68,0.08)',
                          color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 10,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                        onMouseOver={e => {
                          e.target.style.background = 'rgba(239,68,68,0.15)';
                        }}
                        onMouseOut={e => {
                          e.target.style.background = 'rgba(239,68,68,0.08)';
                        }}
                      >
                        🗑️ Cancel
                      </button>
                      <button
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'rgba(37,99,235,0.08)',
                          color: colors.accent,
                          border: `1px solid rgba(37,99,235,0.3)`,
                          borderRadius: 10,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                        onMouseOver={e => {
                          e.target.style.background = 'rgba(37,99,235,0.15)';
                        }}
                        onMouseOut={e => {
                          e.target.style.background = 'rgba(37,99,235,0.08)';
                        }}
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Message in manage tab */}
            {message && activeTab === 'manage' && (
              <div style={{
                padding: '14px 18px',
                borderRadius: 12,
                marginTop: 16,
                fontWeight: 600,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                animation: 'fadeSlideUp 0.3s ease',
                background: messageType === 'error'
                  ? 'rgba(239,68,68,0.12)'
                  : 'rgba(34,197,94,0.12)',
                border: `1px solid ${messageType === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                color: messageType === 'error' ? '#ef4444' : '#22c55e',
              }}>
                {messageType === 'error' ? '⚠️' : '✅'}
                {message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}