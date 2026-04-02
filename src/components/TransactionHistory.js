import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config';

const transactionTypes = [
  { value: '', label: 'All Types', icon: '💰', color: '#6b7280' },
  { value: 'transfer', label: 'Transfers', icon: '🔄', color: '#3b82f6' },
  { value: 'international_transfer', label: 'International', icon: '🌐', color: '#8b5cf6' },
  { value: 'billpayment', label: 'Bill Payments', icon: '💵', color: '#f59e0b' },
  { value: 'p2p', label: 'P2P Payments', icon: '🧑‍🤝‍🧑', color: '#10b981' },
  { value: 'scheduled_payment', label: 'Scheduled', icon: '📅', color: '#06b6d4' },
  { value: 'deposit', label: 'Deposits', icon: '⬇️', color: '#22c55e' },
  { value: 'withdrawal', label: 'Withdrawals', icon: '⬆️', color: '#ef4444' }
];

const getTransactionIcon = (type) => {
  const typeObj = transactionTypes.find(t => t.value === type);
  return typeObj ? typeObj.icon : '💰';
};

const getTransactionColor = (type, direction) => {
  if (direction === 'credit' || type === 'deposit') return '#22c55e';
  if (direction === 'debit' || type === 'withdrawal' || type === 'transfer' || type === 'billpayment' || type === 'p2p') return '#ef4444';
  return '#6b7280';
};

const getTransactionTitle = (type) => {
  const titles = {
    'transfer': 'Bank Transfer',
    'international_transfer': 'International Transfer',
    'billpayment': 'Bill Payment',
    'p2p': 'P2P Payment',
    'scheduled_payment': 'Scheduled Payment',
    'deposit': 'Deposit',
    'withdrawal': 'Withdrawal'
  };
  return titles[type] || 'Transaction';
};

// ── Animated Filter Button ──
function FilterButton({ active, icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className="filter-btn"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '10px 18px', borderRadius: 10,
        border: `2px solid ${active ? color : '#e5e7eb'}`,
        background: active ? `${color}15` : '#fff',
        color: active ? color : '#64748b',
        fontWeight: active ? 700 : 600,
        fontSize: 14, cursor: 'pointer',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  );
}

// ── Transaction Card ──
function TransactionCard({ transaction, isSelected, onClick, isDark }) {
  const colors = {
    bg: isSelected ? (isDark ? '#1a2332' : '#f0f9ff') : (isDark ? '#1a1a2e' : '#fff'),
    border: isSelected ? '#2563eb' : (isDark ? '#2a2a4a' : '#e5e7eb'),
    text: isDark ? '#e8eaf6' : '#1a1a2a',
    textMuted: isDark ? '#8892b0' : '#64748b',
  };

  return (
    <div
      onClick={onClick}
      className="transaction-card"
      style={{
        display: 'flex', alignItems: 'center', padding: '18px 20px',
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 16, cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isSelected ? '0 8px 25px rgba(37,99,235,0.2)' : '0 2px 6px rgba(0,0,0,0.04)',
      }}
    >
      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${getTransactionColor(transaction.transaction_type, transaction.direction)}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, marginRight: 16, flexShrink: 0,
        border: `2px solid ${getTransactionColor(transaction.transaction_type, transaction.direction)}40`,
      }}>
        {getTransactionIcon(transaction.transaction_type)}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getTransactionTitle(transaction.transaction_type)}
          </div>
          <div style={{
            fontWeight: 800, fontSize: 18, marginLeft: 12, flexShrink: 0,
            color: getTransactionColor(transaction.transaction_type, transaction.direction)
          }}>
            {formatAmount(transaction.amount, transaction.transaction_type, transaction.direction)}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: colors.textMuted }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 12 }}>
            {transaction.description || transaction.recipient_name || transaction.provider || 'No description'}
            {transaction.reference && (
              <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.7 }}>
                • {transaction.reference}
              </span>
            )}
          </div>
          <div style={{ flexShrink: 0, fontWeight: 600 }}>{formatDate(transaction.created_at)}</div>
        </div>
      </div>

      {/* Expand Arrow */}
      <div style={{
        marginLeft: 14, fontSize: 16, color: colors.textMuted,
        transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease',
      }}>
        ▼
      </div>
    </div>
  );
}

const formatAmount = (amount, type, direction) => {
  const formattedAmount = parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
  const prefix = (direction === 'credit' || type === 'deposit') ? '+' : '-';
  return `${prefix}$${formattedAmount}`;
};

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Unknown';
  }
};

export default function TransactionHistory({ user, account, isDarkMode }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
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
    cardElevated: dark ? '#0f0f2a' : '#f8fafc',
  };

  // Fetch transactions
  useEffect(() => {
    async function fetchTransactions() {
      try {
        setLoading(true);
        setError('');
        
        const userId = user?.user_id || user?.id || user?.userId;
        
        if (!userId) {
          throw new Error('User ID not found. Please log in again.');
        }
        
        if (!config?.API_BASE_URL) {
          throw new Error('API configuration missing.');
        }
        
        const apiUrl = `${config.API_BASE_URL}/transactions.php?user_id=${userId}`;
        
        const response = await axios.get(apiUrl, {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          withCredentials: false
        });
        
        let transactionData = [];
        
        if (response.data.success && response.data.data) {
          transactionData = response.data.data;
        } else if (Array.isArray(response.data)) {
          transactionData = response.data;
        } else if (response.data.transactions && Array.isArray(response.data.transactions)) {
          transactionData = response.data.transactions;
        } else if (response.data.error) {
          throw new Error(response.data.error + (response.data.details ? ': ' + response.data.details : ''));
        } else {
          throw new Error('Unexpected response format from server');
        }
        
        const cleanedTransactions = transactionData.map((tx, index) => ({
          id: tx.id || `temp_${index}_${Date.now()}`,
          transaction_type: tx.transaction_type || 'transfer',
          amount: parseFloat(tx.amount) || 0,
          direction: tx.direction || 'debit',
          recipient_name: tx.recipient_name || tx.recipient || '',
          to_account: tx.to_account || tx.recipient_account || '',
          from_account: tx.from_account || account?.account_number || account?.accountNumber || '',
          recipient_bank: tx.recipient_bank || tx.bank_name || '',
          recipient_country: tx.recipient_country || '',
          swift_code: tx.swift_code || '',
          provider: tx.provider || '',
          customer_id: tx.customer_id || '',
          purpose: tx.purpose || '',
          description: tx.description || tx.memo || tx.note || '',
          reference: tx.reference || '',
          status: tx.status || 'completed',
          created_at: tx.created_at || new Date().toISOString()
        }));
        
        const sortedTransactions = cleanedTransactions.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
        
        setTransactions(sortedTransactions);
        setFilteredTransactions(sortedTransactions);
        setRetryCount(0);
        
      } catch (error) {
        let errorMessage = 'Failed to load transactions. ';
        
        if (error.response?.status === 404) {
          errorMessage += 'API endpoint not found.';
        } else if (error.response?.status === 500) {
          errorMessage += 'Server error occurred.';
        } else if (error.response?.status === 400) {
          errorMessage += 'Invalid request.';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage += 'Request timeout.';
        } else if (error.code === 'ERR_NETWORK') {
          errorMessage += 'Network error.';
        } else if (error.response?.data?.error) {
          errorMessage += error.response.data.error;
        } else if (error.message) {
          errorMessage += error.message;
        } else {
          errorMessage += 'Unknown error.';
        }
        
        setError(errorMessage);
        setTransactions([]);
        setFilteredTransactions([]);
      }
      setLoading(false);
    }
    
    if (user) {
      fetchTransactions();
    } else {
      setLoading(false);
      setError('No user information available. Please log in.');
    }
  }, [user, account, retryCount]);

  // Filter transactions
  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.recipient_name?.toLowerCase().includes(searchLower) ||
        tx.reference?.toLowerCase().includes(searchLower) ||
        tx.provider?.toLowerCase().includes(searchLower) ||
        tx.amount?.toString().includes(searchTerm) ||
        tx.to_account?.toLowerCase().includes(searchLower) ||
        tx.recipient_bank?.toLowerCase().includes(searchLower)
      );
    }

    if (filterType) {
      filtered = filtered.filter(tx => tx.transaction_type === filterType);
    }

    if (filterDate !== 'all') {
      const now = new Date();
      const filterDate30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const filterDate7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(tx => {
        const txDate = new Date(tx.created_at);
        if (filterDate === '7days') return txDate >= filterDate7;
        if (filterDate === '30days') return txDate >= filterDate30;
        return true;
      });
    }

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, searchTerm, filterType, filterDate]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const exportTransactions = () => {
    try {
      const csvContent = [
        ['Date', 'Type', 'Amount', 'Direction', 'Description', 'Reference', 'Status'].join(','),
        ...filteredTransactions.map(tx => [
          new Date(tx.created_at).toLocaleString(),
          getTransactionTitle(tx.transaction_type),
          tx.amount,
          tx.direction,
          (tx.description || '').replace(/,/g, ';'),
          tx.reference || '',
          tx.status || 'completed'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export transactions.');
    }
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
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.05)} }
        @keyframes cardPop { 0%{transform:scale(.97);opacity:0}70%{transform:scale(1.01)}100%{transform:scale(1);opacity:1} }
        .transaction-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.12) !important; }
        .filter-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        input::placeholder { color: #9ca3af; }
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
        }}>📊</div>
        <h1 style={{
          color: '#fff', fontSize: 26, fontWeight: 800, margin: '0 0 6px',
          textShadow: '0 2px 10px rgba(0,0,0,0.2)',
        }}>Transaction History</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, margin: 0 }}>
          View and manage all your transactions
        </p>
      </div>

      <div style={{ maxWidth: 1100, width: '100%', animation: 'fadeSlideUp 0.4s ease' }}>

        {/* Filters Section */}
        <div style={{
          background: colors.card, borderRadius: 20, padding: 24, marginBottom: 20,
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
        }}>
          {/* Search Bar */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
              fontSize: 13, fontWeight: 600, color: colors.textMuted,
            }}>
              🔍 Search Transactions
            </label>
            <input
              type="text"
              placeholder="Search by description, recipient, reference, or amount..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '14px 18px', borderRadius: 12,
                border: `2px solid ${colors.inputBorder}`,
                fontSize: 15, boxSizing: 'border-box', outline: 'none',
                background: colors.input, color: colors.text,
                transition: 'all 0.2s ease',
              }}
            />
          </div>

          {/* Type Filters */}
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block', marginBottom: 12,
              fontSize: 13, fontWeight: 600, color: colors.textMuted,
            }}>
              Filter by Type
            </label>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 10,
            }}>
              {transactionTypes.map(type => (
                <FilterButton
                  key={type.value}
                  active={filterType === type.value}
                  icon={type.icon}
                  label={type.label}
                  color={type.color}
                  onClick={() => setFilterType(type.value)}
                />
              ))}
            </div>
          </div>

          {/* Date Filter & Stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 13, fontWeight: 600, color: colors.textMuted,
              }}>
                📅 Date Range:
              </label>
              {[
                { value: 'all', label: 'All Time' },
                { value: '7days', label: 'Last 7 Days' },
                { value: '30days', label: 'Last 30 Days' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilterDate(opt.value)}
                  style={{
                    padding: '8px 16px', borderRadius: 10,
                    border: `2px solid ${filterDate === opt.value ? '#2563eb' : colors.inputBorder}`,
                    background: filterDate === opt.value ? 'rgba(37,99,235,0.1)' : 'transparent',
                    color: filterDate === opt.value ? '#2563eb' : colors.text,
                    fontWeight: 600, fontSize: 13, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 13, color: colors.textMuted }}>
                Showing <span style={{ fontWeight: 700, color: colors.text }}>{currentTransactions.length}</span> of{' '}
                <span style={{ fontWeight: 700, color: '#2563eb' }}>{filteredTransactions.length}</span>
                {transactions.length !== filteredTransactions.length && (
                  <span style={{ color: colors.textMuted }}> (Total: {transactions.length})</span>
                )}
              </div>
              {filteredTransactions.length > 0 && (
                <button
                  onClick={exportTransactions}
                  className="filter-btn"
                  style={{
                    padding: '10px 18px', borderRadius: 10,
                    border: '2px solid #22c55e',
                    background: 'rgba(34,197,94,0.1)',
                    color: '#22c55e',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  📥 Export CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ═══ LOADING STATE ═══ */}
        {loading && (
          <div style={{
            background: colors.card, borderRadius: 20, padding: 60,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 400, animation: 'fadeSlideUp 0.4s ease',
          }}>
            <div style={{
              width: 64, height: 64, border: '6px solid rgba(37,99,235,0.2)',
              borderTop: '6px solid #2563eb', borderRadius: '50%',
              animation: 'spin 1s linear infinite', marginBottom: 24,
            }} />
            <div style={{ fontWeight: 700, fontSize: 18, color: '#2563eb', marginBottom: 8 }}>
              Loading Transactions
            </div>
            <div style={{ fontSize: 14, color: colors.textMuted }}>
              Please wait while we fetch your data...
            </div>
          </div>
        )}

        {/* ═══ ERROR STATE ═══ */}
        {error && !loading && (
          <div style={{
            background: colors.card, borderRadius: 20, padding: 50,
            border: `2px solid #ef4444`,
            boxShadow: '0 8px 32px rgba(239,68,68,0.2)',
            textAlign: 'center', animation: 'fadeSlideUp 0.4s ease',
          }}>
            <div style={{ fontSize: 52, marginBottom: 20, animation: 'pulse 2s infinite' }}>⚠️</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#ef4444', marginBottom: 12 }}>
              Error Loading Transactions
            </div>
            <div style={{ fontSize: 14, color: colors.textMuted, marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
              {error}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setRetryCount(prev => prev + 1)}
                style={{
                  padding: '12px 28px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff', border: 'none',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                🔄 Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '12px 28px', borderRadius: 12,
                  background: dark ? '#2a2a4a' : '#e5e7eb',
                  color: colors.text, border: 'none',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* ═══ EMPTY STATE ═══ */}
        {!loading && !error && filteredTransactions.length === 0 && (
          <div style={{
            background: colors.card, borderRadius: 20, padding: 50,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
            textAlign: 'center', animation: 'fadeSlideUp 0.4s ease',
          }}>
            <div style={{ fontSize: 52, marginBottom: 20 }}>📝</div>
            <div style={{ fontWeight: 700, fontSize: 20, color: colors.text, marginBottom: 12 }}>
              {transactions.length === 0 ? 'No Transactions Yet' : 'No Matching Transactions'}
            </div>
            <div style={{ fontSize: 15, color: colors.textMuted, marginBottom: 24 }}>
              {transactions.length === 0 
                ? 'Your transaction history will appear here once you make your first transaction.'
                : 'Try adjusting your search or filter criteria.'
              }
            </div>
            {transactions.length === 0 && (
              <button
                onClick={() => setRetryCount(prev => prev + 1)}
                style={{
                  padding: '12px 28px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                  color: '#fff', border: 'none',
                  fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(37,99,235,0.3)',
                }}
              >
                🔄 Check Again
              </button>
            )}
          </div>
        )}

        {/* ═══ TRANSACTIONS LIST ═══ */}
        {!loading && !error && currentTransactions.length > 0 && (
          <div style={{
            background: colors.card, borderRadius: 20, padding: 24,
            border: `1px solid ${colors.cardBorder}`,
            boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {currentTransactions.map((tx, index) => (
                <div key={tx.id || index} style={{ animation: `cardPop 0.4s ease ${index * 0.05}s both` }}>
                  <TransactionCard
                    transaction={tx}
                    isSelected={selectedTransaction?.id === tx.id}
                    onClick={() => setSelectedTransaction(selectedTransaction?.id === tx.id ? null : tx)}
                    isDark={dark}
                  />

                  {/* Expanded Details */}
                  {selectedTransaction?.id === tx.id && (
                    <div style={{
                      marginTop: 14, padding: 24,
                      background: dark ? '#0f0f2a' : '#f0f9ff',
                      borderRadius: 16,
                      border: `2px solid ${dark ? '#2a3a5a' : '#bfdbfe'}`,
                      animation: 'fadeSlideUp 0.3s ease',
                    }}>
                      <div style={{
                        fontWeight: 700, fontSize: 16, marginBottom: 18,
                        color: dark ? '#818cf8' : '#1e40af',
                        paddingBottom: 12,
                        borderBottom: `2px solid ${dark ? '#2a3a5a' : '#dbeafe'}`,
                      }}>
                        📋 Transaction Details
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 14,
                      }}>
                        {[
                          { label: 'Reference', value: tx.reference || 'N/A', icon: '🔢' },
                          { label: 'Status', value: tx.status || 'Completed', icon: '✅', highlight: true },
                          { label: 'Date', value: new Date(tx.created_at).toLocaleString(), icon: '📅' },
                          { label: 'Type', value: getTransactionTitle(tx.transaction_type), icon: getTransactionIcon(tx.transaction_type) },
                          { label: 'Direction', value: tx.direction || 'N/A', icon: '↔️' },
                          { label: 'Amount', value: `$${parseFloat(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💰' },
                          tx.recipient_name && { label: 'Recipient', value: tx.recipient_name, icon: '👤' },
                          tx.to_account && { label: 'To Account', value: tx.to_account, icon: '🏦' },
                          tx.from_account && { label: 'From Account', value: tx.from_account, icon: '💳' },
                          tx.recipient_bank && { label: 'Bank', value: tx.recipient_bank, icon: '🏛️' },
                          tx.recipient_country && { label: 'Country', value: tx.recipient_country, icon: '🌍' },
                          tx.swift_code && { label: 'SWIFT', value: tx.swift_code, icon: '🔐' },
                          tx.provider && { label: 'Provider', value: tx.provider, icon: '🏢' },
                          tx.customer_id && { label: 'Customer ID', value: tx.customer_id, icon: '🆔' },
                          tx.purpose && { label: 'Purpose', value: tx.purpose, icon: '🎯' },
                          tx.description && { label: 'Description', value: tx.description, icon: '📝' },
                        ].filter(Boolean).map((item, i) => (
                          <div key={i} style={{
                            padding: 12, borderRadius: 10,
                            background: dark ? '#1a2332' : '#fff',
                            border: `1px solid ${dark ? '#2a3a5a' : '#e0e7ff'}`,
                          }}>
                            <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4 }}>
                              {item.icon} {item.label}
                            </div>
                            <div style={{
                              fontWeight: 600, fontSize: 13,
                              color: item.highlight ? '#22c55e' : colors.text,
                              overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ PAGINATION ═══ */}
        {!loading && !error && totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 16, marginTop: 24, animation: 'fadeSlideUp 0.5s ease',
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '12px 24px', borderRadius: 12,
                border: `2px solid ${currentPage === 1 ? colors.cardBorder : '#2563eb'}`,
                background: currentPage === 1 ? 'transparent' : 'rgba(37,99,235,0.1)',
                color: currentPage === 1 ? colors.textMuted : '#2563eb',
                fontWeight: 700, fontSize: 14,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              ← Previous
            </button>

            <div style={{
              padding: '10px 20px', borderRadius: 10,
              background: dark ? '#1a2332' : '#f0f9ff',
              border: `2px solid ${dark ? '#2a3a5a' : '#bfdbfe'}`,
              fontSize: 14, fontWeight: 700, color: colors.text,
            }}>
              Page {currentPage} of {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '12px 24px', borderRadius: 12,
                border: `2px solid ${currentPage === totalPages ? colors.cardBorder : '#2563eb'}`,
                background: currentPage === totalPages ? 'transparent' : 'rgba(37,99,235,0.1)',
                color: currentPage === totalPages ? colors.textMuted : '#2563eb',
                fontWeight: 700, fontSize: 14,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}