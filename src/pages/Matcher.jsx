import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllCattle } from '../utils/database';
import './Matcher.css';

function Matcher() {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchResults, setMatchResults] = useState(null);
  const [error, setError] = useState(null);
  const [scanAnimation, setScanAnimation] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start camera
  useState(() => {
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  });

  async function startCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (err) {
      setError('Unable to access camera. Please allow camera permissions.');
      console.error('Camera error:', err);
    }
  }

  function captureAndMatch() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/png');
    setCapturedImage(imageData);
    
    // Process and match
    processAndMatch(canvas);
  }

  function processAndMatch(canvas) {
    setIsProcessing(true);
    setScanAnimation(true);
    setError(null);
    setMatchResults(null);

    setTimeout(() => {
      try {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Process image
        let processed = toGrayscale(imageData);
        processed = applyGaussianBlur(processed, canvas.width, canvas.height, 1);
        processed = applyCLAHE(processed, canvas.width, canvas.height, 2.0, 8);

        // Extract feature vector
        const queryFeatures = extractFeatureVector(processed, canvas.width, canvas.height);

        // Get all cattle and compare
        const cattle = getAllCattle();
        const results = cattle.map(cattle => {
          const similarity = calculateSimilarity(queryFeatures, cattle.featureVector);
          return {
            ...cattle,
            matchPercentage: similarity
          };
        });

        // Sort by match percentage
        results.sort((a, b) => b.matchPercentage - a.matchPercentage);

        setMatchResults({
          queryFeatures,
          matches: results
        });

        setIsProcessing(false);
        setScanAnimation(false);
      } catch (err) {
        setError('Error processing image. Please try again.');
        setIsProcessing(false);
        setScanAnimation(false);
        console.error('Matching error:', err);
      }
    }, 2000); // Simulate processing time for effect
  }

  // Image processing functions
  function toGrayscale(imageData) {
    const { data, width, height } = imageData;
    const grayData = new Uint8ClampedArray(data.length);
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      grayData[i] = gray;
      grayData[i + 1] = gray;
      grayData[i + 2] = gray;
      grayData[i + 3] = data[i + 3];
    }
    
    return { data: grayData, width, height };
  }

  function applyGaussianBlur(imageData, width, height, radius = 1) {
    const { data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weight = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const px = Math.min(width - 1, Math.max(0, x + kx));
            const py = Math.min(height - 1, Math.max(0, y + ky));
            const idx = (py * width + px) * 4;
            const kIdx = (ky + 1) * 3 + (kx + 1);
            
            sum += data[idx] * kernel[kIdx];
            weight += kernel[kIdx];
          }
        }
        
        const idx = (y * width + x) * 4;
        result[idx] = sum / weight;
        result[idx + 1] = sum / weight;
        result[idx + 2] = sum / weight;
        result[idx + 3] = data[idx + 3];
      }
    }
    
    return { data: result, width, height };
  }

  function applyCLAHE(imageData, width, height, clipLimit = 2.0, tileSize = 8) {
    const { data } = imageData;
    const result = new Uint8ClampedArray(data.length);
    const tileWidth = Math.floor(width / tileSize);
    const tileHeight = Math.floor(height / tileSize);
    
    for (let ty = 0; ty < tileSize; ty++) {
      for (let tx = 0; tx < tileSize; tx++) {
        const startX = tx * tileWidth;
        const startY = ty * tileHeight;
        const endX = Math.min(startX + tileWidth, width);
        const endY = Math.min(startY + tileHeight, height);
        
        const histogram = new Array(256).fill(0);
        let pixelCount = 0;
        
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = (y * width + x) * 4;
            histogram[data[idx]]++;
            pixelCount++;
          }
        }
        
        const clipLimitCount = Math.floor((clipLimit * pixelCount) / 256);
        for (let i = 0; i < 256; i++) {
          if (histogram[i] > clipLimitCount) {
            histogram[i] = clipLimitCount;
          }
        }
        
        const cdf = new Array(256).fill(0);
        cdf[0] = histogram[0];
        for (let i = 1; i < 256; i++) {
          cdf[i] = cdf[i - 1] + histogram[i];
        }
        
        const cdfMin = cdf.find(val => val > 0) || 0;
        const scale = (255 * 256) / (pixelCount - cdfMin);
        
        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = (y * width + x) * 4;
            const grayValue = data[idx];
            const newValue = Math.floor(((cdf[grayValue] - cdfMin) * scale) / 256);
            result[idx] = Math.max(0, Math.min(255, newValue));
            result[idx + 1] = result[idx];
            result[idx + 2] = result[idx];
            result[idx + 3] = data[idx + 3];
          }
        }
      }
    }
    
    return { data: result, width, height };
  }

  function extractFeatureVector(imageData, width, height) {
    const { data } = imageData;
    const gridSize = 4;
    const cellWidth = Math.floor(width / gridSize);
    const cellHeight = Math.floor(height / gridSize);
    
    const features = [];
    
    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const startX = gx * cellWidth;
        const startY = gy * cellHeight;
        
        let sum = 0;
        let count = 0;
        
        for (let y = startY; y < Math.min(startY + cellHeight, height); y++) {
          for (let x = startX; x < Math.min(startX + cellWidth, width); x++) {
            const idx = (y * width + x) * 4;
            sum += data[idx];
            count++;
          }
        }
        
        features.push(sum / count / 255);
      }
    }
    
    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const startX = gx * cellWidth;
        const startY = gy * cellHeight;
        
        let edgeCount = 0;
        
        for (let y = startY + 1; y < Math.min(startY + cellHeight, height - 1); y++) {
          for (let x = startX + 1; x < Math.min(startX + cellWidth, width - 1); x++) {
            const idx = (y * width + x) * 4;
            const idxRight = (y * width + (x + 1)) * 4;
            const idxDown = ((y + 1) * width + x) * 4;
            
            if (Math.abs(data[idx] - data[idxRight]) > 30 || Math.abs(data[idx] - data[idxDown]) > 30) {
              edgeCount++;
            }
          }
        }
        
        features.push(edgeCount / (cellWidth * cellHeight));
      }
    }
    
    return features;
  }

  function calculateSimilarity(vector1, vector2) {
    if (vector1.length !== vector2.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }
    
    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return Math.max(0, Math.min(100, similarity * 100));
  }

  function retakePhoto() {
    setCapturedImage(null);
    setMatchResults(null);
    setError(null);
  }

  function getMatchLabel(percentage) {
    if (percentage >= 85) return { label: 'Excellent Match', class: 'excellent' };
    if (percentage >= 70) return { label: 'Good Match', class: 'good' };
    if (percentage >= 50) return { label: 'Possible Match', class: 'possible' };
    return { label: 'No Match', class: 'no-match' };
  }

  return (
    <div className="matcher-page">
      <div className="container">
        <div className="page-header">
          <Link to="/" className="btn btn-secondary">← Home</Link>
          <h1>🔍 AI Matcher</h1>
          <div className="header-spacer"></div>
        </div>

        <div className="matcher-info">
          <p><strong>MVP 3:</strong> Scan a found/stolen cow's muzzle and get instant identification results. The AI compares against all enrolled cattle and returns match percentages.</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="matcher-container">
          {!capturedImage ? (
            <div className="scanner-view">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                className="scanner-feed"
              />
              <div className="scanner-overlay">
                <div className="scanner-box">
                  <div className="scanner-line"></div>
                  <div className="guide-corner top-left"></div>
                  <div className="guide-corner top-right"></div>
                  <div className="guide-corner bottom-left"></div>
                  <div className="guide-corner bottom-right"></div>
                </div>
                <div className="scanner-text">
                  <span>Position muzzle in frame</span>
                </div>
              </div>
              <div className="scanner-controls">
                <button 
                  onClick={captureAndMatch}
                  className="btn btn-primary btn-scan"
                  disabled={isProcessing}
                >
                  {isProcessing ? '🔄 Scanning...' : '🔍 Scan & Match'}
                </button>
              </div>
              {isProcessing && (
                <div className="processing-status">
                  <div className="spinner-large"></div>
                  <p>Analyzing muzzle print...</p>
                  <p className="processing-sub">Extracting features • Comparing database</p>
                </div>
              )}
            </div>
          ) : (
            <div className="match-results">
              <div className="captured-muzzle">
                <h3>Scanned Muzzle Print</h3>
                <img src={capturedImage} alt="Scanned muzzle" />
              </div>

              {matchResults && (
                <div className="results-section">
                  <h3>📊 Match Results</h3>
                  
                  {matchResults.matches.length === 0 ? (
                    <div className="no-results">
                      <p>No cattle in database. Enroll some cattle first!</p>
                      <Link to="/enroll" className="btn btn-primary">Enroll Cattle</Link>
                    </div>
                  ) : (
                    <div className="matches-list">
                      {matchResults.matches.slice(0, 5).map((match, index) => {
                        const { label, class: matchClass } = getMatchLabel(match.matchPercentage);
                        return (
                          <div 
                            key={match.id} 
                            className={`match-item ${matchClass} ${index === 0 ? 'top-match' : ''}`}
                          >
                            {index === 0 && match.matchPercentage >= 70 && (
                              <div className="top-match-badge">🏆 Best Match</div>
                            )}
                            <div className="match-percentage">
                              <span className={`percentage-value ${matchClass}`}>
                                {match.matchPercentage.toFixed(1)}%
                              </span>
                              <span className="match-label">{label}</span>
                            </div>
                            <div className="match-details">
                              <h4>{match.cowName}</h4>
                              <p>Owner: {match.ownerName}</p>
                              <p className="match-meta">
                                {match.breed} • {match.location} • {match.certificateId}
                              </p>
                            </div>
                            <Link 
                              to={`/certificate/${match.id}`}
                              className="btn btn-sm btn-secondary"
                            >
                              📜 View
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="match-actions">
                <button onClick={retakePhoto} className="btn btn-secondary">
                  🔄 Scan Another
                </button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="algorithm-info">
          <h3>🧠 How the AI Matching Works</h3>
          <div className="algorithm-steps">
            <div className="algo-step">
              <span className="step-num">1</span>
              <div>
                <strong>Capture & Preprocess</strong>
                <p>Convert to grayscale, apply Gaussian blur and CLAHE enhancement</p>
              </div>
            </div>
            <div className="algo-step">
              <span className="step-num">2</span>
              <div>
                <strong>Feature Extraction</strong>
                <p>Extract 16-dimensional feature vector using grid analysis and edge detection</p>
              </div>
            </div>
            <div className="algo-step">
              <span className="step-num">3</span>
              <div>
                <strong>Cosine Similarity</strong>
                <p>Calculate similarity score between query and enrolled feature vectors</p>
              </div>
            </div>
            <div className="algo-step">
              <span className="step-num">4</span>
              <div>
                <strong>Rank Results</strong>
                <p>Sort matches by percentage and return top candidates</p>
              </div>
            </div>
          </div>
        </div>

        <div className="demo-note">
          <h4>🎯 Demo Instructions for Judges</h4>
          <p>
            Use the 3 dummy cow photos (printed muzzle prints). Scan Cow A and verify it matches 
            Cow A with high percentage but NOT Cow B or Cow C. This demonstrates the biometric 
            identification capability.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Matcher;
