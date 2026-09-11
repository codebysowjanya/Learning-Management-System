import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "../../../../lib/supabase-server";

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

type RouteContext = {
  params: Promise<{
    courseId: string;
  }>;
};

async function getInstructor(requestedCourseId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      user: null,
      course: null,
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
      course: null,
      error: NextResponse.json(
        { error: "Only instructors can manage courses." },
        { status: 403 }
      ),
    };
  }

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select(
      "id, title, description, thumbnail_url, created_at, updated_at"
    )
    .eq("id", requestedCourseId)
    .eq("instructor_id", user.id)
    .single();

  if (courseError || !course) {
    return {
      supabase,
      user,
      course: null,
      error: NextResponse.json(
        { error: "Course not found." },
        { status: 404 }
      ),
    };
  }

  return {
    supabase,
    user,
    course,
    error: null,
  };
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  const { params } = context;
  const { courseId } = await params;

  const result = await getInstructor(courseId);

  if (result.error) {
    return result.error;
  }

  return NextResponse.json({
    course: result.course,
  });
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  const { params } = context;
  const { courseId } = await params;

  const result = await getInstructor(courseId);

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

  const validation = courseSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        error:
          validation.error.issues[0]?.message ||
          "Invalid course data.",
      },
      { status: 400 }
    );
  }

  const { title, description } = validation.data;

  const { data, error } = await result.supabase
    .from("courses")
    .update({
      title,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId)
    .eq("instructor_id", result.user!.id)
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

  return NextResponse.json({
    course: data,
  });
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const { params } = context;
  const { courseId } = await params;

  const result = await getInstructor(courseId);

  if (result.error) {
    return result.error;
  }

  const { error } = await result.supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("instructor_id", result.user!.id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Course deleted successfully.",
  });
}