import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TeamMember } from '../lib/types';

const MEMBER_COLORS = ['#6366F1', '#F87171', '#34D399', '#FBBF24', '#38BDF8', '#C084FC', '#FB923C', '#F472B6'];

export function useTeamMembers(userId: string | undefined) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', userId)
        .order('name');
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Team members error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = async (name: string) => {
    if (!userId || !name.trim()) return;
    const color = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
    const avatar_letter = name.trim()[0].toUpperCase();
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({ name: name.trim(), color, avatar_letter, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      setMembers((prev) => [...prev, data]);
      return data;
    } catch (err) {
      console.error('Add member error:', err);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      const { error } = await supabase.from('team_members').delete().eq('id', memberId);
      if (error) { fetchMembers(); throw error; }
    } catch (err) {
      console.error('Remove member error:', err);
    }
  };

  return { members, loading, addMember, removeMember, refetch: fetchMembers };
}
