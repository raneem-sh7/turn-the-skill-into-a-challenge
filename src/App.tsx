import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { challenges, type Challenge } from "./challenges";

const routeFor = (slug: string) => `/challenges/${slug}`;

function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function Button({
  children,
  href,
  secondary = false,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  secondary?: boolean;
  onClick?: () => void;
}) {
  const className = `button ${secondary ? "button-secondary" : "button-primary"}`;

  if (href) {
    return (
      <a
        className={className}
        href={href}
        onClick={(event) => {
          if (href.startsWith("/")) {
            event.preventDefault();
            navigate(href);
          }
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <button className={className} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a
        className="brand"
        href="/"
        aria-label="Turn the Skill into a Challenge — home"
        onClick={(event) => {
          event.preventDefault();
          navigate("/");
        }}
      >
        <span className="logo-placeholder" aria-hidden="true">
          TS
        </span>
        <span>Turn the Skill into a Challenge</span>
      </a>
      <span className="header-note">7-day student challenges</span>
    </header>
  );
}

function QRCodeImage({ challenge }: { challenge: Challenge }) {
  const [source, setSource] = useState("");
  const route = routeFor(challenge.slug);
  const destination = `${window.location.origin}${route}`;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(destination, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: { dark: "#10233f", light: "#ffffff" },
    }).then((url) => active && setSource(url));
    return () => {
      active = false;
    };
  }, [destination]);

  function download() {
    const link = document.createElement("a");
    link.download = `${challenge.slug}-qr-code.png`;
    link.href = source;
    link.click();
  }

  return (
    <div className="qr-block">
      {source ? (
        <img
          className="qr-image"
          src={source}
          alt={`QR code for the ${challenge.english} challenge`}
        />
      ) : (
        <div className="qr-placeholder" aria-label="Generating QR code" />
      )}
      <div className="card-actions">
        <Button href={route}>Open Challenge</Button>
        <Button secondary onClick={download}>
          Download QR Code
        </Button>
      </div>
    </div>
  );
}

function SkillCard({
  challenge,
  index,
}: {
  challenge: Challenge;
  index: number;
}) {
  return (
    <article className="skill-card">
      <div className="card-number" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </div>
      <div className="card-title-row">
        <div>
          <h2>{challenge.english}</h2>
          <p className="arabic-name" dir="rtl" lang="ar">
            {challenge.arabic}
          </p>
        </div>
      </div>
      <p className="description">{challenge.description}</p>
      <QRCodeImage challenge={challenge} />
    </article>
  );
}

function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="eyebrow">Seven days. One practical skill.</div>
          <h1>Turn the Skill<br />into a <span>Challenge.</span></h1>
          <p className="hero-tagline">
            Discover your skill. Scan the QR code. Complete your 7-day challenge.
          </p>
          <p className="instruction">
            Choose a skill, scan its QR code, and start your personal challenge.
          </p>
          <a className="scroll-link" href="#skills">
            Explore all 18 skills <span aria-hidden="true">↓</span>
          </a>
        </section>

        <section className="skills-section" id="skills">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Challenge library</p>
              <h2>Choose where you’ll grow</h2>
            </div>
            <p>Each challenge includes one focused action per day.</p>
          </div>
          <div className="skill-grid">
            {challenges.map((challenge, index) => (
              <SkillCard key={challenge.slug} challenge={challenge} index={index} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ChallengePage({ challenge }: { challenge: Challenge }) {
  const storageKey = `challenge-progress-${challenge.slug}`;
  const [completed, setCompleted] = useState<boolean[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : Array(7).fill(false);
    } catch {
      return Array(7).fill(false);
    }
  });
  const [copyLabel, setCopyLabel] = useState("Copy Challenge Link");
  const count = completed.filter(Boolean).length;
  const percent = Math.round((count / 7) * 100);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(completed));
  }, [completed, storageKey]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyLabel("Link Copied");
      window.setTimeout(() => setCopyLabel("Copy Challenge Link"), 1800);
    } catch {
      setCopyLabel("Copy unavailable");
    }
  }

  function toggleDay(index: number) {
    setCompleted((current) =>
      current.map((value, dayIndex) => (dayIndex === index ? !value : value)),
    );
  }

  return (
    <>
      <Header />
      <main className="challenge-shell">
        <div className="challenge-nav">
          <Button href="/" secondary>← Back to All Skills</Button>
          <Button onClick={copyLink}>{copyLabel}</Button>
        </div>

        <section className="challenge-intro">
          <p className="section-kicker">7-day challenge</p>
          <h1>{challenge.english}</h1>
          <p className="challenge-arabic" dir="rtl" lang="ar">
            {challenge.arabic}
          </p>
          <p className="challenge-description">{challenge.description}</p>
        </section>

        <section className="challenge-card">
          <div className="progress-heading">
            <div>
              <p className="section-kicker">Your 7-Day Challenge</p>
              <h2>Make progress, one day at a time.</h2>
            </div>
            <div className="progress-count" aria-live="polite">
              <strong>{count}</strong> / 7 complete
            </div>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={7}
            aria-valuenow={count}
            aria-label={`${count} of 7 days completed`}
          >
            <div className="progress-fill" style={{ width: `${percent}%` }} />
          </div>

          <div className="task-list">
            {challenge.tasks.map((task, index) => (
              <label className={`task ${completed[index] ? "task-complete" : ""}`} key={task}>
                <input
                  type="checkbox"
                  checked={completed[index]}
                  onChange={() => toggleDay(index)}
                />
                <span className="custom-checkbox" aria-hidden="true">
                  {completed[index] ? "✓" : ""}
                </span>
                <span className="day-number">Day {index + 1}</span>
                <span className="task-text" dir="rtl" lang="ar">{task}</span>
              </label>
            ))}
          </div>

          <div className="reflection">
            <span className="reflection-label">Reflection</span>
            <p dir="rtl" lang="ar">{challenge.reflection}</p>
          </div>
        </section>

        <div className="challenge-bottom-actions">
          <Button href="/" secondary>← Back to All Skills</Button>
          <Button onClick={copyLink}>{copyLabel}</Button>
        </div>
      </main>
      <Footer />
    </>
  );
}

function NotFound() {
  return (
    <>
      <Header />
      <main className="not-found">
        <p className="section-kicker">Page not found</p>
        <h1>This challenge doesn’t exist.</h1>
        <p>Return to the challenge library and choose a skill to begin.</p>
        <Button href="/">Back to All Skills</Button>
      </main>
    </>
  );
}

function Footer() {
  return (
    <footer>
      <div className="footer-mark">TS</div>
      <p>Discover your skill. Take the challenge. Grow in 7 days.</p>
      <p className="footer-credit">Concept &amp; Challenge Design by Raneem Shehadeh</p>
    </footer>
  );
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  const challenge = useMemo(() => {
    const match = path.match(/^\/challenges\/([^/]+)\/?$/);
    return match ? challenges.find((item) => item.slug === match[1]) : undefined;
  }, [path]);

  if (challenge) return <ChallengePage challenge={challenge} />;
  if (path === "/" || path === "") return <HomePage />;
  return <NotFound />;
}
