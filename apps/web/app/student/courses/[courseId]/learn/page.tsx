"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import styles from "./Learn.module.css";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
};

type Lesson = {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  order_index: number;
};

type Progress = {
  id: string;
  student_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
};

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [selectedLesson, setSelectedLesson] =
    useState<Lesson | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingProgress, setSavingProgress] = useState(false);

  useEffect(() => {
    async function loadLearningData() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const response = await fetch(
        `/api/courses/${courseId}/learn`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to load course");
        setLoading(false);
        return;
      }

      setCourse(data.course);
      setLessons(data.lessons);
      setProgress(data.progress);

      if (data.lessons.length > 0) {
        setSelectedLesson(data.lessons[0]);
      }

      setLoading(false);
    }

    loadLearningData();
  }, [courseId, router]);

  function isLessonCompleted(lessonId: string) {
    return progress.some(
      (item) =>
        item.lesson_id === lessonId &&
        item.completed
    );
  }

  const completedCount = lessons.filter((lesson) =>
    isLessonCompleted(lesson.id)
  ).length;

  const progressPercentage =
    lessons.length > 0
      ? Math.round((completedCount / lessons.length) * 100)
      : 0;

  async function markLessonComplete() {
    if (!selectedLesson) {
      return;
    }

    setSavingProgress(true);
    setError("");

    const response = await fetch(
      `/api/courses/${courseId}/progress`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lesson_id: selectedLesson.id,
          completed: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Unable to save progress");
      setSavingProgress(false);
      return;
    }

    setProgress((current) => {
      const existing = current.find(
        (item) =>
          item.lesson_id === selectedLesson.id
      );

      if (existing) {
        return current.map((item) =>
          item.lesson_id === selectedLesson.id
            ? data.progress
            : item
        );
      }

      return [...current, data.progress];
    });

    setSavingProgress(false);
  }

  if (loading) {
    return (
      <main className={styles.loading}>
        Loading your course...
      </main>
    );
  }

  if (error && !course) {
    return (
      <main className={styles.loading}>
        <div className={styles.error}>{error}</div>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/student/courses/${courseId}`
            )
          }
          className={styles.backButton}
        >
          ← Back to Course
        </button>
      </main>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          onClick={() =>
            router.push(
              `/student/courses/${courseId}`
            )
          }
          className={styles.backButton}
        >
          ← Course Overview
        </button>

        <div className={styles.headerTitle}>
          <span>LearnHub</span>
          <strong>{course.title}</strong>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTop}>
            <p>COURSE CONTENT</p>

            <h2>{course.title}</h2>
          </div>

          <div className={styles.progressBox}>
            <div className={styles.progressHeader}>
              <span>Your Progress</span>
              <strong>{progressPercentage}%</strong>
            </div>

            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>

            <small>
              {completedCount} of {lessons.length} lessons
              completed
            </small>
          </div>

          <div className={styles.lessonList}>
            {lessons.length === 0 ? (
              <p className={styles.noLessons}>
                No lessons available yet.
              </p>
            ) : (
              lessons.map((lesson, index) => {
                const completed =
                  isLessonCompleted(lesson.id);

                const active =
                  selectedLesson?.id === lesson.id;

                return (
                  <button
                    type="button"
                    key={lesson.id}
                    onClick={() =>
                      setSelectedLesson(lesson)
                    }
                    className={`${styles.lessonItem} ${
                      active
                        ? styles.lessonActive
                        : ""
                    }`}
                  >
                    <span
                      className={`${styles.lessonNumber} ${
                        completed
                          ? styles.lessonCompleted
                          : ""
                      }`}
                    >
                      {completed ? "✓" : index + 1}
                    </span>

                    <span className={styles.lessonInfo}>
                      <strong>{lesson.title}</strong>

                      <small>
                        {completed
                          ? "Completed"
                          : "Lesson"}
                      </small>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className={styles.content}>
          {selectedLesson ? (
            <>
              <div className={styles.lessonHeader}>
                <span className={styles.lessonLabel}>
                  LESSON{" "}
                  {selectedLesson.order_index + 1}
                </span>

                <h1>{selectedLesson.title}</h1>
              </div>

              <article className={styles.lessonContent}>
                {selectedLesson.content ? (
                  selectedLesson.content
                    .split("\n")
                    .map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))
                ) : (
                  <p className={styles.emptyContent}>
                    This lesson doesn't have any content
                    yet.
                  </p>
                )}
              </article>

              <div className={styles.lessonFooter}>
                {isLessonCompleted(
                  selectedLesson.id
                ) ? (
                  <div className={styles.completedMessage}>
                    ✓ Lesson completed
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={markLessonComplete}
                    disabled={savingProgress}
                    className={styles.completeButton}
                  >
                    {savingProgress
                      ? "Saving..."
                      : "Mark Lesson Complete ✓"}
                  </button>
                )}
              </div>

              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <div>📖</div>

              <h2>Select a lesson</h2>

              <p>
                Choose a lesson from the course content
                menu to start learning.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}