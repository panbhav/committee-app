import React, { useState } from 'react';
import { useApp } from '../../context/useApp';
import { Landmark, ArrowRight, ShieldCheck, Users, BookOpen, Globe2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { DEMO_MODE } from '../../config';

export default function LoginScreen({ onLoginSuccess }) {
  const { members, loans, setCurrentUser, setCurrentOuterLoanId, language, setLanguage } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const hi = language === 'hi';
  const openAccount = (account, type = 'member') => {
    if (!DEMO_MODE || !account) return;
    if (type === 'member') {
      setCurrentUser(account);
      setCurrentOuterLoanId(null);
      localStorage.setItem('comm_current_user', JSON.stringify(account));
      localStorage.removeItem('comm_outer_loan_id');
    } else {
      setCurrentUser(null);
      setCurrentOuterLoanId(account.id);
      localStorage.removeItem('comm_current_user');
      localStorage.setItem('comm_outer_loan_id', JSON.stringify(account.id));
    }
    onLoginSuccess();
  };
  const submit = event => {
    event.preventDefault();
    if (!DEMO_MODE) return;
    const input = identifier.trim().toLowerCase();
    const member = members.find(account => account.name.toLowerCase() === input || account.phone === input);
    if (member) return openAccount(member);
    const borrower = loans.find(loan => loan.type === 'outer' && (String(loan.id) === input || loan.borrowerPhone === input || loan.borrowerName.toLowerCase() === input));
    if (borrower) return openAccount(borrower, 'outer');
    setError(hi ? 'खाता नहीं मिला। सदस्य का नाम, मोबाइल नंबर या लोन आईडी जांचें।' : 'Account not found. Check the member name, phone number, or loan ID.');
  };
  return <main className="login-layout">
    <section className="login-story">
      <div className="brand"><span className="brand-mark"><Landmark size={25} /></span><div><h1>Banking Society</h1><p>GROWING TOGETHER</p></div></div>
      <div className="story-content"><span className="story-pill"><span />{hi ? 'आपकी कमेटी का अपना वर्कस्पेस' : 'A SHARED VISION. A SHARED FUTURE.'}</span><h2>{hi ? <>साथ बचाएं।<br />साथ <em>आगे बढ़ें।</em></> : <>Small savings.<br />Bigger <em>possibilities.</em></>}</h2><p>{hi ? 'सदस्यों, बचत और हर किश्त को जोड़ने वाला एक सरल वर्कस्पेस।' : 'One thoughtful workspace for your members, your savings, and every step forward.'}</p>
      <div className="story-ledger" aria-hidden="true"><div><span className="ledger-icon"><BookOpen size={20} /></span><span>Community passbook<small>Every contribution counts</small></span><span className="ledger-status">Together ↑</span></div><div className="ledger-bars">{[32, 46, 40, 62, 57, 75, 68, 88, 82, 100].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div><div className="ledger-caption"><span>Shared commitment</span><span>Lasting growth <ArrowUpRight size={13} /></span></div></div>
      <div className="story-features"><span><Users size={17} />{hi ? 'जुड़े हुए सदस्य' : 'Connected members'}</span><span><BookOpen size={17} />{hi ? 'स्पष्ट हिसाब' : 'Clear records'}</span></div></div>
      <p className="story-bottom">Built around people. Designed for progress.</p>
    </section>
    <section className="login-form-side">
      <button className="login-language header-icon" onClick={() => setLanguage(hi ? 'en' : 'hi')} aria-label="Switch language"><Globe2 size={16} />{hi ? 'English' : 'हिंदी'}</button>
      <div className="login-card"><span className="eyebrow">{hi ? 'आपका कम्युनिटी पोर्टल' : 'YOUR COMMUNITY PORTAL'}</span><h1>{hi ? 'फिर से स्वागत है' : 'Welcome to your society'}<span className="heading-dot">.</span></h1><p className="login-description">{hi ? 'अपने खाते से जुड़ें और हर योगदान का हिसाब देखें।' : 'Your contributions, collections, and community. All in one place.'}</p>
      {DEMO_MODE ? <>
        <form onSubmit={submit} className="login-form"><label htmlFor="account-identifier">{hi ? 'सदस्य का नाम, मोबाइल या लोन आईडी' : 'Member name, phone number, or loan ID'}</label><input id="account-identifier" autoComplete="username" value={identifier} onChange={event => { setIdentifier(event.target.value); setError(''); }} placeholder={hi ? 'उदा. AVNISH या 408' : 'e.g. AVNISH or loan #408'} required />{error && <p role="alert" className="login-error"><AlertCircle size={16} />{error}</p>}<button type="submit" className="primary-button">{hi ? 'डेमो खाता खोलें' : 'Open demo account'}<ArrowRight size={17} /></button></form>
        <div className="demo-divider"><span>{hi ? 'या वर्कस्पेस देखें' : 'OR EXPLORE THE WORKSPACE'}</span></div>
        <div className="demo-accounts">{[{ name: 'NARENDRA', label: hi ? 'एडमिन डैशबोर्ड' : 'Admin workspace', detail: hi ? 'संग्रह और कमेटी प्रबंधन' : 'Collections & society management', icon: ShieldCheck }, { name: 'AVNISH', label: hi ? 'सदस्य पोर्टल' : 'Member portal', detail: hi ? 'आपके लोन और गारंटी' : 'Personal loans & guarantees', icon: Users }].map(({ name, label, detail, icon: Icon }) => <button key={name} onClick={() => openAccount(members.find(member => member.name === name))}><span className="demo-icon"><Icon size={20} /></span><span>{label}<small>{detail}</small></span><ArrowUpRight size={17} /></button>)}<button onClick={() => openAccount(loans.find(loan => loan.type === 'outer'), 'outer')}><span className="demo-icon"><BookOpen size={20} /></span><span>{hi ? 'उधारकर्ता पासबुक' : 'Borrower passbook'}<small>{hi ? 'किश्तें और भुगतान की तारीखें' : 'Installments & upcoming dates'}</small></span><ArrowUpRight size={17} /></button></div>
        <p className="demo-notice"><span />{hi ? 'स्थानीय डेमो · बदलाव केवल इस ब्राउज़र में सहेजे जाते हैं।' : 'Local demo · Changes stay in this browser.'}</p>
      </> : <div role="status" className="production-notice"><ShieldCheck size={24} /><h2>Account access is not configured</h2><p>Contact your administrator to connect verified sign-in. Demo identities and test OTPs are disabled in production.</p></div>}
      </div><div className="login-footer">
        <span>Banking Society</span>
        <span>·</span>
        <span>
          Designed &amp; Developed by{' '}
          <a
            href="https://pixeltocloud.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#6bd5ad', textDecoration: 'underline', textUnderlineOffset: '2px', fontWeight: 600 }}
          >
            PixelToCloud
          </a>{' '}
          (pixeltocloud.com)
        </span>
      </div>
    </section>
  </main>;
}
