export async function generatePerceptualHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      try {
        const size = 8;
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

        const avg = grayscale.reduce((sum, val) => sum + val, 0) / grayscale.length;

        let hash = '';
        for (let i = 0; i < grayscale.length; i++) {
          hash += grayscale[i] > avg ? '1' : '0';
        }

        const hexHash = parseInt(hash, 2).toString(16).padStart(16, '0');
        resolve(hexHash);
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
): Promise<{ artwork: any; distance: number } | null> {
  const threshold = 5;
  let closestMatch: { artwork: any; distance: number } | null = null;

  for (const artwork of allArtworks) {
    if (!artwork.perceptual_hash) continue;

    const distance = calculateHammingDistance(perceptualHash, artwork.perceptual_hash);

    if (distance <= threshold) {
      if (!closestMatch || distance < closestMatch.distance) {
        closestMatch = { artwork, distance };
      }
    }
  }

  return closestMatch;
}
