"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createEvent, deleteEvent, updateEvent } from "@/lib/events/queries";

export async function createEventAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "").trim();

  if (!title || !eventDate) {
    throw new Error("Title and date are required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await createEvent({
    title,
    eventDate,
    assigneeEmail: String(formData.get("assigneeEmail") ?? "").trim() || null,
    pointOfContact: String(formData.get("pointOfContact") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    createdBy: user?.email ?? null,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/events");
  redirect(`/events/${result.id}`);
}

export async function updateEventAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "").trim();

  if (!id || !title || !eventDate) {
    throw new Error("Title and date are required.");
  }

  const result = await updateEvent(id, {
    title,
    eventDate,
    assigneeEmail: String(formData.get("assigneeEmail") ?? "").trim() || null,
    pointOfContact: String(formData.get("pointOfContact") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
  redirect(`/events/${id}`);
}

export async function deleteEventAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing event id.");

  const result = await deleteEvent(id);
  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/events");
  redirect("/events");
}
