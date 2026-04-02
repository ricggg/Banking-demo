import React, { useState } from 'react';

function AccountSummary({ accounts, isDarkMode }) {
  const [expandedCard, setExpandedCard] = useState(null);
  const [animateIn, setAnimateIn] = useState(true);

  const getAccountTypeDisplay = (type) => {
    const types = {
      'checking': 'Checking Account',
      'savings': 'Savings Account',
      'premium_checking': 'Premium Checking',
      'business_savings': 'Business Savings'
    };
    return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getAccountTypeIcon = (type) => {
    const icons = {
      'checking': '💳',
      'savings': '💰',
      'premium_checking': '⭐',
      'business_savings': '🏢'
    };
    return icons[type] || '🏦';
  };

  const getAccountGradient = (type) => {
    const gradients = {
      'checking': 'linear-gradient(135deg, #1e3c7d, #2563eb)',
      'savings': 'linear-gradient(135deg, #059669, #10b981)',
      'premium_checking': 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
      'business_savings': 'linear-gradient(135deg, #dc2626, #ef4444)'
    };
    return gradients[type] || 'linear-gradient(135deg, #64748b, #475569)';
  };

  const getAccountAccentColor = (type) => {
    const colors = {
      'checking': '#2563eb',
      'savings': '#10b981',
      'premium_checking': '#8b5cf6',
      'business_savings': '#ef4444'
    };
    return colors[type] || '#64748b';
  };

  const dark = isDarkMode;

  const colors = {
    bg: dark ? '#0d0d0d' : '#f0f4f8',
    card: dark ? '#1a1a2e' : '#ffffff',
    cardBorder: dark ? '#2a2a4a' : '#e8ecf0',
    text: dark ? '#e8eaf6' : '#1a1a2a',
    textMuted: dark ? '#8892b0' : '#64748b',
    sectionTitle: dark ? '#818cf8' : '#1e3c7d',
  };

  // Calculate total balance
  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

  if (accounts.length === 0) {
    return (
      <div style={{
        minHeight: '60vh',
        background: dark
          ? 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #0d0d0d 100%)'
          : 'linear-gradient(135deg, #1e3c7d 0%, #2563eb 50%, #1e3c7d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <style>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>

        <div style={{
          background: colors.card,
          borderRadius: 24,
          padding: 50,
          maxWidth: 450,
          textAlign: 'center',
          border: `1px solid ${colors.cardBorder}`,
          boxShadow: '0 25px 80px rgba(0,0,0,0.2)',
          animation: 'fadeSlideUp 0.6s ease',
        }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #64748b, #475569)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: 48,
            animation: 'float 3s ease-in-out infinite',
            boxShadow: '0 10px 40px rgba(100,116,139,0.3)',
          }}>
            🏦
          </div>
          <h2 style={{
            fontSize: 24,
            fontWeight: 800,
            color: colors.text,
            margin: '0 0 12px',
          }}>
            No Accounts Found
          </h2>
          <p style={{
            color: colors.textMuted,
            fontSize: 15,
            margin: '0 0 28px',
            lineHeight: 1.6,
          }}>
            We couldn't find any accounts associated with your profile. 
            Please contact our support team for assistance.
          </p>
          <button style={{
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #1e3c7d, #2563eb)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.target.style.transform = 'translateY(0)'}
          >
            📞 Contact Support
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: dark
        ? 'linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 50%, #0d0d0d 100%)'
        : 'linear-gradient(135deg, #1e3c7d 0%, #2563eb 50%, #1e3c7d 100%)',
      padding: '40px 20px 60px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes shimmer {
          from { background-position: -200% center; }
          to { background-position: 200% center; }
        }
        @keyframes cardPop {
          0% { transform: scale(0.95); opacity: 0; }
          70% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        .account-card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.25) !important;
        }
        .balance-shimmer {
          background: linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0.3) 50%, 
            rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: 40,
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
            margin: '0 auto 16px',
            border: '2px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            animation: 'pulse 2s infinite',
          }}>
            💼
          </div>
          <h1 style={{
            color: '#fff',
            fontSize: 28,
            fontWeight: 800,
            margin: '0 0 8px',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}>
            Your Accounts
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 15,
            margin: 0,
          }}>
            {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'} • Total Balance
          </p>
        </div>

        {/* Total Balance Card */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          padding: '28px 32px',
          marginBottom: 32,
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          animation: 'fadeSlideUp 0.5s ease 0.1s both',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}>
            <div>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                margin: '0 0 6px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: 600,
              }}>
                💰 Total Balance
              </p>
              <h2 style={{
                color: '#fff',
                fontSize: 36,
                fontWeight: 800,
                margin: 0,
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }}>
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                padding: '10px 18px',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Accounts</p>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#fff' }}>{accounts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {accounts.map((account, index) => {
            const isExpanded = expandedCard === account.id;
            const gradient = getAccountGradient(account.account_type);
            const accentColor = getAccountAccentColor(account.account_type);
            
            return (
              <div
                key={account.id}
                className="account-card-hover"
                onClick={() => setExpandedCard(isExpanded ? null : account.id)}
                style={{
                  background: colors.card,
                  borderRadius: 20,
                  overflow: 'hidden',
                  border: `1px solid ${colors.cardBorder}`,
                  boxShadow: dark
                    ? '0 10px 40px rgba(0,0,0,0.3)'
                    : '0 6px 30px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  animation: `cardPop 0.5s ease ${index * 0.1}s both`,
                }}
              >
                {/* Card Header with Gradient */}
                <div style={{
                  background: gradient,
                  padding: '24px 24px 80px',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Decorative circles */}
                  <div style={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                  }} />

                  {/* Account Type */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 20,
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}>
                      {getAccountTypeIcon(account.account_type)}
                    </div>
                    <div>
                      <h3 style={{
                        color: '#fff',
                        fontSize: 16,
                        fontWeight: 700,
                        margin: '0 0 2px',
                        textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}>
                        {getAccountTypeDisplay(account.account_type)}
                      </h3>
                      <p style={{
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: 12,
                        margin: 0,
                      }}>
                        ···· {account.account_number.slice(-4)}
                      </p>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div style={{
                    position: 'relative',
                    zIndex: 1,
                  }}>
                    <p style={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: 12,
                      margin: '0 0 6px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: 600,
                    }}>
                      Available Balance
                    </p>
                    <h2 style={{
                      color: '#fff',
                      fontSize: 32,
                      fontWeight: 800,
                      margin: 0,
                      textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                    }}>
                      ${parseFloat(account.balance).toLocaleString(undefined, { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </h2>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{
                  padding: 24,
                  marginTop: -60,
                  position: 'relative',
                  zIndex: 2,
                }}>
                  {/* Quick Info Card */}
                  <div style={{
                    background: dark ? '#0f0f2a' : '#f8fafc',
                    borderRadius: 14,
                    padding: 18,
                    marginBottom: 16,
                    border: `1px solid ${colors.cardBorder}`,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 14,
                    }}>
                      <div>
                        <p style={{
                          color: colors.textMuted,
                          fontSize: 11,
                          margin: '0 0 4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: 600,
                        }}>
                          Account No.
                        </p>
                        <p style={{
                          color: colors.text,
                          fontSize: 13,
                          fontWeight: 700,
                          margin: 0,
                          fontFamily: 'monospace',
                        }}>
                          {account.account_number}
                        </p>
                      </div>
                      <div>
                        <p style={{
                          color: colors.textMuted,
                          fontSize: 11,
                          margin: '0 0 4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: 600,
                        }}>
                          Account Type
                        </p>
                        <p style={{
                          color: accentColor,
                          fontSize: 13,
                          fontWeight: 700,
                          margin: 0,
                        }}>
                          {account.account_type.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <div style={{
                    maxHeight: isExpanded ? '200px' : '0',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    opacity: isExpanded ? 1 : 0,
                  }}>
                    <div style={{
                      background: dark
                        ? 'linear-gradient(135deg, #0f0f2a, #1a1a3a)'
                        : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                      borderRadius: 12,
                      padding: 16,
                      border: `1px solid ${dark ? accentColor + '33' : accentColor + '22'}`,
                      marginBottom: 16,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 12,
                      }}>
                        <span style={{ fontSize: 16 }}>📅</span>
                        <div>
                          <p style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: 13,
                            color: colors.text,
                          }}>
                            Account Details
                          </p>
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          borderBottom: `1px solid ${colors.cardBorder}`,
                        }}>
                          <span style={{ color: colors.textMuted, fontSize: 12 }}>
                            📆 Opened
                          </span>
                          <span style={{ color: colors.text, fontSize: 12, fontWeight: 600 }}>
                            {new Date(account.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                        }}>
                          <span style={{ color: colors.textMuted, fontSize: 12 }}>
                            🔢 Account ID
                          </span>
                          <span style={{
                            color: colors.text,
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: 'monospace',
                          }}>
                            #{account.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(34,197,94,0.12)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      borderRadius: 50,
                      padding: '6px 14px',
                    }}>
                      <div style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#22c55e',
                        animation: 'pulse 1.5s infinite',
                      }} />
                      <span style={{
                        color: '#22c55e',
                        fontWeight: 600,
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        Active
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCard(isExpanded ? null : account.id);
                      }}
                      style={{
                        background: 'transparent',
                        border: `1px solid ${colors.cardBorder}`,
                        borderRadius: 8,
                        padding: '6px 12px',
                        color: colors.textMuted,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={e => {
                        e.target.style.background = dark ? '#2a2a4a' : '#f0f4f8';
                        e.target.style.borderColor = accentColor;
                        e.target.style.color = accentColor;
                      }}
                      onMouseOut={e => {
                        e.target.style.background = 'transparent';
                        e.target.style.borderColor = colors.cardBorder;
                        e.target.style.color = colors.textMuted;
                      }}
                    >
                      {isExpanded ? '▲ Less' : '▼ More'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div style={{
          textAlign: 'center',
          marginTop: 40,
          padding: 24,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'fadeSlideUp 0.5s ease 0.3s both',
        }}>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 13,
            margin: 0,
            lineHeight: 1.6,
          }}>
            🔒 Your accounts are protected with bank-level security. 
            All transactions are encrypted and monitored 24/7.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AccountSummary;