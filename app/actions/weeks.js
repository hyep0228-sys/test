"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleWeekOpen(weekId, nextValue) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .maybeSingle();

  if (profile?.role !== "professor") {
    throw new Error("권한이 없습니다.");
  }

  const { error } = await supabase
    .from("weeks")
    .update({ is_open: nextValue })
    .eq("id", weekId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/", "layout");
}
