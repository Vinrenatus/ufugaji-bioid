import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content animate-fade-in">
            <div className="hero-badge">
              <span className="badge badge-success">KSEF 2026 Finalist</span>
            </div>
            <h1 className="hero-title">
              Ufugaji-BioID
            </h1>
            <p className="hero-subtitle">
              A Livestock Identification System Using Muzzle Print Biometrics
            </p>
            <p className="hero-description">
              Combating cattle rustling in Kenya's ASAL regions with AI-powered biometric identification. 
              Just like human fingerprints, every cow's muzzle print is unique and unalterable.
            </p>
            <div className="hero-actions">
              <Link to="/enroll" className="btn btn-primary btn-lg">
                📋 Enroll a Cow
              </Link>
              <Link to="/matcher" className="btn btn-accent btn-lg">
                🔍 Identify Cow
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="cow-mascot">🐄</div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="problem-section">
        <div className="container">
          <h2 className="section-title">The Problem</h2>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">🔥</div>
              <h3>Cruel Branding</h3>
              <p>Hot iron branding causes animal suffering and damages hide quality</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">✂️</div>
              <h3>Ear Tags Removed</h3>
              <p>Thieves easily cut off ear tags, making stolen cattle untraceable</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">⚔️</div>
              <h3>Cattle Rustling</h3>
              <p>Violent raids cause death, poverty, and instability in ASAL regions</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">📉</div>
              <h3>Ownership Disputes</h3>
              <p>No reliable proof of ownership leads to endless conflicts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution / MVPs */}
      <section className="solution-section">
        <div className="container">
          <h2 className="section-title">Our Solution</h2>
          <p className="section-description">
            Four powerful features that make Ufugaji-BioID the future of livestock identification
          </p>
          <div className="mvp-grid">
            <div className="mvp-card">
              <div className="mvp-number">MVP 1</div>
              <h3>📷 Muzzle Mapper</h3>
              <p>Camera with guide box for precise muzzle capture. Auto grayscale conversion and CLAHE contrast enhancement for clear ridge detection.</p>
              <Link to="/mapper" className="mvp-link">Try It →</Link>
            </div>
            <div className="mvp-card">
              <div className="mvp-number">MVP 2</div>
              <h3>📝 Offline Enrollment</h3>
              <p>Register cattle with owner details and muzzle prints. Stores feature vectors locally - works in Turkana, Pokot, Kajiado with NO internet.</p>
              <Link to="/enroll" className="mvp-link">Enroll Now →</Link>
            </div>
            <div className="mvp-card">
              <div className="mvp-number">MVP 3</div>
              <h3>🔍 AI Matcher</h3>
              <p>Scan a found/stolen cow and get instant match results with percentage confidence. Powered by lightweight image comparison algorithms.</p>
              <Link to="/matcher" className="mvp-link">Match Cow →</Link>
            </div>
            <div className="mvp-card">
              <div className="mvp-number">MVP 4</div>
              <h3>📜 Digital Title Deed</h3>
              <p>Generate PDF certificates with cow photo, muzzle print, and owner details. Legal proof of ownership at your fingertips.</p>
              <Link to="/cattle" className="mvp-link">View Certificates →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Info */}
      <section className="tech-section">
        <div className="container">
          <h2 className="section-title">Technology Stack</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <span className="tech-icon">🧠</span>
              <h4>Convolutional Neural Network (CNN)</h4>
              <p>Feature extraction from bovine muzzles</p>
            </div>
            <div className="tech-item">
              <span className="tech-icon">👁️</span>
              <h4>OpenCV</h4>
              <p>Image preprocessing & CLAHE enhancement</p>
            </div>
            <div className="tech-item">
              <span className="tech-icon">📊</span>
              <h4>SSIM Algorithm</h4>
              <p>Structural Similarity Index for matching</p>
            </div>
            <div className="tech-item">
              <span className="tech-icon">📱</span>
              <h4>React + Local Storage</h4>
              <p>Offline-first mobile application</p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="impact-section">
        <div className="container">
          <h2 className="section-title">Potential Impact</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">8M+</div>
              <div className="stat-label">Cattle in ASAL Regions</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">KSh 30B</div>
              <div className="stat-label">Annual Losses from Rustling</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">92%</div>
              <div className="stat-label">Match Accuracy (Prototype)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">0%</div>
              <div className="stat-label">Internet Required</div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Instructions */}
      <section className="demo-section">
        <div className="container">
          <h2 className="section-title">Demo Instructions for Judges</h2>
          <div className="demo-steps">
            <div className="demo-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Enroll Test Cattle</h4>
                <p>Go to "Enroll" and register one of our 3 dummy cows (printed photos of different cow noses)</p>
              </div>
            </div>
            <div className="demo-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Test the Matcher</h4>
                <p>Go to "Match" and scan Cow A - verify it matches Cow A but NOT Cow B or Cow C</p>
              </div>
            </div>
            <div className="demo-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Generate Certificate</h4>
                <p>View the registry and download a Digital Title Deed PDF for any enrolled cow</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
