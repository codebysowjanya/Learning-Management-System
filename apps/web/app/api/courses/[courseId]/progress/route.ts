import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";

const progressSchema = z.object({
  lesson_id: z.string().uuid(),
  completed: z.boolean(),
});

const courseIdSchema = z.string().uuid();

type RouteContext = {
  params: Promise<{
    courseId: string;
  }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  const { courseId } = await params;

  const courseIdResult = courseIdSchema.safeParse(courseId);

  if (!courseIdResult.success) {
    return NextResponse.json(
      { error: "Invalid course ID" },
      { status: 400 }
    );
  }

  const body = await request.json();

  const parsed = progressSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid progress data",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { lesson_id, completed } = parsed.data;

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Make sure the student is enrolled in this course.
  const { data: enrollment, error: enrollmentError } =
    await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

  if (enrollmentError) {
    return NextResponse.json(
      { error: enrollmentError.message },
      { status: 500 }
    );
  }

  if (!enrollment) {
    return NextResponse.json(
      {
        error: "You must enroll in this course first",
      },
      { status: 403 }
    );
  }

  // Make sure the lesson belongs to this course.
  const { data: lesson, error: lessonError } =
    await supabase
      .from("lessons")
      .select("id")
      .eq("id", lesson_id)
      .eq("course_id", courseId)
      .maybeSingle();

  if (lessonError) {
    return NextResponse.json(
      { error: lessonError.message },
      { status: 500 }
    );
  }

  if (!lesson) {
    return NextResponse.json(
      { error: "Lesson not found in this course" },
      { status: 404 }
    );
  }

  const completedAt = completed
    ? new Date().toISOString()
    : null;

  // Create or update progress.
  const { data: progress, error: progressError } =
    await supabase
      .from("lesson_progress")
      .upsert(
        {
          student_id: user.id,
          lesson_id,
          completed,
          completed_at: completedAt,
        },
        {
          onConflict: "student_id,lesson_id",
        }
      )
      .select(
        "id, student_id, lesson_id, completed, completed_at"
      )
      .single();

  if (progressError) {
    return NextResponse.json(
      { error: progressError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    progress,
  });
}