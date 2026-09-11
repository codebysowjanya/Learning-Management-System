import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";

const courseIdSchema = z.string().uuid();

type RouteContext = {
  params: Promise<{
    courseId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const { courseId } = await params;

  const parsed = courseIdSchema.safeParse(courseId);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid course ID" },
      { status: 400 }
    );
  }

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

  // Make sure the student is enrolled.
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
      { error: "You must enroll in this course first" },
      { status: 403 }
    );
  }

  // Get course information.
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, description, thumbnail_url")
    .eq("id", courseId)
    .single();

  if (courseError || !course) {
    return NextResponse.json(
      { error: "Course not found" },
      { status: 404 }
    );
  }

  // Get lessons.
  const { data: lessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("id, course_id, title, content, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  if (lessonsError) {
    return NextResponse.json(
      { error: lessonsError.message },
      { status: 500 }
    );
  }

  // Get this student's progress.
  const lessonIds = (lessons ?? []).map((lesson) => lesson.id);

  let progress: {
    id: string;
    student_id: string;
    lesson_id: string;
    completed: boolean;
    completed_at: string | null;
  }[] = [];

  if (lessonIds.length > 0) {
    const { data: progressData, error: progressError } =
      await supabase
        .from("lesson_progress")
        .select(
          "id, student_id, lesson_id, completed, completed_at"
        )
        .eq("student_id", user.id)
        .in("lesson_id", lessonIds);

    if (progressError) {
      return NextResponse.json(
        { error: progressError.message },
        { status: 500 }
      );
    }

    progress = progressData ?? [];
  }

  return NextResponse.json({
    course,
    lessons: lessons ?? [],
    progress,
  });
}