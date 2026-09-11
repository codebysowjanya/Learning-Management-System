"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./CourseDetails.module.css";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

export default function StudentCourseDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

      if (data.course.thumbnail_url) {
        const thumbnailResponse = await fetch(
          `/api/courses/${courseId}/thumbnail`
        );

        if (thumbnailResponse.ok) {
          const thumbnailData =
            await thumbnailResponse.json();

          setThumbnailUrl(
            thumbnailData.thumbnailUrl || null
          );
        }
      }

      // Check whether the current student is already enrolled
      const enrollmentResponse = await fetch(
        `/api/courses/${courseId}/enrollment`
      );

      if (enrollmentResponse.ok) {
        const enrollmentData =
          await enrollmentResponse.json();

        setEnrolled(
          Boolean(enrollmentData.enrolled)
        );
      }
    } catch {
      setError(
        "Something went wrong while loading the course."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  async function handleEnroll() {
    setEnrolling(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/courses/${courseId}/enrollment`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        setError(
          data.error || "Failed to enroll in course."
        );
        return;
      }

      setEnrolled(true);
      setMessage("You are now enrolled in this course!");
    } catch {
      setError(
        "Something went wrong while enrolling."
      );
    } finally {
      setEnrolling(false);
    }
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
        <div className={styles.error}>{error}</div>

        <button
          type="button"
          className={styles.primaryButton}
          onClick={() =>
            router.push("/student/courses")
          }
        >
          ← Back to Courses
        </button>
      </main>
    );
  }

  if (!course) {
    return null;
  }

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
          onClick={() =>
            router.push("/student/courses")
          }
        >
          ← Explore Courses
        </button>
      </nav>

      <section className={styles.container}>
        <div className={styles.breadcrumb}>
          <button
            type="button"
            onClick={() =>
              router.push("/student/courses")
            }
          >
            Courses
          </button>

          <span>/</span>
          <span>{course.title}</span>
        </div>

        <section className={styles.hero}>
          <div className={styles.thumbnail}>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={course.title}
              />
            ) : (
              <div className={styles.placeholder}>
                <span>✦</span>
                <small>LEARNHUB COURSE</small>
              </div>
            )}
          </div>

          <div className={styles.heroContent}>
            <span className={styles.badge}>
              COURSE
            </span>

            <h1>{course.title}</h1>

            <p>
              {course.description ||
                "Start learning with this course and build your knowledge step by step."}
            </p>

            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            {message && (
              <div className={styles.success}>
                ✓ {message}
              </div>
            )}

            {enrolled ? (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() =>
                  router.push(
                    `/student/courses/${courseId}/learn`
                  )
                }
              >
                Continue Learning →
              </button>
            ) : (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling
                  ? "Enrolling..."
                  : "Enroll Now →"}
              </button>
            )}
          </div>
        </section>

        <section className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>📖</div>

            <div>
              <strong>Lessons</strong>
              <span>
                Learn through structured course content
              </span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>✓</div>

            <div>
              <strong>Track Progress</strong>
              <span>
                Mark lessons complete as you learn
              </span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoIcon}>🎓</div>

            <div>
              <strong>Learn at Your Pace</strong>
              <span>
                Continue learning whenever you're ready
              </span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}