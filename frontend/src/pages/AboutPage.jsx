
export default function AboutPage() {
  return (
    <section className="page">
      <header>
        <div>
          <p className="eyebrow">Application Information</p>
          <h1>About</h1>
        </div>
      </header>

      <div className="about-content">
        <img
          src="/images/danish.jpg"
          alt="Danish"
          className="about-photo"
        />

        <div className="about-description">
          <h2>FCHRM</h2>
          <p>
            FCHRM (Football Club Human Resource Management) is a web-based
            application developed by Danish as part of the Mobile Device
            Programming course. This application is designed to simplify
            human resource management in football clubs, including player
            and staff management, contracts, payroll, documents, and club
            activities.
          </p>
          <span>Made by Danish · 2026</span>
        </div>
      </div>
    </section>
  );
}
