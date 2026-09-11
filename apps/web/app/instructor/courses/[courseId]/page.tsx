"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase-browser";
import styles from "./CourseDetails.module.css";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
};

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadCourse() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        setError(data.error || "Failed to load course.");
        return;
      }

      setCourse(data.course);
      setTitle(data.course.title);
      setDescription(data.course.description || "");

      // Get a signed URL for the private thumbnail
      if (data.course.thumbnail_url) {
        const thumbnailResponse = await fetch(
          `/api/courses/${courseId}/thumbnail`
        );

        if (thumbnailResponse.ok) {
          const thumbnailData = await thumbnailResponse.json();

          if (thumbnailData.thumbnailUrl) {
            setThumbnailUrl(thumbnailData.thumbnailUrl);
          }
        }
      } else {
        setThumbnailUrl(null);
      }
    } catch {
      setError("Something went wrong while loading the course.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  async function handleUpdate(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update course.");
        return;
      }

      setCourse(data.course);
      setTitle(data.course.title);
      setDescription(data.course.description || "");

      setMessage("Course updated successfully!");
    } catch {
      setError("Something went wrong while updating the course.");
    } finally {
      setSaving(false);
    }
  }

  async function handleThumbnailUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setThumbnailUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/courses/${courseId}/thumbnail`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to upload thumbnail.");
        return;
      }

      setThumbnailUrl(data.thumbnailUrl || null);

      setCourse((currentCourse) =>
        currentCourse
          ? {
              ...currentCourse,
              thumbnail_url: data.thumbnailPath || null,
            }
          : currentCourse
      );

      setMessage("Course thumbnail uploaded successfully!");
    } catch {
      setError(
        "Something went wrong while uploading the thumbnail."
      );
    } finally {
      setThumbnailUploading(false);

      // Allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete course.");
        return;
      }

      router.replace("/instructor/courses");
      router.refresh();
    } catch {
      setError("Something went wrong while deleting the course.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loader} />
        <p>Loading course...</p>
      </main>
    );
  }

  if (error && !course) {
    return (
      <main className={styles.loadingPage}>
        <div className={styles.loadError}>{error}</div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => router.push("/instructor/courses")}
        >
          Back to My Courses
        </button>
      </main>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          Learn<span>Hub</span>
        </div>

        <div className={styles.profile}>
          <div className={styles.avatar}>S</div>

          <div className={styles.profileText}>
            <strong>Instructor</strong>
            <span>Course Creator</span>
          </div>
        </div>

        <nav className={styles.navigation}>
          <button
            type="button"
            className={styles.navItem}
            onClick={() => router.push("/dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${styles.active}`}
            onClick={() => router.push("/instructor/courses")}
          >
            <span>▣</span>
            My Courses
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() => router.push("/instructor/courses")}
          >
            <span>＋</span>
            Create Course
          </button>
        </nav>

        <div className={styles.sidebarBottom}>
          <button
            type="button"
            className={styles.logout}
            onClick={handleLogout}
          >
            <span>↪</span>
            Sign Out
          </button>
        </div>
      </aside>

      <section className={styles.main}>
        <div className={styles.breadcrumb}>
          <button
            type="button"
            onClick={() => router.push("/instructor/courses")}
          >
            My Courses
          </button>

          <span>/</span>
          <span>Manage Course</span>
        </div>

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              COURSE MANAGEMENT
            </p>

            <h1>{course.title}</h1>

            <p>
              Edit your course details and manage your learning
              content.
            </p>
          </div>

          <div className={styles.draftBadge}>
            <span />
            Draft
          </div>
        </header>

        {message && (
          <div className={styles.success}>
            <span>✓</span>
            {message}
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <section className={styles.editorGrid}>
          <div className={styles.formCard}>
            <div className={styles.cardHeading}>
              <div className={styles.headingIcon}>✎</div>

              <div>
                <h2>Course Information</h2>

                <p>
                  Update the basic information students will see.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleUpdate}
              className={styles.form}
            >
              <div className={styles.field}>
                <label htmlFor="title">
                  Course Title
                </label>

                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Enter course title"
                  required
                />

                <span className={styles.fieldHint}>
                  Use a clear title that explains what students
                  will learn.
                </span>
              </div>

              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label htmlFor="description">
                    Description
                  </label>

                  <span>
                    {description.length}/1000
                  </span>
                </div>

                <textarea
                  id="description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Describe your course..."
                  rows={7}
                  maxLength={1000}
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setTitle(course.title);
                    setDescription(course.description || "");
                    setMessage("");
                    setError("");
                  }}
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className={styles.primaryButton}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes →"}
                </button>
              </div>
            </form>
          </div>

          <aside className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <span>COURSE PREVIEW</span>
            </div>

            <div className={styles.thumbnail}>
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={course.title}
                />
              ) : (
                <>
                  <div className={styles.previewStar}>✦</div>

                  <span className={styles.previewLabel}>
                    LEARNHUB COURSE
                  </span>
                </>
              )}
            </div>

            <div
              style={{
                padding: "0 20px 16px",
                textAlign: "center",
              }}
            >
              <input
                ref={fileInputRef}
                id="thumbnail"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleThumbnailUpload}
                style={{ display: "none" }}
              />

              <label
                htmlFor="thumbnail"
                className={styles.primaryButton}
                style={{
                  display: "inline-block",
                  cursor: thumbnailUploading
                    ? "not-allowed"
                    : "pointer",
                  opacity: thumbnailUploading ? 0.7 : 1,
                }}
              >
                {thumbnailUploading
                  ? "Uploading..."
                  : thumbnailUrl
                  ? "Change Thumbnail"
                  : "Upload Thumbnail"}
              </label>

              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: "12px",
                  opacity: 0.7,
                }}
              >
                JPG, PNG or WebP • Maximum 5 MB
              </p>
            </div>

            <div className={styles.previewContent}>
              <div className={styles.previewStatus}>
                <span />
                Draft
              </div>

              <h3>{title || "Untitled Course"}</h3>

              <p>
                {description ||
                  "Add a description to tell students what they will learn."}
              </p>
            </div>
          </aside>
        </section>

        <section className={styles.contentSection}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>
                COURSE CONTENT
              </p>

              <h2>Build your course</h2>

              <p>
                Add lessons and organize the learning experience.
              </p>
            </div>
          </div>

          <div className={styles.lessonCard}>
            <div className={styles.lessonIcon}>▤</div>

            <div className={styles.lessonInfo}>
              <h3>Lessons</h3>

              <p>
                Create and organize lessons for this course.
              </p>
            </div>

            <div className={styles.lessonCount}>
              <strong>0</strong>
              <span>Lessons</span>
            </div>

            <button
              type="button"
              className={styles.manageLessonsButton}
              onClick={() =>
                router.push(
                  `/instructor/courses/${courseId}/lessons`
                )
              }
            >
              Manage Lessons →
            </button>
          </div>
        </section>

        <section className={styles.dangerSection}>
          <div className={styles.dangerHeading}>
            <div>
              <p className={styles.dangerEyebrow}>
                DANGER ZONE
              </p>

              <h2>Delete this course</h2>

              <p>
                Permanently remove this course and its related
                content.
              </p>
            </div>

            <button
              type="button"
              className={styles.deleteButton}
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting
                ? "Deleting..."
                : "Delete Course"}
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}