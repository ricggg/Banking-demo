import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

export default function CashDeposit({ user, account }) {
  // Always use the real user's account number
  const getAccountNumber = () => {
    if (account && (account.account_number || account.accountNumber)) {
      return account.account_number || account.accountNumber;
    }
    try {
      const storedUser = JSON.parse(localStorage.getItem('bankingUser'));
      if (storedUser && storedUser.account_number) return storedUser.account_number;
      if (storedUser && storedUser.accountNumber) return storedUser.accountNumber;
    } catch (e) {}
    return '';
  };

  const [form, setForm] = useState({
    to_account: getAccountNumber(),
    amount: '',
    description: '',
  });

  useEffect(() => {
    setForm(f => ({
      ...f,
      to_account: getAccountNumber()
    }));
    // eslint-disable-next-line
  }, [account]);

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Request OTP
  const handleSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    setLoading(true);
    try {
      await axios.post(
        `${config.API_BASE_URL}/request-otp.php`,
        {
          user_id: user.user_id,
          transaction_data: {
            type: 'deposit',
            account_number: form.to_account,
            amount: form.amount,
            description: `Cash Deposit. ${form.description}`,
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setOtpSent(true);
      setMessage('OTP sent to your email. Please enter it below to confirm.');
      setMessageType('success');
    } catch (error) {
      setMessage('Failed to send OTP. Try again.');
      setMessageType('error');
    }
    setLoading(false);
  };

  // Step 2: Verify OTP
  const handleOtpSubmit = async e => {
    e.preventDefault();
    setMessage('');
    setMessageType('');
    setLoading(true);
    try {
      const response = await axios.post(
        `${config.API_BASE_URL}/verify-otp.php`,
        { user_id: user.user_id, otp_code: otp },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setMessage(response.data.message || 'Cash deposit successful!');
      setMessageType('success');
      setOtpSent(false);
      setForm(f => ({
        ...f,
        amount: '',
        description: '',
        to_account: getAccountNumber()
      }));
      setOtp('');
    } catch (error) {
      setMessage('Invalid or expired OTP.');
      setMessageType('error');
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      padding: 32,
      maxWidth: 500,
      margin: '0 auto'
    }}>
      <h2 style={{ marginBottom: 24 }}>Cash Deposit</h2>
      {!otpSent ? (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 600 }}>To Account</label>
            <input
              type="text"
              name="to_account"
              value={form.to_account}
              readOnly
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', marginTop: 6, background: '#f4f7fa' }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 600 }}>Amount</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              required
              min="1"
              step="0.01"
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', marginTop: 6 }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 600 }}>Description (optional)</label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', marginTop: 6 }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#1e3c7d',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '14px 0',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            {loading ? 'Processing...' : 'Send OTP to Email'}
          </button>
          {message && (
            <div style={{
              marginTop: 18,
              color: messageType === 'success' ? '#28a745' : '#dc3545',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 600 }}>Enter OTP sent to your email</label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', marginTop: 6 }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#1e3c7d',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '14px 0',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            {loading ? 'Verifying...' : 'Confirm Deposit'}
          </button>
          {message && (
            <div style={{
              marginTop: 18,
              color: messageType === 'success' ? '#28a745' : '#dc3545',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {message}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
