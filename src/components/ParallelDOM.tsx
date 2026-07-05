// A parallel, crawlable DOM (§22). Every experience beat is mirrored in real,
// semantic HTML behind the canvas so screen-readers, search engines and the
// no-WebGL path all get the full content. Visually hidden, not display:none —
// it must remain in the accessibility tree. The skip-link targets #content.

export default function ParallelDOM() {
  return (
    <main id="content" className="sr-only">
      <h1>Aakash Pahuja — Senior Associate Product Manager</h1>
      <p>I turn ambiguous programmes into shipped products.</p>
      <p>Anyone can vibe-code. Products people love are an obsession.</p>

      <section aria-label="Shipped apps">
        <h2>Apps I've shipped</h2>
        <ul>
          <li>
            <strong>Spends</strong> — an offline-first, privacy-first expense tracker
            (Kotlin/Compose, Material 3). Money stored as integer paise, entirely on-device.
          </li>
          <li>
            <strong>Notification Digest</strong> — intercepts notifications, stores them
            privately on-device, and delivers clean digests at chosen times while keeping
            critical apps real-time.
          </li>
          <li>
            <strong>ColorCloset</strong> — turns your wardrobe colours into a swipeable deck of
            outfit pairings, tuned to skin tone and grounded in colour science.
          </li>
          <li>
            <strong>Pause</strong> — a minimal doom-scroll interrupter that shows a brief
            full-screen overlay after continuous time in a chosen app. No accounts, no analytics.
          </li>
        </ul>
      </section>

      <section aria-label="Product work">
        <h2>Product work</h2>
        <p>
          ComXHub Intake &amp; Governance Portal (current) — product strategy for an enterprise
          single digital entry point managing the lifecycle of servicing communications; authored
          the Phase-1 MVP PRD and Jira backlog (18 features, 76 user stories); specified RBAC,
          audit trail, versioning, workflow and an embedded self-service mockup editor with
          AI-assisted mockups.
        </p>
        <p>
          Raven Migration (completed) — discovery and migration of 322 legacy templates across 19
          markets; delivered 170 communications via the new platform.
        </p>
        <p>
          Business Systems Analyst / UAT — 90+ projects, 500+ communications, 100% stakeholder
          satisfaction; +50% throughput (300→450 per sprint); a Jira bulk test-case process that
          improved efficiency by 94%.
        </p>
      </section>

      <section aria-label="Beyond work">
        <h2>Beyond work</h2>
        <p>Fitness: lifted 9,775 kg since 2022 (tracked on Hevy).</p>
        <p>Guitar &amp; singing; gaming — Elden Ring, Black Myth: Wukong, God of War.</p>
      </section>

      <nav aria-label="Links">
        <ul>
          <li><a href="https://github.com/aucksy">GitHub — github.com/aucksy</a></li>
          <li><a href="https://instagram.com/aakashpahuja108">Instagram — aakashpahuja108</a></li>
          <li><a href="https://hevy.com/user/aucksy">Hevy — hevy.com/user/aucksy</a></li>
        </ul>
      </nav>
    </main>
  );
}
