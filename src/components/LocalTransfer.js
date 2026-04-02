import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../config';

const banks = [
  { value: 'Bank of America', icon: '🏦' },
  { value: 'JPMorgan Chase', icon: '🏛️' },
  { value: 'Wells Fargo', icon: '🏦' },
  { value: 'Citibank', icon: '🌐' },
  { value: 'U.S. Bank', icon: '🇺🇸' },
  { value: 'PNC Bank', icon: '🏦' },
  { value: 'Truist', icon: '💼' },
  { value: 'TD Bank', icon: '🏦' },
  { value: 'Capital One', icon: '💳' },
  { value: 'Other', icon: '➕' },
];

// ==========================================
// STEP INDICATOR — 4 Steps
// ==========================================
function StepIndicator({ currentStep }) {
  const steps = [
    { num: 1, label: 'Transfer Details', icon: '📋' },
    { num: 2, label: 'Confirm', icon: '✔️' },
    { num: 3, label: 'Verify OTP', icon: '🔐' },
    { num: 4, label: 'Completed', icon: '✅' },
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
      width: '100%',
      maxWidth: 600,
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
              fontSize: 10,
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
              margin: '0 6px',
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
// ANIMATED INPUT
// ==========================================
function AnimatedInput({ label, icon, error, hint, ...props }) {
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
          onFocus={(e) => { setFocused(true); props.onFocus && props.onFocus(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur && props.onBlur(e); }}
          style={{
            width: '100%',
            padding: '13px 16px',
            borderRadius: 10,
            border: `2px solid ${error ? '#ef4444' : focused ? '#2563eb' : '#e5e7eb'}`,
            fontSize: 15,
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'all 0.25s ease',
            background: props.readOnly ? '#f8fafc' : '#fff',
            color: '#1a1a1a',
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
// MAIN COMPONENT
// ==========================================
export default function LocalTransfer({ user, account, onTransactionSuccess, isDarkMode, onSendOTP }) {

  const getAccountNumber = () => {
    if (account && (account.account_number || account.accountNumber)) {
      return account.account_number || account.accountNumber;
    }
    try {
      const storedUser = JSON.parse(
        localStorage.getItem('bankingUser') ||
        localStorage.getItem('userInfo') || '{}'
      );
      if (storedUser?.account_number) return storedUser.account_number;
      if (storedUser?.accountNumber) return storedUser.accountNumber;
    } catch (e) {}
    return '1234567890';
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

  const [form, setForm] = useState({
    from_account: getAccountNumber(),
    recipient_bank: banks[0].value,
    recipient_name: '',
    recipient_address: '',
    to_account: '',
    amount: '',
    purpose: '',
    description: '',
  });

  const [customBankName, setCustomBankName] = useState('');
  // Steps: 1=Form, 2=Confirmation, 3=OTP, 4=Success
  const [step, setStep] = useState(1);
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

  useEffect(() => {
    setForm(f => ({ ...f, from_account: getAccountNumber() }));
  }, [account]);

  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) { setOtpExpired(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

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

  const getActualBankName = () =>
    form.recipient_bank === 'Other' ? customBankName.trim() : form.recipient_bank;

  const validateForm = () => {
    const { from_account, to_account, amount, recipient_name, recipient_address, purpose } = form;

    if (!from_account || !to_account || !amount || !recipient_name || !recipient_address || !purpose) {
      setMessage('Please fill in all required fields');
      setMessageType('error');
      return false;
    }

    if (form.recipient_bank === 'Other' && !customBankName.trim()) {
      setMessage('Please enter the bank name');
      setMessageType('error');
      return false;
    }

    if (from_account === to_account) {
      setMessage('Cannot transfer to the same account');
      setMessageType('error');
      return false;
    }

    if (parseFloat(amount) <= 0) {
      setMessage('Amount must be greater than 0');
      setMessageType('error');
      return false;
    }

    if (parseFloat(amount) > parseFloat(account?.balance || 15750.50)) {
      setMessage('Insufficient funds');
      setMessageType('error');
      return false;
    }

    return true;
  };

  // Step 1 → Step 2: Validate form & go to Confirmation
  const handleGoToConfirmation = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setMessage('');
    setMessageType('');
    setStep(2);
  };

  // Step 2 → Step 3: Send OTP from Confirmation page
  const handleConfirmAndSendOTP = async () => {
    const actualForm = {
      ...form,
      recipient_bank: getActualBankName()
    };

    setMessage('');
    setMessageType('');
    setLoading(true);

    try {
      const newSessionToken = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      setSessionToken(newSessionToken);

      if (onSendOTP) {
        setMessage('Sending OTP...');
        setMessageType('info');
        await onSendOTP(actualForm);
        setOtpSent(true);
        setStep(3);
        setOtpTimer(300);
        setOtpExpired(false);
        setMessage('OTP sent to your email!');
        setMessageType('success');
      } else {
        const response = await axios.post(
          `${config.API_BASE_URL}/request-otp.php`,
          {
            user_id: getUserId(),
            session_token: newSessionToken,
            transaction_data: {
              ...actualForm,
              transaction_type: "local_transfer",
              timestamp: Date.now()
            }
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
        );

        if (response.data.success) {
          setOtpSent(true);
          setStep(3);
          setOtpTimer(300);
          setOtpExpired(false);
          setMessage('OTP sent to your email!');
          setMessageType('success');
          if (response.data.otp) {
            alert(`Development Mode OTP: ${response.data.otp}`);
          }
        } else {
          setMessage(response.data.message || 'Failed to send OTP.');
          setMessageType('error');
        }
      }
    } catch (error) {
      setMessage('Failed to send OTP. Please check your connection.');
      setMessageType('error');
      setRetryCount(prev => prev + 1);
    }
    setLoading(false);
  };

  // Handle OTP digit input
  const handleOtpDigit = (index, value) => {
    const newDigits = [...otpDigits];
    newDigits[index] = value.replace(/\D/g, '').slice(-1);
    setOtpDigits(newDigits);
    setOtp(newDigits.join(''));

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || '';
      }
      setOtpDigits(newDigits);
      setOtp(newDigits.join(''));
      const focusIndex = Math.min(pastedData.length, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  };

  // Step 3 → Step 4: Verify OTP and process transfer
  const handleOtpSubmit = async e => {
    e.preventDefault();

    if (otp.length !== 6) {
      setMessage('Please enter all 6 digits');
      setMessageType('error');
      return;
    }

    if (otpExpired || otpTimer <= 0) {
      setMessage('OTP has expired. Please request a new one.');
      setMessageType('error');
      return;
    }

    const actualForm = {
      ...form,
      recipient_bank: getActualBankName()
    };

    setMessage('');
    setIsProcessing(true);
    setMessage('Processing your transfer...');
    setMessageType('info');

    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/verify-otp.php`,
        {
          user_id: getUserId(),
          otp_code: otp,
          session_token: sessionToken,
          transaction_data: actualForm
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
      );

      const result = response.data;

      if (result.success) {
        setStep(4);
        setShowSuccess(true);
        setMessage('');
        setTransactionDetails({
          ...actualForm,
          date: new Date().toLocaleString(),
          status: 'Completed',
          reference: result.transaction_id || 'TRX' + Math.floor(Math.random() * 1000000000),
          amount_transferred: result.amount_transferred || form.amount,
          new_balance: result.new_balance
        });
        if (onTransactionSuccess) onTransactionSuccess();
        if (result.new_balance) {
          localStorage.setItem('accountBalance', result.new_balance.toString());
        }
      } else {
        handleTransferError(result);
      }
    } catch (error) {
      if (error.response?.data?.error_code) {
        handleTransferError(error.response.data);
      } else {
        setMessage('Network error. Please try again.');
        setMessageType('error');
      }
      setRetryCount(prev => prev + 1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTransferError = (result) => {
    const errors = {
      OTP_EXPIRED: ['OTP expired. Request a new one.', () => { setStep(2); setOtpSent(false); setOtp(''); setOtpDigits(['', '', '', '', '', '']); }],
      INVALID_OTP: ['Invalid OTP. Try again.', () => { setOtp(''); setOtpDigits(['', '', '', '', '', '']); }],
      INSUFFICIENT_FUNDS: ['Insufficient funds.', () => setStep(1)],
      DATA_MISMATCH: ['Data mismatch. Please start over.', resetForm],
      DUPLICATE_TRANSACTION: ['Duplicate transaction detected.', null],
      ACCOUNT_NOT_FOUND: ['Recipient account not found.', () => setStep(1)],
    };

    const [msg, action] = errors[result.error_code] || [result.message || 'Transfer failed.', null];
    setMessage(msg);
    setMessageType('error');
    if (action) action();
  };

  const resetForm = () => {
    setForm({
      from_account: getAccountNumber(),
      recipient_bank: banks[0].value,
      recipient_name: '',
      recipient_address: '',
      to_account: '',
      amount: '',
      purpose: '',
      description: '',
    });
    setCustomBankName('');
    setStep(1);
    setOtpSent(false);
    setOtp('');
    setOtpDigits(['', '', '', '', '', '']);
    setOtpTimer(0);
    setOtpExpired(false);
    setMessage('');
    setMessageType('');
    setRetryCount(0);
    setSessionToken('');
    setShowSuccess(false);
    setTransactionDetails(null);
  };

  const requestNewOTP = () => {
    setOtp('');
    setOtpDigits(['', '', '', '', '', '']);
    setOtpExpired(false);
    setMessage('');
    // Go back to confirmation to re-send OTP
    setStep(2);
    setOtpSent(false);
  };

  const amount = parseFloat(form.amount) || 0;
  const balance = parseFloat(account?.balance || 15750.50);
  const isOverBalance = amount > balance;
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

  // ==========================================
  // STEP 4: SUCCESS SCREEN
  // ==========================================
  if (showSuccess && transactionDetails) {
    return (
      <div style={{
        minHeight: '100vh',
        background: dark
          ? 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #0d0d0d 100%)'
          : 'linear-gradient(135deg, #1e3c7d 0%, #2563eb 50%, #1e3c7d 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <style>{`
          @keyframes successPop {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes checkDraw {
            0% { stroke-dashoffset: 50; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes ringPulse {
            0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
            70% { box-shadow: 0 0 0 20px rgba(34,197,94,0); }
            100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.2); }
          }
        `}</style>

        <StepIndicator currentStep={4} />

        <div style={{
          background: colors.card,
          borderRadius: 24,
          boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
          padding: '40px 36px',
          maxWidth: 520,
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
            fontSize: 42,
            animation: 'successPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), ringPulse 2s infinite',
            boxShadow: '0 10px 30px rgba(34,197,94,0.4)',
          }}>
            ✅
          </div>

          <h2 style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#22c55e',
            margin: '0 0 6px',
          }}>
            Transfer Successful!
          </h2>
          <p style={{ color: colors.textMuted, margin: '0 0 24px', fontSize: 15 }}>
            Your transaction has been approved and processed
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
            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 14, letterSpacing: '0.5px' }}>
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
              { label: '📊 Status', value: transactionDetails.status, color: '#22c55e' },
              { label: '📅 Date', value: transactionDetails.date },
              { label: '💳 From Account', value: transactionDetails.from_account },
              { label: '🏛️ Recipient Bank', value: transactionDetails.recipient_bank },
              { label: '👤 Recipient Name', value: transactionDetails.recipient_name },
              { label: '📍 Address', value: transactionDetails.recipient_address },
              { label: '🔢 Account No.', value: transactionDetails.to_account },
              { label: '💰 Amount', value: `$${parseFloat(transactionDetails.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: '#22c55e' },
              { label: '📌 Purpose', value: transactionDetails.purpose },
              transactionDetails.description && { label: '📝 Description', value: transactionDetails.description },
              transactionDetails.new_balance && { label: '💳 New Balance', value: `$${parseFloat(transactionDetails.new_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: '#2563eb' },
            ].filter(Boolean).map((row, i, arr) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '11px 0',
                borderBottom: i < arr.length - 1 ? `1px solid ${dark ? '#2a2a4a' : '#f0f0f0'}` : 'none',
                gap: 12,
                animation: `fadeSlideUp 0.4s ease ${i * 0.05}s both`,
              }}>
                <span style={{ color: colors.textMuted, fontSize: 13, flexShrink: 0 }}>{row.label}</span>
                <span style={{
                  fontWeight: 600,
                  color: row.color || colors.text,
                  fontSize: 13,
                  textAlign: 'right',
                  wordBreak: 'break-word',
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
              Transaction Completed
            </span>
          </div>

          <button
            onClick={resetForm}
            style={{
              width: '100%',
              padding: '15px',
              background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.target.style.transform = 'translateY(0)'}
          >
            + New Transfer
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
        @keyframes floatIn {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .transfer-card:hover { transform: translateY(-1px); }
        input::placeholder { color: #9ca3af; }
        select option { background: white; color: #1a1a1a; }
        .otp-input:focus { border-color: #2563eb !important; transform: scale(1.05); }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.4) !important; }
        .action-btn:active { transform: translateY(0); }
        .cancel-btn:hover { background: rgba(255,255,255,0.15) !important; }
        .confirm-row:hover { background: ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(37,99,235,0.03)'} !important; }
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
          🏦
        </div>
        <h1 style={{
          color: '#fff',
          fontSize: 26,
          fontWeight: 800,
          margin: '0 0 6px',
          textShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}>
          Local Transfer
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.7)',
          fontSize: 14,
          margin: 0,
        }}>
          Fast & secure domestic bank transfers
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={step} />

      {/* Main Content */}
      <div style={{
        maxWidth: 680,
        width: '100%',
        animation: animateIn ? 'fadeSlideUp 0.4s ease' : 'none',
      }}>

        {/* ==================== STEP 1: FORM ==================== */}
        {step === 1 && (
          <form onSubmit={handleGoToConfirmation}>

            {/* Card 1: Account & Bank Info */}
            <div className="transfer-card" style={{
              background: dark ? '#1a1a2e' : '#ffffff',
              borderRadius: 20,
              padding: 28,
              marginBottom: 16,
              border: `1px solid ${dark ? '#2a2a4a' : '#e8ecf0'}`,
              boxShadow: dark
                ? '0 8px 32px rgba(0,0,0,0.3)'
                : '0 4px 20px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 22,
                paddingBottom: 14,
                borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
              }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                }}>
                  🏦
                </div>
                <div>
                  <h3 style={{ margin: 0, color: dark ? '#818cf8' : '#1e3c7d', fontSize: 16, fontWeight: 700 }}>
                    Account & Bank Information
                  </h3>
                  <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
                    Select source and destination bank
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
              }}>
                <div>
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
                      border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                      fontSize: 15, boxSizing: 'border-box',
                      background: dark ? '#0f0f2a' : '#f8fafc',
                      color: dark ? '#e8eaf6' : '#1a1a2a',
                      cursor: 'not-allowed', fontWeight: 600,
                    }}
                  />
                  <p style={{ margin: '5px 0 0', fontSize: 11, color: dark ? '#6b7280' : '#9ca3af' }}>
                    💰 Balance: ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 8, fontSize: 13, fontWeight: 600,
                    color: dark ? '#8892b0' : '#555',
                  }}>
                    🏛️ Recipient Bank
                  </label>
                  <select
                    value={form.recipient_bank}
                    onChange={e => {
                      setForm({ ...form, recipient_bank: e.target.value });
                      if (e.target.value !== 'Other') setCustomBankName('');
                    }}
                    required
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
                    {banks.map(b => (
                      <option key={b.value} value={b.value}>
                        {b.icon} {b.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Other Bank Input */}
              {form.recipient_bank === 'Other' && (
                <div style={{
                  marginTop: 16, padding: 20,
                  background: dark
                    ? 'linear-gradient(135deg, #0f0f2a, #1a1a3a)'
                    : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                  borderRadius: 14,
                  border: `2px dashed ${dark ? '#3b4fd8' : '#93c5fd'}`,
                  animation: 'fadeSlideUp 0.3s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>🏦</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: dark ? '#818cf8' : '#1e3c7d', fontSize: 14 }}>
                        Enter Bank Name
                      </p>
                      <p style={{ margin: 0, color: dark ? '#6b7280' : '#64748b', fontSize: 12 }}>
                        Type the full name of the recipient's bank
                      </p>
                    </div>
                    <span style={{
                      marginLeft: 'auto', background: '#ef4444', color: '#fff',
                      borderRadius: 50, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                    }}>
                      REQUIRED
                    </span>
                  </div>
                  <input
                    type="text"
                    value={customBankName}
                    onChange={e => setCustomBankName(e.target.value)}
                    required
                    placeholder="e.g. First National Bank, City Savings Bank..."
                    maxLength={100}
                    autoFocus
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 10,
                      border: `2px solid ${customBankName.trim() ? '#22c55e' : dark ? '#3b4fd8' : '#93c5fd'}`,
                      fontSize: 15, boxSizing: 'border-box',
                      background: dark ? '#16213e' : '#ffffff',
                      color: dark ? '#e8eaf6' : '#1a1a2a',
                      outline: 'none',
                      boxShadow: '0 0 0 4px rgba(37,99,235,0.08)',
                      transition: 'border-color 0.2s ease',
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
                    <span style={{ color: customBankName.trim() ? '#22c55e' : dark ? '#6b7280' : '#64748b' }}>
                      {customBankName.trim() ? '✅ Bank name entered' : '⌨️ Start typing...'}
                    </span>
                    <span style={{ color: dark ? '#6b7280' : '#9ca3af' }}>
                      {customBankName.length}/100
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Recipient Information */}
            <div className="transfer-card" style={{
              background: dark ? '#1a1a2e' : '#ffffff',
              borderRadius: 20, padding: 28, marginBottom: 16,
              border: `1px solid ${dark ? '#2a2a4a' : '#e8ecf0'}`,
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
                }}>
                  👤
                </div>
                <div>
                  <h3 style={{ margin: 0, color: dark ? '#34d399' : '#059669', fontSize: 16, fontWeight: 700 }}>
                    Recipient Information
                  </h3>
                  <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
                    Enter the recipient's details
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16, marginBottom: 16,
              }}>
                <AnimatedInput
                  label="Recipient Full Name" icon="👤" type="text"
                  value={form.recipient_name}
                  onChange={e => setForm({ ...form, recipient_name: e.target.value })}
                  required placeholder="Enter recipient's full name"
                />
                <AnimatedInput
                  label="Account Number" icon="🔢" type="text"
                  value={form.to_account}
                  onChange={e => setForm({ ...form, to_account: e.target.value })}
                  required placeholder="Enter recipient's account number"
                />
              </div>
              <AnimatedInput
                label="Recipient Address" icon="📍" type="text"
                value={form.recipient_address}
                onChange={e => setForm({ ...form, recipient_address: e.target.value })}
                required placeholder="Enter recipient's full address"
              />
            </div>

            {/* Card 3: Transfer Details */}
            <div className="transfer-card" style={{
              background: dark ? '#1a1a2e' : '#ffffff',
              borderRadius: 20, padding: 28, marginBottom: 16,
              border: `1px solid ${dark ? '#2a2a4a' : '#e8ecf0'}`,
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
                  background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                }}>
                  💰
                </div>
                <div>
                  <h3 style={{ margin: 0, color: dark ? '#a78bfa' : '#7c3aed', fontSize: 16, fontWeight: 700 }}>
                    Transfer Details
                  </h3>
                  <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>
                    Specify amount and purpose
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16, marginBottom: 16,
              }}>
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
                      transform: 'translateY(-50%)', fontWeight: 700,
                      color: dark ? '#6b7280' : '#9ca3af', fontSize: 16,
                    }}>$</span>
                    <input
                      type="number" value={form.amount}
                      onChange={e => setForm({ ...form, amount: e.target.value })}
                      required min="1" step="0.01" placeholder="0.00"
                      style={{
                        width: '100%', padding: '13px 16px 13px 28px', borderRadius: 10,
                        border: `2px solid ${isOverBalance ? '#ef4444' : dark ? '#2a2a4a' : '#e5e7eb'}`,
                        fontSize: 18, fontWeight: 700, boxSizing: 'border-box',
                        background: dark ? '#16213e' : '#ffffff',
                        color: dark ? '#e8eaf6' : '#1a1a2a',
                        outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
                    <span style={{ color: dark ? '#6b7280' : '#9ca3af' }}>
                      Available: ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {isOverBalance && (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠️ Insufficient funds</span>
                    )}
                  </div>
                </div>

                <AnimatedInput
                  label="Transfer Purpose" icon="📌" type="text"
                  value={form.purpose}
                  onChange={e => setForm({ ...form, purpose: e.target.value })}
                  required placeholder="e.g. Rent payment, Invoice #123"
                />
              </div>

              <div>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 8, fontSize: 13, fontWeight: 600,
                  color: dark ? '#8892b0' : '#555',
                }}>
                  📝 Description <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Add any additional notes for the recipient..."
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

            {/* Message */}
            {message && (
              <div style={{
                padding: '14px 18px', borderRadius: 12, marginBottom: 16,
                fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 10,
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

            {/* Action Buttons → Goes to Confirmation */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                className="cancel-btn"
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
              >
                ← Cancel
              </button>
              <button
                type="submit"
                className="action-btn"
                disabled={isOverBalance}
                style={{
                  flex: 2, padding: '15px',
                  background: isOverBalance
                    ? 'rgba(255,255,255,0.2)'
                    : 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: '#fff', border: 'none', borderRadius: 14,
                  fontWeight: 700, fontSize: 15,
                  cursor: isOverBalance ? 'not-allowed' : 'pointer',
                  opacity: isOverBalance ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: isOverBalance ? 'none' : '0 4px 20px rgba(34,197,94,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                Review Transfer →
              </button>
            </div>
          </form>
        )}

        {/* ==================== STEP 2: CONFIRMATION ==================== */}
        {step === 2 && (
          <div style={{ animation: 'floatIn 0.5s ease' }}>
            <div style={{
              background: dark ? '#1a1a2e' : '#ffffff',
              borderRadius: 24,
              padding: 0,
              border: `1px solid ${dark ? '#2a2a4a' : '#e8ecf0'}`,
              boxShadow: dark
                ? '0 20px 60px rgba(0,0,0,0.4)'
                : '0 10px 40px rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}>
              {/* Confirmation Header */}
              <div style={{
                background: dark
                  ? 'linear-gradient(135deg, #1e3c7d, #0f0f2a)'
                  : 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                padding: '28px 32px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Background decoration */}
                <div style={{
                  position: 'absolute',
                  top: -20, right: -20,
                  width: 100, height: 100,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: -30, left: -10,
                  width: 80, height: 80,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)',
                }} />

                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', fontSize: 28,
                  border: '2px solid rgba(255,255,255,0.25)',
                  animation: 'fadeSlideUp 0.4s ease',
                }}>
                  📋
                </div>
                <h2 style={{
                  color: '#fff', fontSize: 22, fontWeight: 800,
                  margin: '0 0 4px', textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}>
                  Confirm Your Transfer
                </h2>
                <p style={{
                  color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0,
                }}>
                  Please review the details below before proceeding
                </p>
              </div>

              {/* Transfer Amount Highlight */}
              <div style={{
                padding: '24px 32px',
                background: dark
                  ? 'linear-gradient(135deg, #0a1628, #0f0f2a)'
                  : 'linear-gradient(135deg, #f0f9ff, #eff6ff)',
                borderBottom: `1px solid ${dark ? '#2a2a4a' : '#e0e7ff'}`,
                textAlign: 'center',
              }}>
                <p style={{
                  color: dark ? '#8892b0' : '#64748b',
                  fontSize: 13, margin: '0 0 6px', fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '1px',
                }}>
                  Transfer Amount
                </p>
                <div style={{
                  fontSize: 40, fontWeight: 800,
                  color: dark ? '#818cf8' : '#1e3c7d',
                  letterSpacing: '-1px',
                  textShadow: dark ? '0 2px 10px rgba(129,140,248,0.3)' : 'none',
                  animation: 'fadeSlideUp 0.4s ease 0.1s both',
                }}>
                  ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: dark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 50, padding: '4px 14px', marginTop: 8,
                  fontSize: 12, fontWeight: 600, color: '#22c55e',
                }}>
                  🏷️ No transfer fee
                </div>
              </div>

              {/* Transfer Details List */}
              <div style={{ padding: '24px 32px' }}>
                {/* From → To Visual */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginBottom: 24,
                  padding: 20,
                  background: dark ? '#0f0f2a' : '#f8fafc',
                  borderRadius: 16,
                  border: `1px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                  animation: 'fadeSlideUp 0.4s ease 0.15s both',
                }}>
                  {/* From */}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: dark ? 'rgba(129,140,248,0.15)' : 'rgba(30,60,125,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 8px', fontSize: 20,
                    }}>
                      💳
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>FROM</p>
                    <p style={{
                      margin: '4px 0 0', fontSize: 13, color: colors.text, fontWeight: 700,
                      wordBreak: 'break-all',
                    }}>
                      {form.from_account}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: colors.textMuted }}>Your Account</p>
                  </div>

                  {/* Arrow */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb, #1e3c7d)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, color: '#fff',
                      boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                    }}>
                      →
                    </div>
                  </div>

                  {/* To */}
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: dark ? 'rgba(52,211,153,0.15)' : 'rgba(5,150,105,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 8px', fontSize: 20,
                    }}>
                      👤
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>TO</p>
                    <p style={{
                      margin: '4px 0 0', fontSize: 13, color: colors.text, fontWeight: 700,
                    }}>
                      {form.recipient_name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: colors.textMuted }}>
                      {form.to_account}
                    </p>
                  </div>
                </div>

                {/* Detail Rows */}
                <div style={{
                  background: dark ? '#0f0f2a' : '#fafbfc',
                  borderRadius: 14,
                  border: `1px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                  overflow: 'hidden',
                }}>
                  {[
                    { icon: '🏛️', label: 'Recipient Bank', value: getActualBankName() },
                    { icon: '👤', label: 'Recipient Name', value: form.recipient_name },
                    { icon: '📍', label: 'Recipient Address', value: form.recipient_address },
                    { icon: '🔢', label: 'Account Number', value: form.to_account },
                    { icon: '📌', label: 'Purpose', value: form.purpose },
                    form.description && { icon: '📝', label: 'Description', value: form.description },
                    { icon: '💳', label: 'From Account', value: form.from_account },
                    { icon: '🏷️', label: 'Transfer Fee', value: '$0.00', highlight: true },
                    {
                      icon: '💰',
                      label: 'Total Amount',
                      value: `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                      bold: true,
                      highlight: true,
                    },
                  ].filter(Boolean).map((row, i, arr) => (
                    <div
                      key={i}
                      className="confirm-row"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '13px 20px',
                        borderBottom: i < arr.length - 1
                          ? `1px solid ${dark ? '#1e1e3a' : '#f0f0f0'}`
                          : 'none',
                        background: row.bold
                          ? dark ? 'rgba(129,140,248,0.06)' : 'rgba(30,60,125,0.03)'
                          : 'transparent',
                        transition: 'background 0.15s ease',
                        animation: `fadeSlideUp 0.3s ease ${0.2 + i * 0.04}s both`,
                      }}
                    >
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        color: colors.textMuted, fontSize: 13, fontWeight: 500,
                      }}>
                        <span style={{ fontSize: 14 }}>{row.icon}</span>
                        {row.label}
                      </span>
                      <span style={{
                        fontWeight: row.bold ? 800 : 600,
                        fontSize: row.bold ? 16 : 13,
                        color: row.highlight
                          ? (dark ? '#818cf8' : '#1e3c7d')
                          : colors.text,
                        textAlign: 'right',
                        maxWidth: '55%',
                        wordBreak: 'break-word',
                      }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Security Notice */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  marginTop: 20, padding: 16,
                  background: dark ? 'rgba(234,179,8,0.08)' : 'rgba(234,179,8,0.06)',
                  border: `1px solid ${dark ? 'rgba(234,179,8,0.2)' : 'rgba(234,179,8,0.15)'}`,
                  borderRadius: 12,
                  animation: 'fadeSlideUp 0.3s ease 0.5s both',
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🔒</span>
                  <div>
                    <p style={{
                      margin: 0, fontWeight: 700, fontSize: 13,
                      color: dark ? '#fbbf24' : '#92400e',
                    }}>
                      Secure Verification Required
                    </p>
                    <p style={{
                      margin: '4px 0 0', fontSize: 12,
                      color: dark ? '#d4a017' : '#a16207',
                      lineHeight: 1.5,
                    }}>
                      A one-time verification code (OTP) will be sent to your registered email address to authorize this transaction.
                    </p>
                  </div>
                </div>

                {/* Message */}
                {message && (
                  <div style={{
                    padding: '14px 18px', borderRadius: 12, marginTop: 16,
                    fontWeight: 600, fontSize: 14,
                    display: 'flex', alignItems: 'center', gap: 10,
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
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setMessage(''); setMessageType(''); }}
                    style={{
                      flex: 1, padding: '15px',
                      background: 'transparent',
                      color: dark ? '#8892b0' : '#64748b',
                      border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                      borderRadius: 14, fontWeight: 700, fontSize: 15,
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                    onMouseOver={e => {
                      e.target.style.borderColor = dark ? '#3b4fd8' : '#1e3c7d';
                      e.target.style.color = dark ? '#818cf8' : '#1e3c7d';
                    }}
                    onMouseOut={e => {
                      e.target.style.borderColor = dark ? '#2a2a4a' : '#e5e7eb';
                      e.target.style.color = dark ? '#8892b0' : '#64748b';
                    }}
                  >
                    ← Edit Details
                  </button>
                  <button
                    type="button"
                    className="action-btn"
                    onClick={handleConfirmAndSendOTP}
                    disabled={loading}
                    style={{
                      flex: 2, padding: '15px',
                      background: loading
                        ? dark ? '#2a2a4a' : '#e5e7eb'
                        : 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                      color: loading ? (dark ? '#6b7280' : '#9ca3af') : '#fff',
                      border: 'none', borderRadius: 14,
                      fontWeight: 700, fontSize: 15,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
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
                      <>📧 Confirm & Send OTP</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== STEP 3: OTP ==================== */}
        {step === 3 && (
          <div style={{ animation: 'fadeSlideUp 0.4s ease' }}>
            <div style={{
              background: dark ? '#1a1a2e' : '#ffffff',
              borderRadius: 24,
              padding: 36,
              border: `1px solid ${dark ? '#2a2a4a' : '#e8ecf0'}`,
              boxShadow: dark
                ? '0 20px 60px rgba(0,0,0,0.4)'
                : '0 10px 40px rgba(0,0,0,0.08)',
              textAlign: 'center',
            }}>
              {/* OTP Icon */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: 32,
                boxShadow: '0 8px 25px rgba(37,99,235,0.35)',
                animation: 'pulse 2s infinite',
              }}>
                📧
              </div>

              <h2 style={{
                color: dark ? '#e8eaf6' : '#1a1a2a',
                fontSize: 22, fontWeight: 800, margin: '0 0 8px',
              }}>
                Check Your Email
              </h2>
              <p style={{
                color: dark ? '#8892b0' : '#64748b',
                fontSize: 14, margin: '0 0 24px', lineHeight: 1.6,
              }}>
                We've sent a 6-digit verification code to your email address.
                Please enter it below to confirm your transfer.
              </p>

              {/* Transaction Mini Summary */}
              <div style={{
                background: dark ? '#0f0f2a' : '#f8fafc',
                borderRadius: 14, padding: 16, marginBottom: 24,
                border: `1px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                textAlign: 'left',
              }}>
                {[
                  { label: 'Recipient', value: form.recipient_name, icon: '👤' },
                  { label: 'Bank', value: getActualBankName(), icon: '🏦' },
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
                      color: row.highlight ? '#2563eb' : dark ? '#e8eaf6' : '#1a1a2a',
                    }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Timer */}
              {otpTimer > 0 && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: otpTimer < 60
                    ? 'rgba(239,68,68,0.1)'
                    : 'rgba(37,99,235,0.08)',
                  border: `1px solid ${otpTimer < 60 ? 'rgba(239,68,68,0.3)' : 'rgba(37,99,235,0.2)'}`,
                  borderRadius: 50, padding: '8px 20px',
                  marginBottom: 24, fontSize: 14, fontWeight: 600,
                  color: otpTimer < 60 ? '#ef4444' : dark ? '#818cf8' : '#1e3c7d',
                  transition: 'all 0.3s ease',
                }}>
                  <span style={{ animation: 'pulse 1s infinite' }}>⏱️</span>
                  Expires in {formatTime(otpTimer)}
                </div>
              )}

              {/* OTP Input Boxes */}
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
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className="otp-input"
                      style={{
                        width: 52, height: 60, textAlign: 'center',
                        fontSize: 24, fontWeight: 800, borderRadius: 12,
                        border: `2px solid ${digit ? '#2563eb' : dark ? '#2a2a4a' : '#e5e7eb'}`,
                        background: digit
                          ? dark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.05)'
                          : dark ? '#16213e' : '#ffffff',
                        color: dark ? '#e8eaf6' : '#1a1a2a',
                        outline: 'none', transition: 'all 0.2s ease',
                        boxShadow: digit ? '0 0 0 4px rgba(37,99,235,0.1)' : 'none',
                        animation: digit ? 'otpPop 0.2s ease' : 'none',
                      }}
                    />
                  ))}
                </div>

                {/* Message */}
                {message && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                    fontWeight: 600, fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 8,
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
                  disabled={isProcessing || otp.length !== 6 || otpExpired}
                  style={{
                    width: '100%', padding: '16px',
                    background: (isProcessing || otp.length !== 6 || otpExpired)
                      ? dark ? '#2a2a4a' : '#e5e7eb'
                      : 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                    color: (isProcessing || otp.length !== 6 || otpExpired)
                      ? dark ? '#6b7280' : '#9ca3af' : '#fff',
                    border: 'none', borderRadius: 14,
                    fontWeight: 700, fontSize: 16,
                    cursor: (isProcessing || otp.length !== 6 || otpExpired) ? 'not-allowed' : 'pointer',
                    marginBottom: 12, transition: 'all 0.2s ease',
                    boxShadow: (isProcessing || otp.length !== 6 || otpExpired)
                      ? 'none' : '0 4px 20px rgba(37,99,235,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
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
                      Processing Transfer...
                    </>
                  ) : (
                    <>🔐 Confirm Transfer</>
                  )}
                </button>

                {/* Secondary Buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={requestNewOTP}
                    disabled={loading || otpTimer > 240}
                    style={{
                      flex: 1, padding: '12px',
                      background: 'transparent',
                      color: dark ? '#818cf8' : '#1e3c7d',
                      border: `2px solid ${dark ? '#3b4fd8' : '#1e3c7d'}`,
                      borderRadius: 12, fontWeight: 600, fontSize: 13,
                      cursor: (loading || otpTimer > 240) ? 'not-allowed' : 'pointer',
                      opacity: (loading || otpTimer > 240) ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    🔄 Resend OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep(2); setMessage(''); setMessageType(''); }}
                    style={{
                      flex: 1, padding: '12px',
                      background: 'transparent',
                      color: dark ? '#6b7280' : '#64748b',
                      border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                      borderRadius: 12, fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', transition: 'all 0.2s ease',
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
    </div>
  );
}