"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";
import styles from "./Dashboard.module.css";

type Profile = {
  id: string;
  full_name: string | null;
  role: "student" | "instructor";
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleLogout() {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className={styles.loading}>
        Loading your dashboard...
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.loading}>
        <div className={styles.error}>{error}</div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className={styles.page}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          Learn<span>Hub</span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className={styles.logoutButton}
        >
          Sign Out
        </button>
      </nav>

      <div className={styles.container}>
        <section className={styles.welcome}>
          <span className={styles.welcomeBadge}>
            {profile.role}
          </span>

          <h1>
            Welcome back, {profile.full_name || "Learner"} 👋
          </h1>

          <p>
            Here's what's happening with your learning journey.
          </p>
        </section>

        <section className={styles.cards}>
          {profile.role === "student" ? (
            <>
              <article className={styles.card}>
                <div className={styles.cardIcon}>📚</div>

                <h2>My Courses</h2>

                <p>
                  View the courses you're enrolled in and
                  continue learning.
                </p>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}>✓</div>

                <h2>My Progress</h2>

                <p>
                  Track completed lessons and your overall
                  learning progress.
                </p>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}>🔎</div>

                <h2>Explore Courses</h2>

                <p>
                  Discover new courses and find your next
                  learning opportunity.
                </p>
              </article>
            </>
          ) : (
            <>
              <article className={styles.card}>
                <div className={styles.cardIcon}>📚</div>

                <h2>My Courses</h2>

                <p>
                  Create and manage the courses you've
                  published.
                </p>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}>✦</div>

                <h2>Create Course</h2>

                <p>
                  Build a new course and share your knowledge
                  with students.
                </p>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}>📖</div>

                <h2>Manage Lessons</h2>

                <p>
                  Create and organize lessons inside your
                  courses.
                </p>
              </article>
            </>
          )}
        </section>
      </div>
    </main>
  );
}