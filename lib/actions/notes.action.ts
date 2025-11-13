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

// Add a note for the current user (use direct params instead of FormData for consistency)
export async function addNote({ companionId, content, path, sessionId }: { companionId: string; content: string; path: string; sessionId?: string | null; }) {
  const { userId } = await auth();
  const supabase = createSupabaseAdminClient();

  if (!userId) {
    return { success: false, error: "Unauthorized - Please sign in" } as const;
  }

  const companionIdTrimmed = String(companionId || "").trim();
  const contentTrimmed = String(content || "").trim();
  const pathToRevalidate = String(path || "/");
  const normalizedSessionId = sessionId ? String(sessionId) : null;

  if (!companionIdTrimmed) {
    return { success: false, error: "Missing companion id" } as const;
  }
  if (!contentTrimmed) {
    return { success: false, error: "Note content cannot be empty" } as const;
  }

  const { error } = await supabase.from("notes").insert({
    user_id: userId,
    companion_id: companionIdTrimmed,
    session_id: normalizedSessionId,
    content: contentTrimmed,
  });

  if (error) {
    console.error("Supabase error (add note):", error);
    return { success: false, error: error.message || "Failed to add note" } as const;
  }

  // Revalidate the page showing the notes
  revalidatePath(pathToRevalidate);
  return { success: true } as const;
}

// Optional: Delete a note (only the owner) - use direct params
export async function deleteNote({ noteId, path }: { noteId: string; path: string }) {
  const { userId } = await auth();
  const supabase = createSupabaseAdminClient();

  if (!userId) {
    return { success: false, error: "Unauthorized - Please sign in" } as const;
  }

  const id = String(noteId || "").trim();
  const pathToRevalidate = String(path || "/");

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Supabase error (delete note):", error);
    return { success: false, error: error.message || "Failed to delete note" } as const;
  }

  revalidatePath(pathToRevalidate);
  return { success: true } as const;
}


// Update a note (only the owner) - use direct params
export async function updateNote({ noteId, content, path }: { noteId: string; content: string; path: string }) {
  const { userId } = await auth();
  const supabase = createSupabaseAdminClient();

  if (!userId) {
    return { success: false, error: "Unauthorized - Please sign in" } as const;
  }

  const id = String(noteId || "").trim();
  const contentTrimmed = String(content || "").trim();
  const pathToRevalidate = String(path || "/");

  if (!id) {
    return { success: false, error: "Missing note id" } as const;
  }
  if (!contentTrimmed) {
    return { success: false, error: "Note content cannot be empty" } as const;
  }

  const { error } = await supabase
    .from("notes")
    .update({ content: contentTrimmed, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Supabase error (update note):", error);
    return { success: false, error: error.message || "Failed to update note" } as const;
  }

  revalidatePath(pathToRevalidate);
  return { success: true } as const;
}

// Bulk delete notes (only the owner's notes)
export async function deleteNotesBulk({ noteIds, path }: { noteIds: string[]; path: string }) {
  const { userId } = await auth();
  const supabase = createSupabaseAdminClient();

  if (!userId) {
    return { success: false, error: "Unauthorized - Please sign in" } as const;
  }

  const ids = Array.isArray(noteIds)
    ? noteIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
  const pathToRevalidate = String(path || "/");

  if (ids.length === 0) {
    return { success: false, error: "No notes selected" } as const;
  }

  const { error } = await supabase
    .from("notes")
    .delete()
    .in("id", ids)
    .eq("user_id", userId);

  if (error) {
    console.error("Supabase error (bulk delete notes):", error);
    return { success: false, error: error.message || "Failed to delete notes" } as const;
  }

  revalidatePath(pathToRevalidate);
  return { success: true } as const;
}
