import { supabase } from "@/src/lib/supabase";
import { ClassReminder } from "@/src/types";

export async function getClassReminders(classId: string) {
  const { data, error } = await supabase
    .from('class_reminders')
    .select('*')
    .eq('class_id', classId)
    .order('day_of_week', { ascending: true })
    .order('hour', { ascending: true })
    .order('minute', { ascending: true });

  if (error) throw error;

  return (data || []).map(r => ({
    id: r.id,
    classId: r.class_id,
    userId: r.user_id,
    dayOfWeek: r.day_of_week,
    hour: r.hour,
    minute: r.minute,
    isActive: r.is_active,
    createdAt: r.created_at
  })) as ClassReminder[];
}

export async function createClassReminder(reminder: Omit<ClassReminder, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('class_reminders')
    .insert([{
      class_id: reminder.classId,
      user_id: reminder.userId,
      day_of_week: reminder.dayOfWeek,
      hour: reminder.hour,
      minute: reminder.minute,
      is_active: reminder.isActive
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClassReminder(id: string, reminder: Partial<Omit<ClassReminder, 'id' | 'createdAt' | 'classId' | 'userId'>>) {
  const updateData: any = {};
  if (reminder.dayOfWeek !== undefined) updateData.day_of_week = reminder.dayOfWeek;
  if (reminder.hour !== undefined) updateData.hour = reminder.hour;
  if (reminder.minute !== undefined) updateData.minute = reminder.minute;
  if (reminder.isActive !== undefined) updateData.is_active = reminder.isActive;

  const { data, error } = await supabase
    .from('class_reminders')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClassReminder(id: string) {
  const { error } = await supabase
    .from('class_reminders')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
