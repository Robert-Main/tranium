"use server";

import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdminClient, createSupabaseClient } from "../supabase";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

export async function createCompanion(formData: CreateCompanion) {
    try {
        const { userId: author } = await auth();
        const supabase = createSupabaseAdminClient();

        if (!author) {
            return {
                success: false,
                error: "Unauthorized - Please sign in",
            };
        }

        const { data, error } = await supabase
            .from("companions")
            .insert({
                ...formData,
                author,
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase error:", error);
            return {
                success: false,
                error: error.message || "Failed to create companion",
            };
        }

        console.log("Created companion:", data);
        return {
            success: true,
            data,
        };
    } catch (error) {
        console.error("Unexpected error:", error);
        return {
            success: false,
            error: "An unexpected error occurred",
        };
    }
}

export const getAllCompanions = async ({ limit = 10, page = 1, subject, topic }: GetAllCompanions) => {
    const supabase = createSupabaseClient();
    const { userId } = await auth();

    let query = supabase.from("companions").select("*");

    // Apply filters
    if (subject && topic) {
        query = query.ilike("subject", `%${subject}%`).or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
    } else if (subject) {
        query = query.ilike("subject", `%${subject}%`);
    } else if (topic) {
        query = query.or(`topic.ilike.%${topic}%,name.ilike.%${topic}%`);
    }

    // Apply pagination
    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: companions, error } = await query;

    if (error) {
        console.error("Supabase error:", error);
        return {
            success: false,
            error: error.message || "Failed to fetch companions",
        };
    }

    if (userId && companions && companions.length > 0) {
        const companionIds = companions.map(({ id }) => id);

        const { data: bookmarks } = await supabase
            .from("bookmarks")
            .select("companion_id")
            .eq("user_id", userId)
            .in("companion_id", companionIds);

        const bookmarkedIds = new Set(bookmarks?.map(({ companion_id }) => companion_id) || []);

        // Add bookmarked property to each companion
        companions.forEach((companion) => {
            companion.bookmarked = bookmarkedIds.has(companion.id);
        });
    } else {
        // If no user is authenticated, set all companions as not bookmarked
        companions?.forEach((companion) => {
            companion.bookmarked = false;
        });
    }

    return {
        success: true,
        data: companions,
    };
};

export async function getCompanionById(id: string) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from("companions").select("*").eq("id", id).single();
    if (error) {
        return {
            success: false,
            error: error.message || "Failed to fetch companion",
        };
    }
    return {
        success: true,
        data,
    };
}

export async function updateCompanion(id: string, updates: Partial<CreateCompanion>) {
    const { userId } = await auth();
    const supabase = createSupabaseAdminClient();
    if (!userId) {
        return {
            success: false,
            error: "Unauthorized - Please sign in",
        };
    }
    const { data, error } = await supabase.from("companions").update(updates).eq("id", id).single();
    if (error) {
        return {
            success: false,
            error: error.message || "Failed to update companion",
        };
    }
    return {
        success: true,
        data,
    };
}

export async function deleteCompanion(id: string) {
    const { userId } = await auth();
    const supabase = createSupabaseAdminClient();
    if (!userId) {
        return {
            success: false,
            error: "Unauthorized - Please sign in",
        };
    }
    const { data, error } = await supabase.from("companions").delete().eq("id", id).single();
    if (error) {
        return {
            success: false,
            error: error.message || "Failed to delete companion",
        };
    }
    return {
        success: true,
        data,
    }
}

//add delete session history and delete companion

export const addSessionHistory = async (companionId: string) => {
    const { userId } = await auth();
    const supabase = createSupabaseAdminClient();

    if (!userId) {
        return {
            success: false,
            error: "Unauthorized - Please sign in",
        };
    }

    const { data, error } = await supabase.from("session_history").insert({
        companion_id: companionId,
        user_id: userId,
    });

    if (error) {
        console.error("Supabase error:", error);
        return {
            success: false,
            error: error.message || "Failed to add session history",
        };
    }
    return {
        success: true,
        data,
    };
};

export const getSessionHistories = async (limit = 10) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from("session_history")
        .select(`companions:companion_id (*)`)
        .order("created_at", { ascending: false })
        .limit(limit);
    if (error) throw new Error(error.message || "Failed to fetch session histories");

    const sessionHistory = data.map((companions) => companions);
    return sessionHistory;
};
export const getUserSession = async (userId: string, limit = 10) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
        .from("session_history")
        .select(`companions:companion_id (*)`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
    if (error) throw new Error(error.message || "Failed to fetch user's session histories");

    const sessionHistory = data.map((companions) => companions);
    return sessionHistory;
};
export const getUserCompanions = async (userId: string) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from("companions").select().eq("author", userId);
    if (error) throw new Error(error.message || "Failed to fetch user's companions");

    return data;
};

export const deleteSessionHistory = async (sessionId: string) => {
    const { userId } = await auth();
    const supabase = createSupabaseAdminClient();
    if (!userId) {
        return {
            success: false,
            error: "Unauthorized - Please sign in",
        };
    }
    const { data, error } = await supabase.from("session_history").delete().eq("id", sessionId).single();
    if (error) {
        return {
            success: false,
            error: error.message || "Failed to delete session history",
        };
    }
    return {
        success: true,
        data,
    };
}

export const newCompanionPermission = async () => {
    const { userId, has } = await auth();
    const supabase = createSupabaseAdminClient();

    let limit = 0;

    if (has({ plan: "pro" })) {
        return true;
    } else if (has({ feature: "3_companion_limit" })) {
        limit = 3;
    } else if (has({ feature: "10_companion_limit" })) {
        limit = 10;
    }

    const { data, error } = await supabase.from("companions").select("id", { count: "exact" }).eq("author", userId);
    if (error) throw new Error(error.message || "Failed to fetch user's companions");

    const companionCount = data?.length;

    if (companionCount >= limit) {
        return false;
    } else {
        return true;
    }
};

//bookamarks
export const addUserBookmarks = async (companionId: string, path: string) => {
    const { userId } = await auth();
    const supabase = createSupabaseAdminClient();

    if (!userId) {
        return {
            success: false,
            error: "Unauthorized - Please sign in",
        };
    }

    // Check if bookmark already exists
    const { data: existing } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("companion_id", companionId)
        .eq("user_id", userId)
        .single();

    if (existing) {
        return {
            success: true,
            data: existing,
        };
    }

    const { data, error } = await supabase.from("bookmarks").insert({
        companion_id: companionId,
        user_id: userId,
    });

    if (error) {
        console.error("Supabase error:", error);
        return {
            success: false,
            error: error.message || "Failed to add bookmark",
        };
    }

    revalidatePath(path);

    return {
        success: true,
        data,
    };
};

export const removeUserBookmarks = async (companionId: string, path: string) => {
    const { userId } = await auth();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("companion_id", companionId)
        .eq("user_id", userId);
    revalidatePath(path);
    if (error) {
        console.error("Supabase error:", error);
        return {
            success: false,
            error: error.message || "Failed to remove bookmark",
        };
    }
    return {
        success: true,
        data,
    };
};

export const getBookmarkedCompanions = async (userId: string) => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
        .from("bookmarks")
        .select(`companions:companion_id (*)`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    if (error) throw new Error(error.message || "Failed to fetch bookmarked companions");
    const bookmarkedCompanions = data.map((row) => ({
        ...row.companions,
        bookmarked: true,
    }));
    return bookmarkedCompanions;
};
