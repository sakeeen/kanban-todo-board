import { useState, useEffect, useRef } from 'react';
import type { Task, Status, Priority, Label, TeamMember, Comment, ActivityEntry } from '../lib/types';
import './TaskDetail.css';

interface TaskDetailProps {
  task: Task | null;
  labels: Label[];
  members: TeamMember[];
  comments: Comment[];
  activities: ActivityEntry[];
  commentsLoading: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onAddComment: (taskId: string, content: string) => void;
  onTaskOpen: (taskId: string) => void;
}

const COLUMNS: { id: Status; label: string; icon: string; color: string }[] = [
  { id: 'todo', label: 'To Do', icon: '○', color: '#898DA6' },
  { id: 'in_progress', label: 'In Progress', icon: '◐', color: '#6366F1' },
  { id: 'in_review', label: 'In Review', icon: '◑', color: '#FBBF24' },
  { id: 'done', label: 'Done', icon: '●', color: '#34D399' },
];

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#555973' },
  { value: 'normal', label: 'Normal', color: '#898DA6' },
  { value: 'high', label: 'High', color: '#F87171' },
];

const STATUS_LABELS: Record<string, string> = {
  todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

type Tab = 'details' | 'comments' | 'activity';

export default function TaskDetail({
  task, labels, members, comments, activities, commentsLoading,
  onClose, onUpdate, onDelete, onAddComment, onTaskOpen,
}: TaskDetailProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('todo');
  const [priority, setPriority] = useState<Priority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [taskLabels, setTaskLabels] = useState<string[]>([]);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [commentText, setCommentText] = useState('');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.due_date || '');
      setTaskLabels(task.labels || []);
      setAssigneeId(task.assignee_id || null);
      setHasChanges(false);
      setActiveTab('details');
      setCommentText('');
      onTaskOpen(task.id);
    }
  }, [task?.id]);

  if (!task) return null;

  const handleSave = () => {
    onUpdate(task.id, {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      due_date: dueDate || null,
      labels: taskLabels,
      assignee_id: assigneeId,
    });
    setHasChanges(false);
  };

  const handleChange = (setter: Function, value: any) => {
    setter(value);
    setHasChanges(true);
  };

  const toggleLabel = (labelName: string) => {
    const next = taskLabels.includes(labelName)
      ? taskLabels.filter((l) => l !== labelName)
      : [...taskLabels, labelName];
    setTaskLabels(next);
    setHasChanges(true);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this task? This cannot be undone.')) {
      onDelete(task.id);
      onClose();
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    onAddComment(task.id, commentText.trim());
    setCommentText('');
  };

  const assignee = members.find((m) => m.id === assigneeId);

  return (
    <>
      <div className="detail-overlay" onClick={onClose} />
      <div className="detail-panel">
        {/* Header */}
        <div className="detail-panel__header">
          <span className="detail-panel__id">{task.id.slice(0, 8)}</span>
          <div className="detail-panel__actions">
            <button className="detail-btn detail-btn--danger" onClick={handleDelete} title="Delete task">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
              </svg>
            </button>
            <button className="detail-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="detail-tabs">
          {(['details', 'comments', 'activity'] as Tab[]).map((tab) => (
            <button
              key={tab}
              className={`detail-tab ${activeTab === tab ? 'detail-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'details' && 'Details'}
              {tab === 'comments' && `Comments${comments.length ? ` (${comments.length})` : ''}`}
              {tab === 'activity' && `Activity${activities.length ? ` (${activities.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="detail-panel__body">
          {/* ── Details Tab ── */}
          {activeTab === 'details' && (
            <>
              <input
                className="detail-title"
                value={title}
                onChange={(e) => handleChange(setTitle, e.target.value)}
                placeholder="Task title"
              />
              <textarea
                className="detail-desc"
                value={description}
                onChange={(e) => handleChange(setDescription, e.target.value)}
                placeholder="Add a description..."
                rows={4}
              />

              <div className="detail-properties">
                {/* Status */}
                <div className="detail-prop">
                  <span className="detail-prop__label">Status</span>
                  <div className="detail-prop__value">
                    {COLUMNS.map((col) => (
                      <button
                        key={col.id}
                        className={`status-btn ${status === col.id ? 'status-btn--active' : ''}`}
                        style={{ '--status-color': col.color } as React.CSSProperties}
                        onClick={() => handleChange(setStatus, col.id)}
                      >
                        <span className="status-btn__icon">{col.icon}</span>
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div className="detail-prop">
                  <span className="detail-prop__label">Priority</span>
                  <div className="detail-prop__value">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        className={`priority-btn ${priority === p.value ? 'priority-btn--active' : ''}`}
                        style={{ '--pri-color': p.color } as React.CSSProperties}
                        onClick={() => handleChange(setPriority, p.value)}
                      >
                        <span style={{ color: p.color }}>●</span> {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignee */}
                <div className="detail-prop">
                  <span className="detail-prop__label">Assignee</span>
                  <div className="detail-assignee-area">
                    {assignee ? (
                      <div className="detail-assignee-chip">
                        <span className="avatar-sm" style={{ background: assignee.color }}>
                          {assignee.avatar_letter}
                        </span>
                        <span>{assignee.name}</span>
                        <button className="detail-assignee-chip__remove" onClick={() => handleChange(setAssigneeId, null)}>×</button>
                      </div>
                    ) : (
                      <button className="detail-add-label" onClick={() => setShowAssigneePicker(!showAssigneePicker)}>
                        + Assign
                      </button>
                    )}
                    {showAssigneePicker && (
                      <div className="label-picker">
                        {members.length === 0 && (
                          <div className="label-picker__empty">No team members yet. Add them in the header.</div>
                        )}
                        {members.map((m) => (
                          <button
                            key={m.id}
                            className={`label-picker__item ${assigneeId === m.id ? 'label-picker__item--selected' : ''}`}
                            onClick={() => {
                              handleChange(setAssigneeId, m.id === assigneeId ? null : m.id);
                              setShowAssigneePicker(false);
                            }}
                          >
                            <span className="avatar-sm" style={{ background: m.color }}>{m.avatar_letter}</span>
                            {m.name}
                            {assigneeId === m.id && <span className="label-picker__check">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Due Date */}
                <div className="detail-prop">
                  <span className="detail-prop__label">Due Date</span>
                  <input
                    className="detail-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => handleChange(setDueDate, e.target.value)}
                  />
                </div>

                {/* Labels */}
                <div className="detail-prop">
                  <span className="detail-prop__label">Labels</span>
                  <div className="detail-labels">
                    {taskLabels.map((name) => {
                      const labelObj = labels.find((l) => l.name === name);
                      return (
                        <span key={name} className="detail-label-chip" style={{
                          background: `${labelObj?.color || '#555'}22`,
                          color: labelObj?.color || '#555',
                          borderColor: `${labelObj?.color || '#555'}44`,
                        }}>
                          {name}
                          <button className="detail-label-chip__remove" onClick={() => toggleLabel(name)}>×</button>
                        </span>
                      );
                    })}
                    <button className="detail-add-label" onClick={() => setShowLabelPicker(!showLabelPicker)}>
                      + Add label
                    </button>
                  </div>
                  {showLabelPicker && (
                    <div className="label-picker">
                      {labels.map((l) => (
                        <button
                          key={l.id}
                          className={`label-picker__item ${taskLabels.includes(l.name) ? 'label-picker__item--selected' : ''}`}
                          onClick={() => toggleLabel(l.name)}
                        >
                          <span className="label-picker__dot" style={{ background: l.color }} />
                          {l.name}
                          {taskLabels.includes(l.name) && <span className="label-picker__check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-meta">
                <span>Created {formatDate(task.created_at)}</span>
              </div>
            </>
          )}

          {/* ── Comments Tab ── */}
          {activeTab === 'comments' && (
            <div className="detail-comments">
              {comments.length === 0 && !commentsLoading && (
                <div className="detail-empty-tab">
                  <span className="detail-empty-tab__icon">💬</span>
                  <span>No comments yet</span>
                </div>
              )}
              <div className="comments-list">
                {comments.map((c) => (
                  <div key={c.id} className="comment">
                    <div className="comment__header">
                      <span className="avatar-sm" style={{ background: '#6366F1' }}>U</span>
                      <span className="comment__time">{timeAgo(c.created_at)}</span>
                    </div>
                    <div className="comment__body">{c.content}</div>
                  </div>
                ))}
              </div>
              <div className="comment-input">
                <textarea
                  ref={commentInputRef}
                  className="comment-input__field"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment();
                  }}
                />
                <button
                  className="btn btn--primary btn--sm"
                  disabled={!commentText.trim()}
                  onClick={handleAddComment}
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* ── Activity Tab ── */}
          {activeTab === 'activity' && (
            <div className="detail-activity">
              {activities.length === 0 && (
                <div className="detail-empty-tab">
                  <span className="detail-empty-tab__icon">📋</span>
                  <span>No activity yet</span>
                </div>
              )}
              <div className="activity-timeline">
                {activities.map((a) => (
                  <div key={a.id} className="activity-item">
                    <div className="activity-item__dot" />
                    <div className="activity-item__content">
                      <span className="activity-item__action">{a.action}</span>
                      {a.detail && <span className="activity-item__detail">{a.detail}</span>}
                      <span className="activity-item__time">{timeAgo(a.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — save button */}
        {hasChanges && activeTab === 'details' && (
          <div className="detail-panel__footer">
            <button className="btn btn--ghost" onClick={onClose}>Discard</button>
            <button className="btn btn--primary" onClick={handleSave}>Save Changes</button>
          </div>
        )}
      </div>
    </>
  );
}
