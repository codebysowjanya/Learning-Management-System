"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase-browser";
import styles from "./Register.module.css";

export default function RegisterPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setMessage("Registration failed. Please try again.");
      setLoading(false);
      return;
    }

    setMessage(
      "Registration successful! Please check your email to confirm your account."
    );

    setFullName("");
    setEmail("");
    setPassword("");
    setLoading(false);
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.logo}>
          Learn<span>Hub</span>
        </div>

        <div className={styles.heroContent}>
          <div className={styles.badge}>✦ Learn. Build. Grow.</div>

          <h1>
            Your journey to
            <br />
            <span>better learning.</span>
          </h1>

          <p className={styles.heroText}>
            Learn new skills, explore expert-led courses, and
            track your progress with LearnHub.
          </p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>✓</div>
              Learn from structured courses
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>✓</div>
              Track your learning progress
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>✓</div>
              Learn at your own pace
            </div>
          </div>
        </div>
      </section>

      <section className={styles.formSection}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Create your account</h2>

            <p>
              Start your learning journey today. New accounts
              are created as students.
            </p>
          </div>

          <form onSubmit={handleRegister} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="fullName">Full Name</label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="email">Email Address</label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
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
                placeholder="Create a password"
                minLength={6}
                required
              />

              <span className={styles.passwordHint}>
                Minimum 6 characters
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.button}
            >
              {loading ? "Creating account..." : "Create Account →"}
            </button>
          </form>

          {message && (
            <p className={styles.message}>
              {message}
            </p>
          )}

          <p className={styles.login}>
            Already have an account?{" "}
            <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}