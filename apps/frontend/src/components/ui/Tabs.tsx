import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, activeTab, onChange, className = '' }: TabsProps) => {
  return (
    <div className={className}>
      <div className="tab-list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-trigger ${activeTab === tab.id ? 'tab-trigger-active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-panel">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
};
