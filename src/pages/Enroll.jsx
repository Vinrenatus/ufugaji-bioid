import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addCattle, getAllCattle } from '../utils/database';
import { hammingDistance } from '../utils/imageProcessing';
import './Enroll.css';

const BREEDS = [
  'Boran',
  'Zebu',
  'Ankole',
  'Aberdeen Angus',
  'Hereford',
  'Charolais',
  'Limousin',
  'Simmental',
  'Sahiwal',
  'Gyr',
  'Other'
];

const LOCATIONS = [
  'Turkana',
  'West Pokot',
  'Kajiado',
  'Narok',
  'Samburu',
  'Isiolo',
  'Marsabit',
  'Wajir',
  'Garissa',
  'Mandera',
  'Baringo',
  'Laikipia',
  'Other'
];

function Enroll() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cowName: '',
    ownerName: '',
    breed: 'Boran',
    age: '',
    location: 'Kajiado',
    sex: 'Female',
    color: '',
    notes: ''
  });
  
  const [pendingMuzzleData, setPendingMuzzleData] = useState(() => {
    // Initialize from sessionStorage on first render
    const stored = sessionStorage.getItem('pendingMuzzleData');
    return stored ? JSON.parse(stored) : null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [enrolledCattle, setEnrolledCattle] = useState(() => getAllCattle());
  const [useSample, setUseSample] = useState(false);

  // Initialize enrolled cattle on mount
   
  useEffect(() => {
    // Load enrolled cattle on mount
    setEnrolledCattle(getAllCattle());
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.cowName || !formData.ownerName) {
      setSubmitResult({
        success: false,
        message: 'Cow name and owner name are required'
      });
      return;
    }

    setIsSubmitting(true);

    // Generate feature vector (simulated if no muzzle data)
    let featureVector;
    let muzzleImage;
    let perceptualHash;
    
    if (pendingMuzzleData) {
      featureVector = pendingMuzzleData.featureVector;
      muzzleImage = pendingMuzzleData.image;
      perceptualHash = pendingMuzzleData.perceptualHash;
      
      // Check for duplicate using perceptual hash
      const allCattle = getAllCattle();
      const duplicate = allCattle.find(c => {
        if (!c.perceptualHash || !perceptualHash) return false;
        const distance = hammingDistance(c.perceptualHash, perceptualHash);
        return distance <= 5; // Very similar images
      });
      
      if (duplicate) {
        setSubmitResult({
          success: false,
          message: `⚠️ Duplicate detected! This muzzle matches "${duplicate.cowName}" (Owner: ${duplicate.ownerName}). Same cow already enrolled.`
        });
        setIsSubmitting(false);
        return;
      }
    } else if (useSample) {
      featureVector = Array.from({ length: 28 }, () => Math.random());
      muzzleImage = null;
      perceptualHash = null;
    } else {
      setSubmitResult({
        success: false,
        message: 'Please capture a muzzle print or use sample data for demo'
      });
      setIsSubmitting(false);
      return;
    }

    // Save to database with image and hash
    const newCattle = addCattle({
      ...formData,
      muzzleImage,
      featureVector,
      perceptualHash
    });

    // Clear pending data
    sessionStorage.removeItem('pendingMuzzleData');

    setSubmitResult({
      success: true,
      message: `Successfully enrolled ${formData.cowName}!`,
      cattle: newCattle
    });

    setIsSubmitting(false);
    setEnrolledCattle(getAllCattle());
    
    // Reset form
    setFormData({
      cowName: '',
      ownerName: '',
      breed: 'Boran',
      age: '',
      location: 'Kajiado',
      sex: 'Female',
      color: '',
      notes: ''
    });
    setPendingMuzzleData(null);
    setUseSample(false);
  }

  function handleViewCertificate(id) {
    navigate(`/certificate/${id}`);
  }

  return (
    <div className="enroll-page">
      <div className="container">
        <div className="page-header">
          <Link to="/" className="btn btn-secondary">← Home</Link>
          <h1>📋 Offline Enrollment</h1>
          <div className="header-spacer"></div>
        </div>

        <div className="enroll-info">
          <p><strong>MVP 2:</strong> Register cattle with owner details and muzzle prints. Works offline in remote areas (Turkana, Pokot, Kajiado) with NO internet required.</p>
        </div>

        <div className="enroll-grid">
          {/* Enrollment Form */}
          <div className="enroll-form-card card">
            <div className="card-header">
              <h2 className="card-title">Register New Cattle</h2>
            </div>
            
            {submitResult && (
              <div className={`submit-result ${submitResult.success ? 'success' : 'error'}`}>
                {submitResult.success ? '✅' : '⚠️'} {submitResult.message}
                {submitResult.cattle && (
                  <button 
                    onClick={() => handleViewCertificate(submitResult.cattle.id)}
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: '0.75rem' }}
                  >
                    📜 View Certificate
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-group">
                  <label className="input-label" htmlFor="cowName">Cow Name *</label>
                  <input
                    type="text"
                    id="cowName"
                    name="cowName"
                    className="input"
                    value={formData.cowName}
                    onChange={handleChange}
                    placeholder="e.g., Kamau's Pride"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="ownerName">Owner Name *</label>
                  <input
                    type="text"
                    id="ownerName"
                    name="ownerName"
                    className="input"
                    value={formData.ownerName}
                    onChange={handleChange}
                    placeholder="e.g., John Kamau"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label" htmlFor="breed">Breed</label>
                  <select
                    id="breed"
                    name="breed"
                    className="select"
                    value={formData.breed}
                    onChange={handleChange}
                  >
                    {BREEDS.map(breed => (
                      <option key={breed} value={breed}>{breed}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="location">Location</label>
                  <select
                    id="location"
                    name="location"
                    className="select"
                    value={formData.location}
                    onChange={handleChange}
                  >
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label className="input-label" htmlFor="age">Age</label>
                  <input
                    type="text"
                    id="age"
                    name="age"
                    className="input"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="e.g., 4 years"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="sex">Sex</label>
                  <select
                    id="sex"
                    name="sex"
                    className="select"
                    value={formData.sex}
                    onChange={handleChange}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="color">Color/Markings</label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  className="input"
                  value={formData.color}
                  onChange={handleChange}
                  placeholder="e.g., Brown with white patches"
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  className="input"
                  rows="3"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any distinguishing features..."
                ></textarea>
              </div>

              {/* Muzzle Data Section */}
              <div className="muzzle-data-section">
                <h4>Muzzle Print Data</h4>
                
                {pendingMuzzleData ? (
                  <div className="muzzle-status success">
                    <span className="status-icon">✅</span>
                    <div>
                      <strong>Muzzle print captured</strong>
                      <p>Feature vector ready from Muzzle Mapper</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingMuzzleData(null);
                        sessionStorage.removeItem('pendingMuzzleData');
                      }}
                      className="btn btn-sm btn-secondary"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="muzzle-options">
                    <Link to="/mapper" className="btn btn-primary">
                      📷 Open Muzzle Mapper
                    </Link>
                    
                    <div className="divider">OR</div>
                    
                    <label className="sample-data-option">
                      <input
                        type="checkbox"
                        checked={useSample}
                        onChange={(e) => setUseSample(e.target.checked)}
                      />
                      <span>Use sample data for demo (no camera required)</span>
                    </label>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="btn btn-success btn-block"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enrolling...' : '✓ Enroll Cattle'}
              </button>
            </form>
          </div>

          {/* Recently Enrolled */}
          <div className="recent-enrollments card">
            <div className="card-header">
              <h2 className="card-title">Recently Enrolled</h2>
              <span className="badge badge-primary">{enrolledCattle.length} Total</span>
            </div>

            {enrolledCattle.length === 0 ? (
              <div className="empty-state">
                <p>No cattle enrolled yet.</p>
                <p>Start by registering your first cow!</p>
              </div>
            ) : (
              <div className="enrollment-list">
                {enrolledCattle.slice(-5).reverse().map(cattle => (
                  <div key={cattle.id} className="enrollment-item">
                    <div className="enrollment-info">
                      <h4>{cattle.cowName}</h4>
                      <p>Owner: {cattle.ownerName}</p>
                      <p className="enrollment-meta">
                        <span>{cattle.breed}</span> • <span>{cattle.location}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewCertificate(cattle.id)}
                      className="btn btn-sm btn-secondary"
                    >
                      📜 Certificate
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="offline-badge">
              <span className="badge badge-success">📡 Works Offline</span>
              <p>All data stored locally on device</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Enroll;
