import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

function DepositWithdrawal({ accounts, onTransfer }) {
  const [transaction, setTransaction] = useState({
    account_number: '',
    amount: '',
    type: 'deposit',
    description: '',
    category_id: ''
  });
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, [transaction.type]);

  useEffect(() => {
    if (transaction.type === 'withdrawal' && transaction.account_number && transaction.amount) {
      checkWithdrawalLimits();
    } else {
      setLimitInfo(null);
    }
  }, [transaction.account_number, transaction.amount, transaction.type]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/transaction-categories.php?type=${transaction.type}`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const checkWithdrawalLimits = async () => {
    if (!transaction.account_number || !transaction.amount || parseFloat(transaction.amount) <= 0) {
      return;
    }

    try {
      const response = await axios.post(`${config.API_BASE_URL}/check-limits.php`, {
        account_number: transaction.account_number,
        amount: parseFloat(transaction.amount),
        transaction_type: 'withdrawal'
      });

      setLimitInfo(response.data);

      if (!response.data.allowed) {
        setMessage(response.data.violations[0].message);
        setMessageType('error');
      } else if (response.data.warnings && response.data.warnings.length > 0) {
        setMessage(response.data.warnings[0].message);
        setMessageType('warning');
      } else {
        setMessage('');
        setMessageType('');
      }
    } catch (error) {
      console.error('Error checking limits:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check limits for withdrawals
    if (transaction.type === 'withdrawal' && limitInfo && !limitInfo.allowed) {
      setMessage(limitInfo.violations[0].message);
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await axios.post(
        `${config.API_BASE_URL}/deposit-withdrawal.php`, 
        transaction,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      setMessage(`${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} successful!`);
      setMessageType('success');
      setTransaction({ account_number: '', amount: '', type: transaction.type, description: '', category_id: '' });
      setLimitInfo(null);
      onTransfer(); // Refresh account data
      
    } catch (error) {
      console.error('Transaction error:', error);
      setMessage(`${transaction.type} failed: ` + (error.response?.data?.message || 'Please try again.'));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="deposit-withdrawal">
      <h2>{transaction.type === 'deposit' ? '💵 Deposit Money' : '🏧 Withdraw Money'}</h2>
      
      <div className="transaction-type-selector">
        <button 
          type="button"
          className={`type-btn ${transaction.type === 'deposit' ? 'active' : ''}`}
          onClick={() => setTransaction({...transaction, type: 'deposit', category_id: ''})}
        >
          💵 Deposit
        </button>
        <button 
          type="button"
          className={`type-btn ${transaction.type === 'withdrawal' ? 'active' : ''}`}
          onClick={() => setTransaction({...transaction, type: 'withdrawal', category_id: ''})}
        >
          🏧 Withdraw
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-group">
          <label>Account</label>
          <select
            value={transaction.account_number}
            onChange={(e) => setTransaction({...transaction, account_number: e.target.value})}
            required
            disabled={loading}
          >
            <option value="">Select Account</option>
            {accounts.map(account => (
              <option key={account.id} value={account.account_number}>
                {account.account_number} - {formatCurrency(account.balance)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Amount ($)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={transaction.amount}
            onChange={(e) => setTransaction({...transaction, amount: e.target.value})}
            required
            disabled={loading}
          />
        </div>

        {/* Withdrawal Limit Info */}
        {transaction.type === 'withdrawal' && limitInfo && transaction.amount && (
          <div className={`limit-check-info ${limitInfo.allowed ? 'allowed' : 'not-allowed'}`}>
            <h4>Withdrawal Limit Check</h4>
            {limitInfo.current_limits && (
              <div className="current-limits">
                <p><strong>Daily Withdrawal Limit:</strong> {formatCurrency(limitInfo.current_limits.daily_withdrawal_limit)}</p>
                <p><strong>Used Today:</strong> {formatCurrency(limitInfo.current_usage.daily_withdrawal_amount)}</p>
                <p><strong>Remaining:</strong> {formatCurrency(limitInfo.current_limits.daily_withdrawal_limit - limitInfo.current_usage.daily_withdrawal_amount)}</p>
              </div>
            )}
            {limitInfo.violations && limitInfo.violations.length > 0 && (
              <div className="violations">
                {limitInfo.violations.map((violation, index) => (
                  <p key={index} className="violation-message">❌ {violation.message}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Category</label>
          <select
            value={transaction.category_id}
            onChange={(e) => setTransaction({...transaction, category_id: e.target.value})}
            disabled={loading}
          >
            <option value="">Select Category (Optional)</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.category_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Description (Optional)</label>
          <input
            type="text"
            placeholder={`What's this ${transaction.type} for?`}
            value={transaction.description}
            onChange={(e) => setTransaction({...transaction, description: e.target.value})}
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || (transaction.type === 'withdrawal' && limitInfo && !limitInfo.allowed)} 
          className={`transaction-btn ${transaction.type}`}
        >
          {loading ? 'Processing...' : `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} Money`}
        </button>
        
        {message && (
          <p className={`message ${messageType}`}>
            {messageType === 'success' && '✅ '}
            {messageType === 'error' && '❌ '}
            {messageType === 'warning' && '⚠️ '}
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

export default DepositWithdrawal;
