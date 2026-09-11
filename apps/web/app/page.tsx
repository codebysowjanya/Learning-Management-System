import Link from "next/link";
import styles from "./Home.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          Learn<span>Hub</span>
        </div>

        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginButton}>
            Sign In
          </Link>

          <Link href="/register" className={styles.signupButton}>
            Get Started
          </Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div>
          <span className={styles.badge}>
            MODERN ONLINE LEARNING
          </span>

          <h1>
            Learn.
            <br />
            Create.
            <br />
            <span className={styles.highlight}>Grow.</span>
          </h1>

          <p className={styles.heroText}>
            LearnHub is a full-stack learning platform where
            students can discover courses, learn at their own
            pace, and track their progress.
          </p>

          <div className={styles.heroButtons}>
            <Link
              href="/student/courses"
              className={styles.primaryButton}
            >
              Explore Courses →
            </Link>

            <Link
              href="/register"
              className={styles.secondaryButton}
            >
              Create Account
            </Link>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>📚</strong>
              <span>Structured Courses</span>
            </div>

            <div className={styles.stat}>
              <strong>✓</strong>
              <span>Progress Tracking</span>
            </div>

            <div className={styles.stat}>
              <strong>🔐</strong>
              <span>Secure Learning</span>
            </div>
          </div>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.cardIcon}>🎓</div>

          <h2>Your learning journey starts here.</h2>

          <p>
            Explore courses, enroll in what interests you,
            complete lessons, and watch your progress grow.
          </p>
        </div>
      </section>

      <section className={styles.featuresSection}>
        <div className={styles.sectionHeading}>
          <h2>Everything you need to learn</h2>

          <p>
            A simple learning experience for students and
            instructors.
          </p>
        </div>

        <div className={styles.features}>
          <article className={styles.feature}>
            <div className={styles.featureIcon}>📚</div>

            <h3>Discover Courses</h3>

            <p>
              Browse available courses and find content that
              matches your learning goals.
            </p>
          </article>

          <article className={styles.feature}>
            <div className={styles.featureIcon}>✓</div>

            <h3>Track Progress</h3>

            <p>
              Mark lessons as completed and keep track of
              your learning progress.
            </p>
          </article>

          <article className={styles.feature}>
            <div className={styles.featureIcon}>✦</div>

            <h3>Create & Manage</h3>

            <p>
              Instructors can create courses, upload
              thumbnails, and organize lessons.
            </p>
          </article>
        </div>
      </section>

      <footer className={styles.footer}>
        © 2026 LearnHub · Built for modern online learning
      </footer>
    </main>
  );
}