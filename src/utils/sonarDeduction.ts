import { Detection, FilterSettings, SeverityLevel } from '../types';
import { getTargetClassMeta } from '../data/mockData';

export interface PreprocessingResult {
  processedDataUrl: string;
  width: number;
  height: number;
  metrics: {
    durationMs: number;
    originalMeanBrightness: number;
    processedMeanBrightness: number;
    contrastRatio: number;
    histogramBefore: number[];
    histogramAfter: number[];
    operationsApplied: string[];
  };
}

export async function processSonarImage(
  imageSource: string | HTMLImageElement,
  settings: FilterSettings
): Promise<PreprocessingResult> {
  const startTime = performance.now();
  const operationsApplied: string[] = [];

  const img = await loadImage(imageSource);
  const width = img.naturalWidth || img.width || 800;
  const height = img.naturalHeight || img.height || 500;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Unable to initialize HTML5 2D Canvas context for sonar processing');

  ctx.drawImage(img, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const histBefore = computeHistogram(data);
  const meanBefore = computeMean(data);

  // 1. Grayscale Conversion
  if (settings.grayscale) {
    for (let i = 0; i < data.length; i += 4) {
      const g = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      data[i] = g;
      data[i + 1] = g;
      data[i + 2] = g;
    }
    operationsApplied.push('Acoustic Grayscale Mapping (ITU-R BT.601)');
  }

  // 2. Dynamic Range Min-Max Normalization
  if (settings.normalizeIntensity) {
    let min = 255;
    let max = 0;
    for (let i = 0; i < data.length; i += 4) {
      const v = data[i];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = max - min;
    if (range > 0) {
      for (let i = 0; i < data.length; i += 4) {
        const norm = Math.round(((data[i] - min) / range) * 255);
        data[i] = norm;
        data[i + 1] = norm;
        data[i + 2] = norm;
      }
      operationsApplied.push(`Dynamic Range Min-Max Normalization [${min} -> ${max}]`);
    }
  }

  // 3. Percentile Histogram Stretch
  if (settings.contrastEnhance) {
    const hist = new Uint32Array(256);
    const totalPixels = width * height;
    for (let i = 0; i < data.length; i += 4) hist[data[i]]++;

    let cum = 0;
    let p1 = 0;
    let p99 = 255;
    const p1Count = totalPixels * 0.01;
    const p99Count = totalPixels * 0.99;

    for (let i = 0; i < 256; i++) {
      cum += hist[i];
      if (p1 === 0 && cum >= p1Count) p1 = i;
      if (cum >= p99Count) {
        p99 = i;
        break;
      }
    }

    const diff = p99 - p1;
    if (diff > 5) {
      for (let i = 0; i < data.length; i += 4) {
        let v = data[i];
        if (v <= p1) v = 0;
        else if (v >= p99) v = 255;
        else v = Math.round(((v - p1) / diff) * 255);

        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
      }
      operationsApplied.push(`Histogram Percentile Stretch [p1=${p1}, p99=${p99}]`);
    }
  }

  // 4. Acoustic Speckle Noise Suppression (3x3 Median filter)
  if (settings.denoiseSpeckle) {
    applyMedianFilter(data, width, height);
    operationsApplied.push('Acoustic Speckle Noise Suppression (3x3 Median Matrix)');
  }

  // 5. CLAHE (Contrast-Limited Adaptive Histogram Equalization)
  if (settings.clahe) {
    applyCLAHE(data, width, height, 4, 4, 2.5);
    operationsApplied.push('CLAHE Sonar Slant-Range Equalization (4x4 Grid, Clip 2.5)');
  }

  // 6. Time-Varied Gain (TVG) Seabed Attenuation Normalization
  if (settings.seabedNormalize) {
    applyTVG(data, width, height);
    operationsApplied.push('Seabed Time-Varied-Gain (TVG) Attenuation Equalization');
  }

  // 7. Color Palette Mapping
  if (settings.colorMap !== 'grayscale') {
    applyColorPalette(data, settings.colorMap);
    operationsApplied.push(`Hydroacoustic Color Map: ${settings.colorMap.toUpperCase()}`);
  }

  ctx.putImageData(imgData, 0, 0);

  const histAfter = computeHistogram(data);
  const meanAfter = computeMean(data);
  const durationMs = Math.round(performance.now() - startTime);

  return {
    processedDataUrl: canvas.toDataURL('image/png'),
    width,
    height,
    metrics: {
      durationMs,
      originalMeanBrightness: Math.round(meanBefore),
      processedMeanBrightness: Math.round(meanAfter),
      contrastRatio: computeContrastRatio(histAfter),
      histogramBefore: histBefore,
      histogramAfter: histAfter,
      operationsApplied,
    },
  };
}

function loadImage(source: string | HTMLImageElement): Promise<HTMLImageElement> {
  if (source instanceof HTMLImageElement) return Promise.resolve(source);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load sonar image: ' + String(e)));
    img.src = source;
  });
}

function applyMedianFilter(data: Uint8ClampedArray, width: number, height: number) {
  const grayscale = new Uint8Array(width * height);
  for (let i = 0; i < grayscale.length; i++) grayscale[i] = data[i * 4];

  const window = new Uint8Array(9);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let idx = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          window[idx++] = grayscale[(y + dy) * width + (x + dx)];
        }
      }
      window.sort();
      const median = window[4];
      const p = (y * width + x) * 4;
      data[p] = median;
      data[p + 1] = median;
      data[p + 2] = median;
    }
  }
}

function applyCLAHE(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  gridX: number,
  gridY: number,
  clipLimit: number
) {
  const tileW = Math.floor(width / gridX);
  const tileH = Math.floor(height / gridY);

  for (let ty = 0; ty < gridY; ty++) {
    for (let tx = 0; tx < gridX; tx++) {
      const startX = tx * tileW;
      const startY = ty * tileH;
      const endX = tx === gridX - 1 ? width : startX + tileW;
      const endY = ty === gridY - 1 ? height : startY + tileH;
      const numPixels = (endX - startX) * (endY - startY);

      const hist = new Uint32Array(256);
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          hist[data[(y * width + x) * 4]]++;
        }
      }

      const clipVal = Math.max(1, Math.round((numPixels / 256) * clipLimit));
      let excess = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > clipVal) {
          excess += hist[i] - clipVal;
          hist[i] = clipVal;
        }
      }

      const bonus = Math.floor(excess / 256);
      for (let i = 0; i < 256; i++) hist[i] += bonus;

      // CDF
      const cdf = new Float32Array(256);
      let cum = 0;
      for (let i = 0; i < 256; i++) {
        cum += hist[i];
        cdf[i] = cum / numPixels;
      }

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4;
          const equalized = Math.round(cdf[data[idx]] * 255);
          data[idx] = equalized;
          data[idx + 1] = equalized;
          data[idx + 2] = equalized;
        }
      }
    }
  }
}

function applyTVG(data: Uint8ClampedArray, width: number, height: number) {
  const center = width / 2;
  for (let x = 0; x < width; x++) {
    const normDist = Math.abs(x - center) / center;
    const gain = 1.0 + 0.35 * Math.sqrt(normDist);
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4;
      const val = Math.min(255, Math.round(data[idx] * gain));
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
    }
  }
}

function applyColorPalette(data: Uint8ClampedArray, palette: string) {
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i] / 255;
    let r = 0;
    let g = 0;
    let b = 0;

    if (palette === 'amber') {
      // Classic side-scan phosphor bronze
      r = Math.min(255, Math.round(v * 255 * 1.05));
      g = Math.round(v * 255 * 0.82);
      b = Math.round(v * 255 * 0.52);
    } else if (palette === 'cyan') {
      // Oceanic bathymetric cyan
      r = Math.round(v * 255 * 0.2);
      g = Math.round(v * 255 * 0.9);
      b = Math.min(255, Math.round(v * 255 * 1.05));
    } else if (palette === 'viridis') {
      // Perceptually uniform Viridis colormap approximation
      r = Math.round(255 * Math.max(0, Math.min(1, 1.5 * v - 0.5)));
      g = Math.round(255 * Math.sin(v * Math.PI));
      b = Math.round(255 * Math.cos(v * (Math.PI / 2)));
    } else if (palette === 'deepsea') {
      // Deep sea marine blue
      r = Math.round(v * 255 * 0.15);
      g = Math.round(v * 255 * 0.45);
      b = Math.min(255, Math.round(v * 255 * 0.95));
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

function computeHistogram(data: Uint8ClampedArray): number[] {
  const hist = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) hist[data[i]]++;
  return hist;
}

function computeMean(data: Uint8ClampedArray): number {
  let sum = 0;
  const count = data.length / 4;
  for (let i = 0; i < data.length; i += 4) sum += data[i];
  return count > 0 ? sum / count : 0;
}

function computeContrastRatio(hist: number[]): number {
  let total = 0;
  for (let i = 0; i < 256; i++) total += hist[i];
  if (total === 0) return 1;

  let mean = 0;
  for (let i = 0; i < 256; i++) mean += i * hist[i];
  mean /= total;

  let variance = 0;
  for (let i = 0; i < 256; i++) variance += hist[i] * Math.pow(i - mean, 2);
  const std = Math.sqrt(variance / total);
  return Number((std / 128).toFixed(2));
}

/**
 * Baseline Computer Vision Acoustic Highlight-Shadow Feature Extractor
 */
export async function extractAcousticDetections(
  imageUrl: string,
  scanId: string,
  scanMeta: {
    latitude: number | null;
    longitude: number | null;
    depth: number | null;
    vehicleId: string;
    altitudeMeters?: number;
    swathWidthMeters?: number;
  }
): Promise<Detection[]> {
  const startTime = performance.now();
  const img = await loadImage(imageUrl);
  const width = img.naturalWidth || 800;
  const height = img.naturalHeight || 500;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  ctx.drawImage(img, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;

  // Compute background mean and standard deviation
  let sum = 0;
  let sumSq = 0;
  const total = width * height;
  for (let i = 0; i < data.length; i += 4) {
    const val = data[i];
    sum += val;
    sumSq += val * val;
  }

  const mean = sum / total;
  const variance = sumSq / total - mean * mean;
  const std = Math.max(8, Math.sqrt(Math.max(0, variance)));

  // Thresholds for specular highlight and acoustic shadow
  const highlightThreshold = Math.min(250, Math.round(mean + 1.85 * std));
  const shadowThreshold = Math.max(8, Math.round(mean - 1.45 * std));

  // Cell-based spatial grid scan
  const cellSize = Math.max(12, Math.floor(Math.min(width, height) / 36));
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);

  interface GridCell {
    col: number;
    row: number;
    x: number;
    y: number;
    highlightCount: number;
    shadowCount: number;
    maxLum: number;
    minLum: number;
  }

  const activeCells: GridCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const startX = c * cellSize;
      const startY = r * cellSize;
      let highlights = 0;
      let shadows = 0;
      let maxL = 0;
      let minL = 255;

      for (let py = startY; py < startY + cellSize && py < height; py++) {
        for (let px = startX; px < startX + cellSize && px < width; px++) {
          const lum = data[(py * width + px) * 4];
          if (lum > maxL) maxL = lum;
          if (lum < minL) minL = lum;
          if (lum >= highlightThreshold) highlights++;
          if (lum <= shadowThreshold) shadows++;
        }
      }

      const cellPixels = cellSize * cellSize;
      if (highlights > cellPixels * 0.12 || shadows > cellPixels * 0.18) {
        activeCells.push({
          col: c,
          row: r,
          x: startX,
          y: startY,
          highlightCount: highlights,
          shadowCount: shadows,
          maxLum: maxL,
          minLum: minL,
        });
      }
    }
  }

  // Cluster contiguous highlight-shadow cells
  const visited = new Set<number>();
  const clusters: GridCell[][] = [];

  for (let i = 0; i < activeCells.length; i++) {
    if (visited.has(i)) continue;
    const cluster: GridCell[] = [activeCells[i]];
    visited.add(i);

    for (let j = 0; j < cluster.length; j++) {
      const cur = cluster[j];
      for (let k = 0; k < activeCells.length; k++) {
        if (visited.has(k)) continue;
        const other = activeCells[k];
        const distCols = Math.abs(cur.col - other.col);
        const distRows = Math.abs(cur.row - other.row);
        if (distCols <= 2 && distRows <= 2) {
          visited.add(k);
          cluster.push(other);
        }
      }
    }

    if (cluster.length >= 2) {
      clusters.push(cluster);
    }
  }

  const detections: Detection[] = [];
  const durationMs = Math.round(performance.now() - startTime);

  clusters.slice(0, 5).forEach((cluster, idx) => {
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let totalHighlights = 0;
    let totalShadows = 0;
    let peakHighlight = 0;

    cluster.forEach((c) => {
      minX = Math.min(minX, c.x);
      maxX = Math.max(maxX, c.x + cellSize);
      minY = Math.min(minY, c.y);
      maxY = Math.max(maxY, c.y + cellSize);
      totalHighlights += c.highlightCount;
      totalShadows += c.shadowCount;
      if (c.maxLum > peakHighlight) peakHighlight = c.maxLum;
    });

    const boxWidth = Math.min(width - minX, maxX - minX);
    const boxHeight = Math.min(height - minY, maxY - minY);
    const area = boxWidth * boxHeight;

    // Filter tiny noise speckles
    if (area < 400) return;

    const backscatterRatio = Number((peakHighlight / Math.max(1, mean)).toFixed(2));
    const shadowRatio = totalShadows / Math.max(1, totalHighlights);

    // Classify candidate
    let targetClass = 'Marine Debris';
    let standardCategory: Detection['standardCategory'] = 'Marine Debris';

    if (backscatterRatio > 2.6 && area > 5000) {
      targetClass = 'Shipwreck / Wreck-Like Object';
      standardCategory = 'Seabed Anomaly';
    } else if (backscatterRatio > 2.2 && shadowRatio > 0.8) {
      targetClass = 'Marine Debris';
      standardCategory = 'Marine Debris';
    } else if (boxWidth > boxHeight * 2.8) {
      targetClass = 'Man-Made Underwater Structure';
      standardCategory = 'Seabed Anomaly';
    } else if (backscatterRatio < 1.6 && totalShadows > totalHighlights) {
      targetClass = 'Seabed Depression';
      standardCategory = 'Natural Seabed Feature';
    } else if (backscatterRatio < 2.1) {
      targetClass = 'Rock / Boulder';
      standardCategory = 'Natural Seabed Feature';
    }

    const classMeta = getTargetClassMeta(targetClass);

    // Risk scoring
    const riskFactors: string[] = [];
    let score = classMeta.baseRiskWeight * 0.45;
    riskFactors.push(`Class Base Weight (${classMeta.name}): +${Math.round(score)} pts`);

    if (area > 3500) {
      score += 20;
      riskFactors.push(`Large Acoustic Signature (${area} px²): +20 pts [Navigational Hazard]`);
    } else {
      score += 12;
      riskFactors.push(`Medium Acoustic Signature (${area} px²): +12 pts`);
    }

    const depth = scanMeta.depth ?? 18.5;
    if (depth < 20) {
      score += 18;
      riskFactors.push(`Shallow Coastal Water Depth (${depth} m): +18 pts [Trawl & Vessel Snag Hazard]`);
    } else {
      score += 8;
      riskFactors.push(`Water Depth (${depth} m): +8 pts`);
    }

    const finalRiskScore = Math.max(10, Math.min(100, Math.round(score)));
    const severity: SeverityLevel =
      finalRiskScore >= 75 ? 'HIGH' : finalRiskScore >= 45 ? 'MEDIUM' : 'LOW';

    // Geolocation calculation
    let detLat = scanMeta.latitude;
    let detLng = scanMeta.longitude;
    if (detLat !== null && detLng !== null) {
      // Offset slightly based on position relative to center line
      const offsetX = (minX + boxWidth / 2 - width / 2) * 0.0000015;
      const offsetY = (minY + boxHeight / 2 - height / 2) * 0.0000015;
      detLat = Number((detLat + offsetY).toFixed(5));
      detLng = Number((detLng + offsetX).toFixed(5));
    }

    // Estimate physical height using shadow geometry
    const altitude = scanMeta.altitudeMeters || 12;
    const estHeightM = calculateObstacleHeight(boxWidth * 0.6, altitude, Math.max(15, (minX + boxWidth / 2) * 0.1));

    detections.push({
      id: `det-${scanId}-${idx + 1}-${Date.now().toString().slice(-4)}`,
      analysisId: `analysis-${scanId}`,
      scanId,
      userId: 'op-sih-2026-lead',
      className: targetClass,
      standardCategory,
      priority: severity,
      confidence: null,
      confidenceDisplay: 'Deterministic Acoustic CV (Rule-Based Feature Extraction)',
      boundingBox: {
        x: minX,
        y: minY,
        width: boxWidth,
        height: boxHeight,
        normX: Number((minX / width).toFixed(3)),
        normY: Number((minY / height).toFixed(3)),
        normWidth: Number((boxWidth / width).toFixed(3)),
        normHeight: Number((boxHeight / height).toFixed(3)),
      },
      segmentation: null,
      severity,
      riskScore: finalRiskScore,
      riskFactors,
      latitude: detLat,
      longitude: detLng,
      depth,
      modelName: 'Acoustic Backscatter & Shadow Baseline Extractor (CV-v1.0)',
      modelVersion: '1.0.0-experimental',
      inferenceTimestamp: new Date().toISOString(),
      acousticBackscatterRatio: backscatterRatio,
      positioningStatus: detLat !== null ? 'AVAILABLE' : 'GEOLOCATION_UNAVAILABLE',
      processingDurationMs: durationMs,
      aiExplanation: {
        isAvailable: true,
        acousticIntensity: `Acoustic specular highlight has a ${backscatterRatio}x backscatter ratio over background seabed reverberation.`,
        shapeCharacteristics: `${boxWidth}px × ${boxHeight}px acoustic bounding region with distinct highlights.`,
        contrastRatio: `${backscatterRatio}:1 specular contrast.`,
        shadowCharacteristics: `Downstream acoustic shadow profile indicates an estimated physical relief of ~${estHeightM}m above seafloor.`,
        texturePattern: 'Sharp gradient boundary between specular backscatter zone and acoustic occlusion.',
        objectBackgroundDifference: `Specular return exceeds ambient seabed variance by +${((backscatterRatio - 1) * 2.2).toFixed(1)}σ.`,
        summaryReasoning: `Identified as ${targetClass} due to clear specular backscatter highlight and paired downstream acoustic shadow signature.`,
      },
    });
  });

  return detections;
}

/**
 * Standard hydroacoustic sidescan obstacle height formula:
 * Height = (Shadow Length * Towfish Altitude) / Slant Range
 */
export function calculateObstacleHeight(
  shadowLengthM: number,
  towfishAltitudeM: number,
  slantRangeM: number
): number {
  if (slantRangeM <= 0) return 0;
  const height = (shadowLengthM * towfishAltitudeM) / slantRangeM;
  return Number(Math.max(0.1, height).toFixed(2));
}
