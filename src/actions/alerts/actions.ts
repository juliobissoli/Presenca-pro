import { supabase } from "@/src/lib/supabase";

export interface ReminderSchedule {
  id?: string;
  class_id: string;
  user_id: string;
  day_of_week: number;
  hour: number;
  minute: number;
  is_active: boolean;
}

export async function getReminders(classId: string): Promise<ReminderSchedule[]> {
  const { data, error } = await supabase
    .from("class_reminders")
    .select("*")
    .eq("class_id", classId)
    .order("day_of_week", { ascending: true })
    .order("hour", { ascending: true })
    .order("minute", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function saveReminder(reminder: ReminderSchedule): Promise<ReminderSchedule> {
  const { data, error } = await supabase
    .from("class_reminders")
    .upsert(reminder)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReminder(id: string): Promise<void> {
  const { error } = await supabase
    .from("class_reminders")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function sendTelegramAlert(className: string, chatId: string = "216960152"): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not configured");
    return false;
  }

  const text = encodeURIComponent(`Não se esqueça de marcar a presença da turma ${className}`);
  const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${text}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("Error sending telegram alert:", error);
    return false;
  }
}
