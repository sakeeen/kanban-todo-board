import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ActivityEntry } from '../lib/types';

export function useActivity(userId: string | undefined) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActivity = useCallback(async (taskId: string) => {
    if (!userId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Fetch activity error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const logActivity = async (taskId: string, action: string, detail?: string) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .insert({ task_id: taskId, user_id: userId, action, detail: detail || null })
        .select()
        .single();
      if (error) throw error;
      setActivities((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Log activity error:', err);
    }
  };

  const clearActivity = () => setActivities([]);

  return { activities, loading, fetchActivity, logActivity, clearActivity };
}
