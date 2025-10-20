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
