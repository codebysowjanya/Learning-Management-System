import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const supabase = await createClient();
    const { courseId } = await params;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check instructor role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "instructor") {
      return NextResponse.json(
        { error: "Only instructors can upload thumbnails" },
        { status: 403 }
      );
    }

    // Check course ownership
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id, thumbnail_url")
      .eq("id", courseId)
      .eq("instructor_id", user.id)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG and WebP images are allowed" },
        { status: 400 }
      );
    }

    // 5 MB maximum
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be smaller than 5 MB" },
        { status: 400 }
      );
    }

    const extension =
      file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/png"
        ? "png"
        : "webp";

    const filePath = `${user.id}/${courseId}-${Date.now()}.${extension}`;

    // Upload image
    const { error: uploadError } = await supabase.storage
      .from("course-thumbnails")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Store STORAGE PATH in database
    const { error: updateError } = await supabase
      .from("courses")
      .update({
        thumbnail_url: filePath,
      })
      .eq("id", courseId)
      .eq("instructor_id", user.id);

    if (updateError) {
      await supabase.storage
        .from("course-thumbnails")
        .remove([filePath]);

      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Delete previous thumbnail if it was stored as a path
    if (
      course.thumbnail_url &&
      !course.thumbnail_url.startsWith("http")
    ) {
      await supabase.storage
        .from("course-thumbnails")
        .remove([course.thumbnail_url]);
    }

    // Generate signed URL for immediate display
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("course-thumbnails")
        .createSignedUrl(filePath, 60 * 60);

    if (signedUrlError) {
      return NextResponse.json({
        success: true,
        thumbnailPath: filePath,
        thumbnailUrl: null,
      });
    }

    return NextResponse.json({
      success: true,
      thumbnailPath: filePath,
      thumbnailUrl: signedUrlData.signedUrl,
    });
  } catch (error) {
    console.error("Thumbnail upload error:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}