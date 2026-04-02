import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';

const accountFeatures = [
  { icon: '🔒', title: 'Secure Banking', desc: '256-bit SSL encryption' },
  { icon: '📱', title: 'Mobile Banking', desc: 'Bank anywhere, anytime' },
  { icon: '🌐', title: 'International', desc: 'Global transfers available' },
  { icon: '💳', title: 'Card Services', desc: 'Debit & Credit cards' },
  { icon: '💰', title: 'Loans', desc: 'Personal & business loans' },
  { icon: '📊', title: 'Analytics', desc: 'Spending insights' }
];

const cardTypes = [
  { value: 'Debit', label: 'Debit Card', fee: 'Free', desc: 'Linked to your account balance' },
  { value: 'Credit', label: 'Credit Card', fee: '$50/year', desc: 'Build credit with responsible use' },
  { value: 'Prepaid', label: 'Prepaid Card', fee: '$5', desc: 'Load money as needed' }
];

const loanTypes = [
  { value: 'personal', label: 'Personal Loan', rate: '5.99%', desc: 'For personal expenses' },
  { value: 'business', label: 'Business Loan', rate: '4.99%', desc: 'Grow your business' },
  { value: 'auto', label: 'Auto Loan', rate: '3.99%', desc: 'Finance your vehicle' },
  { value: 'home', label: 'Home Loan', rate: '3.25%', desc: 'Buy your dream home' }
];

export default function MyAccount({ user, account: propAccount }) {
  const [account, setAccount] = useState(propAccount);
  const [loading, setLoading] = useState(!propAccount);
  const [error, setError] = useState('');

  // Modal states
  const [showCardModal, setShowCardModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [cardForm, setCardForm] = useState({
    card_type: 'Debit',
    delivery_address: '',
    annual_income: '',
    employment_status: ''
  });

  const [loanForm, setLoanForm] = useState({
    loan_type: 'personal',
    amount: '',
    purpose: '',
    duration: '12',
    annual_income: '',
    employment_status: ''
  });

  const [settings, setSettings] = useState({
    notifications: true,
    sms_alerts: true,
    email_statements: true,
    two_factor: false
  });

  useEffect(() => {
    if (!propAccount) {
      fetchAccount();
    } else {
      setAccount(propAccount);
      setLoading(false);
    }
  }, [propAccount, user]);

  const fetchAccount = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        `${config.API_BASE_URL}/accounts.php?user_id=${user?.user_id || user?.id}`
      );
      setAccount(response.data[0]);
    } catch (error) {
      console.error('Error fetching account:', error);
      setError('Failed to load account details. Please try again.');
      setAccount(null);
    }
    setLoading(false);
  };

  // Card application handler
  const handleCardApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalMessage('Submitting your card application...');
    
    try {
      // Simulate API call - replace with real endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // const response = await axios.post(`${config.API_BASE_URL}/apply-card.php`, {
      //   user_id: user.user_id,
      //   ...cardForm
      // });
      
      setModalMessage('✅ Card application submitted successfully! Our team will contact you within 2-3 business days.');
      setCardForm({
        card_type: 'Debit',
        delivery_address: '',
        annual_income: '',
        employment_status: ''
      });
    } catch (error) {
      setModalMessage('❌ Application failed. Please try again later.');
    }
    setSubmitting(false);
  };

  // Loan application handler
  const handleLoanApply = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalMessage('Submitting your loan application...');
    
    try {
      // Simulate API call - replace with real endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // const response = await axios.post(`${config.API_BASE_URL}/apply-loan.php`, {
      //   user_id: user.user_id,
      //   ...loanForm
      // });
      
      setModalMessage('✅ Loan application submitted successfully! Our loan officer will contact you within 24 hours.');
      setLoanForm({
        loan_type: 'personal',
        amount: '',
        purpose: '',
        duration: '12',
        annual_income: '',
        employment_status: ''
      });
    } catch (error) {
      setModalMessage('❌ Application failed. Please try again later.');
    }
    setSubmitting(false);
  };

  const getAccountAge = () => {
    if (!account?.created_at) return 'N/A';
    const created = new Date(account.created_at);
    const now = new Date();
    const months = Math.floor((now - created) / (1000 * 60 * 60 * 24 * 30));
    return months > 0 ? `${months} month${months > 1 ? 's' : ''}` : 'Less than a month';
  };

  const getAccountStatus = () => {
    if (!account?.balance) return { status: 'Inactive', color: '#dc3545' };
    const balance = parseFloat(account.balance);
    if (balance >= 10000) return { status: 'Premium', color: '#ffd700' };
    if (balance >= 1000) return { status: 'Active', color: '#22c55e' };
    return { status: 'Basic', color: '#2563eb' };
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f4f7fa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div className="spinner" style={{
          width: 60, height: 60, border: "6px solid #e5e7eb", borderTop: "6px solid #2563eb",
          borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 24
        }} />
        <div style={{ fontWeight: 600, fontSize: 18, color: "#2563eb" }}>Loading account details...</div>
        <style>
          {`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}
        </style>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f4f7fa",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          padding: 40,
          maxWidth: 480,
          margin: "0 auto",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 48, color: "#dc3545", marginBottom: 18 }}>⚠️</div>
          <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 10, color: "#dc3545" }}>Account Error</h2>
          <div style={{ fontSize: 16, color: "#222", marginBottom: 24 }}>
            {error || 'No account found. Please contact support.'}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#dc3545",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 32px",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer"
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const accountStatus = getAccountStatus();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f4f7fa",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "32px 20px"
    }}>
      <div style={{ maxWidth: 1000, width: "100%" }}>
        <h2 style={{ fontWeight: 700, fontSize: 24, marginBottom: 24, textAlign: 'center' }}>
          My Account
        </h2>

        {/* Account Overview */}
        <div style={sectionBoxStyle}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              color: '#fff',
              marginRight: 24
            }}>
              {user?.full_name?.charAt(0) || '👤'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                {user?.full_name || 'Account Holder'}
              </h3>
              <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>
                Account since {getAccountAge()}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                background: accountStatus.color
              }}>
                {accountStatus.status} Member
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 24,
            marginBottom: 24
          }}>
            <div style={statsBoxStyle}>
              <div style={statsLabelStyle}>Current Balance</div>
              <div style={statsValueStyle}>
                ${parseFloat(account.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={statsBoxStyle}>
              <div style={statsLabelStyle}>Account Number</div>
              <div style={statsValueStyle}>{account.account_number}</div>
            </div>
            <div style={statsBoxStyle}>
              <div style={statsLabelStyle}>Account Type</div>
              <div style={statsValueStyle}>{account.account_type}</div>
            </div>
            <div style={statsBoxStyle}>
              <div style={statsLabelStyle}>SWIFT Code</div>
              <div style={statsValueStyle}>{account.swift_code || 'TSOB827282'}</div>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 16
          }}>
            <button
              onClick={() => {
                setShowCardModal(true);
                setModalMessage('');
              }}
              style={actionButtonStyle}
            >
              <span style={{ fontSize: 20, marginRight: 12 }}>💳</span>
              Apply for Card
            </button>
            <button
              onClick={() => {
                setShowLoanModal(true);
                setModalMessage('');
              }}
              style={actionButtonStyle}
            >
              <span style={{ fontSize: 20, marginRight: 12 }}>🏦</span>
              Apply for Loan
            </button>
            <button
              onClick={() => {
                setShowSettingsModal(true);
                setModalMessage('');
              }}
              style={{...actionButtonStyle, background: '#fff', color: '#1e3c7d', border: '2px solid #1e3c7d'}}
            >
              <span style={{ fontSize: 20, marginRight: 12 }}>⚙️</span>
              Account Settings
            </button>
          </div>
        </div>

        {/* Account Features */}
        <div style={sectionBoxStyle}>
          <div style={sectionTitleStyle}>Account Features</div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: 20
          }}>
            {accountFeatures.map((feature, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                padding: 16,
                background: '#f8f9fa',
                borderRadius: 8,
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: 24, marginRight: 16 }}>{feature.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{feature.title}</div>
                  <div style={{ fontSize: 14, color: '#666' }}>{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Information */}
        <div style={sectionBoxStyle}>
          <div style={sectionTitleStyle}>Security & Compliance</div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 16
          }}>
            <div style={securityItemStyle}>
              <span style={{ color: '#22c55e', fontSize: 20, marginRight: 12 }}>🔒</span>
              <div>
                <div style={{ fontWeight: 600 }}>SSL Encryption</div>
                <div style={{ fontSize: 14, color: '#666' }}>Bank-grade security</div>
              </div>
            </div>
            <div style={securityItemStyle}>
              <span style={{ color: '#22c55e', fontSize: 20, marginRight: 12 }}>🛡️</span>
              <div>
                <div style={{ fontWeight: 600 }}>FDIC Insured</div>
                <div style={{ fontSize: 14, color: '#666' }}>Up to $250,000</div>
              </div>
            </div>
            <div style={securityItemStyle}>
              <span style={{ color: '#22c55e', fontSize: 20, marginRight: 12 }}>🔐</span>
              <div>
                <div style={{ fontWeight: 600 }}>Two-Factor Auth</div>
                <div style={{ fontSize: 14, color: '#666' }}>Enhanced protection</div>
              </div>
            </div>
            <div style={securityItemStyle}>
              <span style={{ color: '#22c55e', fontSize: 20, marginRight: 12 }}>📱</span>
              <div>
                <div style={{ fontWeight: 600 }}>Fraud Monitoring</div>
                <div style={{ fontSize: 14, color: '#666' }}>24/7 protection</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Application Modal */}
      {showCardModal && (
        <Modal onClose={() => setShowCardModal(false)}>
          <h3 style={{ marginBottom: 24, fontSize: 24, fontWeight: 700 }}>Apply for Card</h3>
          <form onSubmit={handleCardApply}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Card Type</label>
              <div style={{ marginTop: 8 }}>
                {cardTypes.map(type => (
                  <label key={type.value} style={{
                    display: 'block',
                    padding: 12,
                    border: cardForm.card_type === type.value ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    marginBottom: 8,
                    cursor: 'pointer',
                    background: cardForm.card_type === type.value ? '#f0f9ff' : '#fff'
                  }}>
                    <input
                      type="radio"
                      name="card_type"
                      value={type.value}
                      checked={cardForm.card_type === type.value}
                      onChange={e => setCardForm({ ...cardForm, card_type: e.target.value })}
                      style={{ marginRight: 8 }}
                    />
                    <strong>{type.label}</strong> ({type.fee})
                    <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{type.desc}</div>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Delivery Address</label>
              <textarea
                name="delivery_address"
                value={cardForm.delivery_address}
                onChange={e => setCardForm({ ...cardForm, delivery_address: e.target.value })}
                required
                placeholder="Enter your complete address for card delivery"
                style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Annual Income</label>
              <input
                type="number"
                name="annual_income"
                value={cardForm.annual_income}
                onChange={e => setCardForm({ ...cardForm, annual_income: e.target.value })}
                required
                min="1"
                placeholder="Enter your annual income"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Employment Status</label>
              <select
                name="employment_status"
                value={cardForm.employment_status}
                onChange={e => setCardForm({ ...cardForm, employment_status: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="">Select employment status</option>
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="student">Student</option>
                <option value="retired">Retired</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: submitting ? '#9ca3af' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '14px 0',
                fontWeight: 600,
                fontSize: 16,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
            {modalMessage && (
              <div style={{
                marginTop: 18,
                color: modalMessage.includes('✅') ? '#22c55e' : '#dc3545',
                fontWeight: 600,
                textAlign: 'center'
              }}>
                {modalMessage}
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* Loan Application Modal */}
      {showLoanModal && (
        <Modal onClose={() => setShowLoanModal(false)}>
          <h3 style={{ marginBottom: 24, fontSize: 24, fontWeight: 700 }}>Apply for Loan</h3>
          <form onSubmit={handleLoanApply}>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Loan Type</label>
              <div style={{ marginTop: 8 }}>
                {loanTypes.map(type => (
                  <label key={type.value} style={{
                    display: 'block',
                    padding: 12,
                    border: loanForm.loan_type === type.value ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    marginBottom: 8,
                    cursor: 'pointer',
                    background: loanForm.loan_type === type.value ? '#f0f9ff' : '#fff'
                  }}>
                    <input
                      type="radio"
                      name="loan_type"
                      value={type.value}
                      checked={loanForm.loan_type === type.value}
                      onChange={e => setLoanForm({ ...loanForm, loan_type: e.target.value })}
                      style={{ marginRight: 8 }}
                    />
                    <strong>{type.label}</strong> (from {type.rate} APR)
                    <div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{type.desc}</div>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Loan Amount</label>
              <input
                type="number"
                name="amount"
                value={loanForm.amount}
                onChange={e => setLoanForm({ ...loanForm, amount: e.target.value })}
                required
                min="1000"
                step="1000"
                placeholder="Minimum $1,000"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Purpose</label>
              <input
                type="text"
                name="purpose"
                value={loanForm.purpose}
                onChange={e => setLoanForm({ ...loanForm, purpose: e.target.value })}
                required
                placeholder="What will you use this loan for?"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Duration (months)</label>
              <select
                name="duration"
                value={loanForm.duration}
                onChange={e => setLoanForm({ ...loanForm, duration: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="12">12 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
                <option value="48">48 months</option>
                <option value="60">60 months</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Annual Income</label>
              <input
                type="number"
                name="annual_income"
                value={loanForm.annual_income}
                onChange={e => setLoanForm({ ...loanForm, annual_income: e.target.value })}
                required
                min="1"
                placeholder="Enter your annual income"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Employment Status</label>
              <select
                name="employment_status"
                value={loanForm.employment_status}
                onChange={e => setLoanForm({ ...loanForm, employment_status: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="">Select employment status</option>
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="business-owner">Business Owner</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                background: submitting ? '#9ca3af' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '14px 0',
                fontWeight: 600,
                fontSize: 16,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
            {modalMessage && (
              <div style={{
                marginTop: 18,
                color: modalMessage.includes('✅') ? '#22c55e' : '#dc3545',
                fontWeight: 600,
                textAlign: 'center'
              }}>
                {modalMessage}
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <Modal onClose={() => setShowSettingsModal(false)}>
          <h3 style={{ marginBottom: 24, fontSize: 24, fontWeight: 700 }}>Account Settings</h3>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#1e3c7d' }}>
              Notification Preferences
            </div>
            {Object.entries(settings).map(([key, value]) => (
              <label key={key} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 12,
                marginBottom: 8,
                border: '1px solid #e5e7eb',
                borderRadius: 8
              }}>
                <span style={{ textTransform: 'capitalize' }}>
                  {key.replace('_', ' ')}
                </span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={e => setSettings({ ...settings, [key]: e.target.checked })}
                  style={{ transform: 'scale(1.2)' }}
                />
              </label>
            ))}
          </div>
          <button
            onClick={() => {
              setModalMessage('✅ Settings saved successfully!');
              setTimeout(() => setShowSettingsModal(false), 1500);
            }}
            style={{
              width: '100%',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '14px 0',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer'
            }}
          >
            Save Settings
          </button>
          {modalMessage && (
            <div style={{
              marginTop: 18,
              color: '#22c55e',
              fontWeight: 600,
              textAlign: 'center'
            }}>
              {modalMessage}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// Modal component
function Modal({ children, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: 32,
        minWidth: 400,
        maxWidth: 600,
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: '#888',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

const sectionBoxStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: 32,
  marginBottom: 24,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  border: "1px solid #e5e7eb"
};

const sectionTitleStyle = {
  fontWeight: 700,
  fontSize: 20,
  marginBottom: 20,
  color: "#1e3c7d"
};

const statsBoxStyle = {
  background: '#f8f9fa',
  padding: 20,
  borderRadius: 12,
  border: '1px solid #e5e7eb'
};

const statsLabelStyle = {
  fontSize: 14,
  color: '#666',
  marginBottom: 8,
  fontWeight: 500
};

const statsValueStyle = {
  fontSize: 18,
  fontWeight: 700,
  color: '#1e3c7d'
};

const actionButtonStyle = {
  background: '#2563eb',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '16px 24px',
  fontWeight: 600,
  fontSize: 16,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s'
};

const securityItemStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: 16,
  background: '#f8f9fa',
  borderRadius: 8,
  border: '1px solid #e5e7eb'
};

const labelStyle = {
  fontWeight: 600,
  fontSize: 15,
  marginBottom: 6,
  display: "block"
};

const inputStyle = {
  width: "100%",
  padding: 12,
  borderRadius: 8,
  border: "1px solid #ddd",
  marginTop: 6,
  fontSize: 16,
  boxSizing: "border-box"
};
