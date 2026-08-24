"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { resolveOverrideToStore } from "@/lib/slideStore";

async function assertProfessor() {
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
  return supabase;
}

const initialState = { saved: false, error: null };

export async function saveSlideOverride(prevState, formData) {
  const weekId = Number(formData.get("week_id"));
  const slideIndex = Number(formData.get("slide_index"));
  const editedHtml = formData.get("content_html")?.toString() ?? "";

  let supabase;
  try {
    supabase = await assertProfessor();
  } catch (e) {
    return { ...initialState, error: e.message };
  }

  if (!editedHtml.trim()) {
    return { ...initialState, error: "내용이 비어 있습니다." };
  }

  let finalHtml;
  try {
    finalHtml = resolveOverrideToStore(weekId, slideIndex, editedHtml);
  } catch (e) {
    return { ...initialState, error: e.message };
  }

  const { error } = await supabase.from("slide_overrides").upsert(
    {
      week_id: weekId,
      slide_index: slideIndex,
      content_html: finalHtml,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "week_id,slide_index" }
  );

  if (error) {
    return { ...initialState, error: error.message };
  }

  revalidatePath(`/admin/slides/${weekId}`);
  revalidatePath(`/admin/slides/${weekId}/${slideIndex}`);
  return { saved: true, error: null };
}

export async function resetSlideOverride(prevState, formData) {
  const weekId = Number(formData.get("week_id"));
  const slideIndex = Number(formData.get("slide_index"));

  let supabase;
  try {
    supabase = await assertProfessor();
  } catch (e) {
    return { ...initialState, error: e.message };
  }

  const { error } = await supabase
    .from("slide_overrides")
    .delete()
    .eq("week_id", weekId)
    .eq("slide_index", slideIndex);

  if (error) {
    return { ...initialState, error: error.message };
  }

  revalidatePath(`/admin/slides/${weekId}`);
  revalidatePath(`/admin/slides/${weekId}/${slideIndex}`);
  return { saved: true, error: null };
}
