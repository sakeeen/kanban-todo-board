import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, Status, Priority } from '../lib/types';

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTasks(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Fetch tasks error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create task
  const createTask = async (task: {
    title: string;
    description?: string;
    status: Status;
    priority: Priority;
    due_date?: string | null;
  }) => {
    if (!userId) return;
    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({
          ...task,
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setTasks((prev) => [data, ...prev]);
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Create task error:', err);
    }
  };

  // Update task status (for drag and drop)
  const updateTaskStatus = async (taskId: string, newStatus: Status) => {
    try {
      setError(null);
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (updateError) {
        // Revert on error
        fetchTasks();
        throw updateError;
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Update task error:', err);
    }
  };

  // Update full task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) throw updateError;
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)));
      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('Update task error:', err);
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      setError(null);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (deleteError) {
        fetchTasks();
        throw deleteError;
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Delete task error:', err);
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTaskStatus,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
