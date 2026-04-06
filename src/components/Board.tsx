import { useState, useCallback } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import type { Task, Status, Priority, Column, Label, TeamMember, Comment, ActivityEntry } from '../lib/types';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import TaskDetail from './TaskDetail';
import BoardStats from './BoardStats';
import './Board.css';

const COLUMNS: Column[] = [
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

interface BoardProps {
  tasks: Task[];
  labels: Label[];
  members: TeamMember[];
  comments: Comment[];
  activities: ActivityEntry[];
  commentsLoading: boolean;
  loading: boolean;
  error: string | null;
  onCreateTask: (task: {
    title: string;
    description?: string;
    status: Status;
    priority: Priority;
    due_date?: string | null;
    labels?: string[];
  }) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onUpdateStatus: (taskId: string, newStatus: Status) => void;
  onDeleteTask: (taskId: string) => void;
  onAddMember: (name: string) => void;
  onRemoveMember: (id: string) => void;
  onAddComment: (taskId: string, content: string) => void;
  onTaskOpen: (taskId: string) => void;
  onLogActivity: (taskId: string, action: string, detail?: string) => void;
}

export default function Board({
  tasks, labels, members, comments, activities, commentsLoading,
  loading, error,
  onCreateTask, onUpdateTask, onUpdateStatus, onDeleteTask,
  onAddMember, onRemoveMember, onAddComment, onTaskOpen, onLogActivity,
}: BoardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<Status>('todo');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null);
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const openModal = useCallback((status: Status) => {
    setModalStatus(status);
    setModalOpen(true);
  }, []);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const newStatus = result.destination.droppableId as Status;
      const taskId = result.draggableId;
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== newStatus) {
        onUpdateStatus(taskId, newStatus);
        const statusLabels: Record<string, string> = {
          todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done',
        };
        onLogActivity(taskId, `Moved from ${statusLabels[task.status]} → ${statusLabels[newStatus]}`);
      }
    },
    [tasks, onUpdateStatus, onLogActivity]
  );

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const oldTask = tasks.find((t) => t.id === taskId);
    onUpdateTask(taskId, updates);

    // Log relevant changes
    if (oldTask) {
      if (updates.status && updates.status !== oldTask.status) {
        const sl: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };
        onLogActivity(taskId, `Status changed from ${sl[oldTask.status]} → ${sl[updates.status]}`);
      }
      if (updates.priority && updates.priority !== oldTask.priority) {
        onLogActivity(taskId, `Priority changed to ${updates.priority}`);
      }
      if (updates.assignee_id !== undefined && updates.assignee_id !== oldTask.assignee_id) {
        const m = members.find((x) => x.id === updates.assignee_id);
        onLogActivity(taskId, m ? `Assigned to ${m.name}` : 'Unassigned');
      }
      if (updates.title && updates.title !== oldTask.title) {
        onLogActivity(taskId, 'Title updated');
      }
    }
  }, [tasks, onUpdateTask, onLogActivity, members]);

  const currentSelectedTask = selectedTask
    ? tasks.find((t) => t.id === selectedTask.id) || null
    : null;

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (labelFilter && !(t.labels || []).includes(labelFilter)) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter((t) => {
      if (!t.due_date) return false;
      return new Date(t.due_date).getTime() < Date.now() && t.status !== 'done';
    }).length,
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    onAddMember(newMemberName.trim());
    setNewMemberName('');
  };

  return (
    <div className="board-container">
      {/* ── Header ── */}
      <header className="board-header">
        <div className="board-header__left">
          <div className="board-logo">
            <span className="board-logo__icon">N</span>
          </div>
          <h1 className="board-header__title">Task Board</h1>
          <div className="board-header__stats">
            <span><strong>{stats.total}</strong> tasks</span>
            <span><strong>{stats.done}</strong> done</span>
            {stats.overdue > 0 && (
              <span className="board-header__stat--danger">
                <strong>{stats.overdue}</strong> overdue
              </span>
            )}
          </div>
        </div>

        <div className="board-header__right">
          {/* Team avatars */}
          <div className="team-avatars" onClick={() => setShowTeamPanel(!showTeamPanel)}>
            {members.slice(0, 4).map((m) => (
              <span key={m.id} className="team-avatar" style={{ background: m.color }} title={m.name}>
                {m.avatar_letter}
              </span>
            ))}
            {members.length > 4 && <span className="team-avatar team-avatar--more">+{members.length - 4}</span>}
            {members.length === 0 && <span className="team-add-hint">+ Team</span>}
          </div>

          <div className="search-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              className="search-box__input"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className="search-box__clear" onClick={() => setSearch('')}>×</button>}
          </div>
          <button className="btn btn--ghost btn--icon" onClick={() => setStatsOpen(true)} title="Board stats">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
          </button>
          <button className="btn btn--primary" onClick={() => openModal('todo')}>
            <span>+</span> New Task
          </button>
        </div>
      </header>

      {/* ── Team Panel (dropdown) ── */}
      {showTeamPanel && (
        <div className="team-panel">
          <div className="team-panel__header">
            <span className="team-panel__title">Team Members</span>
            <button className="detail-btn" onClick={() => setShowTeamPanel(false)}>×</button>
          </div>
          <div className="team-panel__list">
            {members.map((m) => (
              <div key={m.id} className="team-panel__member">
                <span className="team-avatar" style={{ background: m.color }}>{m.avatar_letter}</span>
                <span className="team-panel__name">{m.name}</span>
                <button className="team-panel__remove" onClick={() => onRemoveMember(m.id)}>×</button>
              </div>
            ))}
          </div>
          <div className="team-panel__add">
            <input
              className="team-panel__input"
              placeholder="Add member..."
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddMember(); }}
            />
            <button className="btn btn--primary btn--sm" onClick={handleAddMember} disabled={!newMemberName.trim()}>Add</button>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="board-filters">
        <button
          className={`filter-pill ${!priorityFilter && !labelFilter ? 'filter-pill--active' : ''}`}
          onClick={() => { setPriorityFilter(null); setLabelFilter(null); }}
        >All</button>
        {PRIORITIES.map((p) => (
          <button
            key={p.value}
            className={`filter-pill ${priorityFilter === p.value ? 'filter-pill--active' : ''}`}
            onClick={() => { setPriorityFilter(priorityFilter === p.value ? null : p.value); setLabelFilter(null); }}
          >
            <span style={{ color: p.color }}>●</span> {p.label}
          </button>
        ))}
        <span className="filter-divider" />
        {labels.map((l) => (
          <button
            key={l.id}
            className={`filter-pill ${labelFilter === l.name ? 'filter-pill--active' : ''}`}
            onClick={() => { setLabelFilter(labelFilter === l.name ? null : l.name); setPriorityFilter(null); }}
          >
            <span style={{ color: l.color }}>●</span> {l.name}
          </button>
        ))}
      </div>

      {error && <div className="board-error"><span>⚠</span> {error}</div>}

      {loading ? (
        <div className="board-loading">
          <div className="board-loading__spinner" />
          <span>Loading your tasks...</span>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="board">
            {COLUMNS.map((col) => {
              const columnTasks = filtered.filter((t) => t.status === col.id);
              return (
                <div className="column" key={col.id}>
                  <div className="column__header">
                    <div className="column__title-group">
                      <span className="column__icon" style={{ color: col.color }}>{col.icon}</span>
                      <span className="column__title">{col.label}</span>
                      <span className="column__count">{columnTasks.length}</span>
                    </div>
                    <button className="column__add" onClick={() => openModal(col.id)} title="Add task">+</button>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        className={`column__cards ${snapshot.isDraggingOver ? 'column__cards--drag-over' : ''}`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {columnTasks.length === 0 && !snapshot.isDraggingOver ? (
                          <div className="column__empty">
                            <div className="column__empty-icon">✦</div>
                            <span>No tasks</span>
                          </div>
                        ) : (
                          columnTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{ ...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.85 : 1 }}
                                >
                                  <TaskCard task={task} labels={labels} members={members} onDelete={onDeleteTask} onClick={setSelectedTask} />
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      <CreateTaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreate={onCreateTask} defaultStatus={modalStatus} labels={labels} />

      <TaskDetail
        task={currentSelectedTask}
        labels={labels}
        members={members}
        comments={comments}
        activities={activities}
        commentsLoading={commentsLoading}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={(id) => { onDeleteTask(id); setSelectedTask(null); }}
        onAddComment={onAddComment}
        onTaskOpen={onTaskOpen}
      />

      <BoardStats tasks={tasks} isOpen={statsOpen} onClose={() => setStatsOpen(false)} />
    </div>
  );
}
