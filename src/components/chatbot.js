import React, { useState, useEffect, useRef, useCallback } from 'react';

const animations = `
  @keyframes chatBtnPulse {
    0% { box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    50% { box-shadow: 0 4px 35px rgba(0,0,0,0.7), 0 0 0 8px rgba(0,0,0,0.08); }
    100% { box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
  }
  @keyframes chatSlideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes chatFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes chatDots {
    0%, 20% { opacity: 0.3; transform: translateY(0); }
    50% { opacity: 1; transform: translateY(-5px); }
    80%, 100% { opacity: 0.3; transform: translateY(0); }
  }
  @keyframes msgPop {
    0% { opacity: 0; transform: scale(0.85) translateY(10px); }
    60% { transform: scale(1.02) translateY(-2px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes quickReplyFade {
    from { opacity: 0; transform: translateY(6px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes headerShine {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes statusPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.3); }
  }
  @keyframes btnHover {
    0% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.1) rotate(5deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes ripple {
    0% { transform: scale(0); opacity: 0.5; }
    100% { transform: scale(4); opacity: 0; }
  }
  @keyframes slideRight {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes iconBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  .chat-msg-row:hover .chat-bubble {
    filter: brightness(1.02);
  }
  .chat-quick-reply:hover {
    transform: translateY(-2px) scale(1.03) !important;
    box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
  }
  .chat-send-btn:hover:not(:disabled) {
    transform: scale(1.08) !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3) !important;
  }
  .chat-input-field:focus {
    border-color: #333 !important;
    box-shadow: 0 0 0 3px rgba(0,0,0,0.08) !important;
  }
  .chat-attach-btn:hover {
    background: rgba(0,0,0,0.08) !important;
    transform: scale(1.1) !important;
  }
`;

const BOT_NAME = 'Skylark Assistant';
const BOT_AVATAR = '🏦';

const knowledgeBase = [
  {
    keywords: ['balance', 'check balance', 'my balance', 'account balance', 'how much'],
    response: "You can view your **checking** and **savings** balances on the **My Account** page.\n\n• Use the 👁️ icon to show/hide your balance\n• Your savings account earns **4.75% APY**\n• Balances update in real-time after every transaction",
    category: 'accounts',
  },
  {
    keywords: ['transfer', 'send money', 'move money', 'wire', 'send funds'],
    response: "We offer several transfer options:\n\n🏠 **Local Transfer** — Send to US bank accounts instantly\n🌍 **International Transfer** — Send abroad via SWIFT\n💰 **Savings Transfer** — Move between checking & savings\n👥 **P2P Payments** — Send to friends & family\n\nAll transfers are secured with encryption & verification.",
    category: 'transfers',
  },
  {
    keywords: ['card', 'debit', 'credit', 'prepaid', 'apply card'],
    response: "We offer three card types:\n\n💳 **Debit Card** — Free, linked to your checking balance\n⭐ **Credit Card** — $50/year, build your credit score\n🎁 **Prepaid Card** — $5 fee, load money as needed\n\nApply through **My Account → Apply for Card**. Cards are delivered within 5-7 business days.",
    category: 'cards',
  },
  {
    keywords: ['security', 'safe', 'protect', 'fraud', 'hack', 'secure'],
    response: "Your account is protected by multiple layers of security:\n\n🔒 **256-bit SSL** encryption on all data\n🛡️ **FDIC insured** up to $250,000\n🔐 **Two-Factor Authentication** available\n📱 **24/7 Fraud Monitoring** on all transactions\n🚨 **Instant Alerts** for suspicious activity\n\nEnable 2FA in **Account Settings** for maximum protection.",
    category: 'security',
  },
  {
    keywords: ['support', 'contact', 'help', 'phone', 'email', 'call', 'reach'],
    response: "Our support team is here for you:\n\n📧 **Email:** support@skylarkcb.com\n📞 **Phone:** 1-708-667-6099 (24/7)\n💬 **Live Chat:** You're using it right now!\n🏦 **Branch:** Visit your nearest location\n⏰ **Hours:** Phone & Chat available 24/7\n\nAverage response time: under 2 minutes.",
    category: 'support',
  },
  {
    keywords: ['loan', 'borrow', 'mortgage', 'finance', 'credit line'],
    response: "We offer competitive loan products:\n\n👤 **Personal Loan** — from 5.99% APR\n🏢 **Business Loan** — from 4.99% APR\n🚗 **Auto Loan** — from 3.99% APR\n🏠 **Home Loan** — from 3.25% APR\n\nApply through **My Account → Apply for Loan**. Get pre-approved in minutes!",
    category: 'loans',
  },
  {
    keywords: ['savings', 'interest', 'apy', 'earn', 'saving account', 'save'],
    response: "Our high-yield savings account offers:\n\n📊 **4.75% APY** — among the highest in the market!\n🔁 **Monthly compounding** for maximum growth\n✅ **No minimum balance** required\n🛡️ **FDIC insured** up to $250,000\n📈 **Growth projections** available in the Savings tab\n\nStart saving today from the **Savings** section!",
    category: 'savings',
  },
  {
    keywords: ['bill', 'pay bill', 'utility', 'payment', 'bills'],
    response: "Pay your bills easily through our platform:\n\n⚡ **Utilities** — Electric, gas, water\n📱 **Phone & Internet** — All major providers\n🏠 **Rent & Mortgage** — Automated payments\n📅 **Schedule Payments** — Set it and forget it\n\nGo to **Bill Payments** in the sidebar to get started.",
    category: 'bills',
  },
  {
    keywords: ['crypto', 'bitcoin', 'ethereum', 'wallet', 'cryptocurrency'],
    response: "Explore digital assets with our Crypto Wallet:\n\n₿ **Bitcoin (BTC)** — Buy, sell & hold\nΞ **Ethereum (ETH)** — Smart contract platform\n🪙 **Multiple Coins** — Diversify your portfolio\n📊 **Real-time Prices** — Live market data\n🔒 **Secure Storage** — Bank-grade security\n\nAccess your wallet from the **Crypto Wallet** section.",
    category: 'crypto',
  },
  {
    keywords: ['statement', 'e-statement', 'download', 'pdf', 'history'],
    response: "Access your financial records anytime:\n\n📄 **e-Statements** — Monthly PDF statements\n⏱️ **Transaction History** — Full activity log\n📥 **Download** — Export to PDF or CSV\n🔍 **Search & Filter** — Find any transaction\n\nVisit **e-Statements** or **Transaction History** in the sidebar.",
    category: 'statements',
  },
  {
    keywords: ['cheque', 'check', 'deposit cheque', 'mobile deposit'],
    response: "Deposit cheques from anywhere:\n\n📸 **Mobile Deposit** — Snap a photo of your cheque\n🏦 **Branch Deposit** — Visit any Skylark branch\n⏰ **Processing** — Funds available within 1-2 business days\n✅ **Limits** — Up to $10,000 per mobile deposit\n\nGo to **Cheque Deposit** to deposit now.",
    category: 'deposits',
  },
  {
    keywords: ['schedule', 'recurring', 'automatic', 'auto pay', 'scheduled'],
    response: "Set up automated payments:\n\n📅 **One-time** — Schedule for a future date\n🔁 **Recurring** — Weekly, monthly, or custom\n✏️ **Manage** — Edit or cancel anytime\n🔔 **Reminders** — Get notified before execution\n\nVisit **Scheduled Payments** to set up automation.",
    category: 'scheduled',
  },
  {
    keywords: ['fee', 'charge', 'cost', 'pricing', 'free'],
    response: "Our transparent fee structure:\n\n✅ **Account Maintenance** — FREE\n✅ **Online Transfers** — FREE\n✅ **Debit Card** — FREE\n💳 **Credit Card** — $50/year\n🌍 **International Transfer** — 1.5% fee\n🏧 **ATM Withdrawals** — Free at 50,000+ ATMs\n\nNo hidden fees, ever.",
    category: 'fees',
  },
  {
    keywords: ['open account', 'new account', 'sign up', 'register', 'create account'],
    response: "Opening an account is quick and easy:\n\n1️⃣ Visit our website or app\n2️⃣ Provide your personal information\n3️⃣ Verify your identity (takes 2 minutes)\n4️⃣ Fund your account\n\n🎉 Your account is ready to use immediately!\n\nMinimum deposit: **$0** — No minimum required!",
    category: 'account',
  },
  {
    keywords: ['p2p', 'peer', 'friend', 'family', 'send to person'],
    response: "Send money to anyone, instantly:\n\n👥 **P2P Payments** — Send by email or phone\n⚡ **Instant Transfer** — Money arrives in seconds\n💸 **No Fees** — Free for personal transfers\n📱 **Mobile Friendly** — Send from anywhere\n\nGo to **P2P Payments** in the sidebar.",
    category: 'p2p',
  },
];

const quickReplies = [
  { label: '💰 Check Balance', query: 'How do I check my balance?' },
  { label: '🔄 Transfers', query: 'How do I transfer money?' },
  { label: '💳 Cards', query: 'Tell me about card services' },
  { label: '🔒 Security', query: 'How secure is my account?' },
  { label: '📞 Support', query: 'How do I contact support?' },
  { label: '💵 Loans', query: 'Tell me about loans' },
  { label: '📊 Savings', query: 'Tell me about savings' },
  { label: '🪙 Crypto', query: 'Tell me about crypto wallet' },
];

const categoryIcons = {
  accounts: '🏦',
  transfers: '🔄',
  cards: '💳',
  security: '🔒',
  support: '📞',
  loans: '💵',
  savings: '📊',
  bills: '🧾',
  crypto: '🪙',
  statements: '📄',
  deposits: '📥',
  scheduled: '📅',
  fees: '💲',
  account: '👤',
  p2p: '👥',
};

function getResponse(query) {
  const q = query.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|sup|yo)\b/.test(q)) {
    return {
      text: "Hello! 👋 Welcome to Skylark Bank. I'm here to help you with:\n\n• Account inquiries & balances\n• Transfers & payments\n• Cards & loan applications\n• Security & account settings\n\nWhat can I assist you with today?",
      category: null,
    };
  }

  // Thanks
  if (/^(thank|thanks|thx|ty|appreciate|cheers)\b/.test(q)) {
    return {
      text: "You're welcome! 😊 Happy to help. Is there anything else you'd like to know about your Skylark Bank account?",
      category: null,
    };
  }

  // Goodbye
  if (/^(bye|goodbye|see\s*you|later|quit|exit|close)\b/.test(q)) {
    return {
      text: "Goodbye! 👋 Thank you for banking with Skylark. Have a wonderful day! Remember, I'm available 24/7 whenever you need help. 🏦",
      category: null,
    };
  }

  // Search knowledge base
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    let score = 0;
    for (const keyword of entry.keywords) {
      if (q.includes(keyword.toLowerCase())) {
        score += keyword.split(' ').length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    return { text: bestMatch.response, category: bestMatch.category };
  }

  // Default
  return {
    text: "I'm not sure I understand that question. Here are some topics I can help with:\n\n• 💰 Account balances & statements\n• 🔄 Transfers & payments\n• 💳 Card & loan applications\n• 🔒 Security & settings\n• 📊 Savings & investments\n• 🪙 Cryptocurrency\n\nTry asking about any of these, or click a quick reply below! 👇",
    category: null,
  };
}

function formatBotText(text) {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700, color: '#111' }}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatBot({ isDarkMode = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'bot',
      text: "Hello! 👋 I'm your Skylark Bank assistant. How can I help you today?",
      time: new Date(),
      category: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = useCallback((text) => {
    const query = (text || input).trim();
    if (!query) return;

    const userMsg = {
      id: Date.now(),
      from: 'user',
      text: query,
      time: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setShowQuickReplies(false);

    const delay = 600 + Math.random() * 1000;

    setTimeout(() => {
      const { text: responseText, category } = getResponse(query);
      const botReply = {
        id: Date.now() + 1,
        from: 'bot',
        text: responseText,
        time: new Date(),
        category,
      };
      setMessages(prev => [...prev, botReply]);
      setIsTyping(false);
      setShowQuickReplies(true);

      if (!isOpen) {
        setHasNewMessage(true);
      }
    }, delay);
  }, [input, isOpen]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleFeedback = useCallback((msgId, type) => {
    setFeedbackGiven(prev => ({ ...prev, [msgId]: type }));
  }, []);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: Date.now(),
        from: 'bot',
        text: "Chat cleared! 🧹 How can I help you today?",
        time: new Date(),
        category: null,
      },
    ]);
    setShowQuickReplies(true);
    setFeedbackGiven({});
  }, []);

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const bg = isDarkMode ? '#0d0d0d' : '#f0f4f8';
  const cardBg = isDarkMode ? '#1a1a2e' : '#ffffff';
  const cardBorder = isDarkMode ? '#2a2a4a' : '#e8ecf0';
  const textColor = isDarkMode ? '#e8eaf6' : '#1a1a2a';
  const textMuted = isDarkMode ? '#8892b0' : '#64748b';
  const inputBg = isDarkMode ? '#16213e' : '#f8fafc';
  const inputBorder = isDarkMode ? '#2a2a4a' : '#e2e8f0';
  const chatBg = isDarkMode ? '#0f0f1f' : '#f4f6f8';
  const userBubbleBg = 'linear-gradient(135deg, #111111, #333333)';
  const botBubbleBg = isDarkMode ? '#1e1e3a' : '#ffffff';
  const botBubbleBorder = isDarkMode ? '#2a2a4a' : '#e8ecf0';

  return (
    <>
      <style>{animations}</style>

      {/* ── Chat Window ── */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: 100, right: 28, width: 400, maxHeight: 600,
          background: cardBg, borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 25px 80px rgba(0,0,0,0.3), 0 0 0 1px ' + cardBorder,
          animation: 'chatSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 9999, display: 'flex', flexDirection: 'column',
          border: '1px solid ' + cardBorder,
        }}>

          {/* ── Header ── */}
          <div style={{
            background: 'linear-gradient(135deg, #000000, #1a1a1a, #2d2d2d)',
            padding: '20px 20px 18px', position: 'relative', overflow: 'hidden',
          }}>
            {/* Shine effect */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
              backgroundSize: '200% 100%', animation: 'headerShine 4s ease infinite',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 16,
                  background: 'linear-gradient(135deg, #333, #555)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, border: '2px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                }}>
                  {BOT_AVATAR}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '0.3px' }}>{BOT_NAME}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: '#22c55e',
                      animation: 'statusPulse 2s infinite', boxShadow: '0 0 8px rgba(34,197,94,0.6)',
                    }} />
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500 }}>Online • Instant replies</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.6)', width: 34, height: 34, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 15, transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                >🗑️</button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.6)', width: 34, height: 34, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 16, transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                >✕</button>
              </div>
            </div>
          </div>

          {/* ── Messages ── */}
          <div
            ref={chatBodyRef}
            style={{
              flex: 1, overflowY: 'auto', padding: '18px 16px 10px',
              maxHeight: 360, minHeight: 300, background: chatBg,
              scrollBehavior: 'smooth',
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className="chat-msg-row"
                style={{
                  display: 'flex',
                  justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 14,
                  animation: `msgPop 0.35s ease ${idx * 0.02}s both`,
                }}
              >
                {/* Bot Avatar */}
                {msg.from === 'bot' && (
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    marginRight: 10, marginTop: 2,
                    background: 'linear-gradient(135deg, #111, #333)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, border: '1px solid ' + (isDarkMode ? '#333' : '#e0e0e0'),
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}>
                    {msg.category && categoryIcons[msg.category] ? categoryIcons[msg.category] : BOT_AVATAR}
                  </div>
                )}

                <div style={{ maxWidth: '78%' }}>
                  {/* Bubble */}
                  <div
                    className="chat-bubble"
                    style={{
                      padding: '12px 16px',
                      borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: msg.from === 'user' ? userBubbleBg : botBubbleBg,
                      color: msg.from === 'user' ? '#fff' : textColor,
                      fontSize: 13.5, lineHeight: 1.65, fontWeight: 450,
                      border: msg.from === 'bot' ? '1px solid ' + botBubbleBorder : 'none',
                      boxShadow: msg.from === 'user'
                        ? '0 4px 15px rgba(0,0,0,0.2)'
                        : '0 2px 10px rgba(0,0,0,0.04)',
                      whiteSpace: 'pre-line',
                      transition: 'filter 0.2s ease',
                    }}
                  >
                    {msg.from === 'bot' ? formatBotText(msg.text) : msg.text}
                  </div>

                  {/* Time + Feedback */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                    gap: 8, marginTop: 5, padding: '0 4px',
                  }}>
                    <span style={{
                      fontSize: 10.5, color: textMuted, fontWeight: 500,
                    }}>
                      {formatTime(msg.time)}
                      {msg.from === 'user' && ' ✓✓'}
                    </span>

                    {/* Feedback buttons for bot messages */}
                    {msg.from === 'bot' && msg.id !== 1 && (
                      <div style={{ display: 'flex', gap: 4, animation: 'slideRight 0.3s ease 0.5s both' }}>
                        {!feedbackGiven[msg.id] ? (
                          <>
                            <button
                              onClick={() => handleFeedback(msg.id, 'up')}
                              style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                fontSize: 12, padding: '2px 4px', borderRadius: 6,
                                opacity: 0.4, transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                              title="Helpful"
                            >👍</button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'down')}
                              style={{
                                background: 'transparent', border: 'none', cursor: 'pointer',
                                fontSize: 12, padding: '2px 4px', borderRadius: 6,
                                opacity: 0.4, transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                              title="Not helpful"
                            >👎</button>
                          </>
                        ) : (
                          <span style={{ fontSize: 10.5, color: '#22c55e', fontWeight: 600 }}>
                            {feedbackGiven[msg.id] === 'up' ? '✅ Thanks!' : '📝 Noted'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {msg.from === 'user' && (
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    marginLeft: 10, marginTop: 2,
                    background: 'linear-gradient(135deg, #333, #555)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: '#fff', fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}>
                    👤
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 14, animation: 'chatFadeIn 0.25s ease',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: 'linear-gradient(135deg, #111, #333)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, border: '1px solid ' + (isDarkMode ? '#333' : '#e0e0e0'),
                }}>
                  {BOT_AVATAR}
                </div>
                <div style={{
                  padding: '12px 18px', borderRadius: '18px 18px 18px 4px',
                  background: botBubbleBg, border: '1px solid ' + botBubbleBorder,
                  display: 'flex', gap: 5, alignItems: 'center',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: isDarkMode ? '#666' : '#aaa',
                      animation: `chatDots 1.4s infinite ${i * 0.2}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Replies ── */}
          {showQuickReplies && messages.length <= 3 && (
            <div style={{
              padding: '10px 16px 6px', display: 'flex', gap: 7, flexWrap: 'wrap',
              borderTop: '1px solid ' + cardBorder, background: chatBg,
            }}>
              {quickReplies.slice(0, 6).map((qr, i) => (
                <button
                  key={i}
                  className="chat-quick-reply"
                  onClick={() => handleSend(qr.query)}
                  style={{
                    padding: '7px 14px', borderRadius: 50, fontSize: 11.5, fontWeight: 600,
                    border: '1px solid ' + (isDarkMode ? '#333' : '#ddd'),
                    cursor: 'pointer', transition: 'all 0.25s ease',
                    background: isDarkMode ? '#1a1a2e' : '#fff',
                    color: isDarkMode ? '#ccc' : '#333',
                    whiteSpace: 'nowrap',
                    animation: `quickReplyFade 0.3s ease ${i * 0.05}s both`,
                  }}
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Input Area ── */}
          <div style={{
            padding: '14px 16px', borderTop: '1px solid ' + cardBorder,
            background: cardBg, display: 'flex', gap: 10, alignItems: 'flex-end',
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="chat-input-field"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 14,
                  border: '2px solid ' + inputBorder, fontSize: 14,
                  background: inputBg, color: textColor, outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                  transition: 'all 0.25s ease', fontWeight: 450,
                }}
              />
            </div>

            <button
              className="chat-send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              style={{
                width: 46, height: 46, borderRadius: 14, border: 'none',
                background: input.trim()
                  ? 'linear-gradient(135deg, #000, #333)'
                  : (isDarkMode ? '#2a2a4a' : '#e5e7eb'),
                color: '#fff', fontSize: 20, cursor: input.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s ease', flexShrink: 0,
                boxShadow: input.trim() ? '0 4px 15px rgba(0,0,0,0.25)' : 'none',
                opacity: input.trim() ? 1 : 0.5,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: '8px 16px 10px', textAlign: 'center',
            borderTop: '1px solid ' + (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'),
            background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
          }}>
            <span style={{ fontSize: 10.5, color: textMuted, fontWeight: 500 }}>
              Powered by <strong style={{ color: isDarkMode ? '#aaa' : '#555', fontWeight: 700 }}>Skylark AI</strong> • Available 24/7
            </span>
          </div>
        </div>
      )}

      {/* ── Floating Chat Button ── */}
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setHasNewMessage(false); }}
        style={{
          position: 'fixed', bottom: 28, right: 28, width: 64, height: 64,
          borderRadius: isOpen ? 18 : '50%', border: 'none', cursor: 'pointer',
          background: isOpen
            ? 'linear-gradient(135deg, #333, #555)'
            : 'linear-gradient(135deg, #000000, #1a1a1a, #333333)',
          color: '#fff', fontSize: 26,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isOpen
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 6px 30px rgba(0,0,0,0.4)',
          animation: isOpen ? 'none' : 'chatBtnPulse 2.5s infinite',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 10000, overflow: 'hidden',
          backgroundSize: '200% 200%',
        }}
      >
        {/* Ripple overlay */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit',
          background: 'radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
          opacity: isOpen ? 0 : 1, transition: 'opacity 0.3s ease',
        }} />

        <span style={{
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'rotate(0deg) scale(1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 2,
        }}>
          {isOpen ? '✕' : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <line x1="9" y1="10" x2="9" y2="10" strokeWidth="3" />
              <line x1="12" y1="10" x2="12" y2="10" strokeWidth="3" />
              <line x1="15" y1="10" x2="15" y2="10" strokeWidth="3" />
            </svg>
          )}
        </span>

        {/* Notification badge */}
        {!isOpen && hasNewMessage && (
          <div style={{
            position: 'absolute', top: -3, right: -3,
            width: 22, height: 22, borderRadius: '50%',
            background: '#ef4444',
            border: '3px solid ' + (isDarkMode ? '#0d0d0d' : '#f0f4f8'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#fff',
            animation: 'statusPulse 1.5s infinite',
            boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
            zIndex: 3,
          }}>
            1
          </div>
        )}

        {/* Outer ring */}
        {!isOpen && (
          <div style={{
            position: 'absolute', inset: -7, borderRadius: '50%',
            border: '2px solid rgba(0,0,0,0.15)',
            animation: 'statusPulse 2.5s infinite',
            pointerEvents: 'none', zIndex: 1,
          }} />
        )}
      </button>
    </>
  );
}