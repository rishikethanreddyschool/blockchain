export async function generatePerceptualHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        const size = 32;
        canvas.width = size;
        canvas.height = size;

        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;

        const grayscale: number[] = [];
        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          grayscale.push(gray);
        }

        const dctHash = computeDCTHash(grayscale, size);
        resolve(dctHash);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

function computeDCTHash(grayscale: number[], size: number): string {
  const dctCoeffs: number[] = [];
  const dctSize = 8;

  for (let u = 0; u < dctSize; u++) {
    for (let v = 0; v < dctSize; v++) {
      let sum = 0;
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          const pixel = grayscale[y * size + x];
          sum += pixel *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * size)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * size));
        }
      }
      const cu = u === 0 ? 1 / Math.sqrt(2) : 1;
      const cv = v === 0 ? 1 / Math.sqrt(2) : 1;
      dctCoeffs.push((cu * cv * sum) / 4);
    }
  }

  const medianCoeff = dctCoeffs.slice(1).sort((a, b) => a - b)[Math.floor(dctCoeffs.length / 2)];

  let hash = '';
  for (let i = 0; i < dctCoeffs.length; i++) {
    hash += dctCoeffs[i] > medianCoeff ? '1' : '0';
  }

  const hexHash = parseInt(hash, 2).toString(16).padStart(16, '0');
  return hexHash;
}

export function calculateHammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    return Infinity;
  }

  const bin1 = parseInt(hash1, 16).toString(2).padStart(64, '0');
  const bin2 = parseInt(hash2, 16).toString(2).padStart(64, '0');

  let distance = 0;
  for (let i = 0; i < bin1.length; i++) {
    if (bin1[i] !== bin2[i]) {
      distance++;
    }
  }

  return distance;
}

export async function findSimilarArtwork(
  perceptualHash: string,
  allArtworks: Array<{ id: string; perceptual_hash: string | null; title: string; user_id: string }>
): Promise<{ artwork: any; distance: number; confidence: number } | null> {
  const strictThreshold = 10;
  const moderateThreshold = 15;
  let closestMatch: { artwork: any; distance: number; confidence: number } | null = null;

  for (const artwork of allArtworks) {
    if (!artwork.perceptual_hash) continue;

    const distance = calculateHammingDistance(perceptualHash, artwork.perceptual_hash);

    if (distance <= moderateThreshold) {
      const confidence = calculateConfidence(distance);

      if (distance <= strictThreshold) {
        if (!closestMatch || distance < closestMatch.distance) {
          closestMatch = { artwork, distance, confidence };
        }
      } else if (!closestMatch || (distance < closestMatch.distance && confidence > 0.7)) {
        closestMatch = { artwork, distance, confidence };
      }
    }
  }

  return closestMatch;
}

function calculateConfidence(hammingDistance: number): number {
  const maxBits = 64;
  const similarity = 1 - (hammingDistance / maxBits);
  return Math.max(0, Math.min(1, similarity));
}

export async function analyzeImageFeatures(file: File): Promise<{
  colorHistogram: number[];
  edgeFeatures: number[];
  textureFeatures: number[];
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        canvas.width = 256;
        canvas.height = 256;

        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        ctx.drawImage(img, 0, 0, 256, 256);
        const imageData = ctx.getImageData(0, 0, 256, 256);
        const pixels = imageData.data;

        const colorHistogram = computeColorHistogram(pixels);
        const edgeFeatures = computeEdgeFeatures(imageData);
        const textureFeatures = computeTextureFeatures(imageData);

        resolve({ colorHistogram, edgeFeatures, textureFeatures });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

function computeColorHistogram(pixels: Uint8ClampedArray): number[] {
  const bins = 16;
  const histogram = new Array(bins * 3).fill(0);
  const binSize = 256 / bins;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = Math.floor(pixels[i] / binSize);
    const g = Math.floor(pixels[i + 1] / binSize);
    const b = Math.floor(pixels[i + 2] / binSize);

    histogram[r]++;
    histogram[bins + g]++;
    histogram[bins * 2 + b]++;
  }

  const total = pixels.length / 4;
  return histogram.map(count => count / total);
}

function computeEdgeFeatures(imageData: ImageData): number[] {
  const { width, height, data } = imageData;
  const edges: number[] = [];

  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          const kernelIdx = (ky + 1) * 3 + (kx + 1);
          gx += gray * sobelX[kernelIdx];
          gy += gray * sobelY[kernelIdx];
        }
      }

      edges.push(Math.sqrt(gx * gx + gy * gy));
    }
  }

  const histogram = new Array(10).fill(0);
  const maxEdge = Math.max(...edges);
  edges.forEach(edge => {
    const bin = Math.min(9, Math.floor((edge / maxEdge) * 10));
    histogram[bin]++;
  });

  return histogram.map(count => count / edges.length);
}

function computeTextureFeatures(imageData: ImageData): number[] {
  const { width, height, data } = imageData;
  const grayscale: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    grayscale.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }

  let variance = 0;
  const mean = grayscale.reduce((sum, val) => sum + val, 0) / grayscale.length;

  grayscale.forEach(val => {
    variance += Math.pow(val - mean, 2);
  });
  variance /= grayscale.length;

  return [mean / 255, Math.sqrt(variance) / 255];
}

export async function compareImageFeatures(
  features1: { colorHistogram: number[]; edgeFeatures: number[]; textureFeatures: number[] },
  features2: { colorHistogram: number[]; edgeFeatures: number[]; textureFeatures: number[] }
): Promise<number> {
  const colorSimilarity = cosineSimilarity(features1.colorHistogram, features2.colorHistogram);
  const edgeSimilarity = cosineSimilarity(features1.edgeFeatures, features2.edgeFeatures);
  const textureSimilarity = cosineSimilarity(features1.textureFeatures, features2.textureFeatures);

  return (colorSimilarity * 0.4 + edgeSimilarity * 0.4 + textureSimilarity * 0.2);
}

function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}
