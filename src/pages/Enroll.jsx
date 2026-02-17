import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addCattle, getAllCattle } from '../utils/database';
import { hammingDistance } from '../utils/imageProcessing';
import './Enroll.css';

// Breed options
const BREEDS = [
  'Select Breed',
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
  'Ayrshire',
  'Friesian',
  'Jersey',
  'Guernsey',
  'Holstein',
  'Dexter',
  'Highland',
  'Belgian Blue',
  'Wagyu',
  'Other'
];

// Location options (Kenyan counties + regions)
const LOCATIONS = [
  'Select Location',
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
  'Nakuru',
  'Uasin Gishu',
  'Trans Nzoia',
  'Elgeyo Marakwet',
  'Nandi',
  'Bomet',
  'Kericho',
  'Bomet',
  'Nandi',
  'Kakamega',
  'Vihiga',
  'Bungoma',
  'Busia',
  'Siaya',
  'Kisumu',
  'Homa Bay',
  'Migori',
  'Kisii',
  'Nyamira',
  'Nairobi',
  'Kiambu',
  'Murang\'a',
  'Nyeri',
  'Kirinyaga',
  'Embu',
  'Tharaka Nithi',
  'Meru',
  'Isiolo',
  'Machakos',
  'Makueni',
  'Kitui',
  'Kilifi',
  'Kwale',
  'Mombasa',
  'Taita Taveta',
  'Lamu',
  'Tana River',
  'Other'
];

// Age options
const AGES = [
  'Select Age',
  'Calf (0-6 months)',
  'Weaner (6-12 months)',
  'Yearling (1-2 years)',
  '2 years',
  '3 years',
  '4 years',
  '5 years',
  '6 years',
  '7 years',
  '8 years',
  '9 years',
  '10 years',
  '11 years',
  '12 years',
  '13+ years'
];

// Sex options
const SEXES = [
  'Select Sex',
  'Female (Cow/Heifer)',
  'Male (Bull/Steer)',
  'Female (Cow)',
  'Female (Heifer)',
  'Male (Bull)',
  'Male (Steer)',
  'Calf (Unknown)'
];

// Color/Markings options (Top 10+ for cattle)
const COLORS = [
  'Select Color/Markings',
  'Solid Black',
  'Solid Brown',
  'Solid Red',
  'Solid White',
  'Black and White (Piebald)',
  'Brown and White',
  'Red and White',
  'Black with White Face',
  'Brown with White Face',
  'Spotted/Speckled',
  'Brindle',
  'Roan (Red)',
  'Roan (Blue)',
  'Dun',
  'Gray',
  'Yellow/Tan',
  'Belted (Dutch Belt)',
  'Lineback',
  'Other'
];

function Enroll() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cowName: '',
    ownerName: '',
    breed: 'Select Breed',
    age: 'Select Age',
    location: 'Select Location',
    sex: 'Select Sex',
    color: 'Select Color/Markings',
    notes: ''
  });

  const [pendingMuzzleData, setPendingMuzzleData] = useState(() => {
    const stored = sessionStorage.getItem('pendingMuzzleData');
    return stored ? JSON.parse(stored) : null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [enrolledCattle, setEnrolledCattle] = useState(() => getAllCattle());
  const [useSample, setUseSample] = useState(false);

  useEffect(() => {
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

    // Validate required dropdowns
    if (formData.breed === 'Select Breed') {
      setSubmitResult({
        success: false,
        message: 'Please select a breed'
      });
      return;
    }

    if (formData.location === 'Select Location') {
      setSubmitResult({
        success: false,
        message: 'Please select a location'
      });
      return;
    }

    if (formData.sex === 'Select Sex') {
      setSubmitResult({
        success: false,
        message: 'Please select sex'
      });
      return;
    }

    setIsSubmitting(true);

    // Generate feature vector and metadata
    let featureVector;
    let muzzleImage;
    let perceptualHash;
    let bioData;

    if (pendingMuzzleData) {
      featureVector = pendingMuzzleData.featureVector;
      muzzleImage = pendingMuzzleData.image;
      perceptualHash = pendingMuzzleData.perceptualHash;

      // Create bio-data feature vector for latent matching
      bioData = createBioDataVector(formData);

      // Check for duplicate using perceptual hash
      const allCattle = getAllCattle();
      const duplicate = allCattle.find(c => {
        if (!c.perceptualHash || !perceptualHash) return false;
        const distance = hammingDistance(c.perceptualHash, perceptualHash);
        return distance <= 150; // Very similar images
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
      bioData = createBioDataVector(formData);
    } else {
      setSubmitResult({
        success: false,
        message: 'Please capture a muzzle print or use sample data for demo'
      });
      setIsSubmitting(false);
      return;
    }

    // Save to database with image, hash, and bio-data
    const newCattle = addCattle({
      ...formData,
      muzzleImage,
      featureVector,
      perceptualHash,
      bioData,
      bioDataId: `BIO-${Date.now()}`
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
      breed: 'Select Breed',
      age: 'Select Age',
      location: 'Select Location',
      sex: 'Select Sex',
      color: 'Select Color/Markings',
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
              <div className="form-section">
                <h3 className="section-title">📝 Basic Information</h3>

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
              </div>

              <div className="form-section">
                <h3 className="section-title">🐄 Physical Characteristics</h3>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label" htmlFor="breed">Breed *</label>
                    <select
                      id="breed"
                      name="breed"
                      className="select"
                      value={formData.breed}
                      onChange={handleChange}
                      required
                    >
                      {BREEDS.map((breed, idx) => (
                        <option key={idx} value={breed}>{breed}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="sex">Sex *</label>
                    <select
                      id="sex"
                      name="sex"
                      className="select"
                      value={formData.sex}
                      onChange={handleChange}
                      required
                    >
                      {SEXES.map((sex, idx) => (
                        <option key={idx} value={sex}>{sex}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label" htmlFor="age">Age *</label>
                    <select
                      id="age"
                      name="age"
                      className="select"
                      value={formData.age}
                      onChange={handleChange}
                      required
                    >
                      {AGES.map((age, idx) => (
                        <option key={idx} value={age}>{age}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="color">Color/Markings *</label>
                    <select
                      id="color"
                      name="color"
                      className="select"
                      value={formData.color}
                      onChange={handleChange}
                      required
                    >
                      {COLORS.map((color, idx) => (
                        <option key={idx} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="location">Location *</label>
                  <select
                    id="location"
                    name="location"
                    className="select"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  >
                    {LOCATIONS.map((loc, idx) => (
                      <option key={idx} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">📝 Additional Information</h3>

                <div className="input-group">
                  <label className="input-label" htmlFor="notes">Additional Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="input"
                    rows="3"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any distinguishing features, behavior, health status..."
                  ></textarea>
                </div>
              </div>

              {/* Muzzle Data Section */}
              <div className="muzzle-data-section">
                <h4>Muzzle Print Data</h4>

                {pendingMuzzleData ? (
                  <div className="muzzle-status success">
                    <span className="status-icon">✅</span>
                    <div>
                      <strong>Muzzle print captured</strong>
                      <p>Feature vector and biometric hash ready from Muzzle Mapper</p>
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

/**
 * Create bio-data feature vector for latent matching
 * Encodes categorical data into numeric features
 */
function createBioDataVector(formData) {
  const bioData = {
    breedId: BREEDS.indexOf(formData.breed),
    locationId: LOCATIONS.indexOf(formData.location),
    ageId: AGES.indexOf(formData.age),
    sexId: SEXES.indexOf(formData.sex),
    colorId: COLORS.indexOf(formData.color),
    // Normalized values for matching (0-1 range)
    breedScore: BREEDS.indexOf(formData.breed) / BREEDS.length,
    locationScore: LOCATIONS.indexOf(formData.location) / LOCATIONS.length,
    ageScore: AGES.indexOf(formData.age) / AGES.length,
    sexScore: SEXES.indexOf(formData.sex) / SEXES.length,
    colorScore: COLORS.indexOf(formData.color) / COLORS.length
  };

  // Create combined bio-feature vector (5 features)
  bioData.vector = [
    bioData.breedScore,
    bioData.locationScore,
    bioData.ageScore,
    bioData.sexScore,
    bioData.colorScore
  ];

  return bioData;
}

export default Enroll;
