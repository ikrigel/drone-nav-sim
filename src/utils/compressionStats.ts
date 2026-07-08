/**
 * Compression statistics and analysis
 */

export function calculateCompressionStats(
  originalSize: number,
  compressedSize: number
): {
  reduction: number;
  ratio: number;
  saved: number;
  description: string;
} {
  const reduction = originalSize - compressedSize;
  const ratio = originalSize / compressedSize;
  const percentReduction = (reduction / originalSize) * 100;

  let description = '';
  if (ratio < 1.2) {
    description = 'Minimal compression (simple path)';
  } else if (ratio < 2) {
    description = 'Good compression';
  } else if (ratio < 5) {
    description = 'Excellent compression';
  } else {
    description = 'Outstanding compression (complex route)';
  }

  return {
    reduction,
    ratio,
    saved: percentReduction,
    description,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

export function compressionSummary(
  originalPoints: number,
  compressedPoints: number,
  originalBytes: number,
  compressedBytes: number
): string {
  const pointsRatio = originalPoints / compressedPoints;
  const bytesStats = calculateCompressionStats(originalBytes, compressedBytes);

  return (
    `📊 Route Compression:\n` +
    `  Points: ${originalPoints} → ${compressedPoints} (${pointsRatio.toFixed(1)}x reduction)\n` +
    `  Size: ${formatFileSize(originalBytes)} → ${formatFileSize(compressedBytes)} (${bytesStats.saved.toFixed(1)}% smaller)\n` +
    `  Quality: ${bytesStats.description}`
  );
}
