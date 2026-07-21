import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Every query here fails gracefully (returns null rather than
 * throwing) so pages render an honest "not set up yet" state if
 * supabase/events_schema.sql hasn't been run — same convention used
 * everywhere else in this app.
 */

export type Event = {
  id: string;
  title: string;
  event_date: string;
  assignee_email: string | null;
  point_of_contact: string;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getEvents(): Promise<Event[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("event")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) return null;
    return data as Event[];
  } catch {
    return null;
  }
}

export async function getEventById(id: string): Promise<Event | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("event")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Event;
  } catch {
    return null;
  }
}

export async function createEvent(input: {
  title: string;
  eventDate: string;
  assigneeEmail: string | null;
  pointOfContact: string;
  notes: string;
  createdBy: string | null;
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("event")
      .insert({
        title: input.title,
        event_date: input.eventDate,
        assignee_email: input.assigneeEmail,
        point_of_contact: input.pointOfContact,
        notes: input.notes,
        created_by: input.createdBy,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "Failed to create event." };
    }
    return { id: data.id as string };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function updateEvent(
  id: string,
  input: {
    title: string;
    eventDate: string;
    assigneeEmail: string | null;
    pointOfContact: string;
    notes: string;
  },
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("event")
      .update({
        title: input.title,
        event_date: input.eventDate,
        assignee_email: input.assigneeEmail,
        point_of_contact: input.pointOfContact,
        notes: input.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function deleteEvent(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("event").delete().eq("id", id);
    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}
