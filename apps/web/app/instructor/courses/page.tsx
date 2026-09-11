"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Courses.module.css";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

export default function InstructorCoursesPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCourses() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/courses");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        setError(data.error || "Failed to load courses.");
        return;
      }

      const loadedCourses: Course[] = data.courses || [];

      // Generate signed URLs for private thumbnails
      const coursesWithThumbnails = await Promise.all(
        loadedCourses.map(async (course) => {
          if (!course.thumbnail_url) {
            return course;
          }

          try {
            const thumbnailResponse = await fetch(
              `/api/courses/${course.id}/thumbnail`
            );

            if (!thumbnailResponse.ok) {
              return {
                ...course,
                thumbnail_url: null,
              };
            }

            const thumbnailData =
              await thumbnailResponse.json();

            return {
              ...course,
              thumbnail_url:
                thumbnailData.thumbnailUrl || null,
            };
          } catch {
            return {
              ...course,
              thumbnail_url: null,
            };
          }
        })
      );

      setCourses(coursesWithThumbnails);
    } catch {
      setError("Something went wrong while loading courses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function handleCreateCourse(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreating(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
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
        setError(data.error || "Failed to create course.");
        return;
      }

      setMessage("Course created successfully!");
      setTitle("");
      setDescription("");

      await loadCourses();
    } catch {
      setError("Something went wrong while creating the course.");
    } finally {
      setCreating(false);
    }
  }

  async function handleLogout() {
    const { createClient } = await import(
      "../../../lib/supabase-browser"
    );

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

          <div>
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
          >
            <span>▣</span>
            My Courses
          </button>

          <button
            type="button"
            className={styles.navItem}
            onClick={() =>
              document
                .getElementById("create-course")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
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
        <header className={styles.topbar}>
          <div>
            <p className={styles.eyebrow}>
              INSTRUCTOR STUDIO
            </p>

            <h1>My Courses</h1>

            <p className={styles.subtitle}>
              Build, manage, and share your knowledge with students.
            </p>
          </div>

          <button
            type="button"
            className={styles.topCreateButton}
            onClick={() =>
              document
                .getElementById("create-course")
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            + Create Course
          </button>
        </header>

        <section className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>▣</div>

            <div>
              <span>Total Courses</span>
              <strong>{courses.length}</strong>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>✓</div>

            <div>
              <span>Published</span>
              <strong>0</strong>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>◷</div>

            <div>
              <span>Drafts</span>
              <strong>{courses.length}</strong>
            </div>
          </div>
        </section>

        <section
          id="create-course"
          className={styles.createCard}
        >
          <div className={styles.createIntro}>
            <div className={styles.createIcon}>✦</div>

            <div>
              <h2>Create a new course</h2>

              <p>
                Start teaching by creating your first course.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleCreateCourse}
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
                placeholder="e.g. Full Stack Web Development"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Tell students what they will learn..."
                rows={4}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className={styles.createButton}
            >
              {creating
                ? "Creating Course..."
                : "Create Course →"}
            </button>
          </form>

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
        </section>

        <section className={styles.courseSection}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>
                YOUR CONTENT
              </p>

              <h2>All Courses</h2>
            </div>

            <span className={styles.courseCount}>
              {courses.length}{" "}
              {courses.length === 1
                ? "course"
                : "courses"}
            </span>
          </div>

          {loading ? (
            <div className={styles.emptyState}>
              <div className={styles.loader} />
              <p>Loading your courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>▣</div>

              <h3>No courses yet</h3>

              <p>
                Create your first course and start sharing your
                knowledge.
              </p>
            </div>
          ) : (
            <div className={styles.courseGrid}>
              {courses.map((course) => (
                <article
                  key={course.id}
                  className={styles.courseCard}
                >
                  <div className={styles.thumbnail}>
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                      />
                    ) : (
                      <>
                        <div
                          className={styles.thumbnailPattern}
                        >
                          <span>✦</span>
                        </div>

                        <div
                          className={styles.thumbnailLabel}
                        >
                          LEARNHUB COURSE
                        </div>
                      </>
                    )}
                  </div>

                  <div className={styles.courseBody}>
                    <div className={styles.courseStatus}>
                      <span
                        className={styles.draftDot}
                      />
                      Draft
                    </div>

                    <h3>{course.title}</h3>

                    <p>
                      {course.description ||
                        "No description added yet."}
                    </p>

                    <div className={styles.courseFooter}>
                      <span>
                        Created{" "}
                        {new Date(
                          course.created_at
                        ).toLocaleDateString()}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/instructor/courses/${course.id}`
                          )
                        }
                        className={styles.manageButton}
                      >
                        Manage →
                      </button>
                    </div>
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