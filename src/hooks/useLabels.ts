import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Label } from '../lib/types';

// Default labels to seed on first use
const DEFAULT_LABELS = [
  { name: 'Bug', color: '#F87171' },
  { name: 'Feature', color: '#6366F1' },
  { name: 'Design', color: '#C084FC' },
  { name: 'Backend', color: '#FBBF24' },
  { name: 'Frontend', color: '#38BDF8' },
  { name: 'Urgent', color: '#FB923C' },
];

export function useLabels(userId: string | undefined) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLabels = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;

      // Seed defaults if empty
      if (!data || data.length === 0) {
        const inserts = DEFAULT_LABELS.map((l) => ({ ...l, user_id: userId }));
        const { data: seeded, error: seedErr } = await supabase
          .from('labels')
          .insert(inserts)
          .select();
        if (!seedErr && seeded) {
          setLabels(seeded);
        }
      } else {
        setLabels(data);
      }
    } catch (err) {
      console.error('Labels error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const createLabel = async (name: string, color: string) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('labels')
        .insert({ name, color, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      setLabels((prev) => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Create label error:', err);
    }
  };

  const deleteLabel = async (labelId: string) => {
    try {
      setLabels((prev) => prev.filter((l) => l.id !== labelId));
      const { error } = await supabase.from('labels').delete().eq('id', labelId);
      if (error) {
        fetchLabels();
        throw error;
      }
    } catch (err) {
      console.error('Delete label error:', err);
    }
  };

  return { labels, loading, createLabel, deleteLabel, refetch: fetchLabels };
}
