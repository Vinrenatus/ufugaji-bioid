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
  const [useUpload, setUseUpload] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start camera
  useEffect(() => {
    if (!useUpload) {
      startCamera();
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [useUpload]);

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
        setCameraUnavailable(false);
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraUnavailable(true);
      setError('Camera unavailable. You can upload an image instead.');
    }
  }

  function captureImage() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL('image/png');
    setCapturedImage(imageData);

    // Process the image
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
      setError('Image file is too large. Please upload an image under 10MB');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageDataUrl = e.target.result;
      setCapturedImage(imageDataUrl);
      
      // Load image into canvas for processing
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Resize image to optimal size for processing
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
        
        // Process the image
        processImage(canvas);
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

        // Validate muzzle image
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

        // Extract feature vector
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
    
    // Restart camera if not in upload mode
    if (!useUpload && !cameraUnavailable) {
      startCamera();
    }
  }

  function useForEnrollment() {
    if (featureVector) {
      sessionStorage.setItem('pendingMuzzleData', JSON.stringify({
        image: processedImage,
        featureVector,
        validation
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
          <p><strong>MVP 1:</strong> Position the cow's muzzle within the guide box. The system validates it's a muzzle print and applies CLAHE enhancement.</p>
        </div>

        {error && (
          <div className={`error-message ${cameraUnavailable || !validation?.isValid ? 'warning' : ''}`}>
            {cameraUnavailable ? '📷' : validation?.isValid ? '⚠️' : '🐄'} {error}
          </div>
        )}

        <div className="mapper-container">
          {!capturedImage ? (
            <>
              {/* Camera View */}
              {!useUpload && !cameraUnavailable && (
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
                      className="btn btn-secondary"
                    >
                      {showGuide ? 'Hide Guide' : 'Show Guide'}
                    </button>
                    <button 
                      onClick={captureImage}
                      className="btn btn-primary btn-capture"
                    >
                      📸 Capture
                    </button>
                  </div>
                </div>
              )}

              {/* Upload View */}
              {(useUpload || cameraUnavailable) && (
                <div className="upload-view">
                  <div className="upload-icon">📁</div>
                  <h3>Upload Muzzle Image</h3>
                  <p>
                    {cameraUnavailable 
                      ? 'Camera is unavailable. Please upload a clear photo of the cow\'s muzzle.'
                      : 'Or upload a pre-captured image of the cow\'s muzzle.'}
                  </p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleFileUpload}
                    className="file-input"
                    id="muzzle-upload"
                  />
                  
                  <label htmlFor="muzzle-upload" className="btn btn-primary btn-upload">
                    📁 Choose Image File
                  </label>
                  
                  <div className="upload-requirements">
                    <h4>📋 Image Requirements</h4>
                    <ul>
                      <li>✅ Clear, well-lit photo of cow muzzle</li>
                      <li>✅ Muzzle should fill most of the frame</li>
                      <li>✅ Visible ridge patterns</li>
                      <li>✅ JPEG, PNG, or WebP format</li>
                      <li>✅ Max file size: 10MB</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Toggle between camera and upload */}
              {!cameraUnavailable && (
                <div className="capture-mode-toggle">
                  <button
                    onClick={() => setUseUpload(!useUpload)}
                    className="btn btn-secondary btn-toggle"
                  >
                    {useUpload ? '📷 Switch to Camera' : '📁 Switch to Upload'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="capture-result">
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
                  <h4>
                    {validation.isValid ? '✅ Muzzle Print Validated' : '⚠️ Validation Warning'}
                  </h4>
                  <p className="validation-message">{validation.message}</p>
                  <div className="confidence-meter">
                    <div className="meter-label">Confidence Score</div>
                    <div className="meter-bar">
                      <div 
                        className={`meter-fill ${getValidationColor(validation.confidence)}`}
                        style={{ width: `${validation.confidence * 100}%` }}
                      ></div>
                    </div>
                    <div className="meter-value">{(validation.confidence * 100).toFixed(1)}%</div>
                  </div>
                  <div className="validation-scores">
                    <div className="score-item">
                      <span className="score-name">Texture</span>
                      <span className="score-value">{(validation.scores.texture * 100).toFixed(0)}%</span>
                    </div>
                    <div className="score-item">
                      <span className="score-name">Symmetry</span>
                      <span className="score-value">{(validation.scores.symmetry * 100).toFixed(0)}%</span>
                    </div>
                    <div className="score-item">
                      <span className="score-name">Edge Density</span>
                      <span className="score-value">{(validation.scores.edge * 100).toFixed(0)}%</span>
                    </div>
                    <div className="score-item">
                      <span className="score-name">Contrast</span>
                      <span className="score-value">{(validation.scores.contrast * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  {!validation.isValid && (
                    <div className="validation-warning">
                      ⚠️ <strong>Note:</strong> For best results, ensure the image shows a clear cow muzzle with visible ridge patterns. 
                      This validation helps ensure accurate matching.
                    </div>
                  )}
                </div>
              )}

              {featureVector && (
                <div className="feature-info">
                  <h4>✅ Feature Vector Extracted</h4>
                  <p>28-dimensional biometric feature vector successfully extracted</p>
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
                  🔄 Retake / Upload Another
                </button>
                <button 
                  onClick={useForEnrollment} 
                  className="btn btn-primary"
                  disabled={!featureVector}
                >
                  ✓ Use for Enrollment
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
              <span>Capture/Upload Image</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">2</span>
              <span>Validate Muzzle (LBP + Symmetry)</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">3</span>
              <span>Grayscale Conversion</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">4</span>
              <span>Gaussian Blur</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">5</span>
              <span>CLAHE Enhancement</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">6</span>
              <span>Feature Extraction (28-D)</span>
            </div>
          </div>
          
          <div className="algorithm-details">
            <h4>🧠 Validation Algorithm</h4>
            <div className="algo-grid">
              <div className="algo-item">
                <strong>Local Binary Patterns (LBP)</strong>
                <p>Analyzes texture patterns unique to muzzle ridges</p>
              </div>
              <div className="algo-item">
                <strong>Symmetry Analysis</strong>
                <p>Cow muzzles have bilateral symmetry patterns</p>
              </div>
              <div className="algo-item">
                <strong>Edge Density</strong>
                <p>Measures ridge density characteristic of muzzle prints</p>
              </div>
              <div className="algo-item">
                <strong>Contrast Distribution</strong>
                <p>Validates proper lighting and image quality</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MuzzleMapper;
