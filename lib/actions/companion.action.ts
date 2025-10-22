"use server";

import { auth } from "@clerk/nextjs/server";
import {createSupabaseAdminClient, createSupabaseClient} from "../supabase";

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

    // Execute the built query
    const { data: companions, error } = await query;

    if (error) {
        console.error("Supabase error:", error);
        return {
            success: false,
            error: error.message || "Failed to fetch companions",
        };
    }
    return {
        success: true,
        data: companions,
    };
};

export async function getCompanionById(id: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("companions")
    .select("*")
    .eq("id", id)
    .single();
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