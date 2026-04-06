import type { Task } from '../lib/types';
import './BoardStats.css';

interface BoardStatsProps {
  tasks: Task[];
  isOpen: boolean;
  onClose: () => void;
}

export default function BoardStats({ tasks, isOpen, onClose }: BoardStatsProps) {
  if (!isOpen) return null;

  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const inReview = tasks.filter((t) => t.status === 'in_review').length;
  const done = tasks.filter((t) => t.status === 'done').length;

  const overdue = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false;
    return new Date(t.due_date).getTime() < Date.now();
  }).length;

  const dueSoon = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false;
    const diff = Math.ceil(
      (new Date(t.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return diff >= 0 && diff <= 2;
  }).length;

  const highPri = tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length;

  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

  const columns = [
    { label: 'To Do', count: todo, color: '#898DA6', icon: '○' },
    { label: 'In Progress', count: inProgress, color: '#6366F1', icon: '◐' },
    { label: 'In Review', count: inReview, color: '#FBBF24', icon: '◑' },
    { label: 'Done', count: done, color: '#34D399', icon: '●' },
  ];

  return (
    <>
      <div className="stats-overlay" onClick={onClose} />
      <div className="stats-panel">
        <div className="stats-panel__header">
          <h3 className="stats-panel__title">Board Summary</h3>
          <button className="stats-close" onClick={onClose}>×</button>
        </div>

        <div className="stats-panel__body">
          {/* Completion Ring */}
          <div className="stats-completion">
            <div className="stats-ring">
              <svg viewBox="0 0 100 100" className="stats-ring__svg">
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="6"
                />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${completionRate * 2.64} ${264 - completionRate * 2.64}`}
                  strokeDashoffset="66"
                  className="stats-ring__progress"
                />
              </svg>
              <div className="stats-ring__label">
                <span className="stats-ring__pct">{completionRate}%</span>
                <span className="stats-ring__sub">complete</span>
              </div>
            </div>
            <div className="stats-completion__detail">
              <span className="stats-completion__done">{done}</span> of{' '}
              <span>{total}</span> tasks done
            </div>
          </div>

          {/* Column Breakdown */}
          <div className="stats-section">
            <h4 className="stats-section__title">By Status</h4>
            <div className="stats-bars">
              {columns.map((col) => (
                <div className="stats-bar" key={col.label}>
                  <div className="stats-bar__header">
                    <span className="stats-bar__label">
                      <span style={{ color: col.color }}>{col.icon}</span> {col.label}
                    </span>
                    <span className="stats-bar__count">{col.count}</span>
                  </div>
                  <div className="stats-bar__track">
                    <div
                      className="stats-bar__fill"
                      style={{
                        width: total > 0 ? `${(col.count / total) * 100}%` : '0%',
                        background: col.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="stats-section">
            <h4 className="stats-section__title">Alerts</h4>
            <div className="stats-alerts">
              <div className={`stats-alert ${overdue > 0 ? 'stats-alert--danger' : ''}`}>
                <span className="stats-alert__icon">!</span>
                <span className="stats-alert__text">
                  <strong>{overdue}</strong> overdue
                </span>
              </div>
              <div className={`stats-alert ${dueSoon > 0 ? 'stats-alert--warning' : ''}`}>
                <span className="stats-alert__icon">⏱</span>
                <span className="stats-alert__text">
                  <strong>{dueSoon}</strong> due soon
                </span>
              </div>
              <div className={`stats-alert ${highPri > 0 ? 'stats-alert--accent' : ''}`}>
                <span className="stats-alert__icon">↑</span>
                <span className="stats-alert__text">
                  <strong>{highPri}</strong> high priority
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
