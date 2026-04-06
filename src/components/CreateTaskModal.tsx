import { useState, useEffect, useRef } from 'react';
import type { Status, Priority, Label } from '../lib/types';
import './CreateTaskModal.css';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: {
    title: string;
    description?: string;
    status: Status;
    priority: Priority;
    due_date?: string | null;
    labels?: string[];
  }) => void;
  defaultStatus: Status;
  labels: Label[];
}

const COLUMNS: { id: Status; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'In Review' },
  { id: 'done', label: 'Done' },
];

export default function CreateTaskModal({
  isOpen,
  onClose,
  onCreate,
  defaultStatus,
  labels,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<Status>(defaultStatus);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setPriority('normal');
      setDueDate('');
      setStatus(defaultStatus);
      setSelectedLabels([]);
      setTimeout(() => titleRef.current?.focus(), 80);
    }
  }, [isOpen, defaultStatus]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreate({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      due_date: dueDate || null,
      labels: selectedLabels,
    });
    onClose();
  };

  const toggleLabel = (name: string) => {
    setSelectedLabels((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  return (
    <div className="modal-overlay" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">New Task</h2>
          <button className="modal__close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal__body">
          <div className="field">
            <label className="field__label">Title</label>
            <input
              ref={titleRef}
              className="field__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) handleSubmit();
              }}
            />
          </div>

          <div className="field">
            <label className="field__label">Description</label>
            <textarea
              className="field__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="field__label">Priority</label>
              <select
                className="field__select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="field">
              <label className="field__label">Status</label>
              <select
                className="field__select"
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="field__label">Due Date</label>
            <input
              className="field__input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {labels.length > 0 && (
            <div className="field">
              <label className="field__label">Labels</label>
              <div className="modal-labels">
                {labels.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={`modal-label-btn ${selectedLabels.includes(l.name) ? 'modal-label-btn--active' : ''}`}
                    style={{
                      '--label-color': l.color,
                    } as React.CSSProperties}
                    onClick={() => toggleLabel(l.name)}
                  >
                    <span className="modal-label-btn__dot" style={{ background: l.color }} />
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn--primary"
            disabled={!title.trim()}
            onClick={handleSubmit}
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
}
