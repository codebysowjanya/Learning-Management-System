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

  const { data, error } = await supabase
    .from("enrollments")
    .select("id, student_id, course_id, enrolled_at")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    enrolled: Boolean(data),
    enrollment: data ?? null,
  });
}

export async function POST(
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 }
    );
  }

  if (profile.role !== "student") {
    return NextResponse.json(
      { error: "Only students can enroll in courses" },
      { status: 403 }
    );
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError) {
    return NextResponse.json(
      { error: courseError.message },
      { status: 500 }
    );
  }

  if (!course) {
    return NextResponse.json(
      { error: "Course not found" },
      { status: 404 }
    );
  }

  const { data: existingEnrollment } = await supabase
    .from("enrollments")
    .select("id, student_id, course_id, enrolled_at")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existingEnrollment) {
    return NextResponse.json({
      success: true,
      enrolled: true,
      enrollment: existingEnrollment,
    });
  }

  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      student_id: user.id,
      course_id: courseId,
    })
    .select("id, student_id, course_id, enrolled_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      enrolled: true,
      enrollment: data,
    },
    { status: 201 }
  );
}

export async function DELETE(
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

  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("student_id", user.id)
    .eq("course_id", courseId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    enrolled: false,
  });
}