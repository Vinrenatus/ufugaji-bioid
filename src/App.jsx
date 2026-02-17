import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import MuzzleMapper from './pages/MuzzleMapper';
import Enroll from './pages/Enroll';
import Matcher from './pages/Matcher';
import CattleList from './pages/CattleList';
import Certificate from './pages/Certificate';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <Link to="/" className="logo">
              <span className="logo-icon">🐄</span>
              <div className="logo-text">
                <h1>Ufugaji-BioID</h1>
                <span className="tagline">Livestock Muzzle Print Biometrics</span>
              </div>
            </Link>
            <nav className="main-nav">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/enroll" className="nav-link">Enroll</Link>
              <Link to="/matcher" className="nav-link">Match</Link>
              <Link to="/cattle" className="nav-link">Registry</Link>
            </nav>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mapper" element={<MuzzleMapper />} />
            <Route path="/enroll" element={<Enroll />} />
            <Route path="/matcher" element={<Matcher />} />
            <Route path="/cattle" element={<CattleList />} />
            <Route path="/certificate/:id" element={<Certificate />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <p>KSEF 2026 | Computer Science - AI & Computer Systems</p>
            <p className="footer-tagline">Securing Kenya's Livestock, One Muzzle Print at a Time</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
