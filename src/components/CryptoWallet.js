import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const supportedCryptos = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', color: '#f7931a', price: 43250.00, change: '+2.5%', network: 'Bitcoin', gradient: 'linear-gradient(135deg, #f7931a, #e2820e)' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627eea', price: 2680.50, change: '+1.8%', network: 'Ethereum', gradient: 'linear-gradient(135deg, #627eea, #4a6dd8)' },
  { symbol: 'USDT', name: 'Tether', icon: '₮', color: '#26a17b', price: 1.00, change: '0.0%', network: 'Ethereum', gradient: 'linear-gradient(135deg, #26a17b, #1a8a68)' },
  { symbol: 'BNB', name: 'Binance Coin', icon: 'B', color: '#f3ba2f', price: 315.20, change: '+3.2%', network: 'BSC', gradient: 'linear-gradient(135deg, #f3ba2f, #d4a420)' },
  { symbol: 'ADA', name: 'Cardano', icon: 'A', color: '#0033ad', price: 0.485, change: '-1.5%', network: 'Cardano', gradient: 'linear-gradient(135deg, #0033ad, #002890)' },
  { symbol: 'SOL', name: 'Solana', icon: 'S', color: '#9945ff', price: 98.75, change: '+4.7%', network: 'Solana', gradient: 'linear-gradient(135deg, #9945ff, #7b32d9)' },
];

const mockWallet = {
  BTC: { balance: 0.5234, address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
  ETH: { balance: 2.14, address: '0x742d35Cc6634C0532925a3b8D2C04c5dF4e92b3E' },
  USDT: { balance: 1500.00, address: '0x742d35Cc6634C0532925a3b8D2C04c5dF4e92b3E' },
  BNB: { balance: 8.5, address: 'bnb1xy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
  ADA: { balance: 750.25, address: 'addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' },
  SOL: { balance: 12.8, address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM' },
};

const mockTransactions = [
  { id: 1, type: 'send', crypto: 'BTC', amount: 0.1, to: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', date: '2025-01-06T10:30:00Z', status: 'confirmed', fee: 0.0001, hash: '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z' },
  { id: 2, type: 'receive', crypto: 'ETH', amount: 0.5, from: '0x123456789abcdef123456789abcdef123456789a', date: '2025-01-05T15:45:00Z', status: 'confirmed', hash: '9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g9f8e7d6c5b4a3' },
  { id: 3, type: 'send', crypto: 'USDT', amount: 250.00, to: '0x987654321fedcba987654321fedcba9876543210', date: '2025-01-04T09:15:00Z', status: 'pending', fee: 5.00, hash: 'pending...' },
];

/* ───────── Animated Input ───────── */
function AnimatedInput({ label, icon, error, hint, dark, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 4 }}>
      {label && (
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
          fontSize: 13, fontWeight: 600,
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

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
export default function CryptoWallet({ user, account, onTransactionSuccess, isDarkMode }) {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [wallet, setWallet] = useState(mockWallet);
  const [transactions, setTransactions] = useState(mockTransactions);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [animateIn, setAnimateIn] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const [sendForm, setSendForm] = useState({
    crypto: 'BTC', to_address: '', amount: '', network_fee: 'standard', note: '',
  });
  const [receiveForm, setReceiveForm] = useState({
    crypto: 'BTC', amount: '', note: '',
  });
  const [qrCodeData, setQrCodeData] = useState('');

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
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
  };

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Updating crypto prices...');
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Animate tab transitions
  useEffect(() => {
    setAnimateIn(false);
    const t = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(t);
  }, [activeTab]);

  const calculatePortfolioValue = () =>
    supportedCryptos.reduce((total, c) => total + ((wallet[c.symbol]?.balance || 0) * c.price), 0);

  const getCrypto = symbol => supportedCryptos.find(c => c.symbol === symbol);

  const handleSendChange = e => setSendForm({ ...sendForm, [e.target.name]: e.target.value });
  const handleReceiveChange = e => setReceiveForm({ ...receiveForm, [e.target.name]: e.target.value });

  const generateQRCode = () => {
    const address = wallet[receiveForm.crypto]?.address;
    setQrCodeData(receiveForm.amount ? `${address}?amount=${receiveForm.amount}` : address);
  };

  const handleSend = async e => {
    e.preventDefault();
    setMessage(''); setMessageType(''); setLoading(true);
    try {
      const balance = wallet[sendForm.crypto]?.balance || 0;
      const amount = parseFloat(sendForm.amount);
      if (amount > balance) throw new Error('Insufficient balance');
      if (!sendForm.to_address) throw new Error('Please enter recipient address');

      await new Promise(resolve => setTimeout(resolve, 3000));

      const newTransaction = {
        id: transactions.length + 1, type: 'send', crypto: sendForm.crypto,
        amount, to: sendForm.to_address, date: new Date().toISOString(),
        status: 'pending', fee: sendForm.network_fee === 'fast' ? 0.001 : 0.0005,
        hash: 'tx_' + Math.random().toString(36).substr(2, 9), note: sendForm.note,
      };

      setTransactions(prev => [newTransaction, ...prev]);
      setTransactionDetails(newTransaction);
      setShowSuccess(true);
      setWallet(prev => ({
        ...prev,
        [sendForm.crypto]: { ...prev[sendForm.crypto], balance: prev[sendForm.crypto].balance - amount },
      }));
      setSendForm({ crypto: 'BTC', to_address: '', amount: '', network_fee: 'standard', note: '' });
      if (onTransactionSuccess) setTimeout(() => onTransactionSuccess(), 1000);
    } catch (error) {
      setMessage(error.message);
      setMessageType('error');
    }
    setLoading(false);
  };

  const portfolioValue = calculatePortfolioValue();

  const tabConfig = [
    { key: 'portfolio', label: 'Portfolio', icon: '💎' },
    { key: 'send', label: 'Send', icon: '📤' },
    { key: 'receive', label: 'Receive', icon: '📥' },
    { key: 'history', label: 'History', icon: '📋' },
    { key: 'market', label: 'Market', icon: '📊' },
  ];

  /* ═══════ Card wrapper helper ═══════ */
  const Card = ({ children, style }) => (
    <div className="crypto-card" style={{
      background: colors.card, borderRadius: 20, padding: 28, marginBottom: 16,
      border: `1px solid ${colors.cardBorder}`,
      boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      ...style,
    }}>{children}</div>
  );

  /* ═══════ Section header helper ═══════ */
  const SectionHeader = ({ icon, gradient, title, subtitle, titleColor }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 22, paddingBottom: 14,
      borderBottom: `2px solid ${dark ? '#2a2a4a' : '#f0f4f8'}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, background: gradient,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}>{icon}</div>
      <div>
        <h3 style={{ margin: 0, color: titleColor, fontSize: 16, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: 0, color: dark ? '#6b7280' : '#9ca3af', fontSize: 12 }}>{subtitle}</p>
      </div>
    </div>
  );

  /* ════════════════════════════════════
     SUCCESS SCREEN
     ════════════════════════════════════ */
  if (showSuccess && transactionDetails) {
    const txCrypto = getCrypto(transactionDetails.crypto);
    return (
      <div style={{
        minHeight: '100vh',
        background: dark ? '#0d0d0d' : '#f0f4f8',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <style>{`
          @keyframes successPop { 0%{transform:scale(0.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1} }
          @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
          @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(1.2)} }
        `}</style>

        <div style={{
          background: colors.card, borderRadius: 24,
          boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
          padding: 40, maxWidth: 520, width: '100%', textAlign: 'center',
          border: `1px solid ${colors.cardBorder}`,
          animation: 'fadeSlideUp 0.5s ease',
        }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 40,
            animation: 'successPop 0.6s cubic-bezier(0.175,0.885,0.32,1.275)',
            boxShadow: '0 10px 30px rgba(34,197,94,0.4)',
          }}>✨</div>

          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#22c55e', margin: '0 0 6px' }}>
            Transaction Submitted!
          </h2>
          <p style={{ color: colors.textMuted, margin: '0 0 28px', fontSize: 15 }}>
            Your crypto transaction has been submitted to the network
          </p>

          {/* Hash Badge */}
          <div style={{
            background: dark ? '#0a0a1a' : '#f0fdf4', borderRadius: 12,
            padding: '10px 16px', marginBottom: 24, display: 'inline-block',
            border: '1px solid rgba(34,197,94,0.3)', maxWidth: '100%',
          }}>
            <span style={{ color: colors.textMuted, fontSize: 12 }}>TX Hash: </span>
            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 12, wordBreak: 'break-all' }}>
              {transactionDetails.hash}
            </span>
          </div>

          {/* Details */}
          <div style={{
            background: dark ? '#0f0f2a' : '#f8fafc', borderRadius: 16,
            padding: 24, marginBottom: 20, textAlign: 'left',
            border: `1px solid ${colors.cardBorder}`,
          }}>
            {[
              { label: '🪙 Currency', value: txCrypto?.name },
              { label: '💰 Amount', value: `${transactionDetails.amount} ${transactionDetails.crypto}`, color: '#22c55e' },
              { label: '📬 To Address', value: transactionDetails.to, mono: true },
              { label: '⛽ Network Fee', value: `${transactionDetails.fee} ${transactionDetails.crypto}` },
              { label: '📊 Status', value: 'Pending Confirmation', color: '#f59e0b' },
              transactionDetails.note && { label: '📝 Note', value: transactionDetails.note },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '10px 0', gap: 12,
                borderBottom: i < 4 ? `1px solid ${dark ? '#2a2a4a' : '#f0f0f0'}` : 'none',
                animation: `fadeSlideUp 0.4s ease ${i * 0.05}s both`,
              }}>
                <span style={{ color: colors.textMuted, fontSize: 13, flexShrink: 0 }}>{row.label}</span>
                <span style={{
                  fontWeight: 600, fontSize: 13, color: row.color || colors.text,
                  textAlign: 'right', wordBreak: row.mono ? 'break-all' : 'normal',
                  fontFamily: row.mono ? 'monospace' : 'inherit',
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
              • Your transaction is being processed by the network<br />
              • Confirmation usually takes 10-30 minutes<br />
              • You'll receive an email notification when confirmed
            </div>
          </div>

          {/* Status Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 50, padding: '8px 20px', marginBottom: 24,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#f59e0b',
              animation: 'pulse 1.5s infinite',
            }} />
            <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 14 }}>Pending Confirmation</span>
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
          >← Return to Wallet</button>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════
     MAIN RENDER
     ════════════════════════════════════ */
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
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(1.2)} }
        @keyframes shimmer { from{background-position:-200% center}to{background-position:200% center} }
        @keyframes float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)} }
        .crypto-card:hover { transform: translateY(-1px); }
        .holding-row:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.12) !important; }
        .action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.4) !important; }
        .action-btn:active { transform: translateY(0); }
        .cancel-btn:hover { background: rgba(255,255,255,0.15) !important; }
        .fee-card:hover { transform: translateY(-2px); }
        .tx-row:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.1) !important; }
        .market-row:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.12) !important; }
        input::placeholder { color: #9ca3af; }
        select option { background: white; color: #1a1a1a; }
      `}</style>

      {/* ───────── Header ───────── */}
      <div style={{
        textAlign: 'center', marginBottom: 28, animation: 'fadeSlideUp 0.5s ease',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30, margin: '0 auto 12px',
          border: '2px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          animation: 'float 3s ease-in-out infinite',
        }}>💎</div>
        <h1 style={{
          color: '#fff', fontSize: 26, fontWeight: 800,
          margin: '0 0 6px', textShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}>Crypto Wallet</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
          Manage your digital assets securely
        </p>
      </div>

      {/* ───────── Tabs ───────── */}
      <div style={{
        display: 'flex', background: 'rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 4, marginBottom: 28,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        maxWidth: 600, width: '100%', overflow: 'auto',
      }}>
        {tabConfig.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setMessage(''); }}
            style={{
              flex: 1, padding: '11px 14px', border: 'none', borderRadius: 12,
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: 13, cursor: 'pointer', transition: 'all 0.3s ease',
              background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.6)',
              backdropFilter: activeTab === tab.key ? 'blur(10px)' : 'none',
              boxShadow: activeTab === tab.key ? '0 2px 10px rgba(0,0,0,0.15)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              whiteSpace: 'nowrap',
            }}
          >{tab.icon} {tab.label}</button>
        ))}
      </div>

      {/* ───────── Content ───────── */}
      <div style={{
        maxWidth: 760, width: '100%',
        animation: animateIn ? 'fadeSlideUp 0.4s ease' : 'none',
      }}>

        {/* ═══════════ PORTFOLIO ═══════════ */}
        {activeTab === 'portfolio' && (
          <>
            {/* Portfolio Value Card */}
            <div style={{
              background: dark
                ? 'linear-gradient(135deg, #1a1a2e, #0f0f2a)'
                : 'linear-gradient(135deg, #1e3c7d, #2563eb)',
              borderRadius: 20, padding: 32, marginBottom: 16, textAlign: 'center',
              boxShadow: '0 8px 32px rgba(37,99,235,0.3)',
              animation: 'fadeSlideUp 0.4s ease',
              border: dark ? '1px solid #2a2a4a' : 'none',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: '0 0 8px', fontWeight: 500 }}>
                💰 Total Portfolio Value
              </p>
              <div style={{
                fontSize: 42, fontWeight: 800, color: '#fff', margin: '0 0 8px',
                textShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}>
                ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(34,197,94,0.2)',
                borderRadius: 50, padding: '6px 16px',
                border: '1px solid rgba(34,197,94,0.3)',
              }}>
                <span style={{ color: '#22c55e', fontWeight: 700, fontSize: 14 }}>
                  📈 +$1,234.56 (+2.8%) today
                </span>
              </div>
            </div>

            {/* Holdings */}
            <Card>
              <SectionHeader
                icon="📊" gradient="linear-gradient(135deg, #1e3c7d, #2563eb)"
                title="Your Holdings" subtitle="Digital assets in your wallet"
                titleColor={dark ? '#818cf8' : '#1e3c7d'}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {supportedCryptos.map((crypto, idx) => {
                  const balance = wallet[crypto.symbol]?.balance || 0;
                  const value = balance * crypto.price;
                  return (
                    <div key={crypto.symbol} className="holding-row" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 16, borderRadius: 14,
                      background: dark ? '#0f0f2a' : '#f8fafc',
                      border: `1px solid ${dark ? '#2a2a4a' : '#e8ecf0'}`,
                      transition: 'all 0.25s ease', cursor: 'pointer',
                      animation: `fadeSlideUp 0.4s ease ${idx * 0.06}s both`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: crypto.gradient, color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 18,
                          boxShadow: `0 4px 12px ${crypto.color}40`,
                        }}>{crypto.icon}</div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>{crypto.name}</div>
                          <div style={{ fontSize: 13, color: colors.textMuted }}>{crypto.symbol}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>
                          {balance.toFixed(4)} {crypto.symbol}
                        </div>
                        <div style={{ fontSize: 13, color: colors.textMuted }}>
                          ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        {/* ═══════════ SEND ═══════════ */}
        {activeTab === 'send' && (
          <form onSubmit={handleSend}>
            <Card>
              <SectionHeader
                icon="📤" gradient="linear-gradient(135deg, #dc2626, #ef4444)"
                title="Send Cryptocurrency" subtitle="Transfer crypto to another wallet"
                titleColor={dark ? '#f87171' : '#dc2626'}
              />

              {/* Select Crypto */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                  fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555',
                }}>🪙 Select Cryptocurrency</label>
                <select
                  name="crypto" value={sendForm.crypto}
                  onChange={handleSendChange} required
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: 10,
                    border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                    fontSize: 15, boxSizing: 'border-box',
                    background: dark ? '#16213e' : '#ffffff',
                    color: dark ? '#e8eaf6' : '#1a1a2a',
                    cursor: 'pointer', outline: 'none', appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                    paddingRight: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  {supportedCryptos.map(c => (
                    <option key={c.symbol} value={c.symbol}>
                      {c.icon} {c.name} ({c.symbol}) — Balance: {wallet[c.symbol]?.balance?.toFixed(4) || 0}
                    </option>
                  ))}
                </select>
              </div>

              <AnimatedInput
                dark={dark} label="Recipient Address" icon="📬"
                type="text" name="to_address"
                value={sendForm.to_address} onChange={handleSendChange}
                required placeholder="Enter recipient's wallet address"
              />

              <div style={{ marginTop: 12, marginBottom: 16 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                  fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555',
                }}>💵 Amount</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" name="amount"
                    value={sendForm.amount} onChange={handleSendChange}
                    required min="0.0001" step="0.0001" placeholder="0.0000"
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 10,
                      border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                      fontSize: 18, fontWeight: 700, boxSizing: 'border-box',
                      background: dark ? '#16213e' : '#ffffff',
                      color: dark ? '#e8eaf6' : '#1a1a2a',
                      outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      paddingRight: 60,
                    }}
                  />
                  <span style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 14, fontWeight: 700, color: dark ? '#6b7280' : '#9ca3af',
                  }}>{sendForm.crypto}</span>
                </div>
                <p style={{ margin: '5px 0 0', fontSize: 12, color: dark ? '#6b7280' : '#9ca3af' }}>
                  Available: {wallet[sendForm.crypto]?.balance?.toFixed(4) || 0} {sendForm.crypto}
                </p>
              </div>

              {/* Network Fee Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
                  fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555',
                }}>⛽ Network Fee</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { value: 'slow', label: 'Slow', time: '~30 min', icon: '🐢', color: '#22c55e' },
                    { value: 'standard', label: 'Standard', time: '~10 min', icon: '⚡', color: '#f59e0b' },
                    { value: 'fast', label: 'Fast', time: '~3 min', icon: '🚀', color: '#ef4444' },
                  ].map(speed => {
                    const isSelected = sendForm.network_fee === speed.value;
                    return (
                      <label key={speed.value} className="fee-card" style={{
                        padding: 14, borderRadius: 14, cursor: 'pointer', textAlign: 'center',
                        background: isSelected
                          ? (dark ? 'rgba(37,99,235,0.12)' : '#eff6ff')
                          : (dark ? '#0f0f2a' : '#f8fafc'),
                        border: `2px solid ${isSelected ? '#2563eb' : dark ? '#2a2a4a' : '#e8ecf0'}`,
                        transition: 'all 0.25s ease',
                        boxShadow: isSelected ? '0 4px 15px rgba(37,99,235,0.15)' : 'none',
                      }}>
                        <input type="radio" name="network_fee" value={speed.value}
                          checked={isSelected} onChange={handleSendChange}
                          style={{ display: 'none' }}
                        />
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{speed.icon}</div>
                        <div style={{
                          fontWeight: 700, fontSize: 14,
                          color: isSelected ? (dark ? '#60a5fa' : '#1e3c7d') : colors.text,
                        }}>{speed.label}</div>
                        <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                          {speed.time}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                  fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555',
                }}>📝 Note <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Optional)</span></label>
                <textarea
                  name="note" value={sendForm.note} onChange={handleSendChange}
                  placeholder="Add a note for your records..."
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
            </Card>

            {/* Transaction Summary (gradient) */}
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
              }}>📋 Transaction Summary</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Amount', value: `${sendForm.amount || '0'} ${sendForm.crypto}`, icon: '💰' },
                  { label: 'Network Fee', value: `${sendForm.network_fee === 'fast' ? '0.0010' : '0.0005'} ${sendForm.crypto}`, icon: '⛽' },
                  { label: 'Network', value: getCrypto(sendForm.crypto)?.network, icon: '🌐' },
                  { label: 'Speed', value: sendForm.network_fee, icon: '⚡' },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px',
                    backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>
                      {item.icon} {item.label}
                    </div>
                    <div style={{
                      color: '#fff', fontWeight: 700, fontSize: 13,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      textTransform: item.label === 'Speed' ? 'capitalize' : 'none',
                    }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>Total</span>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 24, textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                  {(parseFloat(sendForm.amount || 0) + (sendForm.network_fee === 'fast' ? 0.001 : 0.0005)).toFixed(4)} {sendForm.crypto}
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
                background: messageType === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                border: `1px solid ${messageType === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                color: messageType === 'error' ? '#ef4444' : '#22c55e',
              }}>
                {messageType === 'error' ? '⚠️' : '✅'} {message}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" className="cancel-btn"
                onClick={() => setActiveTab('portfolio')}
                style={{
                  flex: 1, padding: '15px', background: 'rgba(255,255,255,0.1)',
                  color: '#fff', border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  transition: 'all 0.2s ease', backdropFilter: 'blur(10px)',
                }}
              >← Back</button>
              <button type="submit" className="action-btn" disabled={loading}
                style={{
                  flex: 2, padding: '15px',
                  background: loading ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
                  color: '#fff', border: 'none', borderRadius: 14,
                  fontWeight: 700, fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(220,38,38,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white', borderRadius: '50%',
                      display: 'inline-block', animation: 'spin 0.8s linear infinite',
                    }} /> Processing...
                  </>
                ) : (<>📤 Send Crypto</>)}
              </button>
            </div>
          </form>
        )}

        {/* ═══════════ RECEIVE ═══════════ */}
        {activeTab === 'receive' && (
          <Card>
            <SectionHeader
              icon="📥" gradient="linear-gradient(135deg, #059669, #10b981)"
              title="Receive Cryptocurrency" subtitle="Share your wallet address to receive funds"
              titleColor={dark ? '#34d399' : '#059669'}
            />

            {/* Select Crypto */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555',
              }}>🪙 Select Cryptocurrency</label>
              <select
                name="crypto" value={receiveForm.crypto}
                onChange={handleReceiveChange}
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 10,
                  border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                  fontSize: 15, boxSizing: 'border-box',
                  background: dark ? '#16213e' : '#ffffff',
                  color: dark ? '#e8eaf6' : '#1a1a2a',
                  cursor: 'pointer', outline: 'none', appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
                  paddingRight: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                {supportedCryptos.map(c => (
                  <option key={c.symbol} value={c.symbol}>{c.icon} {c.name} ({c.symbol})</option>
                ))}
              </select>
            </div>

            {/* Address Display */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                fontSize: 13, fontWeight: 600, color: dark ? '#8892b0' : '#555',
              }}>📬 Your {receiveForm.crypto} Address</label>
              <div style={{
                background: dark ? '#0f0f2a' : '#f8fafc', borderRadius: 12,
                padding: 16, fontFamily: 'monospace', fontSize: 14,
                wordBreak: 'break-all', lineHeight: 1.6,
                border: `2px solid ${copiedAddress ? '#22c55e' : dark ? '#2a2a4a' : '#e5e7eb'}`,
                color: colors.text, transition: 'border-color 0.3s ease',
              }}>
                {wallet[receiveForm.crypto]?.address}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(wallet[receiveForm.crypto]?.address);
                  setCopiedAddress(true);
                  setMessage('Address copied to clipboard!');
                  setMessageType('success');
                  setTimeout(() => { setMessage(''); setCopiedAddress(false); }, 3000);
                }}
                style={{
                  marginTop: 10, padding: '10px 20px',
                  background: copiedAddress
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : 'linear-gradient(135deg, #2563eb, #1e3c7d)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                }}
              >
                {copiedAddress ? '✅ Copied!' : '📋 Copy Address'}
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16, marginBottom: 20,
            }}>
              <AnimatedInput
                dark={dark} label="Amount" icon="💵"
                type="number" name="amount"
                value={receiveForm.amount} onChange={handleReceiveChange}
                min="0.0001" step="0.0001"
                placeholder="Specify amount to request"
                hint="Optional — leave blank for any amount"
              />
              <AnimatedInput
                dark={dark} label="Note" icon="📝"
                type="text" name="note"
                value={receiveForm.note} onChange={handleReceiveChange}
                placeholder="What's this payment for?"
                hint="Optional — for your records"
              />
            </div>

            <button
              onClick={generateQRCode} className="action-btn"
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontWeight: 700, fontSize: 16, cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                transition: 'all 0.2s ease', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >📱 Generate QR Code</button>

            {qrCodeData && (
              <div style={{
                textAlign: 'center', padding: 24,
                background: dark ? '#0f0f2a' : '#f8fafc', borderRadius: 16,
                border: `1px solid ${dark ? '#2a2a4a' : '#e8ecf0'}`,
                animation: 'fadeSlideUp 0.3s ease',
              }}>
                <p style={{ fontWeight: 700, fontSize: 16, color: colors.text, margin: '0 0 16px' }}>
                  📱 QR Code for Payment
                </p>
                <div style={{
                  width: 200, height: 200,
                  background: dark ? '#1a1a2e' : '#fff',
                  margin: '0 auto 16px', borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                }}>
                  <div style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', padding: 20 }}>
                    📷 QR Code<br />
                    <small style={{ fontSize: 11 }}>(Feature in development)</small>
                  </div>
                </div>
                <div style={{
                  fontSize: 12, color: colors.textMuted, wordBreak: 'break-all',
                  fontFamily: 'monospace', lineHeight: 1.5,
                  background: dark ? '#1a1a2e' : '#fff',
                  padding: 12, borderRadius: 8,
                  border: `1px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                }}>{qrCodeData}</div>
              </div>
            )}

            {/* Message */}
            {message && (
              <div style={{
                padding: '14px 18px', borderRadius: 12, marginTop: 16,
                fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 10,
                animation: 'fadeSlideUp 0.3s ease',
                background: messageType === 'error' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                border: `1px solid ${messageType === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                color: messageType === 'error' ? '#ef4444' : '#22c55e',
              }}>
                {messageType === 'error' ? '⚠️' : '✅'} {message}
              </div>
            )}
          </Card>
        )}

        {/* ═══════════ HISTORY ═══════════ */}
        {activeTab === 'history' && (
          <Card>
            <SectionHeader
              icon="📋" gradient="linear-gradient(135deg, #7c3aed, #8b5cf6)"
              title="Transaction History" subtitle="Your crypto transaction records"
              titleColor={dark ? '#a78bfa' : '#7c3aed'}
            />

            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 50 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: dark ? '#0f0f2a' : '#f8fafc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 32,
                  border: `1px solid ${dark ? '#2a2a4a' : '#e5e7eb'}`,
                }}>📊</div>
                <p style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: '0 0 8px' }}>
                  No transactions yet
                </p>
                <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
                  Your crypto transaction history will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {transactions.map((tx, idx) => {
                  const isSend = tx.type === 'send';
                  const statusColor = tx.status === 'confirmed' ? '#22c55e' : '#f59e0b';
                  const statusBg = tx.status === 'confirmed'
                    ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)';
                  return (
                    <div key={tx.id} className="tx-row" style={{
                      borderRadius: 16, padding: 20,
                      background: dark ? '#0f0f2a' : '#f8fafc',
                      border: `1px solid ${dark ? '#2a2a4a' : '#e8ecf0'}`,
                      transition: 'all 0.25s ease',
                      animation: `fadeSlideUp 0.4s ease ${idx * 0.08}s both`,
                    }}>
                      {/* Top */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', marginBottom: 12,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: isSend
                              ? 'linear-gradient(135deg, #dc2626, #ef4444)'
                              : 'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, fontWeight: 700,
                            boxShadow: isSend
                              ? '0 4px 12px rgba(220,38,38,0.3)'
                              : '0 4px 12px rgba(34,197,94,0.3)',
                          }}>{isSend ? '↗' : '↙'}</div>
                          <div>
                            <div style={{
                              fontWeight: 700, fontSize: 15, color: colors.text,
                              textTransform: 'capitalize',
                            }}>{tx.type} {tx.crypto}</div>
                            <div style={{ fontSize: 12, color: colors.textMuted }}>
                              {new Date(tx.date).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontWeight: 800, fontSize: 16,
                            color: isSend ? '#ef4444' : '#22c55e',
                          }}>
                            {isSend ? '-' : '+'}{tx.amount} {tx.crypto}
                          </div>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '3px 10px', borderRadius: 50, marginTop: 4,
                            fontSize: 11, fontWeight: 700,
                            color: statusColor, background: statusBg,
                            border: `1px solid ${statusColor}33`,
                            textTransform: 'capitalize',
                          }}>
                            <div style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: statusColor,
                              animation: tx.status === 'pending' ? 'pulse 1.5s infinite' : 'none',
                            }} />
                            {tx.status}
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div style={{
                        fontSize: 12, color: colors.textMuted,
                        fontFamily: 'monospace', wordBreak: 'break-all',
                        background: dark ? '#1a1a2e' : '#ffffff',
                        padding: '8px 12px', borderRadius: 8,
                        border: `1px solid ${dark ? '#2a2a4a' : '#e8ecf0'}`,
                      }}>
                        {isSend ? `To: ${tx.to}` : `From: ${tx.from}`}
                      </div>
                      {tx.hash && tx.hash !== 'pending...' && (
                        <div style={{
                          fontSize: 11, color: colors.textMuted,
                          fontFamily: 'monospace', wordBreak: 'break-all',
                          marginTop: 6, opacity: 0.7,
                        }}>
                          Hash: {tx.hash}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* ═══════════ MARKET ═══════════ */}
        {activeTab === 'market' && (
          <Card>
            <SectionHeader
              icon="📊" gradient="linear-gradient(135deg, #d97706, #f59e0b)"
              title="Market Overview" subtitle="Live cryptocurrency prices"
              titleColor={dark ? '#fbbf24' : '#d97706'}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {supportedCryptos.map((crypto, idx) => {
                const isPositive = crypto.change.startsWith('+');
                const isNeutral = crypto.change.startsWith('0');
                const changeColor = isPositive ? '#22c55e' : isNeutral ? colors.textMuted : '#ef4444';
                const changeBg = isPositive ? 'rgba(34,197,94,0.12)' : isNeutral ? 'rgba(107,114,128,0.12)' : 'rgba(239,68,68,0.12)';
                return (
                  <div key={crypto.symbol} className="market-row" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 16, borderRadius: 14,
                    background: dark ? '#0f0f2a' : '#f8fafc',
                    border: `1px solid ${dark ? '#2a2a4a' : '#e8ecf0'}`,
                    transition: 'all 0.25s ease', cursor: 'pointer',
                    animation: `fadeSlideUp 0.4s ease ${idx * 0.06}s both`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: crypto.gradient, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 18,
                        boxShadow: `0 4px 12px ${crypto.color}40`,
                      }}>{crypto.icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>
                          {crypto.name}
                        </div>
                        <div style={{ fontSize: 13, color: colors.textMuted }}>
                          {crypto.symbol} · {crypto.network}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>
                        ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 50, marginTop: 4,
                        fontSize: 12, fontWeight: 700,
                        color: changeColor, background: changeBg,
                        border: `1px solid ${changeColor}33`,
                      }}>
                        {isPositive ? '📈' : isNeutral ? '➖' : '📉'} {crypto.change}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Market Note */}
            <div style={{
              marginTop: 20, padding: '14px 18px',
              background: dark ? 'rgba(245,158,11,0.06)' : '#fffbeb',
              borderRadius: 12,
              border: `1px solid ${dark ? 'rgba(245,158,11,0.2)' : '#fde68a'}`,
              fontSize: 13, color: dark ? '#fbbf24' : '#92400e',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              💡 Prices update every 30 seconds. Market data is for reference only.
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}