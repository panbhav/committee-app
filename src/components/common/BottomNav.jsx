import React from 'react';
import { LayoutDashboard, Users, BookOpen, ChartNoAxesCombined, Landmark, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../context/useApp';

export default function BottomNav({ activeTab, setActiveTab }) {
  const { t, lang } = useApp();
  const tabs = [
    { id: 'home', label: t.tabMeeting, icon: LayoutDashboard, detail: 'Overview & collections' },
    { id: 'loans', label: t.tabLoans, icon: BookOpen, detail: 'Every loan, every installment' },
    { id: 'limits', label: t.tabLimits, icon: Users, detail: 'Members & borrowing limits' },
    { id: 'annual', label: t.tabAnnual, icon: ChartNoAxesCombined, detail: 'Dividends & settlement' },
  ];
  return <nav className="main-nav" aria-label="Main navigation">
    <p className="nav-caption">{lang === 'hi' ? 'आपका वर्कस्पेस' : 'WORKSPACE'}</p>
    <div className="nav-items">{tabs.map(({ id, label, icon: Icon, detail }) => <button key={id} onClick={() => { setActiveTab(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-current={activeTab === id ? 'page' : undefined} className={`nav-item ${activeTab === id ? 'selected' : ''}`}><Icon size={20} strokeWidth={1.8} /><span>{label}<small>{detail}</small></span>{activeTab === id && <ArrowUpRight size={15} className="nav-arrow" />}</button>)}</div>
    <div className="nav-note"><Landmark size={24} /><h3>Stronger, together.</h3><p>Small contributions.<br />Shared possibilities.</p><span>Banking Society · Est. 2026</span></div>
    <div className="nav-footer">
      <span>Designed &amp; Developed by</span>
      <a href="https://pixeltocloud.com" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#6bd5ad', textDecoration: 'none', fontWeight: 600 }}>
        PixelToCloud <ArrowUpRight size={10} />
      </a>
      <span style={{ display: 'block', fontSize: '7.5px', color: '#728987', marginTop: '2px' }}>pixeltocloud.com</span>
    </div>
  </nav>;
}
