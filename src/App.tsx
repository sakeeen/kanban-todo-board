import { useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { useLabels } from './hooks/useLabels';
import { useTeamMembers } from './hooks/useTeamMembers';
import { useComments } from './hooks/useComments';
import { useActivity } from './hooks/useActivity';
import Board from './components/Board';
import './index.css';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const {
    tasks, loading: tasksLoading, error,
    createTask, updateTaskStatus, updateTask, deleteTask,
  } = useTasks(user?.id);
  const { labels } = useLabels(user?.id);
  const { members, addMember, removeMember } = useTeamMembers(user?.id);
  const { comments, loading: commentsLoading, fetchComments, addComment } = useComments(user?.id);
  const { activities, fetchActivity, logActivity } = useActivity(user?.id);

  const handleTaskOpen = useCallback((taskId: string) => {
    fetchComments(taskId);
    fetchActivity(taskId);
  }, [fetchComments, fetchActivity]);

  const handleUpdateStatus = useCallback((taskId: string, newStatus: any) => {
    updateTaskStatus(taskId, newStatus);
  }, [updateTaskStatus]);

  if (authLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px',
        background: 'var(--bg)', color: 'var(--text-tertiary)',
        fontFamily: 'var(--font-body)',
      }}>
        <div style={{
          width: 36, height: 36,
          border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
        }} />
        <span style={{ fontSize: 14 }}>Setting up your workspace...</span>
      </div>
    );
  }

  return (
    <Board
      tasks={tasks}
      labels={labels}
      members={members}
      comments={comments}
      activities={activities}
      commentsLoading={commentsLoading}
      loading={tasksLoading}
      error={error}
      onCreateTask={createTask}
      onUpdateTask={updateTask}
      onUpdateStatus={handleUpdateStatus}
      onDeleteTask={deleteTask}
      onAddMember={addMember}
      onRemoveMember={removeMember}
      onAddComment={addComment}
      onTaskOpen={handleTaskOpen}
      onLogActivity={logActivity}
    />
  );
}
