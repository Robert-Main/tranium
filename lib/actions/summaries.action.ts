"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "../supabase";

export type Summary = {
    id: string;
    user_id: string;
    companion_id: string;
    session_id: string | null;
    title: string | null;
    points: string[];
    created_at: string;
    updated_at: string | null;
};

export async function listSummariesByCompanion(companionId: string) {
    const { userId } = await auth();
    if (!userId) return [] as Summary[];

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("summaries")
        .select("id,user_id,companion_id,session_id,title,points,created_at,updated_at")
        .eq("user_id", userId)
        .eq("companion_id", companionId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Supabase error (list summaries):", error);
        return [] as Summary[];
    }

    // points comes back as JSON; ensure it's an array of strings
    const normalized = (data || []).map((row: any) => ({
        ...row,
        points: Array.isArray(row.points) ? row.points : [],
    })) as Summary[];
    return normalized;
}

// Add a summary for the current user
export async function addSummary({
    companionId,
    points,
    path,
    sessionId,
    title,
}: {
    companionId: string;
    points: string[];
    path: string;
    sessionId?: string | null;
    title?: string | null;
}) {
    const { userId } = await auth();
    const supabase = createSupabaseAdminClient();

    if (!userId) {
        return { success: false, error: "Unauthorized - Please sign in" } as const;
    }

    const companionIdTrimmed = String(companionId || "").trim();
    const pathToRevalidate = String(path || "/");
    const normalizedSessionId = sessionId ? String(sessionId) : null;
    const pts = Array.isArray(points) ? points.filter((p) => typeof p === "string" && p.trim().length > 0) : [];
    const ttl = title ? String(title).trim() : null;

    if (!companionIdTrimmed) {
        return { success: false, error: "Missing companion id" } as const;
    }
    if (pts.length === 0) {
        return { success: false, error: "No summary points to save" } as const;
    }

    const { error } = await supabase.from("summaries").insert({
        user_id: userId,
        companion_id: companionIdTrimmed,
        session_id: normalizedSessionId,
        title: ttl,
        points: pts,
    });

    if (error) {
        console.error("Supabase error (add summary):", error);
        return { success: false, error: error.message || "Failed to add summary" } as const;
    }

    revalidatePath(pathToRevalidate);
    return { success: true } as const;
}

export async function updateSummary({
    summaryId,
    title,
    points,
    path,
}: {
    summaryId: string;
    title?: string | null;
    points: string[];
    path: string;
}) {
    const { userId } = await auth();
    const supabase = createSupabaseAdminClient();

    if (!userId) {
        return { success: false, error: "Unauthorized - Please sign in" } as const;
    }

    const id = String(summaryId || "").trim();
    const pathToRevalidate = String(path || "/");
    const ttl = typeof title === "string" ? title.trim() : null;
    const pts = Array.isArray(points)
        ? points.map((p) => (typeof p === "string" ? p.trim() : "")).filter((p) => p.length > 0)
        : [];

    if (!id) {
        return { success: false, error: "Missing summary id" } as const;
    }
    if (pts.length === 0) {
        return { success: false, error: "No summary points to save" } as const;
    }

    const { error } = await supabase
        .from("summaries")
        .update({ title: ttl, points: pts })
        .eq("id", id)
        .eq("user_id", userId);

    if (error) {
        console.error("Supabase error (update summary):", error);
        return { success: false, error: error.message || "Failed to update summary" } as const;
    }

    revalidatePath(pathToRevalidate);
    return { success: true } as const;
}

export async function deleteSummary({ summaryId, path }: { summaryId: string; path: string }) {
    const { userId } = await auth();
    const supabase = createSupabaseAdminClient();

    if (!userId) {
        return { success: false, error: "Unauthorized - Please sign in" } as const;
    }

    const id = String(summaryId || "").trim();
    const pathToRevalidate = String(path || "/");

    const { error } = await supabase.from("summaries").delete().eq("id", id).eq("user_id", userId);

    if (error) {
        console.error("Supabase error (delete summary):", error);
        return { success: false, error: error.message || "Failed to delete summary" } as const;
    }

    revalidatePath(pathToRevalidate);
    return { success: true } as const;
}

// Bulk delete summaries
export async function deleteSummariesBulk({ summaryIds, path }: { summaryIds: string[]; path: string }) {
    const { userId } = await auth();
    const supabase = createSupabaseAdminClient();

    if (!userId) {
        return { success: false, error: "Unauthorized - Please sign in" } as const;
    }

    const ids = Array.isArray(summaryIds) ? summaryIds.map((id) => String(id || "").trim()).filter(Boolean) : [];
    const pathToRevalidate = String(path || "/");

    if (ids.length === 0) {
        return { success: false, error: "No summaries selected" } as const;
    }

    const { error } = await supabase.from("summaries").delete().in("id", ids).eq("user_id", userId);

    if (error) {
        console.error("Supabase error (bulk delete summaries):", error);
        return { success: false, error: error.message || "Failed to delete summaries" } as const;
    }

    revalidatePath(pathToRevalidate);
    return { success: true } as const;
}
