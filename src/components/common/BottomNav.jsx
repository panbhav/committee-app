import React from 'react';
import { Home, Users, FileText, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function BottomNav({ activeTab, setActiveTab, isSuperAdmin }) {
  const { t } = useApp();

  const tabs = [
    { id: 'home', label: t.tabMeeting, icon: Home },
    { id: 'loans', label: t.tabLoans, icon: FileText },
    { id: 'limits', label: t.tabLimits, icon: Users },
    { id: 'annual', label: t.tabAnnual, icon: Calendar },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 max-w-md mx-auto px-2 py-1.5 flex justify-around items-center">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive
                ? 'text-emerald-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

