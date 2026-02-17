/**
 * Image Processing Utilities for Muzzle Print Analysis
 * Simulates OpenCV-style preprocessing in browser
 */

/**
 * Convert image data to grayscale
 */
export function toGrayscale(imageData) {
  const { data, width, height } = imageData;
  const grayData = new Uint8ClampedArray(data.length);
  
  for (let i = 0; i < data.length; i += 4) {
    // Luminosity method: weighted average for human perception
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    grayData[i] = gray;
    grayData[i + 1] = gray;
    grayData[i + 2] = gray;
    grayData[i + 3] = data[i + 3];
  }
  
  return { data: grayData, width, height };
}

/**
 * Apply CLAHE-like contrast enhancement (simplified version)
 * Contrast Limited Adaptive Histogram Equalization
 */
export function applyCLAHE(imageData, clipLimit = 2.0, tileSize = 8) {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  
  // Calculate tile dimensions
  const tileWidth = Math.floor(width / tileSize);
  const tileHeight = Math.floor(height / tileSize);
  
  // Process each tile
  for (let ty = 0; ty < tileSize; ty++) {
    for (let tx = 0; tx < tileSize; tx++) {
      const startX = tx * tileWidth;
      const startY = ty * tileHeight;
      const endX = Math.min(startX + tileWidth, width);
      const endY = Math.min(startY + tileHeight, height);
      
      // Build histogram for this tile
      const histogram = new Array(256).fill(0);
      let pixelCount = 0;
      
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4;
          const grayValue = data[idx];
          histogram[grayValue]++;
          pixelCount++;
        }
      }
      
      // Clip histogram
      const clipLimitCount = Math.floor((clipLimit * pixelCount) / 256);
      for (let i = 0; i < 256; i++) {
        if (histogram[i] > clipLimitCount) {
          histogram[i] = clipLimitCount;
        }
      }
      
      // Build CDF
      const cdf = new Array(256).fill(0);
      cdf[0] = histogram[0];
      for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + histogram[i];
      }
      
      // Normalize CDF
      const cdfMin = cdf.find(val => val > 0) || 0;
      const scale = (255 * 256) / (pixelCount - cdfMin);
      
      // Apply equalization to tile
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
export function applyGaussianBlur(imageData, radius = 1) {
  const { data, width, height } = imageData;
  const result = new Uint8ClampedArray(data.length);
  
  // Simple 3x3 kernel for radius=1
  const kernel = [
    1, 2, 1,
    2, 4, 2,
    1, 2, 1
  ];
  const kernelSum = 16;
  
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
 * Extract feature vector from processed muzzle image
 * Simulates CNN feature extraction
 */
export function extractFeatureVector(imageData) {
  const { data, width, height } = imageData;
  
  // Divide image into 4x4 grid and compute statistics for each cell
  const gridSize = 4;
  const cellWidth = Math.floor(width / gridSize);
  const cellHeight = Math.floor(height / gridSize);
  
  const features = [];
  
  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const startX = gx * cellWidth;
      const startY = gy * cellHeight;
      const endX = startX + cellWidth;
      const endY = startY + cellHeight;
      
      // Compute mean intensity for this cell
      let sum = 0;
      let count = 0;
      
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4;
          sum += data[idx];
          count++;
        }
      }
      
      const mean = sum / count;
      // Normalize to 0-1 range
      features.push(mean / 255);
    }
  }
  
  // Add edge density features (simplified)
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
          
          const diffRight = Math.abs(data[idx] - data[idxRight]);
          const diffDown = Math.abs(data[idx] - data[idxDown]);
          
          if (diffRight > 30 || diffDown > 30) {
            edgeCount++;
          }
        }
      }
      
      const cellPixels = cellWidth * cellHeight;
      features.push(edgeCount / cellPixels);
    }
  }
  
  return features;
}

/**
 * Calculate similarity between two feature vectors
 * Uses cosine similarity
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
  return Math.max(0, Math.min(100, similarity * 100)); // Return as percentage
}

/**
 * Process muzzle image through full pipeline
 */
export function processMuzzleImage(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Step 1: Convert to grayscale
  let processed = toGrayscale(imageData);
  
  // Step 2: Apply Gaussian blur for noise reduction
  processed = applyGaussianBlur({ data: processed, width: canvas.width, height: canvas.height }, 1);
  
  // Step 3: Apply CLAHE for contrast enhancement
  processed = applyCLAHE({ data: processed, width: canvas.width, height: canvas.height }, 2.0, 8);
  
  // Step 4: Extract feature vector
  const featureVector = extractFeatureVector({ data: processed, width: canvas.width, height: canvas.height });
  
  return {
    processedData: processed,
    featureVector
  };
}
