"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./StudentCourses.module.css";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

export default function StudentCoursesPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
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
      setError(
        "Something went wrong while loading courses."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <main className={styles.page}>
      <nav className={styles.navbar}>
        <button
          type="button"
          className={styles.logo}
          onClick={() => router.push("/dashboard")}
        >
          Learn<span>Hub</span>
        </button>

        <button
          type="button"
          className={styles.backButton}
          onClick={() => router.push("/dashboard")}
        >
          ← Dashboard
        </button>
      </nav>

      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              LEARNHUB CATALOG
            </p>

            <h1>Explore Courses</h1>

            <p>
              Discover courses created by instructors and
              start learning something new.
            </p>
          </div>

          <div className={styles.courseCount}>
            {courses.length}{" "}
            {courses.length === 1
              ? "Course"
              : "Courses"}
          </div>
        </header>

        {loading ? (
          <div className={styles.state}>
            <div className={styles.loader} />
            <p>Loading courses...</p>
          </div>
        ) : error ? (
          <div className={styles.state}>
            <div className={styles.error}>
              {error}
            </div>

            <button
              type="button"
              className={styles.retryButton}
              onClick={loadCourses}
            >
              Try Again
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              📚
            </div>

            <h2>No courses available yet</h2>

            <p>
              Instructors haven't created any courses yet.
              Check back soon!
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {courses.map((course) => (
              <article
                key={course.id}
                className={styles.card}
              >
                <div className={styles.thumbnail}>
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                    />
                  ) : (
                    <div className={styles.placeholder}>
                      <span>✦</span>
                      <small>LEARNHUB COURSE</small>
                    </div>
                  )}
                </div>

                <div className={styles.body}>
                  <span className={styles.badge}>
                    COURSE
                  </span>

                  <h2>{course.title}</h2>

                  <p>
                    {course.description ||
                      "Start learning with this course."}
                  </p>

                  <div className={styles.footer}>
                    <span>
                      Created{" "}
                      {new Date(
                        course.created_at
                      ).toLocaleDateString()}
                    </span>

                    <button
                      type="button"
                      className={styles.viewButton}
                      onClick={() =>
                        router.push(
                          `/student/courses/${course.id}`
                        )
                      }
                    >
                      View Course →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}