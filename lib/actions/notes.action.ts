"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient, createSupabaseClient } from "../supabase";

export type Note = {
  id: string;
  user_id: string;
  companion_id: string;
  session_id: string | null;
  content: string;
  created_at: string;
  updated_at: string | null;
};

// List notes for the current user and companion
export async function listNotesByCompanion(companionId: string) {
  const { userId } = await auth();
  if (!userId) return [] as Note[];

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("notes")
    .select("id,user_id,companion_id,session_id,content,created_at,updated_at")
    .eq("user_id", userId)
    .eq("companion_id", companionId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error (list notes):", error);
    return [] as Note[];
  }
  return (data as Note[]) || [];
}

// Add a note for the current user
export async function addNote(formData: FormData) {
  const { userId } = await auth();
  const supabase = createSupabaseAdminClient();

  if (!userId) {
    return { success: false, error: "Unauthorized - Please sign in" } as const;
  }

  const companionId = String(formData.get("companionId") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const pathToRevalidate = String(formData.get("path") || "/");
  const sessionId = formData.get("sessionId") ? String(formData.get("sessionId")) : null;

  if (!companionId) {
    return { success: false, error: "Missing companion id" } as const;
  }
  if (!content) {
    return { success: false, error: "Note content cannot be empty" } as const;
  }

  const { error } = await supabase.from("notes").insert({
    user_id: userId,
    companion_id: companionId,
    session_id: sessionId,
    content,
  });

  if (error) {
    console.error("Supabase error (add note):", error);
    return { success: false, error: error.message || "Failed to add note" } as const;
  }

  // Revalidate the page showing the notes
  revalidatePath(pathToRevalidate);
  return { success: true } as const;
}

// Optional: Delete a note (only the owner)
export async function deleteNote(formData: FormData) {
  const { userId } = await auth();
  const supabase = createSupabaseAdminClient();

  if (!userId) {
    return { success: false, error: "Unauthorized - Please sign in" } as const;
  }

  const noteId = String(formData.get("noteId") || "");
  const pathToRevalidate = String(formData.get("path") || "/");

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", userId);

  if (error) {
    console.error("Supabase error (delete note):", error);
    return { success: false, error: error.message || "Failed to delete note" } as const;
  }

  revalidatePath(pathToRevalidate);
  return { success: true } as const;
}
