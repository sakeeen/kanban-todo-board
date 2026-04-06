import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Comment } from '../lib/types';

export function useComments(userId: string | undefined) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async (taskId: string) => {
    if (!userId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Fetch comments error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const addComment = async (taskId: string, content: string) => {
    if (!userId || !content.trim()) return;
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ task_id: taskId, user_id: userId, content: content.trim() })
        .select()
        .single();
      if (error) throw error;
      setComments((prev) => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  const clearComments = () => setComments([]);

  return { comments, loading, fetchComments, addComment, clearComments };
}
