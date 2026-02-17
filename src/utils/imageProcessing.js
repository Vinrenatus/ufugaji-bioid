/**
 * Advanced Image Processing for Bovine Muzzle Print Analysis
 * Implements cow-specific detection and feature extraction
 */

/**
 * Validate if an image appears to be a valid muzzle print
 * Returns confidence score 0-1
 */
export function validateMuzzleImage(imageData) {
  const { width, height } = imageData;

  // Check 1: Texture analysis - muzzle prints have distinctive ridge patterns
  const textureScore = analyzeTexture(imageData, width, height);
  
  // Check 2: Symmetry - muzzle prints are roughly symmetrical
  const symmetryScore = analyzeSymmetry(imageData, width, height);
  
  // Check 3: Edge density - muzzle prints have high edge density in ridges
  const edgeScore = analyzeEdgeDensity(imageData, width, height);
  
  // Check 4: Contrast distribution - muzzle prints have specific contrast patterns
  const contrastScore = analyzeContrastDistribution(imageData, width, height);
  
  // Weighted average
  const overallScore = (
    textureScore * 0.35 +
    symmetryScore * 0.25 +
    edgeScore * 0.25 +
    contrastScore * 0.15
  );
  
  return {
    isValid: overallScore >= 0.45, // Threshold for valid muzzle
    confidence: overallScore,
    scores: {
      texture: textureScore,
      symmetry: symmetryScore,
      edge: edgeScore,
      contrast: contrastScore
    },
    message: getValidationMessage(overallScore)
  };
}

function analyzeTexture(imageData, width, height) {
  const { data } = imageData;
  const grayData = new Float32Array(width * height);
  
  // Convert to grayscale
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    grayData[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  
  // Calculate local binary pattern histogram
  let lbpScore = 0;
  let validPixels = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = grayData[y * width + x];
      let lbp = 0;
      
      // 8-neighbor LBP
      const neighbors = [
        grayData[(y-1) * width + (x-1)],
        grayData[(y-1) * width + x],
        grayData[(y-1) * width + (x+1)],
        grayData[y * width + (x+1)],
        grayData[(y+1) * width + (x+1)],
        grayData[(y+1) * width + x],
        grayData[(y+1) * width + (x-1)],
        grayData[y * width + (x-1)]
      ];
      
      for (let i = 0; i < 8; i++) {
        if (neighbors[i] >= center) lbp |= (1 << i);
      }
      
      // Muzzle prints typically have LBP values in mid-range (texture patterns)
      if (lbp > 20 && lbp < 235) {
        lbpScore++;
      }
      validPixels++;
    }
  }
  
  return Math.min(1, lbpScore / validPixels);
}

function analyzeSymmetry(imageData, width, height) {
  const { data } = imageData;
  const grayData = new Float32Array(width * height);
  
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    grayData[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  
  // Calculate vertical symmetry (muzzle prints are roughly symmetrical)
  let symmetryScore = 0;
  let comparisons = 0;
  
  const midX = Math.floor(width / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < midX; x++) {
      const leftVal = grayData[y * width + x];
      const rightVal = grayData[y * width + (width - 1 - x)];
      
      const diff = Math.abs(leftVal - rightVal) / 255;
      symmetryScore += (1 - diff);
      comparisons++;
    }
  }
  
  return symmetryScore / comparisons;
}

function analyzeEdgeDensity(imageData, width, height) {
  const { data } = imageData;
  let edgeCount = 0;
  let totalPixels = 0;
  
  // Sobel edge detection
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          const kIdx = (ky + 1) * 3 + (kx + 1);
          
          gx += gray * sobelX[kIdx];
          gy += gray * sobelY[kIdx];
        }
      }
      
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      // Muzzle prints have moderate edge density (ridges)
      if (magnitude > 30 && magnitude < 150) {
        edgeCount++;
      }
      totalPixels++;
    }
  }
  
  // Ideal edge density for muzzle: 15-40%
  const edgeDensity = edgeCount / totalPixels;
  if (edgeDensity >= 0.15 && edgeDensity <= 0.40) {
    return 1;
  } else if (edgeDensity < 0.15) {
    return edgeDensity / 0.15;
  } else {
    return Math.max(0, 1 - (edgeDensity - 0.40) / 0.40);
  }
}

function analyzeContrastDistribution(imageData, width, height) {
  const { data } = imageData;
  const histogram = new Array(256).fill(0);
  
  // Build histogram
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[gray]++;
  }
  
  // Calculate contrast metrics
  let mean = 0;
  let totalPixels = width * height;
  
  for (let i = 0; i < 256; i++) {
    mean += i * histogram[i];
  }
  mean /= totalPixels;
  
  let variance = 0;
  for (let i = 0; i < 256; i++) {
    variance += histogram[i] * Math.pow(i - mean, 2);
  }
  const stdDev = Math.sqrt(variance / totalPixels);
  
  // Muzzle prints typically have stdDev between 40-80
  if (stdDev >= 40 && stdDev <= 80) {
    return 1;
  } else if (stdDev < 40) {
    return stdDev / 40;
  } else {
    return Math.max(0, 1 - (stdDev - 80) / 100);
  }
}

function getValidationMessage(score) {
  if (score >= 0.75) return "Excellent muzzle print quality";
  if (score >= 0.60) return "Good muzzle print detected";
  if (score >= 0.45) return "Acceptable muzzle print";
  if (score >= 0.30) return "Low confidence - may not be a muzzle";
  return "Warning: Image does not appear to be a muzzle print";
}

/**
 * Convert image data to grayscale
 */
export function toGrayscale(imageData) {
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

/**
 * Apply CLAHE-like contrast enhancement
 */
export function applyCLAHE(imageData, clipLimit = 2.0, tileSize = 8) {
  const { data, width, height } = imageData;
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

/**
 * Apply Gaussian blur for noise reduction
 */
export function applyGaussianBlur(imageData) {
  const { data, width, height } = imageData;
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

/**
 * Extract advanced feature vector from processed muzzle image
 * Uses multiple feature extraction techniques
 */
export function extractFeatureVector(imageData, width, height) {
  const { data } = imageData;
  
  // Convert to grayscale array
  const grayData = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    grayData[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  
  const features = [];
  
  // Feature Set 1: Grid-based mean intensity (4x4 = 16 features)
  const gridSize = 4;
  const cellWidth = Math.floor(width / gridSize);
  const cellHeight = Math.floor(height / gridSize);
  
  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const startX = gx * cellWidth;
      const startY = gy * cellHeight;
      let sum = 0;
      let count = 0;
      
      for (let y = startY; y < Math.min(startY + cellHeight, height); y++) {
        for (let x = startX; x < Math.min(startX + cellWidth, width); x++) {
          sum += grayData[y * width + x];
          count++;
        }
      }
      
      features.push(sum / count / 255);
    }
  }
  
  // Feature Set 2: Edge density per quadrant (2x2 = 4 features)
  const quadrantSize = 2;
  const quadWidth = Math.floor(width / quadrantSize);
  const quadHeight = Math.floor(height / quadrantSize);
  
  for (let qy = 0; qy < quadrantSize; qy++) {
    for (let qx = 0; qx < quadrantSize; qx++) {
      const startX = qx * quadWidth;
      const startY = qy * quadHeight;
      let edgeCount = 0;
      let totalPixels = 0;
      
      for (let y = startY + 1; y < Math.min(startY + quadHeight, height - 1); y++) {
        for (let x = startX + 1; x < Math.min(startX + quadWidth, width - 1); x++) {
          const idx = y * width + x;
          const dx = Math.abs(grayData[idx] - grayData[idx + 1]);
          const dy = Math.abs(grayData[idx] - grayData[idx + width]);
          
          if (dx > 25 || dy > 25) {
            edgeCount++;
          }
          totalPixels++;
        }
      }
      
      features.push(edgeCount / totalPixels);
    }
  }
  
  // Feature Set 3: Texture features (variance per quadrant = 4 features)
  for (let qy = 0; qy < quadrantSize; qy++) {
    for (let qx = 0; qx < quadrantSize; qx++) {
      const startX = qx * quadWidth;
      const startY = qy * quadHeight;
      let sum = 0;
      let count = 0;
      
      for (let y = startY; y < Math.min(startY + quadHeight, height); y++) {
        for (let x = startX; x < Math.min(startX + quadWidth, width); x++) {
          sum += grayData[y * width + x];
          count++;
        }
      }
      
      const mean = sum / count;
      let varianceSum = 0;
      
      for (let y = startY; y < Math.min(startY + quadHeight, height); y++) {
        for (let x = startX; x < Math.min(startX + quadWidth, width); x++) {
          const diff = grayData[y * width + x] - mean;
          varianceSum += diff * diff;
        }
      }
      
      features.push(Math.sqrt(varianceSum / count) / 255);
    }
  }
  
  // Feature Set 4: Radial features from center (4 features)
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const maxRadius = Math.min(centerX, centerY);
  
  for (let r = 0; r < 4; r++) {
    const innerRadius = (r / 4) * maxRadius;
    const outerRadius = ((r + 1) / 4) * maxRadius;
    let sum = 0;
    let count = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist >= innerRadius && dist < outerRadius) {
          sum += grayData[y * width + x];
          count++;
        }
      }
    }
    
    features.push(count > 0 ? sum / count / 255 : 0);
  }
  
  // Normalize all features to 0-1 range
  const normalizedFeatures = features.map(f => Math.max(0, Math.min(1, f)));
  
  return normalizedFeatures;
}

/**
 * Calculate similarity between two feature vectors using cosine similarity
 */
export function calculateSimilarity(vector1, vector2) {
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

/**
 * Process muzzle image through full pipeline with validation
 */
export function processMuzzleImage(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Step 1: Validate this is a muzzle print
  const validation = validateMuzzleImage(imageData);
  
  // Step 2: Convert to grayscale
  let processed = toGrayscale(imageData);
  
  // Step 3: Apply Gaussian blur for noise reduction
  processed = applyGaussianBlur({ data: processed, width: canvas.width, height: canvas.height }, 1);
  
  // Step 4: Apply CLAHE for contrast enhancement
  processed = applyCLAHE({ data: processed, width: canvas.width, height: canvas.height }, 2.0, 8);
  
  // Step 5: Extract feature vector
  const featureVector = extractFeatureVector({ data: processed, width: canvas.width, height: canvas.height });
  
  return {
    processedData: processed,
    featureVector,
    validation
  };
}
