import React, { useState, useEffect, useCallback } from 'react';
import TransactionHistory from './TransactionHistory';
import EStatements from './EStatements';
import LocalTransfer from './LocalTransfer';
import InternationalTransfer from './InternationalTransfer';
import P2PPayments from './P2PPayments';
import BillPayments from './BillPayments';
import ScheduledPayments from './ScheduledPayments';
import ChequeDeposit from './ChequeDeposit';
import CryptoWallet from './CryptoWallet';
import ChatBot from './ChatBot';
import axios from 'axios';
import config from '../config';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend, Tooltip, Filler);

const SAVINGS_ANNUAL_RATE = 4.75;
const SAVINGS_MONTHLY_RATE = SAVINGS_ANNUAL_RATE / 12 / 100;

const animations = `
  @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(1.08)} }
  @keyframes slideIn { 0%{transform:translateX(-20px);opacity:0} 100%{transform:translateX(0);opacity:1} }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn { 0%{opacity:0;transform:translateY(-10px)} 100%{opacity:1;transform:translateY(0)} }
  @keyframes cardPop { 0%{transform:scale(0.95);opacity:0} 70%{transform:scale(1.02)} 100%{transform:scale(1);opacity:1} }
  @keyframes countUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes interestGlow { 0%{box-shadow:0 0 10px rgba(37,99,235,0.2)} 50%{box-shadow:0 0 30px rgba(37,99,235,0.5)} 100%{box-shadow:0 0 10px rgba(37,99,235,0.2)} }
  @keyframes accrualPulse { 0%{box-shadow:0 0 5px rgba(37,99,235,0.2)} 50%{box-shadow:0 0 20px rgba(37,99,235,0.4)} 100%{box-shadow:0 0 5px rgba(37,99,235,0.2)} }
  @keyframes tickUp { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  .sidebar-item:hover{background:rgba(255,255,255,0.12)!important}
  .action-card:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.15)!important}
  .stat-card:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,0.1)!important}
  .feature-card:hover{transform:translateY(-2px);border-color:#2563eb!important}
  .modal-overlay{backdrop-filter:blur(8px)}
  .savings-transfer-btn:hover{transform:translateY(-2px)!important}
  .savings-tab-btn:hover{opacity:0.85}
`;

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
    sectionTitle: isDarkMode ? '#818cf8' : '#1e3c7d',
    accent: '#2563eb',
    accentDark: '#1e3c7d',
    success: '#22c55e',
    error: '#ef4444',
    warning: '#f59e0b',
    cardElevated: isDarkMode ? '#0f0f2a' : '#f8fafc',
  };
}

function safeNum(val) {
  if (typeof val === 'number' && !isNaN(val)) return val;
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function formatCurrency(val) {
  const n = safeNum(val);
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return 'N/A'; }
}

function mapSavingsTransaction(tx) {
  const type = (tx.transaction_type || '').toLowerCase();
  const isIncoming = ['deposit', 'transfer_in', 'interest'].includes(type);
  return {
    id: tx.id,
    date: tx.created_at,
    amount: safeNum(tx.amount),
    direction: isIncoming ? 'toSavings' : 'toChecking',
    note: tx.description || (isIncoming ? 'Transfer to Savings' : 'Transfer to Checking'),
    balanceAfter: safeNum(tx.balance_after),
    type: tx.transaction_type,
  };
}

// ── Real-time Interest Calculator ─────────────────────────────────────────────
function calculateAccruedInterest(savingsHistory, currentBalance) {
  if (!savingsHistory || savingsHistory.length === 0 || currentBalance <= 0) {
    return { totalAccrued: 0, dailyRate: 0, hourlyRate: 0, perSecond: 0, daysSinceFirst: 0, monthsSinceFirst: 0, yearsSinceFirst: 0, deposits: [] };
  }

  const now = new Date();
  const dailyRate = SAVINGS_ANNUAL_RATE / 100 / 365;
  const hourlyRate = dailyRate / 24;
  const perSecond = hourlyRate / 3600;

  // Build deposit ledger: track each deposit and when it was made
  const deposits = [];
  savingsHistory
    .filter(tx => tx.direction === 'toSavings')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach(tx => {
      const depositDate = new Date(tx.date);
      if (!isNaN(depositDate.getTime())) {
        const msElapsed = now - depositDate;
        const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
        const interestEarned = safeNum(tx.amount) * dailyRate * daysElapsed;
        deposits.push({
          amount: safeNum(tx.amount),
          date: depositDate,
          daysElapsed: Math.max(0, daysElapsed),
          interestEarned: Math.max(0, interestEarned),
        });
      }
    });

  // Also account for withdrawals reducing principal
  const withdrawals = savingsHistory
    .filter(tx => tx.direction === 'toChecking')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Simple accrual: sum interest from each deposit based on time held
  let totalAccrued = deposits.reduce((sum, d) => sum + d.interestEarned, 0);

  // Find earliest deposit
  const firstDeposit = deposits.length > 0 ? deposits[0].date : now;
  const msSinceFirst = now - firstDeposit;
  const daysSinceFirst = Math.max(0, msSinceFirst / (1000 * 60 * 60 * 24));
  const monthsSinceFirst = daysSinceFirst / 30.44;
  const yearsSinceFirst = daysSinceFirst / 365.25;

  return {
    totalAccrued: Math.max(0, totalAccrued),
    dailyRate,
    hourlyRate,
    perSecond,
    daysSinceFirst,
    monthsSinceFirst,
    yearsSinceFirst,
    deposits,
    firstDepositDate: firstDeposit,
  };
}

// ── Live Interest Ticker ──────────────────────────────────────────────────────
function LiveInterestTicker({ savingsHistory, savingsBalance, isDarkMode }) {
  const c = useColors(isDarkMode);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const interest = calculateAccruedInterest(savingsHistory, savingsBalance);

  if (savingsBalance <= 0 || interest.deposits.length === 0) return null;

  // Live accumulating display
  const now = new Date();
  let liveTotal = 0;
  interest.deposits.forEach(d => {
    const ms = now - d.date;
    const days = ms / (1000 * 60 * 60 * 24);
    liveTotal += d.amount * interest.dailyRate * days;
  });

  const timeLabel = interest.yearsSinceFirst >= 1
    ? `${interest.yearsSinceFirst.toFixed(1)} years`
    : interest.monthsSinceFirst >= 1
      ? `${interest.monthsSinceFirst.toFixed(1)} months`
      : `${Math.floor(interest.daysSinceFirst)} days`;

  return (
    <div style={{
      background: isDarkMode ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.05)',
      border: '1px solid rgba(37,99,235,0.2)',
      borderRadius: 16, padding: '18px 22px', marginTop: 20,
      animation: 'accrualPulse 3s infinite',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}>⏱️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: c.text }}>Live Interest Accrued</div>
            <div style={{ fontSize: 11, color: c.textMuted }}>Compounding in real-time • {timeLabel}</div>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)',
          borderRadius: 50, padding: '3px 10px',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', animation: 'pulse 1.5s infinite' }} />
          <span style={{ color: '#2563eb', fontSize: 10, fontWeight: 700 }}>LIVE</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <div style={{
          background: isDarkMode ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.06)',
          borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(37,99,235,0.15)',
        }}>
          <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, marginBottom: 6 }}>TOTAL EARNED</div>
          <div style={{
            fontSize: 24, fontWeight: 900, color: '#2563eb',
            fontFamily: "'Segoe UI', monospace", animation: 'tickUp 0.3s ease',
          }} key={tick}>
            {formatCurrency(liveTotal)}
          </div>
        </div>

        <div style={{
          background: isDarkMode ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.06)',
          borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(37,99,235,0.15)',
        }}>
          <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, marginBottom: 6 }}>PER DAY</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>
            +{formatCurrency(savingsBalance * interest.dailyRate)}
          </div>
        </div>

        <div style={{
          background: isDarkMode ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.06)',
          borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(37,99,235,0.15)',
        }}>
          <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, marginBottom: 6 }}>PER MONTH</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>
            +{formatCurrency(savingsBalance * SAVINGS_MONTHLY_RATE)}
          </div>
        </div>

        <div style={{
          background: isDarkMode ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.06)',
          borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(37,99,235,0.15)',
        }}>
          <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, marginBottom: 6 }}>PER YEAR</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>
            +{formatCurrency(savingsBalance * SAVINGS_ANNUAL_RATE / 100)}
          </div>
        </div>
      </div>

      {/* Deposit breakdown */}
      {interest.deposits.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Interest by Deposit ({interest.deposits.length} deposit{interest.deposits.length > 1 ? 's' : ''})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
            {interest.deposits.map((dep, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                borderRadius: 10, border: '1px solid ' + c.cardBorder, fontSize: 12,
              }}>
                <div>
                  <span style={{ fontWeight: 700, color: c.text }}>{formatCurrency(dep.amount)}</span>
                  <span style={{ color: c.textMuted, marginLeft: 6 }}>
                    • {Math.floor(dep.daysElapsed)}d ago
                  </span>
                </div>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>+{formatCurrency(dep.interestEarned)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Savings Component ────────────────────────────────────────────────────────
function SavingsAccount({ user, account, isDarkMode, savingsBalance: rawSavBal, savingsHistory: rawSavHist, onSavingsTransferComplete }) {
  const c = useColors(isDarkMode);
  const savingsBalance = safeNum(rawSavBal);
  const savingsHistory = Array.isArray(rawSavHist) ? rawSavHist : [];

  const [activeTab, setActiveTab] = useState('overview');
  const [transferDirection, setTransferDirection] = useState('toSavings');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferMsg, setTransferMsg] = useState({ text: '', type: '' });
  const [showBalances, setShowBalances] = useState(true);

  const checkingBalance = account ? safeNum(account.balance) : 0;
  const interest = calculateAccruedInterest(savingsHistory, savingsBalance);
  const monthlyInterest = savingsBalance * SAVINGS_MONTHLY_RATE;
  const yearlyInterest = savingsBalance * (SAVINGS_ANNUAL_RATE / 100);

  const projectedBalance = (months) => savingsBalance * Math.pow(1 + SAVINGS_MONTHLY_RATE, months);

  const handleTransfer = async (e) => {
    e.preventDefault();
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) { setTransferMsg({ text: 'Please enter a valid amount.', type: 'error' }); return; }
    if (transferDirection === 'toSavings' && amount > checkingBalance) { setTransferMsg({ text: 'Insufficient checking balance.', type: 'error' }); return; }
    if (transferDirection === 'toChecking' && amount > savingsBalance) { setTransferMsg({ text: 'Insufficient savings balance.', type: 'error' }); return; }

    setTransferring(true);
    setTransferMsg({ text: '', type: '' });

    try {
      const response = await axios.post(config.API_BASE_URL + '/savings.php', {
        user_id: user?.user_id || user?.id,
        action: transferDirection === 'toSavings' ? 'transfer_from_checking' : 'transfer_to_checking',
        amount,
        description: transferNote || (transferDirection === 'toSavings' ? 'Transfer to Savings' : 'Transfer to Checking'),
      });
      if (response.data && response.data.success) {
        setTransferMsg({ text: `✅ Successfully transferred ${formatCurrency(amount)} ${transferDirection === 'toSavings' ? 'to Savings' : 'to Checking'}.`, type: 'success' });
        setTransferAmount('');
        setTransferNote('');
        if (onSavingsTransferComplete) onSavingsTransferComplete();
      } else {
        setTransferMsg({ text: '❌ ' + (response.data?.error || 'Transfer failed.'), type: 'error' });
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Transfer failed. Please try again.';
      setTransferMsg({ text: '❌ ' + errMsg, type: 'error' });
    }
    setTransferring(false);
  };

  const projectionData = {
    labels: ['Now', '3mo', '6mo', '9mo', '12mo', '18mo', '24mo'],
    datasets: [{
      label: 'Projected Balance',
      data: [0, 3, 6, 9, 12, 18, 24].map(m => parseFloat(projectedBalance(m).toFixed(2))),
      fill: true, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.10)',
      tension: 0.4, borderWidth: 2.5, pointRadius: 5, pointBackgroundColor: '#2563eb',
      pointBorderColor: '#fff', pointBorderWidth: 2,
    }]
  };
  const projectionOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: c.card, titleColor: c.text, bodyColor: c.textMuted, borderColor: c.cardBorder, borderWidth: 1, cornerRadius: 12, padding: 12, callbacks: { label: (ctx) => ' Balance: ' + formatCurrency(ctx.raw) } }
    },
    scales: {
      y: { beginAtZero: false, grid: { color: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', drawBorder: false }, ticks: { color: c.textMuted, font: { size: 11 }, callback: (v) => '$' + safeNum(v).toLocaleString() }, border: { display: false } },
      x: { grid: { display: false }, ticks: { color: c.textMuted, font: { size: 11, weight: '600' } }, border: { display: false } }
    },
    interaction: { intersect: false, mode: 'index' },
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'transfer', label: 'Transfer', icon: '🔄' },
    { key: 'history', label: 'History', icon: '📋' },
    { key: 'projection', label: 'Growth', icon: '📈' },
  ];

  return (
    <div style={{ maxWidth: 1100, width: '100%', padding: '0 20px', margin: '0 auto' }}>

      {/* Hero Banner — BLUE theme */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2347 0%, #1e3c7d 40%, #2563eb 80%, #3b82f6 100%)',
        borderRadius: 24, padding: '32px 36px', marginBottom: 28,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(30,60,125,0.4)', animation: 'cardPop 0.5s ease',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 200, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, backdropFilter: 'blur(4px)' }}>💰</div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Savings Account</p>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>High-yield • FDIC Insured</p>
              </div>
            </div>
            <div style={{ fontSize: 46, fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: 4, animation: 'countUp 0.6s ease' }}>
              {showBalances ? formatCurrency(savingsBalance) : '••••••••'}
            </div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Total Savings Balance</p>
            {interest.totalAccrued > 0 && showBalances && (
              <p style={{ margin: '4px 0 0', color: '#93c5fd', fontSize: 13, fontWeight: 600 }}>
                +{formatCurrency(interest.totalAccrued)} interest earned
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
            <div style={{
              background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
              borderRadius: 16, padding: '14px 20px', border: '1px solid rgba(255,255,255,0.2)',
              textAlign: 'center', animation: 'interestGlow 3s infinite',
            }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>{SAVINGS_ANNUAL_RATE}%</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: '1px', marginTop: 2 }}>ANNUAL APY</div>
            </div>
            <button onClick={() => setShowBalances(!showBalances)} style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', borderRadius: 10, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600,
            }}>{showBalances ? '👁️ Hide' : '👁️‍🗨️ Show'}</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {[
            { label: 'Interest Earned', value: formatCurrency(interest.totalAccrued), icon: '✨', color: '#fbbf24' },
            { label: 'Monthly Interest', value: formatCurrency(monthlyInterest), icon: '📅', color: '#93c5fd' },
            { label: 'Annual Interest', value: formatCurrency(yearlyInterest), icon: '🎯', color: '#a78bfa' },
            { label: 'Saving Since', value: interest.daysSinceFirst > 0 ? `${Math.floor(interest.daysSinceFirst)}d` : 'N/A', icon: '⏰', color: '#f9a8d4' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(4px)',
              borderRadius: 14, padding: '12px 18px', border: '1px solid rgba(255,255,255,0.12)',
              flex: '1 1 130px', minWidth: 120,
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: stat.color, marginBottom: 2 }}>{showBalances ? stat.value : '••••'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 24, background: c.card,
        borderRadius: 16, padding: 6, border: '1px solid ' + c.cardBorder,
      }}>
        {tabs.map(tab => (
          <button key={tab.key} className="savings-tab-btn" onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: '11px 16px', border: 'none', borderRadius: 12,
            cursor: 'pointer', fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.25s ease',
            background: activeTab === tab.key ? 'linear-gradient(135deg, #1e3c7d, #2563eb)' : 'transparent',
            color: activeTab === tab.key ? '#fff' : c.textMuted,
            boxShadow: activeTab === tab.key ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
          }}>
            <span style={{ fontSize: 15 }}>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ animation: 'fadeSlideUp 0.4s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ background: c.card, borderRadius: 20, padding: 24, border: '1px solid ' + c.cardBorder }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #1e3c7d, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>🏦</div>
                <div><div style={{ fontWeight: 700, fontSize: 14, color: c.text }}>Checking Account</div><div style={{ fontSize: 12, color: c.textMuted }}>Available Balance</div></div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: c.text, marginBottom: 8 }}>{showBalances ? formatCurrency(checkingBalance) : '••••••••'}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 50, padding: '3px 10px' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563eb', animation: 'pulse 1.5s infinite' }} />
                <span style={{ color: '#2563eb', fontSize: 10, fontWeight: 700 }}>No APY</span>
              </div>
            </div>

            <div style={{ background: c.card, borderRadius: 20, padding: 24, border: '1px solid rgba(37,99,235,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #1e3c7d, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>💰</div>
                <div><div style={{ fontWeight: 700, fontSize: 14, color: c.text }}>Savings Account</div><div style={{ fontSize: 12, color: c.textMuted }}>Earning Interest</div></div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#2563eb', marginBottom: 8 }}>{showBalances ? formatCurrency(savingsBalance) : '••••••••'}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 50, padding: '3px 10px' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563eb', animation: 'pulse 1.5s infinite' }} />
                <span style={{ color: '#2563eb', fontSize: 10, fontWeight: 700 }}>{SAVINGS_ANNUAL_RATE}% APY</span>
              </div>
              {interest.totalAccrued > 0 && showBalances && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#2563eb', fontWeight: 600 }}>+{formatCurrency(interest.totalAccrued)} earned so far</div>
              )}
            </div>

            <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', borderRadius: 20, padding: 24, border: '1px solid rgba(139,92,246,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏆</div>
                <div><div style={{ fontWeight: 700, fontSize: 14, color: '#e0e7ff' }}>Total Wealth</div><div style={{ fontSize: 12, color: 'rgba(224,231,255,0.6)' }}>Including Accrued Interest</div></div>
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#a78bfa', marginBottom: 8 }}>
                {showBalances ? formatCurrency(checkingBalance + savingsBalance + interest.totalAccrued) : '••••••••'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(224,231,255,0.6)' }}>
                Savings: {(checkingBalance + savingsBalance) > 0 ? ((savingsBalance / (checkingBalance + savingsBalance)) * 100).toFixed(1) : '0'}% of total
              </div>
            </div>
          </div>

          {/* Live Interest Ticker */}
          <LiveInterestTicker savingsHistory={savingsHistory} savingsBalance={savingsBalance} isDarkMode={isDarkMode} />

          {/* Rate Details */}
          <div style={{ marginTop: 24, background: c.card, borderRadius: 20, padding: 28, border: '1px solid ' + c.cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid ' + c.cardBorder }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1e3c7d, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>⭐</div>
              <div><h3 style={{ margin: 0, color: isDarkMode ? '#93c5fd' : '#1e3c7d', fontSize: 16, fontWeight: 700 }}>Savings Rate Details</h3><p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Your current interest rate information</p></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
              {[
                { label: 'Annual Rate (APY)', value: SAVINGS_ANNUAL_RATE + '%', icon: '📊', color: '#2563eb' },
                { label: 'Monthly Rate', value: (SAVINGS_MONTHLY_RATE * 100).toFixed(4) + '%', icon: '📅', color: '#3b82f6' },
                { label: 'Daily Rate', value: (SAVINGS_ANNUAL_RATE / 365).toFixed(4) + '%', icon: '⏰', color: '#818cf8' },
                { label: 'Compounding', value: 'Daily', icon: '🔁', color: '#f59e0b' },
                { label: 'Min Balance', value: '$0.00', icon: '✅', color: '#22c55e' },
                { label: 'FDIC Insured', value: 'Up to $250K', icon: '🛡️', color: '#06b6d4' },
              ].map((item, i) => (
                <div key={i} className="stat-card" style={{ background: c.cardElevated, borderRadius: 14, padding: 16, border: '1px solid ' + c.cardBorder, transition: 'all 0.3s ease' }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: item.color, marginBottom: 4 }}>{item.value}</div>
                  <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Tab */}
      {activeTab === 'transfer' && (
        <div style={{ animation: 'fadeSlideUp 0.4s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: c.card, borderRadius: 20, padding: 28, border: '1px solid ' + c.cardBorder }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid ' + c.cardBorder }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1e3c7d, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🔄</div>
                <div><h3 style={{ margin: 0, color: isDarkMode ? '#93c5fd' : '#1e3c7d', fontSize: 16, fontWeight: 700 }}>Fund Transfer</h3><p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Move money between accounts</p></div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 10 }}>Transfer Direction</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { value: 'toSavings', label: 'Checking → Savings', icon: '📥', color: '#2563eb' },
                    { value: 'toChecking', label: 'Savings → Checking', icon: '📤', color: '#1e3c7d' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => { setTransferDirection(opt.value); setTransferMsg({ text: '', type: '' }); }} style={{
                      padding: '14px 12px', border: transferDirection === opt.value ? '2px solid ' + opt.color : '2px solid ' + c.cardBorder,
                      borderRadius: 14, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                      background: transferDirection === opt.value ? opt.color + '12' : c.cardElevated,
                      color: transferDirection === opt.value ? opt.color : c.textMuted,
                      transition: 'all 0.25s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    }}><span style={{ fontSize: 22 }}>{opt.icon}</span><span>{opt.label}</span></button>
                  ))}
                </div>
              </div>
              <div style={{ background: c.cardElevated, borderRadius: 12, padding: '12px 16px', border: '1px solid ' + c.cardBorder, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, marginBottom: 4 }}>{transferDirection === 'toSavings' ? 'FROM (Checking)' : 'FROM (Savings)'}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>{formatCurrency(transferDirection === 'toSavings' ? checkingBalance : savingsBalance)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 20 }}>→</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, marginBottom: 4 }}>{transferDirection === 'toSavings' ? 'TO (Savings)' : 'TO (Checking)'}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#2563eb' }}>{formatCurrency(transferDirection === 'toSavings' ? savingsBalance : checkingBalance)}</div>
                </div>
              </div>
              <form onSubmit={handleTransfer}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>Transfer Amount</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 700, color: c.textMuted }}>$</span>
                    <input type="number" min="0.01" step="0.01" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} placeholder="0.00" required style={{
                      width: '100%', padding: '13px 16px 13px 30px', borderRadius: 12,
                      border: '2px solid ' + c.inputBorder, fontSize: 18, fontWeight: 700,
                      background: c.input, color: c.text, outline: 'none', boxSizing: 'border-box',
                    }} onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = c.inputBorder} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {[100, 500, 1000, 2500].map(amt => (
                      <button key={amt} type="button" onClick={() => setTransferAmount(amt.toString())} style={{
                        padding: '5px 12px', border: '1px solid ' + c.cardBorder, borderRadius: 8,
                        background: transferAmount === amt.toString() ? '#2563eb' : c.cardElevated,
                        color: transferAmount === amt.toString() ? '#fff' : c.textMuted,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>${amt.toLocaleString()}</button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>Note (Optional)</label>
                  <input type="text" value={transferNote} onChange={e => setTransferNote(e.target.value)} placeholder="Add a memo..." style={{
                    width: '100%', padding: '13px 16px', borderRadius: 12,
                    border: '2px solid ' + c.inputBorder, fontSize: 14,
                    background: c.input, color: c.text, outline: 'none', boxSizing: 'border-box',
                  }} />
                </div>
                {transferAmount && parseFloat(transferAmount) > 0 && transferDirection === 'toSavings' && (
                  <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, animation: 'fadeSlideUp 0.3s ease' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', marginBottom: 6 }}>💡 Interest Preview</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: c.textMuted }}>
                      <span>Monthly interest:</span><span style={{ fontWeight: 700, color: '#2563eb' }}>+{formatCurrency(parseFloat(transferAmount) * SAVINGS_MONTHLY_RATE)}/mo</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: c.textMuted, marginTop: 4 }}>
                      <span>Annual interest:</span><span style={{ fontWeight: 700, color: '#2563eb' }}>+{formatCurrency(parseFloat(transferAmount) * SAVINGS_ANNUAL_RATE / 100)}/yr</span>
                    </div>
                  </div>
                )}
                <button type="submit" disabled={transferring} className="savings-transfer-btn" style={{
                  width: '100%', padding: '15px', border: 'none', borderRadius: 14,
                  background: transferring ? 'rgba(156,163,175,0.4)' : 'linear-gradient(135deg, #1e3c7d, #2563eb)',
                  color: '#fff', fontWeight: 700, fontSize: 15, cursor: transferring ? 'not-allowed' : 'pointer',
                  boxShadow: transferring ? 'none' : '0 6px 20px rgba(37,99,235,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {transferring ? (<><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Processing...</>) : (<>{transferDirection === 'toSavings' ? '📥 Move to Savings' : '📤 Move to Checking'}</>)}
                </button>
                {transferMsg.text && (
                  <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 12, fontWeight: 600, fontSize: 14, textAlign: 'center', background: transferMsg.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid ' + (transferMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'), color: transferMsg.type === 'success' ? '#22c55e' : '#ef4444', animation: 'fadeSlideUp 0.3s ease' }}>
                    {transferMsg.text}
                  </div>
                )}
              </form>
            </div>
            {/* Info Side */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'linear-gradient(135deg, #0f2347, #2563eb)', borderRadius: 20, padding: 24, boxShadow: '0 8px 30px rgba(37,99,235,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 28 }}>🌱</span>
                  <div><div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Earn While You Save</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Your money works for you 24/7</div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'APY Rate', value: SAVINGS_ANNUAL_RATE + '%' },
                    { label: 'Interest Earned', value: formatCurrency(interest.totalAccrued) },
                    { label: 'This Month', value: formatCurrency(monthlyInterest) },
                    { label: 'This Year', value: formatCurrency(yearlyInterest) },
                  ].map((s, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>{showBalances ? s.value : '••••'}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: c.card, borderRadius: 20, padding: 24, border: '1px solid ' + c.cardBorder }}>
                <h4 style={{ margin: '0 0 16px', color: c.sectionTitle, fontSize: 14, fontWeight: 700 }}>💡 Savings Tips</h4>
                {[
                  { tip: 'Interest is calculated daily on your balance.', icon: '⏱️' },
                  { tip: 'The longer you save, the more compound interest grows.', icon: '📈' },
                  { tip: `At ${SAVINGS_ANNUAL_RATE}% APY, $10,000 earns $${(10000 * SAVINGS_ANNUAL_RATE / 100).toFixed(0)}/yr.`, icon: '💰' },
                  { tip: 'Your savings are FDIC insured up to $250,000.', icon: '🛡️' },
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < 3 ? '1px solid ' + c.cardBorder : 'none' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
                    <span style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.5 }}>{t.tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={{ animation: 'fadeSlideUp 0.4s ease' }}>
          <div style={{ background: c.card, borderRadius: 20, padding: 28, border: '1px solid ' + c.cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid ' + c.cardBorder }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1e3c7d, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📋</div>
                <div><h3 style={{ margin: 0, color: isDarkMode ? '#93c5fd' : '#1e3c7d', fontSize: 16, fontWeight: 700 }}>Transfer History</h3><p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Recent savings transfers</p></div>
              </div>
              <span style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', borderRadius: 50, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>{savingsHistory.length} transfers</span>
            </div>
            {savingsHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: c.textMuted }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📂</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: c.text }}>No transfers yet</div>
                <div style={{ fontSize: 13 }}>Start transferring funds to see your history here.</div>
                <button onClick={() => setActiveTab('transfer')} style={{ marginTop: 20, padding: '10px 24px', background: 'linear-gradient(135deg, #1e3c7d, #2563eb)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Make First Transfer →</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {savingsHistory.map((tx, i) => {
                  // Calculate interest earned on this deposit
                  let depositInterest = 0;
                  if (tx.direction === 'toSavings' && tx.date) {
                    const daysHeld = Math.max(0, (new Date() - new Date(tx.date)) / (1000 * 60 * 60 * 24));
                    depositInterest = tx.amount * (SAVINGS_ANNUAL_RATE / 100 / 365) * daysHeld;
                  }
                  return (
                    <div key={tx.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: c.cardElevated, borderRadius: 14, border: '1px solid ' + c.cardBorder, animation: 'fadeSlideUp 0.3s ease ' + (i * 0.04) + 's both' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: tx.direction === 'toSavings' ? 'rgba(37,99,235,0.12)' : 'rgba(139,92,246,0.12)', border: '1px solid ' + (tx.direction === 'toSavings' ? 'rgba(37,99,235,0.3)' : 'rgba(139,92,246,0.3)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                          {tx.direction === 'toSavings' ? '📥' : '📤'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: c.text, marginBottom: 2 }}>{tx.note || 'Transfer'}</div>
                          <div style={{ fontSize: 11, color: c.textMuted }}>{formatDate(tx.date)}</div>
                          {tx.direction === 'toSavings' && depositInterest > 0.001 && (
                            <div style={{ fontSize: 10, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>
                              ✨ +{formatCurrency(depositInterest)} interest earned
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: tx.direction === 'toSavings' ? '#2563eb' : '#7c3aed', marginBottom: 2 }}>
                          {tx.direction === 'toSavings' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </div>
                        <div style={{ fontSize: 11, color: c.textMuted }}>Balance: {formatCurrency(tx.balanceAfter)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projection Tab */}
      {activeTab === 'projection' && (
        <div style={{ animation: 'fadeSlideUp 0.4s ease' }}>
          <div style={{ background: c.card, borderRadius: 20, padding: 28, border: '1px solid ' + c.cardBorder, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid ' + c.cardBorder }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #1e3c7d, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📈</div>
              <div><h3 style={{ margin: 0, color: isDarkMode ? '#93c5fd' : '#1e3c7d', fontSize: 16, fontWeight: 700 }}>Growth Projection</h3><p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Estimated growth at {SAVINGS_ANNUAL_RATE}% APY</p></div>
            </div>
            {savingsBalance > 0 ? <Line data={projectionData} options={projectionOptions} /> : (
              <div style={{ textAlign: 'center', padding: '40px 24px', color: c.textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 8 }}>Start Saving to See Growth</div>
                <div style={{ fontSize: 13 }}>Transfer funds to see your projected growth.</div>
              </div>
            )}
          </div>
          <div style={{ background: c.card, borderRadius: 20, padding: 28, border: '1px solid ' + c.cardBorder }}>
            <h4 style={{ margin: '0 0 16px', color: c.sectionTitle, fontSize: 15, fontWeight: 700 }}>📊 Detailed Projections</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>
                  {['Period', 'Projected Balance', 'Interest Earned', 'Growth %'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', background: c.cardElevated, color: c.textMuted, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', borderBottom: '2px solid ' + c.cardBorder }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {[{ label: '1 Month', months: 1 }, { label: '3 Months', months: 3 }, { label: '6 Months', months: 6 }, { label: '1 Year', months: 12 }, { label: '2 Years', months: 24 }, { label: '5 Years', months: 60 }].map((row, i) => {
                    const proj = projectedBalance(row.months);
                    const earned = proj - savingsBalance;
                    const growth = savingsBalance > 0 ? ((earned / savingsBalance) * 100) : 0;
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : c.cardElevated }}>
                        <td style={{ padding: '12px 14px', color: c.text, fontWeight: 600, borderBottom: '1px solid ' + c.cardBorder }}>{row.label}</td>
                        <td style={{ padding: '12px 14px', color: '#2563eb', fontWeight: 700, borderBottom: '1px solid ' + c.cardBorder }}>{formatCurrency(proj)}</td>
                        <td style={{ padding: '12px 14px', color: '#3b82f6', fontWeight: 600, borderBottom: '1px solid ' + c.cardBorder }}>+{formatCurrency(earned)}</td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid ' + c.cardBorder }}>
                          <span style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '3px 8px', borderRadius: 50, fontSize: 11, fontWeight: 700 }}>+{growth.toFixed(2)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 11, color: c.textLight, textAlign: 'center' }}>* Projections based on current balance and {SAVINGS_ANNUAL_RATE}% APY. Actual returns may vary.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WelcomeMessage ───────────────────────────────────────────────────────────
function WelcomeMessage({ user }) {
  const getUserName = () => { try { const s = localStorage.getItem('user'); if (s) { const p = JSON.parse(s); return p.full_name || p.first_name || p.name || 'User'; } } catch {} return user?.full_name || user?.first_name || user?.name || 'User'; };
  const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return '🌅 Good Morning'; if (h < 17) return '☀️ Good Afternoon'; return '🌙 Good Evening'; };
  return (<div style={{ animation: 'fadeSlideUp 0.6s ease' }}><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px', fontWeight: 500, textAlign: 'right' }}>{getGreeting()}</p><h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>{getUserName()}</h1></div>);
}

// ─── AccountBalanceDisplay ────────────────────────────────────────────────────
function AccountBalanceDisplay({ account, isDarkMode }) {
  const [showBalance, setShowBalance] = useState(true);
  const c = useColors(isDarkMode);
  if (!account) return null;
  const balance = safeNum(account.balance);
  return (
    <div style={{ background: c.card, borderRadius: 20, border: '1px solid ' + c.cardBorder, animation: 'cardPop 0.5s ease', width: '320px', padding: '28px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 6px 30px rgba(0,0,0,0.06)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #1e3c7d, #2563eb, #818cf8)', borderRadius: '20px 20px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1e3c7d, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>💰</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Checking Balance</span>
        </div>
        <button onClick={() => setShowBalance(!showBalance)} style={{ background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', border: '1px solid ' + c.cardBorder, cursor: 'pointer', fontSize: 16, color: c.textMuted, padding: '6px 8px', borderRadius: 8, display: 'flex', alignItems: 'center' }}>{showBalance ? '👁️' : '👁️‍🗨️'}</button>
      </div>
      <div style={{ fontSize: 38, fontWeight: 800, color: c.text, marginBottom: 16, fontFamily: "'Segoe UI', monospace", textAlign: 'center' }}>{showBalance ? formatCurrency(balance) : '••••••••'}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0 0', borderTop: '1px solid ' + c.cardBorder, fontSize: 12, color: c.textMuted }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 10 }}>🏦</span><span style={{ fontWeight: 600 }}>{account.account_type || 'Checking'}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 10 }}>🔢</span><span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{'····' + String(account.account_number || '0000').slice(-4)}</span></div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 50, padding: '2px 8px' }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} /><span style={{ color: '#22c55e', fontSize: 10, fontWeight: 700 }}>Active</span></div>
      </div>
    </div>
  );
}

// ─── SavingsBalanceCard ───────────────────────────────────────────────────────
function SavingsBalanceCard({ savingsBalance: rawBal, savingsHistory, isDarkMode }) {
  const c = useColors(isDarkMode);
  const [showBalance, setShowBalance] = useState(true);
  const bal = safeNum(rawBal);
  const interest = calculateAccruedInterest(savingsHistory || [], bal);
  const monthlyInterest = bal * SAVINGS_MONTHLY_RATE;
  return (
    <div style={{ background: c.card, borderRadius: 20, border: '1px solid ' + c.cardBorder, animation: 'cardPop 0.5s ease 0.15s both', width: '320px', padding: '28px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 6px 30px rgba(37,99,235,0.08)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #1e3c7d, #2563eb, #3b82f6)', borderRadius: '20px 20px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #1e3c7d, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>💰</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Savings Balance</span>
        </div>
        <button onClick={() => setShowBalance(!showBalance)} style={{ background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', border: '1px solid ' + c.cardBorder, cursor: 'pointer', fontSize: 16, color: c.textMuted, padding: '6px 8px', borderRadius: 8, display: 'flex', alignItems: 'center' }}>{showBalance ? '👁️' : '👁️‍🗨️'}</button>
      </div>
      <div style={{ fontSize: 38, fontWeight: 800, color: '#2563eb', marginBottom: 6, fontFamily: "'Segoe UI', monospace", textAlign: 'center' }}>{showBalance ? formatCurrency(bal) : '••••••••'}</div>
      {interest.totalAccrued > 0 && showBalance && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#2563eb', fontWeight: 600, marginBottom: 8 }}>+{formatCurrency(interest.totalAccrued)} earned</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0 0', borderTop: '1px solid ' + c.cardBorder, fontSize: 12, color: c.textMuted }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 10 }}>📈</span><span style={{ fontWeight: 600 }}>{SAVINGS_ANNUAL_RATE}% APY</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 10 }}>💵</span><span style={{ fontWeight: 600 }}>+${monthlyInterest.toFixed(2)}/mo</span></div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 50, padding: '2px 8px' }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2563eb', animation: 'pulse 1.5s infinite' }} /><span style={{ color: '#2563eb', fontSize: 10, fontWeight: 700 }}>Earning</span></div>
      </div>
    </div>
  );
}

// ─── SpendingAnalysisChart ────────────────────────────────────────────────────
function SpendingAnalysisChart({ isDarkMode }) {
  const c = useColors(isDarkMode);
  const data = { labels: ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [
    { label: 'Groceries', data: [650,590,800,810,560,550], fill: true, borderColor: '#4BC0C0', backgroundColor: 'rgba(75,192,192,0.08)', tension: 0.4, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#4BC0C0', pointBorderColor: '#fff', pointBorderWidth: 2 },
    { label: 'Utilities', data: [300,350,320,290,330,400], fill: true, borderColor: '#FF6384', backgroundColor: 'rgba(255,99,132,0.08)', tension: 0.4, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#FF6384', pointBorderColor: '#fff', pointBorderWidth: 2 },
    { label: 'Entertainment', data: [500,400,600,450,700,600], fill: true, borderColor: '#FFCD56', backgroundColor: 'rgba(255,205,86,0.08)', tension: 0.4, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#FFCD56', pointBorderColor: '#fff', pointBorderWidth: 2 },
    { label: 'Dining', data: [400,450,380,520,590,600], fill: true, borderColor: '#36A2EB', backgroundColor: 'rgba(54,162,235,0.08)', tension: 0.4, borderWidth: 2.5, pointRadius: 4, pointBackgroundColor: '#36A2EB', pointBorderColor: '#fff', pointBorderWidth: 2 },
  ]};
  const options = { responsive: true, plugins: { legend: { position: 'top', labels: { color: c.text, font: { size: 12, weight: '600' }, usePointStyle: true, pointStyle: 'circle', padding: 20 } }, tooltip: { backgroundColor: c.card, titleColor: c.text, bodyColor: c.textMuted, borderColor: c.cardBorder, borderWidth: 1, cornerRadius: 12, displayColors: true, usePointStyle: true, padding: 14, titleFont: { weight: '700' }, callbacks: { label: (ctx) => ' ' + ctx.dataset.label + ': $' + ctx.raw } } }, scales: { y: { beginAtZero: true, grid: { color: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', drawBorder: false }, ticks: { color: c.textMuted, font: { size: 11 }, callback: (v) => '$' + v }, border: { display: false } }, x: { grid: { display: false }, ticks: { color: c.textMuted, font: { size: 11, weight: '600' } }, border: { display: false } } }, interaction: { intersect: false, mode: 'index' } };
  const stats = [{ label: 'Total Spent', value: '$2,150', icon: '💸', color: c.text }, { label: 'Top Category', value: 'Groceries', icon: '🛒', color: '#4BC0C0' }, { label: 'vs Last Month', value: '+5%', icon: '📈', color: '#22c55e' }, { label: 'Budget Status', value: 'On Track', icon: '🎯', color: '#FFCD56' }];
  return (
    <div style={{ marginTop: 30, padding: 28, background: c.card, borderRadius: 20, border: '1px solid ' + c.cardBorder, boxShadow: isDarkMode ? '0 10px 40px rgba(0,0,0,0.3)' : '0 6px 30px rgba(0,0,0,0.06)', animation: 'fadeSlideUp 0.5s ease 0.3s both', width: '100%', maxWidth: 900, margin: '30px auto 0', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid ' + c.cardBorder }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>📊</div>
        <div><h3 style={{ margin: 0, color: isDarkMode ? '#a78bfa' : '#7c3aed', fontSize: 16, fontWeight: 700 }}>Spending Analysis</h3><p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Monthly spending breakdown</p></div>
      </div>
      <Line data={data} options={options} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginTop: 24 }}>
        {stats.map((s, i) => (<div key={i} className="stat-card" style={{ padding: 16, background: c.cardElevated, borderRadius: 14, border: '1px solid ' + c.cardBorder, textAlign: 'center', transition: 'all 0.3s ease' }}><div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div><div style={{ fontSize: 11, color: c.textMuted, marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div><div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div></div>))}
      </div>
    </div>
  );
}

// ─── MyAccount ────────────────────────────────────────────────────────────────
function MyAccount({ user, account: propAccount, isDarkMode }) {
  const [account, setAccount] = useState(propAccount);
  const [loading, setLoading] = useState(!propAccount);
  const [error, setError] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cardForm, setCardForm] = useState({ card_type: 'Debit', delivery_address: '', annual_income: '', employment_status: '' });
  const [loanForm, setLoanForm] = useState({ loan_type: 'personal', amount: '', purpose: '', duration: '12', annual_income: '', employment_status: '' });
  const [settings, setSettings] = useState({ notifications: true, sms_alerts: true, email_statements: true, two_factor: false });
  const c = useColors(isDarkMode);
  const accountFeatures = [{ icon: '🔒', title: 'Secure Banking', desc: '256-bit SSL encryption', gradient: 'linear-gradient(135deg, #1e3c7d, #2563eb)' },{ icon: '📱', title: 'Mobile Banking', desc: 'Bank anywhere, anytime', gradient: 'linear-gradient(135deg, #059669, #10b981)' },{ icon: '🌐', title: 'International', desc: 'Global transfers available', gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)' },{ icon: '💳', title: 'Card Services', desc: 'Debit & Credit cards', gradient: 'linear-gradient(135deg, #dc2626, #ef4444)' },{ icon: '💰', title: 'Loans', desc: 'Personal & business loans', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)' },{ icon: '📊', title: 'Analytics', desc: 'Spending insights', gradient: 'linear-gradient(135deg, #0891b2, #06b6d4)' }];
  const cardTypes = [{ value: 'Debit', label: 'Debit Card', fee: 'Free', desc: 'Linked to your account balance', icon: '💳', color: '#2563eb' },{ value: 'Credit', label: 'Credit Card', fee: '$50/year', desc: 'Build credit', icon: '⭐', color: '#7c3aed' },{ value: 'Prepaid', label: 'Prepaid Card', fee: '$5', desc: 'Load money as needed', icon: '🎁', color: '#059669' }];
  const loanTypes = [{ value: 'personal', label: 'Personal Loan', rate: '5.99%', desc: 'For personal expenses', icon: '👤', color: '#2563eb' },{ value: 'business', label: 'Business Loan', rate: '4.99%', desc: 'Grow your business', icon: '🏢', color: '#7c3aed' },{ value: 'auto', label: 'Auto Loan', rate: '3.99%', desc: 'Finance your vehicle', icon: '🚗', color: '#059669' },{ value: 'home', label: 'Home Loan', rate: '3.25%', desc: 'Buy your dream home', icon: '🏠', color: '#d97706' }];
  const securityItems = [{ icon: '🔒', title: 'SSL Encryption', desc: 'Bank-grade security', color: '#22c55e' },{ icon: '🛡️', title: 'FDIC Insured', desc: 'Up to $250,000', color: '#2563eb' },{ icon: '🔐', title: 'Two-Factor Auth', desc: 'Enhanced protection', color: '#7c3aed' },{ icon: '📱', title: 'Fraud Monitoring', desc: '24/7 protection', color: '#f59e0b' }];

  useEffect(() => { if (!propAccount) fetchAcc(); else { setAccount(propAccount); setLoading(false); } }, [propAccount, user]);
  const fetchAcc = async () => { try { setLoading(true); setError(''); const r = await axios.get(config.API_BASE_URL + '/accounts.php?user_id=' + (user?.user_id || user?.id)); const d = r.data; if (Array.isArray(d) && d.length > 0) setAccount(d[0]); else if (d && d.id) setAccount(d); else setAccount(null); } catch { setError('Failed to load account.'); setAccount(null); } setLoading(false); };
  const handleCardApply = async (e) => { e.preventDefault(); setSubmitting(true); setModalMessage('Submitting...'); await new Promise(r => setTimeout(r, 2000)); setModalMessage('✅ Card application submitted!'); setCardForm({ card_type: 'Debit', delivery_address: '', annual_income: '', employment_status: '' }); setSubmitting(false); };
  const handleLoanApply = async (e) => { e.preventDefault(); setSubmitting(true); setModalMessage('Submitting...'); await new Promise(r => setTimeout(r, 2000)); setModalMessage('✅ Loan application submitted!'); setLoanForm({ loan_type: 'personal', amount: '', purpose: '', duration: '12', annual_income: '', employment_status: '' }); setSubmitting(false); };
  const getAccountAge = () => { if (!account?.created_at) return 'N/A'; const m = Math.floor((new Date() - new Date(account.created_at)) / (1000*60*60*24*30)); return m > 0 ? m + ' month' + (m > 1 ? 's' : '') : 'Less than a month'; };
  const getAccountStatus = () => { if (!account?.balance) return { status: 'Inactive', color: '#dc3545', icon: '⚪' }; const b = safeNum(account.balance); if (b >= 10000) return { status: 'Premium', color: '#ffd700', icon: '⭐' }; if (b >= 1000) return { status: 'Active', color: '#22c55e', icon: '🟢' }; return { status: 'Basic', color: '#2563eb', icon: '🔵' }; };
  if (loading) return (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}><div style={{ width: 60, height: 60, border: '4px solid ' + c.cardBorder, borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 20 }} /><p style={{ fontWeight: 600, fontSize: 16, color: c.accent }}>Loading...</p></div>);
  if (error || !account) return (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}><div style={{ background: c.card, borderRadius: 24, padding: 48, maxWidth: 450, textAlign: 'center', border: '1px solid ' + c.cardBorder }}><div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#dc2626,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>⚠️</div><h2 style={{ fontSize: 22, fontWeight: 800, color: '#ef4444', margin: '0 0 10px' }}>Account Error</h2><p style={{ color: c.textMuted, fontSize: 14, margin: '0 0 24px' }}>{error || 'No account found.'}</p><button onClick={() => window.location.reload()} style={{ padding: '12px 32px', background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>🔄 Retry</button></div></div>);
  const accountStatus = getAccountStatus();
  const renderInput = (label, props) => (<div style={{ marginBottom: 16 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>{label}</label>{props.type === 'select' ? (<select value={props.value} onChange={props.onChange} required={props.required} style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: '2px solid ' + c.inputBorder, fontSize: 14, boxSizing: 'border-box', background: c.input, color: c.text, outline: 'none', cursor: 'pointer' }}>{props.children}</select>) : props.type === 'textarea' ? (<textarea value={props.value} onChange={props.onChange} required={props.required} placeholder={props.placeholder} style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: '2px solid ' + c.inputBorder, fontSize: 14, boxSizing: 'border-box', background: c.input, color: c.text, outline: 'none', minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} />) : (<input type={props.type || 'text'} value={props.value} onChange={props.onChange} required={props.required} min={props.min} step={props.step} placeholder={props.placeholder} style={{ width: '100%', padding: '13px 16px', borderRadius: 10, border: '2px solid ' + c.inputBorder, fontSize: 14, boxSizing: 'border-box', background: c.input, color: c.text, outline: 'none' }} />)}</div>);

  return (
    <div style={{ maxWidth: 1200, width: '100%', padding: '0 20px', margin: '0 auto' }}>
      <div style={{ background: c.card, borderRadius: 20, padding: 32, marginBottom: 24, border: '1px solid ' + c.cardBorder, animation: 'fadeSlideUp 0.4s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 32, alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg,#1e3c7d,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: '#fff', marginRight: 20, boxShadow: '0 8px 25px rgba(37,99,235,0.35)', border: '3px solid rgba(255,255,255,0.2)' }}>{user?.full_name ? user.full_name.charAt(0) : '👤'}</div>
            <div><h3 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: c.text }}>{user?.full_name || 'Account Holder'}</h3><p style={{ fontSize: 13, color: c.textMuted, margin: '0 0 10px' }}>📅 Account since {getAccountAge()}</p><div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 50, background: accountStatus.color + '18', border: '1px solid ' + accountStatus.color + '44' }}><span style={{ fontSize: 12 }}>{accountStatus.icon}</span><span style={{ color: accountStatus.color, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{accountStatus.status} Member</span></div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
            {[{ label: 'Current Balance', value: formatCurrency(account.balance), icon: '💰', gradient: 'linear-gradient(135deg,#1e3c7d,#2563eb)' },{ label: 'Account Number', value: '····' + String(account.account_number || '0000').slice(-4), icon: '🔢', gradient: 'linear-gradient(135deg,#059669,#10b981)' },{ label: 'Account Type', value: account.account_type || 'N/A', icon: '🏦', gradient: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' },{ label: 'SWIFT Code', value: account.swift_code || 'TSOB827282', icon: '🌐', gradient: 'linear-gradient(135deg,#d97706,#f59e0b)' }].map((stat, i) => (
              <div key={i} className="stat-card" style={{ background: c.cardElevated, padding: 18, borderRadius: 14, border: '1px solid ' + c.cardBorder, animation: 'fadeSlideUp 0.4s ease ' + (i * 0.1) + 's both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><div style={{ width: 24, height: 24, borderRadius: 6, background: stat.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{stat.icon}</div><span style={{ fontSize: 11, color: c.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</span></div>
                <div style={{ fontSize: 16, fontWeight: 800, color: c.text, fontFamily: (stat.label.includes('Number') || stat.label.includes('SWIFT')) ? 'monospace' : 'inherit' }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14 }}>
          {[{ label: 'Apply for Card', icon: '💳', onClick: () => { setShowCardModal(true); setModalMessage(''); }, gradient: 'linear-gradient(135deg,#1e3c7d,#2563eb)' },{ label: 'Apply for Loan', icon: '🏦', onClick: () => { setShowLoanModal(true); setModalMessage(''); }, gradient: 'linear-gradient(135deg,#059669,#10b981)' },{ label: 'Account Settings', icon: '⚙️', onClick: () => { setShowSettingsModal(true); setModalMessage(''); }, outline: true }].map((btn, i) => (
            <button key={i} className="action-card" onClick={btn.onClick} style={{ background: btn.outline ? 'transparent' : btn.gradient, color: btn.outline ? c.accent : '#fff', border: btn.outline ? '2px solid ' + c.accent : 'none', borderRadius: 14, padding: '16px 24px', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s ease', boxShadow: btn.outline ? 'none' : '0 4px 15px rgba(37,99,235,0.25)' }}><span style={{ fontSize: 20 }}>{btn.icon}</span>{btn.label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px,1fr))', gap: 20, marginBottom: 24 }}>
        <div style={{ background: c.card, borderRadius: 20, padding: 28, border: '1px solid ' + c.cardBorder, animation: 'fadeSlideUp 0.4s ease 0.1s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 14, borderBottom: '2px solid ' + c.cardBorder }}><div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1e3c7d,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⭐</div><div><h3 style={{ margin: 0, color: c.sectionTitle, fontSize: 16, fontWeight: 700 }}>Account Features</h3><p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>What's included</p></div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>{accountFeatures.map((f, i) => (<div key={i} className="feature-card" style={{ display: 'flex', alignItems: 'center', padding: 16, background: c.cardElevated, borderRadius: 14, border: '1px solid ' + c.cardBorder, transition: 'all 0.3s ease' }}><div style={{ width: 38, height: 38, borderRadius: 10, background: f.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginRight: 14, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{f.icon}</div><div><div style={{ fontWeight: 700, fontSize: 14, color: c.text, marginBottom: 2 }}>{f.title}</div><div style={{ fontSize: 12, color: c.textMuted }}>{f.desc}</div></div></div>))}</div>
        </div>
        <div style={{ background: c.card, borderRadius: 20, padding: 28, border: '1px solid ' + c.cardBorder, animation: 'fadeSlideUp 0.4s ease 0.2s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 14, borderBottom: '2px solid ' + c.cardBorder }}><div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#059669,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛡️</div><div><h3 style={{ margin: 0, color: isDarkMode ? '#34d399' : '#059669', fontSize: 16, fontWeight: 700 }}>Security & Compliance</h3><p style={{ margin: 0, color: c.textLight, fontSize: 12 }}>Your protection</p></div></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>{securityItems.map((item, i) => (<div key={i} className="feature-card" style={{ display: 'flex', alignItems: 'center', padding: 16, background: c.cardElevated, borderRadius: 14, border: '1px solid ' + c.cardBorder, transition: 'all 0.3s ease' }}><div style={{ width: 38, height: 38, borderRadius: 10, background: item.color + '18', border: '1px solid ' + item.color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginRight: 14, flexShrink: 0 }}>{item.icon}</div><div><div style={{ fontWeight: 700, fontSize: 14, color: c.text, marginBottom: 2 }}>{item.title}</div><div style={{ fontSize: 12, color: c.textMuted }}>{item.desc}</div></div></div>))}</div>
        </div>
      </div>
      {showCardModal && (<Modal onClose={() => setShowCardModal(false)} isDarkMode={isDarkMode} title="💳 Apply for Card" subtitle="Choose your card type"><form onSubmit={handleCardApply}><div style={{ marginBottom: 20 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>Card Type</label>{cardTypes.map(type => (<label key={type.value} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, marginBottom: 8, border: cardForm.card_type === type.value ? '2px solid ' + type.color : '2px solid ' + c.cardBorder, borderRadius: 14, cursor: 'pointer', background: cardForm.card_type === type.value ? type.color + '08' : c.cardElevated }}><input type="radio" name="card_type" value={type.value} checked={cardForm.card_type === type.value} onChange={e => setCardForm({ ...cardForm, card_type: e.target.value })} style={{ display: 'none' }} /><div style={{ width: 40, height: 40, borderRadius: 10, background: type.color + '18', border: '1px solid ' + type.color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{type.icon}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{type.label}</div><div style={{ fontSize: 12, color: c.textMuted }}>{type.desc}</div></div><span style={{ background: type.color + '18', color: type.color, padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700 }}>{type.fee}</span></label>))}</div>{renderInput('📍 Address', { type: 'textarea', value: cardForm.delivery_address, onChange: e => setCardForm({ ...cardForm, delivery_address: e.target.value }), required: true, placeholder: 'Enter address' })}<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{renderInput('💵 Income', { type: 'number', value: cardForm.annual_income, onChange: e => setCardForm({ ...cardForm, annual_income: e.target.value }), required: true, min: '1', placeholder: 'Annual income' })}{renderInput('💼 Employment', { type: 'select', value: cardForm.employment_status, onChange: e => setCardForm({ ...cardForm, employment_status: e.target.value }), required: true, children: [<option key="" value="">Select</option>,<option key="e" value="employed">Employed</option>,<option key="s" value="self-employed">Self-Employed</option>,<option key="st" value="student">Student</option>,<option key="r" value="retired">Retired</option>] })}</div><ModalSubmitButton submitting={submitting} label="Submit Application" />{modalMessage && <ModalMessage message={modalMessage} />}</form></Modal>)}
      {showLoanModal && (<Modal onClose={() => setShowLoanModal(false)} isDarkMode={isDarkMode} title="🏦 Apply for Loan" subtitle="Select loan type"><form onSubmit={handleLoanApply}><div style={{ marginBottom: 20 }}><label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>Loan Type</label>{loanTypes.map(type => (<label key={type.value} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, marginBottom: 8, border: loanForm.loan_type === type.value ? '2px solid ' + type.color : '2px solid ' + c.cardBorder, borderRadius: 14, cursor: 'pointer', background: loanForm.loan_type === type.value ? type.color + '08' : c.cardElevated }}><input type="radio" name="loan_type" value={type.value} checked={loanForm.loan_type === type.value} onChange={e => setLoanForm({ ...loanForm, loan_type: e.target.value })} style={{ display: 'none' }} /><div style={{ width: 40, height: 40, borderRadius: 10, background: type.color + '18', border: '1px solid ' + type.color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{type.icon}</div><div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{type.label}</div><div style={{ fontSize: 12, color: c.textMuted }}>{type.desc}</div></div><span style={{ background: type.color + '18', color: type.color, padding: '4px 10px', borderRadius: 50, fontSize: 11, fontWeight: 700 }}>from {type.rate}</span></label>))}</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{renderInput('💰 Amount', { type: 'number', value: loanForm.amount, onChange: e => setLoanForm({ ...loanForm, amount: e.target.value }), required: true, min: '1000', step: '1000', placeholder: 'Min $1,000' })}{renderInput('📅 Duration', { type: 'select', value: loanForm.duration, onChange: e => setLoanForm({ ...loanForm, duration: e.target.value }), required: true, children: [<option key="12" value="12">12 months</option>,<option key="24" value="24">24 months</option>,<option key="36" value="36">36 months</option>,<option key="48" value="48">48 months</option>,<option key="60" value="60">60 months</option>] })}</div>{renderInput('📌 Purpose', { type: 'text', value: loanForm.purpose, onChange: e => setLoanForm({ ...loanForm, purpose: e.target.value }), required: true, placeholder: 'Purpose' })}<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{renderInput('💵 Income', { type: 'number', value: loanForm.annual_income, onChange: e => setLoanForm({ ...loanForm, annual_income: e.target.value }), required: true, min: '1', placeholder: 'Annual income' })}{renderInput('💼 Employment', { type: 'select', value: loanForm.employment_status, onChange: e => setLoanForm({ ...loanForm, employment_status: e.target.value }), required: true, children: [<option key="" value="">Select</option>,<option key="e" value="employed">Employed</option>,<option key="s" value="self-employed">Self-Employed</option>,<option key="b" value="business-owner">Business Owner</option>,<option key="r" value="retired">Retired</option>] })}</div><ModalSubmitButton submitting={submitting} label="Submit Application" />{modalMessage && <ModalMessage message={modalMessage} />}</form></Modal>)}
      {showSettingsModal && (<Modal onClose={() => setShowSettingsModal(false)} isDarkMode={isDarkMode} title="⚙️ Account Settings" subtitle="Notification preferences"><div style={{ marginBottom: 24 }}>{Object.entries(settings).map(([key, value], i) => { const meta = { notifications: { icon: '🔔', label: 'Push Notifications' }, sms_alerts: { icon: '📱', label: 'SMS Alerts' }, email_statements: { icon: '📧', label: 'Email Statements' }, two_factor: { icon: '🔐', label: 'Two-Factor Auth' } }[key] || { icon: '⚙️', label: key }; return (<label key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 8, border: '1px solid ' + c.cardBorder, borderRadius: 14, background: c.cardElevated, cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 20 }}>{meta.icon}</span><span style={{ fontWeight: 600, fontSize: 14, color: c.text }}>{meta.label}</span></div><div style={{ width: 48, height: 26, borderRadius: 13, background: value ? '#22c55e' : c.cardBorder, position: 'relative', cursor: 'pointer' }} onClick={() => setSettings({ ...settings, [key]: !value })}><div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: value ? 24 : 2, transition: 'all 0.3s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} /></div></label>); })}</div><button onClick={() => { setModalMessage('✅ Settings saved!'); setTimeout(() => setShowSettingsModal(false), 1500); }} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#1e3c7d,#2563eb)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>💾 Save</button>{modalMessage && <ModalMessage message={modalMessage} />}</Modal>)}
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function Modal({ children, onClose, isDarkMode, title, subtitle }) { const c = useColors(isDarkMode); return (<div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn 0.2s ease' }}><div style={{ background: c.card, borderRadius: 24, padding: 36, minWidth: 400, maxWidth: 600, maxHeight: '90vh', overflow: 'auto', position: 'relative', border: '1px solid ' + c.cardBorder, boxShadow: '0 25px 80px rgba(0,0,0,0.3)', animation: 'fadeSlideUp 0.3s ease' }}><button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', border: '1px solid ' + c.cardBorder, fontSize: 18, cursor: 'pointer', color: c.textMuted, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10 }}>✕</button>{title && (<div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid ' + c.cardBorder }}><h3 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: c.text }}>{title}</h3>{subtitle && <p style={{ margin: 0, fontSize: 13, color: c.textMuted }}>{subtitle}</p>}</div>)}{children}</div></div>); }
function ModalSubmitButton({ submitting, label }) { return (<button type="submit" disabled={submitting} style={{ width: '100%', marginTop: 8, padding: '15px', background: submitting ? 'rgba(156,163,175,0.5)' : 'linear-gradient(135deg,#1e3c7d,#2563eb)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{submitting ? (<><span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />Processing...</>) : ('📨 ' + label)}</button>); }
function ModalMessage({ message }) { const ok = message.includes('✅'); return (<div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 12, fontWeight: 600, textAlign: 'center', fontSize: 14, background: ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid ' + (ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'), color: ok ? '#22c55e' : '#ef4444', animation: 'fadeSlideUp 0.3s ease' }}>{message}</div>); }

// ─── Notifications ────────────────────────────────────────────────────────────
function NotificationDropdown({ notifications, onMarkAsRead, onClose, isDarkMode }) { const c = useColors(isDarkMode); return (<div style={{ position: 'absolute', top: 50, right: 0, width: 340, background: c.card, borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', zIndex: 1000, maxHeight: 420, overflow: 'auto', border: '1px solid ' + c.cardBorder, animation: 'fadeSlideUp 0.25s ease' }}><div style={{ padding: '18px 20px', borderBottom: '1px solid ' + c.cardBorder, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: c.card, zIndex: 2, borderRadius: '20px 20px 0 0' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>🔔</span><h4 style={{ margin: 0, color: c.text, fontSize: 15, fontWeight: 700 }}>Notifications</h4></div><button onClick={onClose} style={{ background: c.cardElevated, border: '1px solid ' + c.cardBorder, width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, color: c.textMuted }}>✕</button></div>{notifications.length === 0 ? (<div style={{ padding: 40, textAlign: 'center', color: c.textMuted }}><div style={{ fontSize: 40, marginBottom: 12 }}>📭</div><p style={{ margin: 0, fontWeight: 600 }}>No new notifications</p></div>) : notifications.map((n, i) => (<div key={n.id} style={{ padding: '14px 20px', borderBottom: '1px solid ' + c.cardBorder, cursor: 'pointer', background: n.read ? 'transparent' : (isDarkMode ? '#0f1629' : '#f0f9ff') }} onClick={() => onMarkAsRead(n.id)}><div style={{ display: 'flex', gap: 12 }}><div style={{ width: 36, height: 36, borderRadius: 10, background: c.cardElevated, border: '1px solid ' + c.cardBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{n.icon}</div><div style={{ flex: 1 }}><div style={{ fontWeight: n.read ? 500 : 700, fontSize: 13, marginBottom: 4, color: c.text }}>{n.title}{!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', display: 'inline-block', marginLeft: 6, verticalAlign: 'middle' }} />}</div><div style={{ fontSize: 12, color: c.textMuted, lineHeight: 1.4 }}>{n.message}</div><div style={{ fontSize: 11, color: c.textLight, marginTop: 4 }}>{n.time}</div></div></div></div>))}</div>); }

// ─── CreditCard ───────────────────────────────────────────────────────────────
function CreditCard({ account, user }) { const [isFlipped, setIsFlipped] = useState(false); if (!account) return null; const fmtCard = (n) => !n ? '•••• •••• •••• ••••' : '•••• •••• •••• ' + String(n).slice(-4); const fmtExp = () => { const d = new Date(); return String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getFullYear() + 3).slice(-2); }; let userName = 'NO NAME'; if (user?.full_name) userName = user.full_name; return (<div style={{ width: 340, height: 210, perspective: 1000, cursor: 'pointer', animation: 'cardPop 0.6s ease 0.2s both' }} onMouseEnter={() => setIsFlipped(true)} onMouseLeave={() => setIsFlipped(false)}><div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: 20, backfaceVisibility: 'hidden', transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)', background: 'linear-gradient(135deg, #0a1628 0%, #1e3c7d 60%, #2563eb 100%)', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#fff', boxShadow: '0 15px 40px rgba(30,60,125,0.4)', overflow: 'hidden', boxSizing: 'border-box' }}><div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} /><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}><div style={{ width: 44, height: 32, borderRadius: 6, background: 'linear-gradient(135deg,#ffd700,#ffb700)', boxShadow: '0 2px 8px rgba(255,215,0,0.4)' }} /><span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.7)' }}>Premium Card</span></div><div style={{ fontSize: 20, fontWeight: 600, letterSpacing: 3, fontFamily: "'Courier New', monospace", position: 'relative', zIndex: 1 }}>{fmtCard(account.account_number)}</div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}><div><div style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Card Holder</div><div style={{ fontSize: 14, fontWeight: 600 }}>{userName}</div></div><div style={{ textAlign: 'right' }}><div style={{ fontSize: 9, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Expires</div><div style={{ fontSize: 14, fontWeight: 600 }}>{fmtExp()}</div></div></div></div><div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: 20, backfaceVisibility: 'hidden', transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)', background: 'linear-gradient(135deg,#1e3c7d,#0a1628)', transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(-180deg)', padding: '24px 0', color: '#fff', boxShadow: '0 15px 40px rgba(30,60,125,0.4)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}><div style={{ height: 44, background: '#000', margin: '0 0 20px' }} /><div style={{ padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}><div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '1px' }}>Security Code</div><div style={{ background: '#fff', color: '#1a1a2a', padding: '8px 14px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, borderRadius: 6, fontSize: 16 }}>{String(account.account_number || '000').slice(-3).padStart(3, '0')}</div></div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#ffd700,#ffb700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#0a1628' }}>SB</div><span style={{ color: '#ffd700', fontWeight: 700, fontSize: 16, letterSpacing: '2px' }}>SKYLARK BANK</span></div></div></div></div>); }

// ─── Sidebar Config ───────────────────────────────────────────────────────────
const sidebarMenu = [{ label: 'My Account', icon: '👤', component: 'MyAccount', section: 'ACCOUNTS' },{ label: 'Savings', icon: '💰', component: 'SavingsAccount', section: 'ACCOUNTS' },{ label: 'Transaction History', icon: '⏱️', component: 'TransactionHistory', section: 'ACCOUNTS' },{ label: 'e-Statements', icon: '📄', component: 'EStatements', section: 'ACCOUNTS' },{ label: 'Local Transfer', icon: '🔄', component: 'LocalTransfer', section: 'TRANSFERS & PAYMENTS' },{ label: 'International Transfer', icon: '🌐', component: 'InternationalTransfer', section: 'TRANSFERS & PAYMENTS' },{ label: 'P2P Payments', icon: '🧑‍🤝‍🧑', component: 'P2PPayments', section: 'TRANSFERS & PAYMENTS' },{ label: 'Bill Payments', icon: '💵', component: 'BillPayments', section: 'TRANSFERS & PAYMENTS' },{ label: 'Scheduled Payments', icon: '📅', component: 'ScheduledPayments', section: 'TRANSFERS & PAYMENTS' },{ label: 'Cheque Deposit', icon: '🏦', component: 'ChequeDeposit', section: 'DEPOSITS' },{ label: 'Crypto Wallet', icon: '🪙', component: 'CryptoWallet', section: 'INVESTMENT' }];
const sectionOrder = ['ACCOUNTS', 'TRANSFERS & PAYMENTS', 'DEPOSITS', 'INVESTMENT'];
const componentMap = { MyAccount, SavingsAccount, TransactionHistory, EStatements, LocalTransfer, InternationalTransfer, P2PPayments, BillPayments, ScheduledPayments, ChequeDeposit, CryptoWallet };
const sectionIcons = { 'ACCOUNTS': '🏦', 'TRANSFERS & PAYMENTS': '💸', 'DEPOSITS': '📥', 'INVESTMENT': '📈' };

function SidebarItem({ label, icon, active, onClick, isDarkMode, index }) { const [h, setH] = useState(false); return (<div className="sidebar-item" style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', fontSize: 14, cursor: 'pointer', background: active ? 'rgba(255,255,255,0.15)' : h ? 'rgba(255,255,255,0.08)' : 'transparent', borderLeft: active ? '3px solid #ffd700' : '3px solid transparent', borderRight: active ? '3px solid #ffd700' : '3px solid transparent', marginBottom: 2, fontWeight: active ? 700 : 500, color: active ? '#fff' : 'rgba(255,255,255,0.75)', transition: 'all 0.25s ease', transform: h && !active ? 'translateX(6px)' : 'translateX(0)', animation: 'slideIn 0.4s ease ' + (index * 0.04) + 's both', position: 'relative' }} onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{active && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(180deg,#ffd700,#ffb700)', borderRadius: '0 2px 2px 0', boxShadow: '0 0 10px rgba(255,215,0,0.5)' }} />}<span style={{ fontSize: 17, marginRight: 14, transition: 'all 0.3s ease', transform: h ? 'scale(1.2)' : 'scale(1)', filter: active ? 'drop-shadow(0 0 4px rgba(255,215,0,0.5))' : 'none' }}>{icon}</span><span>{label}</span></div>); }

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard({ user, onLogout }) {
  const [activeComponent, setActiveComponent] = useState('MyAccount');
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transitionLoading, setTransitionLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Transfer Successful', message: 'Your transfer of $500 was completed', icon: '✅', time: '2 hours ago', read: false },
    { id: 2, title: 'New Security Feature', message: 'Two-factor authentication available', icon: '🔒', time: '1 day ago', read: false },
    { id: 3, title: 'Monthly Statement', message: 'Your January statement is ready', icon: '📄', time: '3 days ago', read: true },
  ]);
  const [savingsData, setSavingsData] = useState({ balance: 0, history: [] });
  const c = useColors(isDarkMode);

  useEffect(() => { try { const s = localStorage.getItem('darkMode'); if (s) setIsDarkMode(JSON.parse(s)); } catch {} }, []);
  const toggleDarkMode = () => { const n = !isDarkMode; setIsDarkMode(n); localStorage.setItem('darkMode', JSON.stringify(n)); };
  const markNotificationAsRead = (id) => { setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n)); };
  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchAccount = useCallback(async () => {
    try { const r = await fetch('/backend/api/accounts.php?user_id=' + (user?.user_id || user?.id)); if (!r.ok) throw new Error(); const d = await r.json(); if (Array.isArray(d) && d.length > 0) setAccount(d[0]); else if (d && d.id) setAccount(d); else if (d && d.account) setAccount(d.account); else setAccount(null); } catch { setAccount(null); } setLoading(false);
  }, [user]);

  const fetchSavingsData = useCallback(async () => {
    try { const r = await fetch('/backend/api/savings.php?user_id=' + (user?.user_id || user?.id) + '&action=transactions'); if (!r.ok) throw new Error(); const d = await r.json(); if (d && d.success) { setSavingsData({ balance: parseFloat(d.account?.balance) || 0, history: Array.isArray(d.transactions) ? d.transactions.map(mapSavingsTransaction) : [] }); } } catch { setSavingsData({ balance: 0, history: [] }); }
  }, [user]);

  useEffect(() => { fetchAccount(); fetchSavingsData(); }, [fetchAccount, fetchSavingsData]);
  const handleSavingsTransferComplete = () => { fetchAccount(); fetchSavingsData(); };
  const handleSidebarClick = (comp) => { if (comp === activeComponent) return; setTransitionLoading(true); setTimeout(() => { setActiveComponent(comp); setTransitionLoading(false); }, 800); };

  const componentProps = { user, account, isDarkMode, onTransactionSuccess: fetchAccount, savingsBalance: savingsData.balance, savingsHistory: savingsData.history, onSavingsTransferComplete: handleSavingsTransferComplete };
  const ActiveComponent = componentMap[activeComponent];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: c.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{animations}</style>
      <aside style={{ width: 260, background: isDarkMode ? 'linear-gradient(180deg,#0a0f1f 0%,#111827 50%,#0a0f1f 100%)' : 'linear-gradient(180deg,#0f2347 0%,#1e3c7d 50%,#0f2347 100%)', display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'space-between', animation: 'slideIn 0.5s ease', borderRight: '1px solid ' + (isDarkMode ? '#1e293b' : 'rgba(255,255,255,0.1)'), boxShadow: '4px 0 20px rgba(0,0,0,0.15)' }}>
        <div>
          <div style={{ textAlign: 'center', padding: '20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <img src="/images/logo.png" alt="Skylark Bank" style={{ maxHeight: 44, maxWidth: 170, objectFit: 'contain', filter: 'brightness(1.2) contrast(1.1)' }} onError={e => { e.target.style.display = 'none'; }} />
            </div>
          </div>
          <nav style={{ padding: '8px 0' }}>
            {sectionOrder.map((section, sIdx) => (<React.Fragment key={section}><div style={{ margin: '20px 0 10px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 11 }}>{sectionIcons[section]}</span><span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{section}</span></div>{sidebarMenu.filter(item => item.section === section).map((item, iIdx) => (<SidebarItem key={item.label} label={item.label} icon={item.icon} active={activeComponent === item.component} onClick={() => handleSidebarClick(item.component)} isDarkMode={isDarkMode} index={sIdx * 10 + iIdx} />))}</React.Fragment>))}
          </nav>
        </div>
        <div style={{ padding: '20px 20px 28px' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: '0 0 4px' }}>Logged in as</p><p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.full_name || user?.email || 'User'}</p></div>
          <button onClick={onLogout} style={{ width: '100%', background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 15px rgba(220,53,69,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>🚪 Logout</button>
        </div>
      </aside>
      <main style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: isDarkMode ? 'linear-gradient(135deg,#111827,#1e293b)' : 'linear-gradient(135deg,#1e3c7d,#2563eb)', padding: '0 32px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid ' + (isDarkMode ? '#1e293b' : 'rgba(255,255,255,0.1)'), boxShadow: '0 2px 15px rgba(0,0,0,0.1)', position: 'relative', zIndex: 10 }}>
          <div><p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{(sidebarMenu.find(m => m.component === activeComponent) || {}).section || ''}</p><h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><span>{(sidebarMenu.find(m => m.component === activeComponent) || {}).icon || ''}</span>{(sidebarMenu.find(m => m.component === activeComponent) || {}).label || 'Dashboard'}</h2></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!loading && !transitionLoading && <WelcomeMessage user={user} />}
            <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.15)', margin: '0 8px' }} />
            <div style={{ position: 'relative' }}><button onClick={() => setShowNotifications(!showNotifications)} style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', color: '#fff' }}>🔔{unreadCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: '#fff', borderRadius: '50%', fontSize: 10, fontWeight: 700, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s infinite', border: '2px solid ' + (isDarkMode ? '#111827' : '#1e3c7d') }}>{unreadCount}</span>}</button>{showNotifications && <NotificationDropdown notifications={notifications} onMarkAsRead={markNotificationAsRead} onClose={() => setShowNotifications(false)} isDarkMode={isDarkMode} />}</div>
            <button onClick={toggleDarkMode} style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isDarkMode ? '☀️' : '🌙'}</button>
          </div>
        </div>
        <div style={{ flex: 1, background: c.bg, padding: '32px 0 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
          {(loading || transitionLoading) ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}><div style={{ width: 56, height: 56, border: '4px solid ' + c.cardBorder, borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 20 }} /><p style={{ fontWeight: 700, fontSize: 16, color: c.accent, margin: '0 0 6px' }}>Loading...</p><p style={{ fontSize: 13, color: c.textMuted, margin: 0 }}>Please wait</p></div>
          ) : (
            <div style={{ animation: 'fadeSlideUp 0.5s ease', width: '100%' }}>
              {activeComponent === 'MyAccount' && account && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, padding: '0 40px', marginBottom: 30, maxWidth: 1200, margin: '0 auto 30px', flexWrap: 'wrap' }}>
                  <AccountBalanceDisplay account={account} isDarkMode={isDarkMode} />
                  <SavingsBalanceCard savingsBalance={savingsData.balance} savingsHistory={savingsData.history} isDarkMode={isDarkMode} />
                  <CreditCard account={account} user={user} />
                </div>
              )}
              <ActiveComponent {...componentProps} />
              {activeComponent === 'MyAccount' && <SpendingAnalysisChart isDarkMode={isDarkMode} />}
            </div>
          )}
        </div>
        <ChatBot isDarkMode={isDarkMode} />
      </main>
    </div>
  );
}