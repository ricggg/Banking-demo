import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

function LimitsOverview({ user }) {
  const [limits, setLimits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const response = await axios.get(`${config.API_BASE_URL}/account-limits.php?user_id=${user.user_id}`);
      setLimits(response.data);
    } catch (error) {
      console.error('Error fetching limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return '#dc3545'; // Red
    if (percentage >= 70) return '#ffc107'; // Yellow
    return '#28a745'; // Green
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading limits...</div>;
  }

  return (
    <div className="limits-overview">
      <h2>📊 Transaction Limits Overview</h2>
      
      {limits.map(account => (
        <div key={account.account_id} className="account-limits-card">
          <div className="limits-header">
            <h3>{account.account_number} - {account.account_type}</h3>
            <span className="balance">Balance: {formatCurrency(account.balance)}</span>
          </div>
          
          <div className="limits-grid">
            {/* Daily Transfer Limit */}
            <div className="limit-item">
              <div className="limit-title">Daily Transfer Limit</div>
              <div className="limit-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${Math.min(account.daily_transfer_percentage, 100)}%`,
                      backgroundColor: getProgressColor(account.daily_transfer_percentage)
                    }}
                  />
                </div>
                <div className="limit-values">
                  <span className="used">{formatCurrency(account.used_daily_transfer)}</span>
                  <span className="total">/ {formatCurrency(account.daily_transfer_limit)}</span>
                </div>
                <div className="remaining">
                  Remaining: {formatCurrency(account.remaining_daily_transfer)}
                </div>
              </div>
            </div>

            {/* Daily Withdrawal Limit */}
            <div className="limit-item">
              <div className="limit-title">Daily Withdrawal Limit</div>
              <div className="limit-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${Math.min(account.daily_withdrawal_percentage, 100)}%`,
                      backgroundColor: getProgressColor(account.daily_withdrawal_percentage)
                    }}
                  />
                </div>
                <div className="limit-values">
                  <span className="used">{formatCurrency(account.used_daily_withdrawal)}</span>
                  <span className="total">/ {formatCurrency(account.daily_withdrawal_limit)}</span>
                </div>
                <div className="remaining">
                  Remaining: {formatCurrency(account.remaining_daily_withdrawal)}
                </div>
              </div>
            </div>

            {/* Single Transaction Limit */}
            <div className="limit-item">
              <div className="limit-title">Single Transaction Limit</div>
              <div className="limit-single">
                <div className="limit-amount">{formatCurrency(account.single_transaction_limit)}</div>
                <div className="limit-description">Maximum per transaction</div>
              </div>
            </div>

            {/* Daily Transaction Count */}
            <div className="limit-item">
              <div className="limit-title">Daily Transaction Count</div>
              <div className="limit-count">
                <div className="count-display">
                  <span className="count-used">{account.used_daily_count}</span>
                  <span className="count-separator">/</span>
                  <span className="count-total">{account.daily_transaction_count_limit}</span>
                </div>
                <div className="limit-description">Transactions today</div>
              </div>
            </div>

            {/* Monthly Transfer Limit */}
            <div className="limit-item">
              <div className="limit-title">Monthly Transfer Limit</div>
              <div className="limit-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${Math.min((account.used_monthly_transfer / account.monthly_transfer_limit) * 100, 100)}%`,
                      backgroundColor: getProgressColor((account.used_monthly_transfer / account.monthly_transfer_limit) * 100)
                    }}
                  />
                </div>
                <div className="limit-values">
                  <span className="used">{formatCurrency(account.used_monthly_transfer)}</span>
                  <span className="total">/ {formatCurrency(account.monthly_transfer_limit)}</span>
                </div>
                <div className="remaining">
                  Remaining: {formatCurrency(account.remaining_monthly_transfer)}
                </div>
              </div>
            </div>

            {/* Monthly Withdrawal Limit */}
            <div className="limit-item">
              <div className="limit-title">Monthly Withdrawal Limit</div>
              <div className="limit-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${Math.min((account.used_monthly_withdrawal / account.monthly_withdrawal_limit) * 100, 100)}%`,
                      backgroundColor: getProgressColor((account.used_monthly_withdrawal / account.monthly_withdrawal_limit) * 100)
                    }}
                  />
                </div>
                <div className="limit-values">
                  <span className="used">{formatCurrency(account.used_monthly_withdrawal)}</span>
                  <span className="total">/ {formatCurrency(account.monthly_withdrawal_limit)}</span>
                </div>
                <div className="remaining">
                  Remaining: {formatCurrency(account.remaining_monthly_withdrawal)}
                </div>
              </div>
            </div>
          </div>
          
          <div className="limits-note">
            <p>💡 Limits reset daily at midnight and monthly on the 1st</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LimitsOverview;
