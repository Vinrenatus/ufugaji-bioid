import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllCattle, getStats, deleteCattle } from '../utils/database';
import './CattleList.css';

function CattleList() {
  const [cattle, setCattle] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBreed, setFilterBreed] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');

  const loadCattle = useCallback(() => {
    const allCattle = getAllCattle();
    const allStats = getStats();
    setCattle(allCattle);
    setStats(allStats);
  }, []);

  // Initialize cattle data on mount
   
  useEffect(() => {
    loadCattle();
  }, [loadCattle]);

  function handleDelete(id) {
    if (window.confirm('Are you sure you want to delete this cattle record?')) {
      deleteCattle(id);
      loadCattle();
    }
  }

  function handleExport() {
    const dataStr = JSON.stringify(cattle, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ufugaji-bioid-registry-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Filter cattle
  const filteredCattle = cattle.filter(c => {
    const matchesSearch = searchTerm === '' || 
      c.cowName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBreed = filterBreed === 'all' || c.breed === filterBreed;
    const matchesLocation = filterLocation === 'all' || c.location === filterLocation;
    
    return matchesSearch && matchesBreed && matchesLocation;
  });

  // Get unique breeds and locations for filters
  const breeds = [...new Set(cattle.map(c => c.breed))];
  const locations = [...new Set(cattle.map(c => c.location))];

  return (
    <div className="cattle-list-page">
      <div className="container">
        <div className="page-header">
          <Link to="/" className="btn btn-secondary">← Home</Link>
          <h1>📜 Cattle Registry</h1>
          <div className="header-actions">
            <button onClick={handleExport} className="btn btn-secondary">
              📥 Export
            </button>
            <Link to="/enroll" className="btn btn-primary">
              + Enroll New
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Cattle</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Object.keys(stats.breedCount).length}</div>
              <div className="stat-label">Breeds</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{Object.keys(stats.locationCount).length}</div>
              <div className="stat-label">Locations</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">100%</div>
              <div className="stat-label">Offline</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section card">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">🔍 Search</label>
              <input
                type="text"
                className="input"
                placeholder="Search by name, owner, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">🐄 Breed</label>
              <select
                className="select"
                value={filterBreed}
                onChange={(e) => setFilterBreed(e.target.value)}
              >
                <option value="all">All Breeds</option>
                {breeds.map(breed => (
                  <option key={breed} value={breed}>{breed}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">📍 Location</label>
              <select
                className="select"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              >
                <option value="all">All Locations</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cattle List */}
        <div className="cattle-grid">
          {filteredCattle.length === 0 ? (
            <div className="empty-state-card card">
              <div className="empty-state">
                <span className="empty-icon">🐄</span>
                <h3>No Cattle Found</h3>
                <p>
                  {cattle.length === 0 
                    ? "You haven't enrolled any cattle yet. Start by registering your first cow!"
                    : "No cattle match your search criteria."}
                </p>
                {cattle.length === 0 && (
                  <Link to="/enroll" className="btn btn-primary">
                    Enroll First Cattle
                  </Link>
                )}
              </div>
            </div>
          ) : (
            filteredCattle.map(cow => (
              <div key={cow.id} className="cattle-card card">
                <div className="cattle-card-header">
                  <div className="certificate-badge">
                    <span className="badge badge-primary">{cow.certificateId}</span>
                  </div>
                  <div className="cattle-actions">
                    <Link 
                      to={`/certificate/${cow.id}`}
                      className="btn btn-sm btn-secondary"
                    >
                      📜 Certificate
                    </Link>
                    <button
                      onClick={() => handleDelete(cow.id)}
                      className="btn btn-sm btn-secondary delete-btn"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="cattle-info">
                  <div className="cattle-main">
                    <h3 className="cattle-name">{cow.cowName}</h3>
                    <p className="cattle-owner">Owner: {cow.ownerName}</p>
                  </div>
                  
                  <div className="cattle-details">
                    <div className="detail-item">
                      <span className="detail-label">Breed</span>
                      <span className="detail-value">{cow.breed}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Location</span>
                      <span className="detail-value">{cow.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Age</span>
                      <span className="detail-value">{cow.age || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Sex</span>
                      <span className="detail-value">{cow.sex || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="cattle-meta">
                    <span>Registered: {cow.registrationDate}</span>
                    {cow.featureVector && (
                      <span className="biometric-badge">
                        ✅ Biometric ID Stored
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* MVP4 Info */}
        <div className="mvp4-info card">
          <h3>📜 MVP 4: Digital Title Deed</h3>
          <p>
            Each enrolled cattle receives a unique certificate ID and a downloadable PDF certificate 
            with the cow's photo, muzzle print, and owner details. This serves as legal proof of 
            ownership in case of disputes or theft.
          </p>
          <div className="certificate-features">
            <div className="cert-feature">
              <span className="feature-icon">🔐</span>
              <span>Unique Certificate ID</span>
            </div>
            <div className="cert-feature">
              <span className="feature-icon">📷</span>
              <span>Muzzle Print Image</span>
            </div>
            <div className="cert-feature">
              <span className="feature-icon">👤</span>
              <span>Owner Details</span>
            </div>
            <div className="cert-feature">
              <span className="feature-icon">📱</span>
              <span>Downloadable PDF</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CattleList;
