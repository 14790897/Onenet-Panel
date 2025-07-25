import { getDatastreamStats, getCachedDatastreamStats, type DatastreamStats } from './datastream-stats-cache';

export function calculateValueColor(
  value: number,
  min: number,
  max: number,
  inverted: boolean = false
): string {
  if (min === max) {
    return "text-blue-600";
  }

  const normalizedValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const colorPosition = inverted ? normalizedValue : 1 - normalizedValue;

  if (colorPosition >= 0.7) {
    return "text-green-600";
  } else if (colorPosition >= 0.4) {
    return "text-yellow-600";
  } else if (colorPosition >= 0.2) {
    return "text-orange-600";
  } else {
    return "text-red-600";
  }
}

function shouldInvertColorLogic(datastreamId: string): boolean {
  const datastreamLower = datastreamId.toLowerCase();
  const invertedTypes = [
    'battery', 'voltage', 'signal', 'rssi', 'quality'
  ];
  return invertedTypes.some(type => datastreamLower.includes(type));
}

export async function getSmartValueColor(
  value: number,
  datastreamId: string
): Promise<string> {
  const stats = await getDatastreamStats(datastreamId);

  if (!stats) {
    return getFixedThresholdColor(value, datastreamId);
  }

  const inverted = shouldInvertColorLogic(datastreamId);
  return calculateValueColor(value, stats.min, stats.max, inverted);
}

export function getSmartValueColorSync(
  value: number,
  datastreamId: string
): string {
  const stats = getCachedDatastreamStats(datastreamId);

  if (!stats) {
    return getFixedThresholdColor(value, datastreamId);
  }

  const inverted = shouldInvertColorLogic(datastreamId);
  return calculateValueColor(value, stats.min, stats.max, inverted);
}

function getFixedThresholdColor(value: number, datastreamId: string): string {
  const datastreamLower = datastreamId.toLowerCase();

  if (datastreamLower.includes('temp')) {
    if (value > 35 || value < 5) return "text-red-600";
    if (value > 30 || value < 10) return "text-orange-600";
    if (value > 25 || value < 15) return "text-yellow-600";
    return "text-green-600";
  }

  if (datastreamLower.includes('hum')) {
    if (value > 80 || value < 20) return "text-red-600";
    if (value > 70 || value < 30) return "text-orange-600";
    if (value > 60 || value < 40) return "text-yellow-600";
    return "text-green-600";
  }

  if (datastreamLower.includes('press')) {
    if (value > 1050 || value < 950) return "text-red-600";
    if (value > 1030 || value < 970) return "text-orange-600";
    if (value > 1020 || value < 980) return "text-yellow-600";
    return "text-green-600";
  }

  if (datastreamLower.includes('voc')) {
    if (value > 100) return "text-red-600";
    if (value > 50) return "text-orange-600";
    if (value > 25) return "text-yellow-600";
    return "text-green-600";
  }

  if (datastreamLower.includes('battery') || datastreamLower.includes('voltage')) {
    if (value < 3.3) return "text-red-600";
    if (value < 3.6) return "text-orange-600";
    if (value < 3.9) return "text-yellow-600";
    return "text-green-600";
  }

  if (value > 80) return "text-red-600";
  if (value > 60) return "text-orange-600";
  if (value > 40) return "text-yellow-600";
  return "text-green-600";
}

export function getColorDescription(colorClass: string): string {
  switch (colorClass) {
    case "text-green-600": return "Normal";
    case "text-yellow-600": return "Medium";
    case "text-orange-600": return "Warning";
    case "text-red-600": return "Abnormal";
    default: return "Unknown";
  }
}

export function getRelativePositionText(value: number, min: number, max: number): string {
  if (min === max) return "Unique";

  const position = (value - min) / (max - min);

  if (position <= 0.1) return "Very Low";
  if (position <= 0.3) return "Low";
  if (position <= 0.7) return "Medium";
  if (position <= 0.9) return "High";
  return "Very High";
}

export function useSmartValueColor() {
  const getColorSync = (
    value: number,
    datastreamId: string
  ): string => {
    return getSmartValueColorSync(value, datastreamId);
  };

  return {
    getColorSync,
    getSmartValueColor,
    getSmartValueColorSync
  };
}
