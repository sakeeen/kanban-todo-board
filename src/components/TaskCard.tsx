import type { Task, Label, TeamMember } from '../lib/types';
import './TaskCard.css';

interface TaskCardProps {
  task: Task;
  labels: Label[];
  members: TeamMember[];
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
}

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: '#555973', bg: 'rgba(85,89,115,0.15)' },
  normal: { label: 'Normal', color: '#898DA6', bg: 'rgba(137,141,166,0.15)' },
  high: { label: 'High', color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
};

function getDueStatus(dueDate: string | null) {
  if (!dueDate) return null;
  const diff = Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0)
    return { label: 'Overdue', color: 'var(--danger)', bg: 'var(--danger-subtle)', icon: '!' };
  if (diff <= 2)
    return { label: 'Due soon', color: 'var(--warning)', bg: 'var(--warning-subtle)', icon: '⏱' };
  return {
    label: `${diff}d left`,
    color: 'var(--text-tertiary)',
    bg: 'transparent',
    icon: '○',
  };
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

export default function TaskCard({ task, labels, members, onDelete, onClick }: TaskCardProps) {
  const pri = PRIORITY_CONFIG[task.priority];
  const due = getDueStatus(task.due_date);
  const assignee = task.assignee_id ? members.find((m) => m.id === task.assignee_id) : null;
  const taskLabels = (task.labels || [])
    .map((name) => {
      const l = labels.find((lb) => lb.name === name);
      return l ? { name: l.name, color: l.color } : { name, color: '#555973' };
    });

  return (
    <div className="task-card" onClick={() => onClick(task)}>
      <button
        className="task-card__delete"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        title="Delete task"
      >
        ×
      </button>

      {/* Labels row */}
      {taskLabels.length > 0 && (
        <div className="task-card__labels">
          {taskLabels.map((l) => (
            <span
              key={l.name}
              className="task-card__label"
              style={{
                background: `${l.color}22`,
                color: l.color,
              }}
            >
              {l.name}
            </span>
          ))}
        </div>
      )}

      <div className="task-card__title">{task.title}</div>

      {task.description && (
        <div className="task-card__desc">{task.description}</div>
      )}

      <div className="task-card__meta">
        <span
          className="task-card__priority"
          style={{ color: pri.color, background: pri.bg }}
        >
          {pri.label}
        </span>

        {due && (
          <span
            className="task-card__due"
            style={{ color: due.color, background: due.bg }}
          >
            {due.icon} {due.label}
          </span>
        )}

        <span className="task-card__time">{timeAgo(task.created_at)}</span>

        {assignee && (
          <span className="task-card__avatar" style={{ background: assignee.color }} title={assignee.name}>
            {assignee.avatar_letter}
          </span>
        )}
      </div>
    </div>
  );
}
