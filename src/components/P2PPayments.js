import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

var quickAmounts = [10, 25, 50, 100, 250, 500];

function useColors(isDarkMode) {
  return {
    bg: isDarkMode ? '#0d0d0d' : '#f0f4f8',
    card: isDarkMode ? '#1a1a2e' : '#ffffff',
    cardBorder: isDarkMode ? '#2a2a4a' : '#e8ecf0',
    text: isDarkMode ? '#e8eaf6' : '#1a1a2a',
    textMuted: isDarkMode ? '#8892b0' : '#64748b',
    textLight: isDarkMode ? '#6b7280' : '#9ca3af',
    input: isDarkMode ? '#16213e' : '#ffffff',
    inputBorder: isDarkMode ? '#2a2a4a' : '#e2e8f0',
    inputFocus: '#2563eb',
    sectionTitle: isDarkMode ? '#818cf8' : '#1e3c7d',
    accent: '#2563eb',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    cardElevated: isDarkMode ? '#0f0f2a' : '#f8fafc',
  };
}

export default function P2PPayments({ user, account, onTransactionSuccess, isDarkMode, onSendOTP }) {
  var c = useColors(isDarkMode);

  var getAccountNumber = function() {
    if (account && (account.account_number || account.accountNumber)) {
      return account.account_number || account.accountNumber;
    }
    try {
      var storedUser = JSON.parse(localStorage.getItem('bankingUser') || localStorage.getItem('userInfo') || '{}');
      if (storedUser && storedUser.account_number) return storedUser.account_number;
      if (storedUser && storedUser.accountNumber) return storedUser.accountNumber;
    } catch (e) {}
    return '1234567890';
  };

  var getUserId = function() {
    if (user && (user.user_id || user.id)) return user.user_id || user.id;
    try {
      var storedUser = JSON.parse(localStorage.getItem('bankingUser') || localStorage.getItem('userInfo') || '{}');
      return storedUser.user_id || storedUser.id || '12345';
    } catch (e) { return '12345'; }
  };

  var formState = useState({
    from_account: getAccountNumber(),
    recipient: '',
    recipient_name: '',
    amount: '',
    description: '',
    payment_method: 'instant'
  });
  var form = formState[0];
  var setForm = formState[1];

  useEffect(function() {
    setForm(function(f) { return { ...f, from_account: getAccountNumber() }; });
  }, [account]);

  var stepState = useState(1);
  var step = stepState[0];
  var setStep = stepState[1];

  var otpSentState = useState(false);
  var otpSent = otpSentState[0];
  var setOtpSent = otpSentState[1];

  var otpState = useState('');
  var otp = otpState[0];
  var setOtp = otpState[1];

  var otpTimerState = useState(0);
  var otpTimer = otpTimerState[0];
  var setOtpTimer = otpTimerState[1];

  var otpExpiredState = useState(false);
  var otpExpired = otpExpiredState[0];
  var setOtpExpired = otpExpiredState[1];

  var messageState = useState('');
  var message = messageState[0];
  var setMessage = messageState[1];

  var messageTypeState = useState('');
  var messageType = messageTypeState[0];
  var setMessageType = messageTypeState[1];

  var loadingState = useState(false);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var processingState = useState(false);
  var isProcessing = processingState[0];
  var setIsProcessing = processingState[1];

  var successState = useState(false);
  var showSuccess = successState[0];
  var setShowSuccess = successState[1];

  var txnState = useState(null);
  var transactionDetails = txnState[0];
  var setTransactionDetails = txnState[1];

  var retryState = useState(0);
  var retryCount = retryState[0];
  var setRetryCount = retryState[1];

  var sessionState = useState('');
  var sessionToken = sessionState[0];
  var setSessionToken = sessionState[1];

  useEffect(function() {
    var timer;
    if (otpTimer > 0) {
      timer = setInterval(function() {
        setOtpTimer(function(prev) {
          if (prev <= 1) { setOtpExpired(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return function() { clearInterval(timer); };
  }, [otpTimer]);

  var formatTime = function(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    return mins + ':' + String(secs).padStart(2, '0');
  };

  var handleQuickAmount = function(amount) {
    setForm({ ...form, amount: amount.toString() });
  };

  var validateForm = function() {
    if (!form.from_account || !form.recipient || !form.amount) {
      setMessage('Please fill in all required fields');
      setMessageType('error');
      return false;
    }
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var phoneRegex = /^[\d\s\-\+\(\)]+$/;
    var usernameRegex = /^[a-zA-Z0-9_]{3,}$/;
    if (!emailRegex.test(form.recipient) && !phoneRegex.test(form.recipient) && !usernameRegex.test(form.recipient)) {
      setMessage('Please enter a valid email, phone number, or username');
      setMessageType('error');
      return false;
    }
    if (parseFloat(form.amount) <= 0) {
      setMessage('Amount must be greater than 0');
      setMessageType('error');
      return false;
    }
    var payFee = form.payment_method === 'instant' ? 0.50 : 0.00;
    var totalAmount = parseFloat(form.amount) + payFee;
    if (totalAmount > parseFloat(account?.balance || 15750.50)) {
      setMessage('Insufficient funds. Total charge including fee: $' + totalAmount.toFixed(2));
      setMessageType('error');
      return false;
    }
    return true;
  };

  var handleSubmit = async function(e) {
    e.preventDefault();
    if (!validateForm()) return;
    setMessage('');
    setMessageType('');
    setLoading(true);
    try {
      var token = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      setSessionToken(token);
      var transactionData = { ...form, to_account: form.recipient, transaction_type: 'p2p', timestamp: Date.now() };
      if (onSendOTP) {
        setMessage('Sending OTP...');
        setMessageType('info');
        await onSendOTP(transactionData);
        setOtpSent(true);
        setStep(2);
        setOtpTimer(300);
        setOtpExpired(false);
        setMessage('OTP sent to your email. Please enter it below to confirm.');
        setMessageType('success');
      } else {
        var response = await axios.post(
          config.API_BASE_URL + '/request-otp.php',
          { user_id: getUserId(), session_token: token, transaction_data: transactionData },
          { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
        );
        if (response.data.success) {
          setOtpSent(true);
          setStep(2);
          setOtpTimer(300);
          setOtpExpired(false);
          setMessage('OTP sent to your email. Please enter it below to confirm.');
          setMessageType('success');
          if (response.data.otp) {
            alert('Development Mode: Your OTP is ' + response.data.otp);
          }
        } else {
          setMessage(response.data.message || 'Failed to send OTP. Try again.');
          setMessageType('error');
        }
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        setMessage('Request timeout. Please try again.');
      } else if (error.response && error.response.data && error.response.data.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Failed to send OTP. Please check your connection and try again.');
      }
      setMessageType('error');
      setRetryCount(function(prev) { return prev + 1; });
    }
    setLoading(false);
  };

  var handleOtpSubmit = async function(e) {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setMessage('Please enter a valid 6-digit OTP');
      setMessageType('error');
      return;
    }
    if (otpExpired || otpTimer <= 0) {
      setMessage('OTP has expired. Please request a new one.');
      setMessageType('error');
      return;
    }
    setMessage('');
    setMessageType('');
    setIsProcessing(true);
    setMessage('Processing your P2P payment...');
    setMessageType('info');
    try {
      var transactionData = { ...form, to_account: form.recipient };
      var response = await axios.post(
        config.API_BASE_URL + '/verify-otp.php',
        { user_id: getUserId(), otp_code: otp, session_token: sessionToken, transaction_data: transactionData },
        { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
      );
      var result = response.data;
      if (result.success) {
        setMessage(result.message || 'P2P payment successful!');
        setMessageType('success');
        setStep(3);
        setShowSuccess(true);
        var payFee = form.payment_method === 'instant' ? 0.50 : 0.00;
        setTransactionDetails({
          ...form,
          date: new Date().toLocaleString(),
          status: 'Sent',
          reference: result.transaction_id || 'P2P' + Math.floor(Math.random() * 1000000000),
          amount_transferred: result.amount_transferred || form.amount,
          new_balance: result.new_balance,
          fee: payFee,
          total_charged: (parseFloat(form.amount) + payFee).toFixed(2)
        });
        resetForm();
        if (onTransactionSuccess) onTransactionSuccess();
        if (result.new_balance) localStorage.setItem('accountBalance', result.new_balance.toString());
        if (result.transaction_id) {
          setTimeout(function() { verifyTransaction(result.transaction_id); }, 2000);
        }
      } else {
        handleTransferError(result);
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        setMessage('Transaction timeout. Please check if the payment was processed.');
        setMessageType('error');
        if (onTransactionSuccess) setTimeout(function() { onTransactionSuccess(); }, 3000);
      } else if (error.response && error.response.data) {
        var errorData = error.response.data;
        if (errorData.error_code) { handleTransferError(errorData); }
        else { setMessage(errorData.message || 'Payment failed. Please try again.'); setMessageType('error'); }
      } else {
        setMessage('Network error. Please check your connection and try again.');
        setMessageType('error');
      }
      setRetryCount(function(prev) { return prev + 1; });
    }
    setIsProcessing(false);
  };

  var handleTransferError = function(result) {
    switch(result.error_code) {
      case 'OTP_EXPIRED':
        setMessage('OTP has expired. Please request a new one.');
        setMessageType('error');
        setStep(1); setOtpSent(false); setOtp('');
        break;
      case 'INVALID_OTP':
        setMessage('Invalid OTP. Please check and try again.');
        setMessageType('error'); setOtp('');
        break;
      case 'INSUFFICIENT_FUNDS':
        var payFee = form.payment_method === 'instant' ? 0.50 : 0.00;
        setMessage('Insufficient funds including the $' + payFee.toFixed(2) + ' fee.');
        setMessageType('error'); setStep(1);
        break;
      case 'DATA_MISMATCH':
        setMessage('Transaction data mismatch. Please start over.');
        setMessageType('error'); resetForm();
        break;
      case 'DUPLICATE_TRANSACTION':
        setMessage('Duplicate transaction detected. Please wait before retrying.');
        setMessageType('error');
        break;
      case 'RECIPIENT_NOT_FOUND':
      case 'ACCOUNT_NOT_FOUND':
        setMessage('Recipient not found. Please verify the details.');
        setMessageType('error'); setStep(1);
        break;
      default:
        setMessage(result.message || 'Payment failed. Please try again.');
        setMessageType('error');
    }
  };

  var verifyTransaction = async function(txnId) {
    try {
      var response = await axios.get(config.API_BASE_URL + '/verify-transaction.php?id=' + txnId);
      if (response.data.success) console.log('Transaction verified:', response.data.transaction);
    } catch (error) { console.error('Verification error:', error); }
  };

  var resetForm = function() {
    setForm(function(f) {
      return { ...f, recipient: '', recipient_name: '', amount: '', description: '', payment_method: 'instant', from_account: getAccountNumber() };
    });
    setStep(1); setOtpSent(false); setOtp(''); setOtpTimer(0); setOtpExpired(false);
    setMessage(''); setMessageType(''); setRetryCount(0); setSessionToken('');
  };

  var requestNewOTP = function() {
    setOtp(''); setOtpExpired(false); setMessage(''); setMessageType('');
    setStep(1); setOtpSent(false);
  };

  var amount = parseFloat(form.amount) || 0;
  var fee = form.payment_method === 'instant' ? 0.50 : 0.00;
  var total = amount + fee;
  var balance = parseFloat(account?.balance || 0);

  var formatCurrency = function(val) {
    return '$' + parseFloat(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ── Message Component ──
  var renderMessage = function() {
    if (!message) return null;
    var bgColor, borderColor, textColor, icon;
    if (messageType === 'success') {
      bgColor = 'rgba(34,197,94,0.1)'; borderColor = 'rgba(34,197,94,0.3)'; textColor = '#22c55e'; icon = '✅';
    } else if (messageType === 'error') {
      bgColor = 'rgba(239,68,68,0.1)'; borderColor = 'rgba(239,68,68,0.3)'; textColor = '#ef4444'; icon = '⚠️';
    } else {
      bgColor = isDarkMode ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.06)';
      borderColor = isDarkMode ? 'rgba(37,99,235,0.3)' : 'rgba(37,99,235,0.2)';
      textColor = '#2563eb'; icon = 'ℹ️';
    }
    return (
      <div style={{
        marginTop: 20, padding: '14px 18px', borderRadius: 14, fontWeight: 600,
        textAlign: 'center', fontSize: 14, background: bgColor,
        border: '1px solid ' + borderColor, color: textColor,
        animation: 'fadeSlideUp 0.3s ease', maxWidth: 600, width: '100%',
      }}>
        <span style={{ marginRight: 8 }}>{icon}</span>
        {message}
        {retryCount > 0 && (
          <div style={{ fontSize: 11, marginTop: 6, opacity: 0.7 }}>
            {'Retry attempt: ' + retryCount}
          </div>
        )}
      </div>
    );
  };

  // ── Step Indicator ──
  var renderStepIndicator = function() {
    var steps = [
      { num: 1, label: 'Payment Details', icon: '📝' },
      { num: 2, label: 'Verify OTP', icon: '🔐' },
      { num: 3, label: 'Complete', icon: '✅' },
    ];
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 0, marginBottom: 32, maxWidth: 600, width: '100%',
      }}>
        {steps.map(function(s, i) {
          var isActive = step >= s.num;
          var isCurrent = step === s.num;
          return (
            <React.Fragment key={s.num}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                opacity: isActive ? 1 : 0.4, transition: 'all 0.3s ease',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: isCurrent ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : isActive ? 'linear-gradient(135deg, #059669, #10b981)' : c.cardElevated,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: isActive ? '#fff' : c.textMuted,
                  border: '2px solid ' + (isCurrent ? '#7c3aed' : isActive ? '#059669' : c.cardBorder),
                  boxShadow: isCurrent ? '0 4px 15px rgba(124,58,237,0.35)' : 'none',
                  transition: 'all 0.3s ease',
                }}>
                  {isActive && step > s.num ? '✓' : s.icon}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? c.text : c.textMuted,
                  textAlign: 'center', whiteSpace: 'nowrap',
                }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  flex: 1, height: 2, margin: '0 8px', marginBottom: 22,
                  background: step > s.num ? '#059669' : c.cardBorder,
                  borderRadius: 2, transition: 'all 0.3s ease', minWidth: 40,
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ═══════════════════════════════════════════
  // SUCCESS SCREEN
  // ═══════════════════════════════════════════
  if (showSuccess && transactionDetails) {
    return (
      <div style={{ maxWidth: 700, width: '100%', padding: '0 20px', margin: '0 auto' }}>
        <div style={{
          background: c.card, borderRadius: 24, padding: '48px 36px',
          border: '1px solid ' + c.cardBorder,
          boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 6px 30px rgba(0,0,0,0.06)',
          textAlign: 'center', animation: 'fadeSlideUp 0.5s ease',
        }}>
          {/* Success Animation */}
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 42, color: '#fff',
            boxShadow: '0 8px 30px rgba(16,185,129,0.4)',
            animation: 'cardPop 0.6s ease',
          }}>✓</div>

          <h2 style={{ fontSize: 28, fontWeight: 800, color: c.success, margin: '0 0 8px' }}>
            Payment Sent!
          </h2>
          <p style={{ fontSize: 15, color: c.textMuted, margin: '0 0 32px' }}>
            Your P2P payment has been processed successfully
          </p>

          {/* Amount Display */}
          <div style={{
            background: isDarkMode ? 'rgba(5,150,105,0.08)' : 'rgba(5,150,105,0.05)',
            borderRadius: 16, padding: '20px 28px', marginBottom: 28,
            border: '1px solid rgba(5,150,105,0.2)',
          }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: c.success, marginBottom: 4 }}>
              {formatCurrency(transactionDetails.amount)}
            </div>
            <div style={{ fontSize: 13, color: c.textMuted }}>Amount Sent</div>
          </div>

          {/* Transaction Details */}
          <div style={{
            background: c.cardElevated, borderRadius: 16, padding: 24,
            border: '1px solid ' + c.cardBorder, textAlign: 'left', marginBottom: 28,
          }}>
            {[
              { label: 'Status', value: transactionDetails.status, color: c.success, icon: '🟢' },
              { label: 'Reference', value: transactionDetails.reference, icon: '🔖' },
              { label: 'Date', value: transactionDetails.date, icon: '📅' },
              { label: 'From', value: transactionDetails.from_account, icon: '🏦' },
              { label: 'To', value: transactionDetails.recipient, icon: '👤' },
              transactionDetails.recipient_name ? { label: 'Recipient', value: transactionDetails.recipient_name, icon: '📛' } : null,
              { label: 'Amount', value: formatCurrency(transactionDetails.amount), icon: '💰' },
              transactionDetails.fee > 0 ? { label: 'Fee', value: formatCurrency(transactionDetails.fee), icon: '📋' } : null,
              { label: 'Total Charged', value: formatCurrency(transactionDetails.total_charged), color: c.error, icon: '💳' },
              { label: 'Method', value: transactionDetails.payment_method === 'instant' ? '⚡ Instant (0-30 min)' : '📬 Standard (1-3 days)', icon: '🚀' },
              transactionDetails.description ? { label: 'Note', value: transactionDetails.description, icon: '📝' } : null,
              transactionDetails.new_balance ? { label: 'New Balance', value: formatCurrency(transactionDetails.new_balance), icon: '🏦' } : null,
            ].filter(Boolean).map(function(row, i) {
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < 10 ? '1px solid ' + c.cardBorder : 'none',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.textMuted, fontSize: 14 }}>
                    <span style={{ fontSize: 14 }}>{row.icon}</span>
                    {row.label}
                  </span>
                  <span style={{
                    fontWeight: 700, fontSize: 14,
                    color: row.color || c.text,
                    fontFamily: row.label === 'Reference' ? 'monospace' : 'inherit',
                  }}>{row.value}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={function() { setShowSuccess(false); }}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 14,
              padding: '15px 40px', fontWeight: 700, fontSize: 16,
              cursor: 'pointer', boxShadow: '0 4px 15px rgba(124,58,237,0.35)',
              transition: 'all 0.3s ease', display: 'inline-flex',
              alignItems: 'center', gap: 8,
            }}
          >
            🔄 New Payment
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // MAIN FORM
  // ═══════════════════════════════════════════
  return (
    <div style={{ maxWidth: 700, width: '100%', padding: '0 20px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a78bfa 100%)',
        borderRadius: 24, padding: '32px 36px', marginBottom: 28,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(124,58,237,0.35)',
        animation: 'cardPop 0.5s ease',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 100, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>🧑‍🤝‍🧑</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff' }}>P2P Payments</h2>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Send money instantly to anyone</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Available', value: formatCurrency(balance), icon: '💰' },
              { label: 'Method', value: form.payment_method === 'instant' ? '⚡ Instant' : '📬 Standard', icon: '🚀' },
              { label: 'Fee', value: fee > 0 ? formatCurrency(fee) : 'Free', icon: '📋' },
            ].map(function(stat, i) {
              return (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.1)', borderRadius: 12,
                  padding: '10px 16px', border: '1px solid rgba(255,255,255,0.15)',
                  flex: '1 1 100px', minWidth: 100,
                }}>
                  <div style={{ fontSize: 14, marginBottom: 2 }}>{stat.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {renderStepIndicator()}

      {/* ── STEP 1: FORM ── */}
      {step === 1 && (
        <form onSubmit={handleSubmit} style={{ animation: 'fadeSlideUp 0.4s ease' }}>

          {/* Sender Section */}
          <div style={{
            background: c.card, borderRadius: 20, padding: 28, marginBottom: 20,
            border: '1px solid ' + c.cardBorder,
            boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid ' + c.cardBorder }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1e3c7d, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🏦</div>
              <div>
                <h3 style={{ margin: 0, color: c.sectionTitle, fontSize: 16, fontWeight: 700 }}>Sender</h3>
                <p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Your account details</p>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6 }}>From Account</label>
              <input type="text" value={form.from_account} readOnly style={{
                width: '100%', padding: '13px 16px', borderRadius: 12,
                border: '2px solid ' + c.cardBorder, fontSize: 15, fontWeight: 600,
                background: c.cardElevated, color: c.textMuted, outline: 'none',
                boxSizing: 'border-box', fontFamily: 'monospace',
              }} />
              <div style={{ fontSize: 12, color: c.textMuted, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10 }}>💰</span>
                {'Available: ' + formatCurrency(balance)}
              </div>
            </div>
          </div>

          {/* Recipient Section */}
          <div style={{
            background: c.card, borderRadius: 20, padding: 28, marginBottom: 20,
            border: '1px solid ' + c.cardBorder,
            boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid ' + c.cardBorder }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
              <div>
                <h3 style={{ margin: 0, color: isDarkMode ? '#a78bfa' : '#7c3aed', fontSize: 16, fontWeight: 700 }}>Recipient</h3>
                <p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Who are you sending to?</p>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6 }}>Username, Email or Phone *</label>
              <input type="text" value={form.recipient} required
                onChange={function(e) { setForm({ ...form, recipient: e.target.value }); }}
                placeholder="e.g. john@email.com or +1234567890"
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 12,
                  border: '2px solid ' + c.inputBorder, fontSize: 15,
                  background: c.input, color: c.text, outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.2s ease',
                }}
                onFocus={function(e) { e.target.style.borderColor = '#7c3aed'; }}
                onBlur={function(e) { e.target.style.borderColor = c.inputBorder; }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6 }}>Recipient Name (Optional)</label>
              <input type="text" value={form.recipient_name}
                onChange={function(e) { setForm({ ...form, recipient_name: e.target.value }); }}
                placeholder="Enter recipient's full name"
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 12,
                  border: '2px solid ' + c.inputBorder, fontSize: 15,
                  background: c.input, color: c.text, outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.2s ease',
                }}
                onFocus={function(e) { e.target.style.borderColor = '#7c3aed'; }}
                onBlur={function(e) { e.target.style.borderColor = c.inputBorder; }}
              />
            </div>
          </div>

          {/* Payment Details */}
          <div style={{
            background: c.card, borderRadius: 20, padding: 28, marginBottom: 20,
            border: '1px solid ' + c.cardBorder,
            boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid ' + c.cardBorder }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💸</div>
              <div>
                <h3 style={{ margin: 0, color: isDarkMode ? '#34d399' : '#059669', fontSize: 16, fontWeight: 700 }}>Payment Details</h3>
                <p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Amount and delivery preference</p>
              </div>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6 }}>Amount *</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, fontWeight: 700, color: c.textMuted }}>$</span>
                <input type="number" value={form.amount} required min="1" step="0.01"
                  onChange={function(e) { setForm({ ...form, amount: e.target.value }); }}
                  placeholder="0.00"
                  style={{
                    width: '100%', padding: '13px 16px 13px 32px', borderRadius: 12,
                    border: '2px solid ' + c.inputBorder, fontSize: 20, fontWeight: 700,
                    background: c.input, color: c.text, outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s ease',
                  }}
                  onFocus={function(e) { e.target.style.borderColor = '#059669'; }}
                  onBlur={function(e) { e.target.style.borderColor = c.inputBorder; }}
                />
              </div>
              {/* Quick Amounts */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {quickAmounts.map(function(qa) {
                  var isSelected = form.amount === qa.toString();
                  return (
                    <button key={qa} type="button" onClick={function() { handleQuickAmount(qa); }} style={{
                      padding: '7px 14px', borderRadius: 10,
                      border: '2px solid ' + (isSelected ? '#059669' : c.cardBorder),
                      background: isSelected ? '#059669' : c.cardElevated,
                      color: isSelected ? '#fff' : c.textMuted,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}>{'$' + qa}</button>
                  );
                })}
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 10 }}>Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { value: 'instant', label: '⚡ Instant', desc: '0-30 minutes • $0.50 fee', color: '#7c3aed' },
                  { value: 'standard', label: '📬 Standard', desc: '1-3 business days • Free', color: '#059669' },
                ].map(function(method) {
                  var isSelected = form.payment_method === method.value;
                  return (
                    <div
                      key={method.value}
                      onClick={function() { setForm({ ...form, payment_method: method.value }); }}
                      style={{
                        padding: 16, borderRadius: 14, cursor: 'pointer',
                        border: '2px solid ' + (isSelected ? method.color : c.cardBorder),
                        background: isSelected ? method.color + '10' : c.cardElevated,
                        transition: 'all 0.2s ease', textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 700, color: isSelected ? method.color : c.text, marginBottom: 4 }}>
                        {method.label}
                      </div>
                      <div style={{ fontSize: 11, color: c.textMuted }}>{method.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 6 }}>Description (Optional)</label>
              <textarea value={form.description}
                onChange={function(e) { setForm({ ...form, description: e.target.value }); }}
                placeholder="What's this payment for?"
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 12,
                  border: '2px solid ' + c.inputBorder, fontSize: 14,
                  background: c.input, color: c.text, outline: 'none',
                  boxSizing: 'border-box', minHeight: 70, resize: 'vertical',
                  fontFamily: 'inherit', transition: 'border-color 0.2s ease',
                }}
                onFocus={function(e) { e.target.style.borderColor = '#7c3aed'; }}
                onBlur={function(e) { e.target.style.borderColor = c.inputBorder; }}
              />
            </div>
          </div>

          {/* Summary */}
          <div style={{
            background: c.card, borderRadius: 20, padding: 28, marginBottom: 20,
            border: '1px solid ' + c.cardBorder,
            boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid ' + c.cardBorder }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #d97706, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📊</div>
              <div>
                <h3 style={{ margin: 0, color: isDarkMode ? '#fbbf24' : '#d97706', fontSize: 16, fontWeight: 700 }}>Payment Summary</h3>
              </div>
            </div>
            {[
              { label: 'From', value: form.from_account, icon: '🏦' },
              { label: 'To', value: form.recipient || '—', icon: '👤' },
              { label: 'Amount', value: formatCurrency(amount), icon: '💰', bold: true, color: c.sectionTitle },
              { label: 'Fee', value: fee > 0 ? formatCurrency(fee) : 'Free', icon: '📋' },
            ].map(function(row, i) {
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0', borderBottom: '1px solid ' + c.cardBorder,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: c.textMuted, fontSize: 14 }}>
                    <span style={{ fontSize: 13 }}>{row.icon}</span>
                    {row.label}
                  </span>
                  <span style={{ fontWeight: row.bold ? 800 : 600, fontSize: row.bold ? 18 : 14, color: row.color || c.text }}>{row.value}</span>
                </div>
              );
            })}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0 0', marginTop: 4,
            }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: c.text }}>💳 Total</span>
              <span style={{ fontWeight: 900, fontSize: 22, color: c.error }}>{formatCurrency(total)}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0 0',
            }}>
              <span style={{ fontSize: 13, color: c.textMuted }}>🚀 Delivery</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>
                {form.payment_method === 'instant' ? '⚡ 0-30 minutes' : '📬 1-3 business days'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 14 }}>
            <button type="button" onClick={resetForm} style={{
              flex: 1, padding: '15px', border: '2px solid ' + c.cardBorder,
              borderRadius: 14, background: 'transparent', color: c.text,
              fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.3s ease',
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '15px', border: 'none', borderRadius: 14,
              background: loading ? 'rgba(156,163,175,0.5)' : 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
              color: '#fff', fontWeight: 700, fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(124,58,237,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.3s ease',
            }}>
              {loading ? (
                <React.Fragment>
                  <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  Sending OTP...
                </React.Fragment>
              ) : '🔐 Send OTP to Email'}
            </button>
          </div>
        </form>
      )}

      {/* ── STEP 2: OTP ── */}
      {step === 2 && (
        <div style={{ maxWidth: 480, width: '100%', margin: '0 auto', animation: 'fadeSlideUp 0.4s ease' }}>
          <div style={{
            background: c.card, borderRadius: 20, padding: 32,
            border: '1px solid ' + c.cardBorder,
            boxShadow: isDarkMode ? '0 8px 30px rgba(0,0,0,0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid ' + c.cardBorder }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔐</div>
              <div>
                <h3 style={{ margin: 0, color: isDarkMode ? '#a78bfa' : '#7c3aed', fontSize: 16, fontWeight: 700 }}>Verify Payment</h3>
                <p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Enter the 6-digit code sent to your email</p>
              </div>
            </div>

            {/* Payment Preview */}
            <div style={{
              background: isDarkMode ? 'rgba(124,58,237,0.08)' : 'rgba(124,58,237,0.04)',
              borderRadius: 14, padding: '16px 20px', marginBottom: 24,
              border: '1px solid rgba(124,58,237,0.2)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 4 }}>Sending to {form.recipient}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#7c3aed' }}>{formatCurrency(amount)}</div>
              {fee > 0 && <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>+ {formatCurrency(fee)} fee = {formatCurrency(total)} total</div>}
            </div>

            {/* Timer */}
            {otpTimer > 0 && (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: otpTimer < 60 ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.08)',
                  border: '1px solid ' + (otpTimer < 60 ? 'rgba(239,68,68,0.3)' : 'rgba(37,99,235,0.2)'),
                  borderRadius: 50, padding: '6px 16px',
                }}>
                  <span style={{ fontSize: 13 }}>⏱️</span>
                  <span style={{
                    fontWeight: 700, fontSize: 14,
                    color: otpTimer < 60 ? c.error : c.accent,
                  }}>
                    {'Expires in ' + formatTime(otpTimer)}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleOtpSubmit}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={function(e) { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); }}
                  required maxLength="6"
                  placeholder="000000"
                  style={{
                    width: '100%', padding: '16px', borderRadius: 14,
                    border: '2px solid ' + c.inputBorder, fontSize: 28,
                    fontWeight: 800, background: c.input, color: c.text,
                    outline: 'none', boxSizing: 'border-box',
                    textAlign: 'center', letterSpacing: '8px',
                    fontFamily: 'monospace', transition: 'border-color 0.2s ease',
                  }}
                  onFocus={function(e) { e.target.style.borderColor = '#7c3aed'; }}
                  onBlur={function(e) { e.target.style.borderColor = c.inputBorder; }}
                />
              </div>

              <button type="submit" disabled={isProcessing || otp.length !== 6 || otpExpired} style={{
                width: '100%', padding: '15px', border: 'none', borderRadius: 14,
                background: (isProcessing || otp.length !== 6 || otpExpired) ? 'rgba(156,163,175,0.5)' : 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                color: '#fff', fontWeight: 700, fontSize: 16,
                cursor: (isProcessing || otp.length !== 6 || otpExpired) ? 'not-allowed' : 'pointer',
                boxShadow: (isProcessing || otp.length !== 6 || otpExpired) ? 'none' : '0 4px 15px rgba(124,58,237,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.3s ease', marginBottom: 10,
              }}>
                {isProcessing ? (
                  <React.Fragment>
                    <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                    Processing Payment...
                  </React.Fragment>
                ) : '✅ Confirm Payment'}
              </button>

              <button type="button" onClick={requestNewOTP} disabled={loading || (otpTimer > 240)} style={{
                width: '100%', padding: '13px', border: '2px solid ' + (loading || otpTimer > 240 ? c.cardBorder : '#7c3aed'),
                borderRadius: 14, background: 'transparent',
                color: (loading || otpTimer > 240) ? c.textMuted : '#7c3aed',
                fontWeight: 700, fontSize: 14,
                cursor: (loading || otpTimer > 240) ? 'not-allowed' : 'pointer',
                opacity: (loading || otpTimer > 240) ? 0.5 : 1,
                transition: 'all 0.3s ease', marginBottom: 10,
              }}>
                {loading ? 'Sending...' : '🔄 Request New OTP'}
              </button>

              <button type="button" onClick={function() { setStep(1); }} style={{
                width: '100%', padding: '13px', border: '1px solid ' + c.cardBorder,
                borderRadius: 14, background: 'transparent',
                color: c.textMuted, fontWeight: 600, fontSize: 14,
                cursor: 'pointer', transition: 'all 0.3s ease',
              }}>
                ← Back to Form
              </button>
            </form>
          </div>
        </div>
      )}

      {renderMessage()}

      {/* Animations */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cardPop { 0% { transform: scale(0.95); opacity: 0; } 70% { transform: scale(1.02); } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}