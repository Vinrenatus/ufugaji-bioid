/**
 * Advanced Image Processing for Bovine Muzzle Print Analysis
 * Implements cow-specific detection, duplicate detection, and optimized matching
 */

/**
 * Calculate image perceptual hash (pHash) for duplicate detection
 * Returns a 64-character binary string for better precision
 */
export function calculatePerceptualHash(imageData) {
  const { width, height } = imageData;
  
  // Resize to 64x64 for better hash precision
  const size = 64;
  const resized = new Float32Array(size * size);
  
  const scaleX = width / size;
  const scaleY = height / size;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);
      const idx = (srcY * width + srcX) * 4;
      const gray = 0.299 * imageData.data[idx] + 0.587 * imageData.data[idx + 1] + 0.114 * imageData.data[idx + 2];
      resized[y * size + x] = gray;
    }
  }
  
  // Calculate mean
  let sum = 0;
  for (let i = 0; i < size * size; i++) {
    sum += resized[i];
  }
  const mean = sum / (size * size);
  
  // Generate hash based on comparison with mean
  let hash = '';
  for (let i = 0; i < size * size; i++) {
    hash += resized[i] > mean ? '1' : '0';
  }
  
  return hash;
}

/**
 * Calculate Hamming distance between two perceptual hashes
 * Returns 0-4096 (0 = identical, 4096 = completely different)
 */
export function hammingDistance(hash1, hash2) {
  if (hash1.length !== hash2.length) return hash1.length;
  
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  
  return distance;
}

/**
 * Check if two images are duplicates based on perceptual hash
 */
export function areImagesDuplicate(hash1, hash2, threshold = 150) {
  const distance = hammingDistance(hash1, hash2);
  return {
    isDuplicate: distance <= threshold,
    distance,
    similarity: 100 - (distance / 4096 * 100)
  };
}

/**
 * Advanced cow muzzle validation with multiple checks
 */
export function validateMuzzleImage(imageData) {
  const { width, height } = imageData;
  
  // Aspect ratio check - cow muzzles are roughly square or slightly wider
  const aspectRatio = width / height;
  const aspectRatioScore = (aspectRatio >= 0.7 && aspectRatio <= 1.5) ? 1 : Math.max(0, 1 - Math.abs(aspectRatio - 1.1) * 0.5);
  
  // Check 1: Texture analysis - muzzle prints have distinctive ridge patterns
  const textureScore = analyzeMuzzleTexture(imageData, width, height);
  
  // Check 2: Symmetry - cow muzzles are roughly bilaterally symmetrical
  const symmetryScore = analyzeBilateralSymmetry(imageData, width, height);
  
  // Check 3: Edge density - muzzle prints have specific ridge edge density (15-40%)
  const edgeScore = analyzeMuzzleEdgeDensity(imageData, width, height);
  
  // Check 4: Contrast distribution - proper muzzle images have specific contrast
  const contrastScore = analyzeContrastDistribution(imageData, width, height);
  
  // Check 5: Nose print pattern detection (radial symmetry from center)
  const radialScore = analyzeRadialPattern(imageData, width, height);
  
  // Check 6: Color analysis - should be grayscale/natural colors
  const colorScore = analyzeNaturalColors(imageData, width, height);
  
  // Weighted average with emphasis on texture and pattern
  const overallScore = (
    textureScore * 0.30 +
    symmetryScore * 0.15 +
    edgeScore * 0.20 +
    contrastScore * 0.15 +
    radialScore * 0.15 +
    aspectRatioScore * 0.05
  );
  
  // Additional checks for non-muzzle detection
  const isProbablyFace = detectHumanFaceCharacteristics(imageData, width, height);
  const isProbablyObject = detectNonBiologicalObject(imageData, width, height);
  const hasSufficientDetail = checkSufficientDetail(imageData, width, height);
  
  // Penalize if detected as face or artificial object
  let finalScore = overallScore;
  if (isProbablyFace) finalScore *= 0.2; // Very heavy penalty for face-like patterns
  if (isProbablyObject) finalScore *= 0.3; // Heavy penalty for artificial objects
  if (!hasSufficientDetail) finalScore *= 0.4; // Penalty for low detail images
  
  const isValid = finalScore >= 0.50 && !isProbablyFace && !isProbablyObject && hasSufficientDetail;
  
  return {
    isValid,
    confidence: finalScore,
    scores: {
      texture: textureScore,
      symmetry: symmetryScore,
      edge: edgeScore,
      contrast: contrastScore,
      radial: radialScore,
      aspect: aspectRatioScore,
      color: colorScore
    },
    flags: {
      isProbablyFace,
      isProbablyObject,
      hasSufficientDetail
    },
    message: getValidationMessage(finalScore, isProbablyFace, isProbablyObject, hasSufficientDetail)
  };
}

/**
 * Analyze texture patterns specific to cow muzzles
 */
function analyzeMuzzleTexture(imageData, width, height) {
  const { data } = imageData;
  const grayData = new Float32Array(width * height);
  
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    grayData[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  
  // LBP analysis with muzzle-specific patterns
  let lbpScore = 0;
  let validPixels = 0;
  let ridgePatternCount = 0;
  
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      const center = grayData[y * width + x];
      
      // 8-neighbor LBP
      let lbp = 0;
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
      
      // Cow muzzle ridges create specific LBP patterns (mid-range values)
      if (lbp > 30 && lbp < 220) {
        lbpScore++;
        
        // Check for ridge-like patterns (alternating high-low)
        const pattern = neighbors.map((v, i) => v > center ? 1 : 0).join('');
        if (pattern.includes('010') || pattern.includes('101')) {
          ridgePatternCount++;
        }
      }
      validPixels++;
    }
  }
  
  const baseScore = lbpScore / validPixels;
  const ridgeBonus = Math.min(0.3, ridgePatternCount / validPixels * 2);
  
  return Math.min(1, baseScore + ridgeBonus);
}

/**
 * Analyze bilateral symmetry (cow muzzles are symmetrical left-right)
 */
function analyzeBilateralSymmetry(imageData, width, height) {
  const { data } = imageData;
  const grayData = new Float32Array(width * height);
  
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    grayData[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  
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

/**
 * Analyze edge density specific to muzzle ridge patterns
 */
function analyzeMuzzleEdgeDensity(imageData, width, height) {
  const { data } = imageData;
  let edgeCount = 0;
  let totalPixels = 0;
  
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
      
      if (magnitude > 25 && magnitude < 120) {
        edgeCount++;
      }
      totalPixels++;
    }
  }
  
  const edgeDensity = edgeCount / totalPixels;
  
  if (edgeDensity >= 0.15 && edgeDensity <= 0.40) {
    return 1;
  } else if (edgeDensity < 0.15) {
    return edgeDensity / 0.15;
  } else {
    return Math.max(0, 1 - (edgeDensity - 0.40) / 0.40);
  }
}

/**
 * Analyze contrast distribution
 */
function analyzeContrastDistribution(imageData, width, height) {
  const { data } = imageData;
  const histogram = new Array(256).fill(0);
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    histogram[gray]++;
  }
  
  let mean = 0;
  const totalPixels = width * height;
  
  for (let i = 0; i < 256; i++) {
    mean += i * histogram[i];
  }
  mean /= totalPixels;
  
  let variance = 0;
  for (let i = 0; i < 256; i++) {
    variance += histogram[i] * Math.pow(i - mean, 2);
  }
  const stdDev = Math.sqrt(variance / totalPixels);
  
  if (stdDev >= 40 && stdDev <= 80) {
    return 1;
  } else if (stdDev < 40) {
    return stdDev / 40;
  } else {
    return Math.max(0, 1 - (stdDev - 80) / 100);
  }
}

/**
 * Analyze radial pattern from center
 */
function analyzeRadialPattern(imageData, width, height) {
  const { data } = imageData;
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const maxRadius = Math.min(centerX, centerY);
  
  const grayData = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    grayData[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  
  const ringCount = 8;
  const ringMeans = [];
  
  for (let r = 0; r < ringCount; r++) {
    const innerRadius = (r / ringCount) * maxRadius;
    const outerRadius = ((r + 1) / ringCount) * maxRadius;
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
    
    ringMeans.push(count > 0 ? sum / count : 0);
  }
  
  let variance = 0;
  const overallMean = ringMeans.reduce((a, b) => a + b, 0) / ringCount;
  for (const mean of ringMeans) {
    variance += Math.pow(mean - overallMean, 2);
  }
  variance /= ringCount;
  
  const normalizedVariance = Math.sqrt(variance) / 255;
  return Math.min(1, normalizedVariance * 3);
}

/**
 * Check for natural colors
 */
function analyzeNaturalColors(imageData, width, height) {
  const { data } = imageData;
  
  let naturalPixels = 0;
  let totalPixels = Math.min(10000, width * height);
  
  for (let i = 0; i < totalPixels * 4; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    const isNatural = (
      Math.max(r, g, b) - Math.min(r, g, b) < 100 &&
      !(r > 200 && g > 200 && b < 100) &&
      !(r > 200 && g < 100 && b > 200) &&
      !(r < 100 && g > 200 && b > 200) &&
      (r + g + b) / 3 > 30 && (r + g + b) / 3 < 230
    );
    
    if (isNatural) naturalPixels++;
  }
  
  return naturalPixels / totalPixels;
}

/**
 * Detect human face characteristics
 */
function detectHumanFaceCharacteristics(imageData, width, height) {
  const { data } = imageData;
  
  const upperThird = Math.floor(height / 3);
  let darkSpotsUpper = 0;
  let darkSpotsLower = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      
      if (brightness < 50) {
        if (y < upperThird) {
          darkSpotsUpper++;
        } else {
          darkSpotsLower++;
        }
      }
    }
  }
  
  const hasEyesLikePattern = darkSpotsUpper > (width * upperThird * 0.02);
  
  let horizontalLineCount = 0;
  for (let y = Math.floor(height * 2 / 3); y < height; y++) {
    let rowDarkCount = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      if (brightness < 60) rowDarkCount++;
    }
    if (rowDarkCount > width * 0.3) horizontalLineCount++;
  }
  
  const hasMouthLikePattern = horizontalLineCount > 3;
  
  return hasEyesLikePattern && hasMouthLikePattern;
}

/**
 * Detect non-biological artificial objects
 */
function detectNonBiologicalObject(imageData, width, height) {
  const { data } = imageData;
  
  let straightLineCount = 0;
  
  for (let y = 0; y < height; y++) {
    let consecutiveSimilar = 0;
    for (let x = 1; x < width; x++) {
      const idx1 = (y * width + x - 1) * 4;
      const idx2 = (y * width + x) * 4;
      const diff = Math.abs(data[idx1] - data[idx2]);
      
      if (diff < 5) {
        consecutiveSimilar++;
      } else {
        if (consecutiveSimilar > width * 0.8) straightLineCount++;
        consecutiveSimilar = 0;
      }
    }
  }
  
  for (let x = 0; x < width; x++) {
    let consecutiveSimilar = 0;
    for (let y = 1; y < height; y++) {
      const idx1 = ((y - 1) * width + x) * 4;
      const idx2 = (y * width + x) * 4;
      const diff = Math.abs(data[idx1] - data[idx2]);
      
      if (diff < 5) {
        consecutiveSimilar++;
      } else {
        if (consecutiveSimilar > height * 0.8) straightLineCount++;
        consecutiveSimilar = 0;
      }
    }
  }
  
  return straightLineCount > 10;
}

/**
 * Check if image has sufficient detail for analysis
 */
function checkSufficientDetail(imageData, width, height) {
  const { data } = imageData;
  
  // Check variance - low variance means blurry/low detail
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += gray;
    sumSq += gray * gray;
    count++;
  }
  
  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  const stdDev = Math.sqrt(variance);
  
  // Need sufficient standard deviation for detail
  return stdDev > 30;
}

function getValidationMessage(score, isFace, isObject, hasDetail) {
  if (isFace) return '⚠️ Detected human face characteristics - please upload cow muzzle only';
  if (isObject) return '⚠️ Detected artificial object - please upload natural cow muzzle';
  if (!hasDetail) return '⚠️ Image too blurry or lacks detail - please take a clearer photo';
  if (score >= 0.75) return '✅ Excellent muzzle print quality';
  if (score >= 0.60) return '✅ Good muzzle print detected';
  if (score >= 0.50) return '⚠️ Acceptable muzzle print';
  if (score >= 0.30) return '⚠️ Low confidence - may not be a muzzle';
  return '❌ Not a valid cow muzzle print';
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
 * Extract optimized feature vector from processed muzzle image
 */
export function extractFeatureVector(imageData, width, height) {
  const { data } = imageData;
  
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
  
  // Feature Set 3: Texture variance per quadrant (2x2 = 4 features)
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
  
  const normalizedFeatures = features.map(f => Math.max(0, Math.min(1, f)));
  
  return normalizedFeatures;
}

/**
 * Calculate optimized similarity with multiple metrics
 */
export function calculateSimilarity(vector1, vector2) {
  if (vector1.length !== vector2.length) {
    return 0;
  }
  
  // Cosine similarity
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
  
  const cosineSim = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  
  // Euclidean distance (normalized)
  let euclidDist = 0;
  for (let i = 0; i < vector1.length; i++) {
    const diff = vector1[i] - vector2[i];
    euclidDist += diff * diff;
  }
  euclidDist = Math.sqrt(euclidDist);
  const euclidSim = 1 / (1 + euclidDist);
  
  // Weighted combination
  const combinedSim = (cosineSim * 0.7 + euclidSim * 0.3);
  
  return Math.max(0, Math.min(100, combinedSim * 100));
}

/**
 * Process muzzle image through full pipeline
 */
export function processMuzzleImage(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  const validation = validateMuzzleImage(imageData);
  
  let processed = toGrayscale(imageData);
  processed = applyGaussianBlur({ data: processed, width: canvas.width, height: canvas.height });
  processed = applyCLAHE({ data: processed, width: canvas.width, height: canvas.height }, 2.0, 8);
  
  const featureVector = extractFeatureVector({ data: processed, width: canvas.width, height: canvas.height });
  const perceptualHash = calculatePerceptualHash(imageData);
  
  return {
    processedData: processed,
    featureVector,
    validation,
    perceptualHash
  };
}
