import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "../../../lib/supabase-server";

const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Course title must be at least 3 characters")
    .max(100, "Course title must be less than 100 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional()
    .default(""),
});

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "instructor") {
    return NextResponse.json(
      { error: "Only instructors can access courses." },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, title, description, thumbnail_url, created_at, updated_at"
    )
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ courses: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "instructor") {
    return NextResponse.json(
      { error: "Only instructors can create courses." },
      { status: 403 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request." },
      { status: 400 }
    );
  }

  const result = courseSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error.issues[0]?.message || "Invalid course data.",
      },
      { status: 400 }
    );
  }

  const { title, description } = result.data;

  const { data, error } = await supabase
    .from("courses")
    .insert({
      instructor_id: user.id,
      title,
      description,
    })
    .select(
      "id, title, description, thumbnail_url, created_at, updated_at"
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { course: data },
    { status: 201 }
  );
}