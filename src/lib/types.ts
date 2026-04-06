export type Status = 'todo' | 'in_progress' | 'in_review' | 'done';
export type Priority = 'low' | 'normal' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_date: string | null;
  user_id: string;
  created_at: string;
  labels: string[];
  assignee_id: string | null;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

export interface TeamMember {
  id: string;
  name: string;
  color: string;
  avatar_letter: string;
  user_id: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface Column {
  id: Status;
  label: string;
  icon: string;
  color: string;
}
