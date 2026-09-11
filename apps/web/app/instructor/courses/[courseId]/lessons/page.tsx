"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "../../../../../lib/supabase-browser";
import styles from "./Lessons.module.css";

type Lesson = {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  order_index: number;
  created_at: string;
};

export default function LessonsPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.courseId as string;

  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [courseTitle, setCourseTitle] = useState(
    "Course Lessons"
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [order, setOrder] = useState("1");

  const [editingId, setEditingId] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [courseResponse, lessonsResponse] =
        await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch(`/api/courses/${courseId}/lessons`),
        ]);

      const courseData = await courseResponse.json();
      const lessonsData = await lessonsResponse.json();

      if (!courseResponse.ok) {
        if (courseResponse.status === 401) {
          router.replace("/login");
          return;
        }

        setError(
          courseData.error || "Failed to load course."
        );
        return;
      }

      if (!lessonsResponse.ok) {
        setError(
          lessonsData.error || "Failed to load lessons."
        );
        return;
      }

      setCourseTitle(courseData.course.title);
      setLessons(lessonsData.lessons || []);
    } catch {
      setError("Something went wrong while loading.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (courseId) {
      loadData();
    }
  }, [courseId]);

  function resetForm() {
    setTitle("");
    setContent("");
    setOrder(String(lessons.length + 1));
    setEditingId(null);
  }

  function startEditing(lesson: Lesson) {
    setEditingId(lesson.id);
    setTitle(lesson.title);
    setContent(lesson.content || "");
    setOrder(String(lesson.order_index));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    const numericOrder = Number(order);

    if (!Number.isInteger(numericOrder) || numericOrder < 0) {
      setError("Lesson order must be a whole number.");
      setSaving(false);
      return;
    }

    try {
      const url = editingId
        ? `/api/courses/${courseId}/lessons/${editingId}`
        : `/api/courses/${courseId}/lessons`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          order_index: numericOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to save lesson.");
        return;
      }

      setMessage(
        editingId
          ? "Lesson updated successfully!"
          : "Lesson created successfully!"
      );

      resetForm();

      await loadData();
    } catch {
      setError("Something went wrong while saving the lesson.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lessonId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lesson?"
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to delete lesson.");
        return;
      }

      setMessage("Lesson deleted successfully!");

      if (editingId === lessonId) {
        resetForm();
      }

      await loadData();
    } catch {
      setError("Something went wrong while deleting the lesson.");
    }
  }

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
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

          <button
            type="button"
            onClick={() =>
              router.push(
                `/instructor/courses/${courseId}`
              )
            }
          >
            {courseTitle}
          </button>

          <span>/</span>

          <span>Lessons</span>
        </div>

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              COURSE CONTENT
            </p>

            <h1>Manage Lessons</h1>

            <p>
              Build and organize the lessons inside{" "}
              <strong>{courseTitle}</strong>.
            </p>
          </div>

          <div className={styles.lessonTotal}>
            <strong>{lessons.length}</strong>
            <span>
              {lessons.length === 1 ? "Lesson" : "Lessons"}
            </span>
          </div>
        </header>

        {message && (
          <div className={styles.success}>
            ✓ {message}
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <section className={styles.editorCard}>
          <div className={styles.cardHeading}>
            <div className={styles.headingIcon}>
              {editingId ? "✎" : "＋"}
            </div>

            <div>
              <h2>
                {editingId
                  ? "Edit Lesson"
                  : "Add a New Lesson"}
              </h2>

              <p>
                {editingId
                  ? "Update this lesson's information."
                  : "Create structured learning content for your students."}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className={styles.form}
          >
            <div className={styles.formRow}>
              <div className={styles.field}>
                <label htmlFor="lessonTitle">
                  Lesson Title
                </label>

                <input
                  id="lessonTitle"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. Introduction to HTML"
                  required
                />
              </div>

              <div className={styles.orderField}>
                <label htmlFor="order">Order</label>

                <input
                  id="order"
                  type="number"
                  min="0"
                  value={order}
                  onChange={(event) =>
                    setOrder(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="content">
                  Lesson Content
                </label>

                <span>{content.length}/10000</span>
              </div>

              <textarea
                id="content"
                value={content}
                onChange={(event) =>
                  setContent(event.target.value)
                }
                placeholder="Write the lesson content here..."
                rows={9}
                maxLength={10000}
              />
            </div>

            <div className={styles.formActions}>
              {editingId && (
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className={styles.primaryButton}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Lesson →"
                    : "Add Lesson →"}
              </button>
            </div>
          </form>
        </section>

        <section className={styles.lessonsSection}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>
                LEARNING MATERIAL
              </p>

              <h2>Your Lessons</h2>
            </div>

            <span className={styles.countBadge}>
              {lessons.length} total
            </span>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.loader} />
              <p>Loading lessons...</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>▤</div>

              <h3>No lessons yet</h3>

              <p>
                Add your first lesson using the form above.
              </p>
            </div>
          ) : (
            <div className={styles.lessonList}>
              {lessons.map((lesson, index) => (
                <article
                  key={lesson.id}
                  className={styles.lessonItem}
                >
                  <div className={styles.lessonNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className={styles.lessonDetails}>
                    <div className={styles.lessonMeta}>
                      <span>
                        Lesson {lesson.order_index}
                      </span>

                      <span>•</span>

                      <span>
                        {new Date(
                          lesson.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>

                    <h3>{lesson.title}</h3>

                    <p>
                      {lesson.content
                        ? lesson.content
                        : "No lesson content added yet."}
                    </p>
                  </div>

                  <div className={styles.lessonActions}>
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() =>
                        startEditing(lesson)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className={styles.deleteLessonButton}
                      onClick={() =>
                        handleDelete(lesson.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}