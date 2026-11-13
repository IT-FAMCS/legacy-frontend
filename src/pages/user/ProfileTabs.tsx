export type ProfileTab = 'info' | 'tasks' | 'activity';
const tabs: { key: ProfileTab; label: string }[] = [{ key: 'info', label: 'Информация' }, { key: 'tasks', label: 'Таски' }, { key: 'activity', label: 'Активность' }];
export function ProfileTabs({ active, onChange }: { active: ProfileTab; onChange: (tab: ProfileTab) => void }) {
  return <div className="profile-tabs" role="tablist" aria-label="Разделы профиля">{tabs.map((tab, index) =>
    <button type="button" key={tab.key} id={`profile-${tab.key}-tab`} role="tab" aria-selected={active === tab.key} aria-controls={`profile-${tab.key}-panel`} tabIndex={active === tab.key ? 0 : -1}
      onClick={() => onChange(tab.key)} onKeyDown={event => {
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : -1;
        if (next < 0) return; event.preventDefault(); onChange(tabs[next].key); document.getElementById(`profile-${tabs[next].key}-tab`)?.focus();
      }}>{tab.label}</button>)}</div>;
}
