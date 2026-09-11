import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "../../../../../lib/supabase-server";

const lessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Lesson title must be at least 2 characters")
    .max(150, "Lesson title must be less than 150 characters"),

  content: z
    .string()
    .trim()
    .max(10000, "Lesson content must be less than 10000 characters")
    .optional()
    .default(""),

  order_index: z
    .number()
    .int()
    .min(0, "Lesson order cannot be negative"),
});

type RouteContext = {
  params: Promise<{
    courseId: string;
  }>;
};

async function verifyInstructor(courseId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "instructor") {
    return {
      supabase,
      user: null,
      error: NextResponse.json(
        { error: "Only instructors can manage lessons." },
        { status: 403 }
      ),
    };
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("instructor_id", user.id)
    .single();

  if (courseError || !course) {
    return {
      supabase,
      user,
      error: NextResponse.json(
        { error: "Course not found." },
        { status: 404 }
      ),
    };
  }

  return {
    supabase,
    user,
    error: null,
  };
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  const { courseId } = await context.params;

  const result = await verifyInstructor(courseId);

  if (result.error) {
    return result.error;
  }

  const { data, error } = await result.supabase
    .from("lessons")
    .select(
      "id, course_id, title, content, order_index, created_at"
    )
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    lessons: data,
  });
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  const { courseId } = await context.params;

  const result = await verifyInstructor(courseId);

  if (result.error) {
    return result.error;
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

  const validation = lessonSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error:
          validation.error.issues[0]?.message ||
          "Invalid lesson data.",
      },
      { status: 400 }
    );
  }

  const { title, content, order_index } = validation.data;

  const { data, error } = await result.supabase
    .from("lessons")
    .insert({
      course_id: courseId,
      title,
      content,
      order_index,
    })
    .select(
      "id, course_id, title, content, order_index, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { lesson: data },
    { status: 201 }
  );
}