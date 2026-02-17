import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MuzzleMapper.css';

function MuzzleMapper() {
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [featureVector, setFeatureVector] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showGuide, setShowGuide] = useState(true);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processedCanvasRef = useRef(null);

  // Start camera
  useEffect(() => {
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

  function processImage(canvas) {
    setIsProcessing(true);
    setError(null);

    // Use setTimeout to allow UI to update
    setTimeout(() => {
      try {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

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

  // Image processing functions (inline for component)
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

  function retakePhoto() {
    setCapturedImage(null);
    setProcessedImage(null);
    setFeatureVector(null);
    setError(null);
  }

  function useForEnrollment() {
    if (featureVector) {
      // Store in sessionStorage for enrollment page to pick up
      sessionStorage.setItem('pendingMuzzleData', JSON.stringify({
        image: processedImage,
        featureVector
      }));
      window.location.href = '/enroll';
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
          <p><strong>MVP 1:</strong> Position the cow's muzzle within the guide box. The system will automatically enhance the image using grayscale conversion and CLAHE contrast enhancement.</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <div className="mapper-container">
          {!capturedImage ? (
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
                      <span>Align muzzle within box</span>
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

              {featureVector && (
                <div className="feature-info">
                  <h4>✅ Feature Vector Extracted</h4>
                  <p>16-dimensional feature vector successfully extracted from muzzle print</p>
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
                  🔄 Retake
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

        <div className="tech-details">
          <h3>🔬 Image Processing Pipeline</h3>
          <div className="pipeline-steps">
            <div className="pipeline-step">
              <span className="step-badge">1</span>
              <span>Capture RGB Image</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">2</span>
              <span>Convert to Grayscale</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">3</span>
              <span>Gaussian Blur (Noise Reduction)</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">4</span>
              <span>CLAHE Enhancement</span>
            </div>
            <div className="pipeline-arrow">→</div>
            <div className="pipeline-step">
              <span className="step-badge">5</span>
              <span>Feature Vector Extraction</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MuzzleMapper;
