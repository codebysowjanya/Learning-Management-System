"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase-browser";
import styles from "./Login.module.css";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.logo}>
          Learn<span>Hub</span>
        </div>

        <div className={styles.heroContent}>
          <div className={styles.badge}>✦ Welcome back</div>

          <h1>
            Continue your
            <br />
            <span>learning journey.</span>
          </h1>

          <p className={styles.heroText}>
            Sign in to access your courses, track your progress,
            and continue learning with LearnHub.
          </p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>✓</div>
              Access your enrolled courses
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>✓</div>
              Continue where you left off
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>✓</div>
              Track your learning progress
            </div>
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Welcome back</h2>

            <p>
              Sign in to your LearnHub account to continue learning.
            </p>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? "Signing in..." : "Sign In →"}
            </button>
          </form>

          {message && (
            <p className={styles.message}>
              {message}
            </p>
          )}

          <p className={styles.register}>
            Don't have an account?{" "}
            <Link href="/register">Create one</Link>
          </p>
        </div>
      </section>
    </main>
  );
}