import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Replaces all lecture material pages for a given week.
// Body: { week_id: number (1-15), images: string[] } — ordered image URLs.
export async function POST(request) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.LECTURE_MATERIALS_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const weekId = Number(body.week_id);
  const images = body.images;

  if (!Number.isInteger(weekId) || weekId < 1 || weekId > 15) {
    return NextResponse.json(
      { error: "week_id must be an integer between 1 and 15" },
      { status: 400 }
    );
  }
  if (
    !Array.isArray(images) ||
    images.length === 0 ||
    !images.every((u) => typeof u === "string" && u.length > 0)
  ) {
    return NextResponse.json(
      { error: "images must be a non-empty array of URL strings" },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  const { error: deleteError } = await supabase
    .from("lecture_materials")
    .delete()
    .eq("week_id", weekId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const rows = images.map((image_url, i) => ({
    week_id: weekId,
    order_no: i + 1,
    image_url,
  }));

  const { error: insertError } = await supabase
    .from("lecture_materials")
    .insert(rows);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, week_id: weekId, count: rows.length });
}
