import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { validateMuzzleImage, toGrayscale, applyGaussianBlur, applyCLAHE, extractFeatureVector } from '../utils/imageProcessing';
import './MuzzleMapper.css';

function MuzzleMapper() {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [featureVector, setFeatureVector] = useState(null);
  const [validation, setValidation] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showGuide, setShowGuide] = useState(true);
  const [cameraUnavailable, setCameraUnavailable] = useState(false);
  const [captureMode, setCaptureMode] = useState('camera'); // 'camera' or 'upload'
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initCamera = async () => {
      if (captureMode === 'camera' && !capturedImage && !cameraUnavailable) {
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
            setCameraUnavailable(false);
          }
        } catch (err) {
          console.error('Camera error:', err);
          setCameraUnavailable(true);
          setCaptureMode('upload');
          setError('Camera access unavailable. Please upload an image of the cow muzzle instead.');
        }
      }
    };
    
    initCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captureMode, capturedImage, cameraUnavailable]);

  function captureImage() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/png');
    setCapturedImage(imageDataUrl);
    processImage(canvas);
  }

  function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, or WebP)');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file is too large. Maximum size is 10MB.');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageDataUrl = e.target.result;
      setCapturedImage(imageDataUrl);
      
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Optimize image size for processing
        const maxSize = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        processImage(canvas);
      };
      img.onerror = () => {
        setError('Error loading image. Please try another file.');
      };
      img.src = imageDataUrl;
    };
    
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(file);
  }

  function processImage(canvas) {
    setIsProcessing(true);
    setError(null);

    setTimeout(() => {
      try {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Validate muzzle image with AI
        const validationResult = validateMuzzleImage(imageData);
        setValidation(validationResult);

        // Image processing pipeline
        let processed = toGrayscale(imageData);
        processed = applyGaussianBlur(processed, canvas.width, canvas.height, 1);
        processed = applyCLAHE(processed, canvas.width, canvas.height, 2.0, 8);

        // Draw processed image
        const processedCanvas = processedCanvasRef.current;
        if (processedCanvas) {
          processedCanvas.width = canvas.width;
          processedCanvas.height = canvas.height;
          const processedCtx = processedCanvas.getContext('2d');
          processedCtx.putImageData(processed, 0, 0);
          setProcessedImage(processedCanvas.toDataURL('image/png'));
        }

        // Extract 28-dimensional feature vector
        const features = extractFeatureVector(processed, canvas.width, canvas.height);
        setFeatureVector(features);

        setIsProcessing(false);
      } catch (err) {
        setError('Error processing image. Please try again.');
        setIsProcessing(false);
        console.error('Processing error:', err);
      }
    }, 100);
  }

  function retakePhoto() {
    setCapturedImage(null);
    setProcessedImage(null);
    setFeatureVector(null);
    setValidation(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function useForEnrollment() {
    if (featureVector) {
      sessionStorage.setItem('pendingMuzzleData', JSON.stringify({
        image: processedImage,
        featureVector,
        validation,
        captureMode
      }));
      window.location.href = '/enroll';
    }
  }

  function getValidationColor(confidence) {
    if (confidence >= 0.60) return 'success';
    if (confidence >= 0.45) return 'warning';
    return 'error';
  }

  function triggerFileUpload() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  return (
    <div className="mapper-page">
      <div className="container">
        <div className="page-header">
          <Link to="/enroll" className="btn btn-secondary">← Back</Link>
          <h1>📷 Muzzle Mapper</h1>
          <div className="header-spacer"></div>
        </div>

        <div className="mapper-info">
          <p><strong>MVP 1:</strong> Capture or upload a clear photo of the cow's muzzle. Our AI validates it's a muzzle print and applies CLAHE enhancement for accurate biometric analysis.</p>
        </div>

        {error && (
          <div className={`error-message ${!validation?.isValid ? 'warning' : ''}`}>
            {cameraUnavailable ? '📷' : validation?.isValid ? '⚠️' : '🐄'} {error}
          </div>
        )}

        <div className="mapper-container">
          {!capturedImage ? (
            <>
              {/* Capture Mode Toggle */}
              <div className="capture-mode-selector">
                <button
                  className={`mode-btn ${captureMode === 'camera' ? 'active' : ''}`}
                  onClick={() => !cameraUnavailable && setCaptureMode('camera')}
                  disabled={cameraUnavailable}
                >
                  📷 Camera
                </button>
                <button
                  className={`mode-btn ${captureMode === 'upload' ? 'active' : ''}`}
                  onClick={() => setCaptureMode('upload')}
                >
                  📁 Upload Image
                </button>
              </div>

              {/* Camera View */}
              {captureMode === 'camera' && !cameraUnavailable && (
                <div className="camera-view">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline
                    className="camera-feed"
                  />
                  {showGuide && (
                    <div className="guide-overlay">
                      <div className="guide-box">
                        <div className="guide-corner top-left"></div>
                        <div className="guide-corner top-right"></div>
                        <div className="guide-corner bottom-left"></div>
                        <div className="guide-corner bottom-right"></div>
                        <div className="guide-text">
                          <span>Align cow muzzle within box</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="camera-controls">
                    <button 
                      onClick={() => setShowGuide(!showGuide)}
                      className="btn btn-secondary btn-sm"
                    >
                      {showGuide ? 'Hide Guide' : 'Show Guide'}
                    </button>
                    <button 
                      onClick={captureImage}
                      className="btn btn-primary btn-capture"
                    >
                      📸 Capture Photo
                    </button>
                  </div>
                </div>
              )}

              {/* Upload View */}
              {captureMode === 'upload' && (
                <div className="upload-view">
                  <div className="upload-icon">📁</div>
                  <h3>Upload Muzzle Photo</h3>
                  <p>Upload a clear, well-lit photo of the cow's muzzle for biometric analysis.</p>

                  {/* Drag and Drop Zone */}
                  <div 
                    className="upload-drop-zone"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('drag-over');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('drag-over');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('drag-over');
                      const file = e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        handleFileUpload({ target: { files: [file] } });
                      }
                    }}
                  >
                    <div className="drop-zone-content">
                      <span className="drop-icon">📤</span>
                      <p><strong>Drag & drop</strong> your image here</p>
                      <p>or</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        onChange={handleFileUpload}
                        className="file-input"
                        id="muzzle-upload"
                      />
                      <button
                        onClick={triggerFileUpload}
                        className="btn btn-primary btn-upload"
                      >
                        📁 Browse Files
                      </button>
                    </div>
                  </div>

                  <div className="upload-requirements">
                    <h4>📋 Image Requirements</h4>
                    <div className="requirements-grid">
                      <div className="requirement-item">
                        <span className="check-icon">✅</span>
                        <span>Clear, well-lit photo</span>
                      </div>
                      <div className="requirement-item">
                        <span className="check-icon">✅</span>
                        <span>Muzzle fills most of frame</span>
                      </div>
                      <div className="requirement-item">
                        <span className="check-icon">✅</span>
                        <span>Visible ridge patterns</span>
                      </div>
                      <div className="requirement-item">
                        <span className="check-icon">✅</span>
                        <span>JPEG, PNG, or WebP</span>
                      </div>
                      <div className="requirement-item">
                        <span className="check-icon">✅</span>
                        <span>Max file size: 10MB</span>
                      </div>
                      <div className="requirement-item">
                        <span className="check-icon">✅</span>
                        <span>Minimal motion blur</span>
                      </div>
                    </div>
                  </div>

                  <div className="upload-tips">
                    <h4>💡 Pro Tips</h4>
                    <ul>
                      <li>Capture from 6-12 inches distance</li>
                      <li>Ensure even lighting (no harsh shadows)</li>
                      <li>Clean the muzzle if dirty for better ridge visibility</li>
                      <li>Take multiple photos and select the clearest one</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="capture-result">
              <div className="result-header">
                <h3>✅ Image Captured</h3>
                <span className="capture-mode-badge">
                  {captureMode === 'camera' ? '📷 Camera' : '📁 Upload'}
                </span>
              </div>

              <div className="image-comparison">
                <div className="image-panel">
                  <h4>Original (Grayscale)</h4>
                  <img src={capturedImage} alt="Captured muzzle" />
                </div>
                <div className="image-panel">
                  <h4>After CLAHE Enhancement</h4>
                  {isProcessing ? (
                    <div className="processing-overlay">
                      <div className="spinner"></div>
                      <p>Processing image...</p>
                      <p className="processing-sub">Applying AI enhancement</p>
                    </div>
                  ) : (
                    <>
                      <img src={processedImage} alt="Processed muzzle" />
                      <canvas ref={processedCanvasRef} style={{ display: 'none' }} />
                    </>
                  )}
                </div>
              </div>

              {validation && (
                <div className={`validation-result ${getValidationColor(validation.confidence)}`}>
                  <div className="validation-header">
                    <h4>
                      {validation.isValid ? '✅ Muzzle Print Validated' : '⚠️ Validation Warning'}
                    </h4>
                    <span className="confidence-score">
                      {(validation.confidence * 100).toFixed(1)}% Confidence
                    </span>
                  </div>
                  <p className="validation-message">{validation.message}</p>
                  
                  <div className="confidence-meter">
                    <div className="meter-label">Overall Confidence</div>
                    <div className="meter-bar">
                      <div 
                        className={`meter-fill ${getValidationColor(validation.confidence)}`}
                        style={{ width: `${validation.confidence * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="validation-scores">
                    <div className="score-item">
                      <div className="score-icon">🔬</div>
                      <span className="score-name">Texture (LBP)</span>
                      <span className="score-value">{(validation.scores.texture * 100).toFixed(0)}%</span>
                    </div>
                    <div className="score-item">
                      <div className="score-icon">⚖️</div>
                      <span className="score-name">Symmetry</span>
                      <span className="score-value">{(validation.scores.symmetry * 100).toFixed(0)}%</span>
                    </div>
                    <div className="score-item">
                      <div className="score-icon">📐</div>
                      <span className="score-name">Edge Density</span>
                      <span className="score-value">{(validation.scores.edge * 100).toFixed(0)}%</span>
                    </div>
                    <div className="score-item">
                      <div className="score-icon">🎯</div>
                      <span className="score-name">Contrast</span>
                      <span className="score-value">{(validation.scores.contrast * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {!validation.isValid && (
                    <div className="validation-warning">
                      <strong>⚠️ Low Confidence Detection</strong>
                      <p>The image may not be a valid cow muzzle print. For accurate matching, please ensure:</p>
                      <ul>
                        <li>The image shows a clear cow muzzle (not other body parts)</li>
                        <li>Ridge patterns are visible</li>
                        <li>Lighting is adequate</li>
                      </ul>
                      <button onClick={retakePhoto} className="btn btn-warning btn-sm">
                        🔄 Retake/Upload New Photo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {featureVector && (
                <div className="feature-info">
                  <h4>✅ Biometric Feature Vector Extracted</h4>
                  <p>28-dimensional feature vector successfully extracted for database matching</p>
                  <div className="feature-visualization">
                    {featureVector.map((val, idx) => (
                      <div key={idx} className="feature-bar">
                        <div 
                          className="feature-bar-fill" 
                          style={{ height: `${val * 100}%` }}
                          title={`Feature ${idx + 1}: ${val.toFixed(3)}`}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="capture-actions">
                <button onClick={retakePhoto} className="btn btn-secondary">
                  🔄 Retake / New Upload
                </button>
                <button 
                  onClick={useForEnrollment} 
                  className="btn btn-primary"
                  disabled={!featureVector}
                >
                  ✓ Proceed to Enrollment
                </button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/jpeg,image/png,image/jpg,image/webp" 
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <div className="tech-details">
          <h3>🔬 AI-Powered Muzzle Detection Pipeline</h3>
          <div className="pipeline-steps">
            <div className="pipeline-step">
              <span className="step-badge">1</span>
              <span>Capture/Upload</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">2</span>
              <span>AI Validation</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">3</span>
              <span>Grayscale</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">4</span>
              <span>Gaussian Blur</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">5</span>
              <span>CLAHE</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">6</span>
              <span>Feature Extract (28-D)</span>
            </div>
          </div>
          
          <div className="algorithm-details">
            <h4>🧠 Validation Algorithm Details</h4>
            <div className="algo-grid">
              <div className="algo-item">
                <strong>Local Binary Patterns (LBP)</strong>
                <p>Analyzes micro-texture patterns unique to bovine muzzle ridges. Compares each pixel with its 8 neighbors to create texture signature.</p>
              </div>
              <div className="algo-item">
                <strong>Symmetry Analysis</strong>
                <p>Bovine muzzles exhibit bilateral symmetry. Calculates left-right mirror correlation to validate anatomical structure.</p>
              </div>
              <div className="algo-item">
                <strong>Edge Density Detection</strong>
                <p>Muzzle prints have characteristic ridge patterns with edge density between 15-40%. Uses Sobel operators for edge detection.</p>
              </div>
              <div className="algo-item">
                <strong>Contrast Distribution</strong>
                <p>Validates proper lighting conditions. Optimal muzzle images have standard deviation between 40-80 in grayscale histogram.</p>
              </div>
            </div>
          </div>

          <div className="tech-specs">
            <h4>📊 Technical Specifications</h4>
            <div className="specs-table">
              <div className="spec-row">
                <span className="spec-label">Feature Vector Dimensions</span>
                <span className="spec-value">28</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Validation Threshold</span>
                <span className="spec-value">≥45% confidence</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">High Confidence Threshold</span>
                <span className="spec-value">≥60% confidence</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Image Processing Time</span>
                <span className="spec-value">&lt;500ms</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Supported Formats</span>
                <span className="spec-value">JPEG, PNG, WebP</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Max File Size</span>
                <span className="spec-value">10 MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MuzzleMapper;
