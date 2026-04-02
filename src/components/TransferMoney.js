import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

function TransferMoney({ accounts, onTransfer }) {
  const [transfer, setTransfer] = useState({
    from_account: '',
    to_account: '',
    amount: '',
    description: '',
    category_id: ''
  });
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'warning'
  const [loading, setLoading] = useState(false);
  const [limitInfo, setLimitInfo] = useState(null);
  const [checkingLimits, setCheckingLimits] = useState(false);

  useEffect(() => {
    fetchTransferCategories();
  }, []);

  useEffect(() => {
    if (transfer.from_account && transfer.amount) {
      checkLimits();
    }
  }, [transfer.from_account, transfer.amount]);

  const fetchTransferCategories = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/transaction-categories.php?type=transfer`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const checkLimits = async () => {
    if (!transfer.from_account || !transfer.amount || parseFloat(transfer.amount) <= 0) {
      setLimitInfo(null);
      return;
    }

    setCheckingLimits(true);
    try {
      const response = await axios.post(`${config.API_BASE_URL}/check-limits.php`, {
        account_number: transfer.from_account,
        amount: parseFloat(transfer.amount),
        transaction_type: 'transfer'
      });

      setLimitInfo(response.data);

      // Show warnings if approaching limits
      if (response.data.warnings && response.data.warnings.length > 0) {
        setMessage(response.data.warnings[0].message);
        setMessageType('warning');
      } else if (!response.data.allowed) {
        setMessage(response.data.violations[0].message);
        setMessageType('error');
      } else {
        setMessage('');
        setMessageType('');
      }
    } catch (error) {
      console.error('Error checking limits:', error);
    } finally {
      setCheckingLimits(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check limits one more time before submitting
    if (limitInfo && !limitInfo.allowed) {
      setMessage(limitInfo.violations[0].message);
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await axios.post(
        `${config.API_BASE_URL}/transfer.php`, 
        transfer,
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      setMessage('Transfer successful!');
      setMessageType('success');
      setTransfer({ from_account: '', to_account: '', amount: '', description: '', category_id: '' });
      setLimitInfo(null);
      onTransfer(); // Refresh account data
      
    } catch (error) {
      console.error('Transfer error:', error);
      setMessage(error.response?.data?.message || 'Transfer failed. Please check your details and try again.');
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
    <div className="transfer-money">
      <h2>💸 Transfer Money</h2>
      
      <form onSubmit={handleSubmit} className="transfer-form">
        <div className="form-group">
          <label>From Account</label>
          <select
            value={transfer.from_account}
            onChange={(e) => setTransfer({...transfer, from_account: e.target.value})}
            required
            disabled={loading}
          >
            <option value="">Select From Account</option>
            {accounts.map(account => (
              <option key={account.id} value={account.account_number}>
                {account.account_number} - {formatCurrency(account.balance)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>To Account Number</label>
          <input
            type="text"
            placeholder="Enter recipient account number"
            value={transfer.to_account}
            onChange={(e) => setTransfer({...transfer, to_account: e.target.value})}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Amount ($)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={transfer.amount}
            onChange={(e) => setTransfer({...transfer, amount: e.target.value})}
            required
            disabled={loading}
          />
          {checkingLimits && <span className="checking-limits">Checking limits...</span>}
        </div>

        {/* Limit Info Display */}
        {limitInfo && transfer.from_account && transfer.amount && (
          <div className={`limit-check-info ${limitInfo.allowed ? 'allowed' : 'not-allowed'}`}>
            <h4>Transaction Limit Check</h4>
            {limitInfo.current_limits && (
              <div className="current-limits">
                <p><strong>Daily Transfer Limit:</strong> {formatCurrency(limitInfo.current_limits.daily_transfer_limit)}</p>
                <p><strong>Single Transaction Limit:</strong> {formatCurrency(limitInfo.current_limits.single_transaction_limit)}</p>
                <p><strong>Used Today:</strong> {formatCurrency(limitInfo.current_usage.daily_transfer_amount)}</p>
                <p><strong>Remaining Today:</strong> {formatCurrency(limitInfo.current_limits.daily_transfer_limit - limitInfo.current_usage.daily_transfer_amount)}</p>
              </div>
            )}
            {limitInfo.violations && limitInfo.violations.length > 0 && (
              <div className="violations">
                {limitInfo.violations.map((violation, index) => (
                  <p key={index} className="violation-message">❌ {violation.message}</p>
                ))}
              </div>
            )}
            {limitInfo.warnings && limitInfo.warnings.length > 0 && (
              <div className="warnings">
                {limitInfo.warnings.map((warning, index) => (
                  <p key={index} className="warning-message">⚠️ {warning.message}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="form-group">
          <label>Category</label>
          <select
            value={transfer.category_id}
            onChange={(e) => setTransfer({...transfer, category_id: e.target.value})}
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
            placeholder="What's this transfer for?"
            value={transfer.description}
            onChange={(e) => setTransfer({...transfer, description: e.target.value})}
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || (limitInfo && !limitInfo.allowed)} 
          className="transfer-btn"
        >
          {loading ? 'Processing...' : 'Transfer Money'}
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

export default TransferMoney;
