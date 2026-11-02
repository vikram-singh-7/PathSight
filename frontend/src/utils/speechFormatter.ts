import type { DetectionItem } from '../types';

export interface FormattedSpeech {
  speechText: string;
  isUrgent: boolean;
  sceneSignature: string;
}

function getDirectionPhrase(position: 'left' | 'center' | 'right'): string {
  switch (position) {
    case 'left':
      return 'on the left';
    case 'right':
      return 'on the right';
    case 'center':
    default:
      return 'ahead';
  }
}

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Formats genuine YOLO detection results into concise, natural spoken guidance.
 * Strictly respects directional bounding boxes and avoids fabricated distance metrics.
 */
export function formatDetectionSpeech(detections: DetectionItem[]): FormattedSpeech {
  if (!detections || detections.length === 0) {
    return {
      speechText: 'Path clear ahead.',
      isUrgent: false,
      sceneSignature: 'scene_empty',
    };
  }

  // Sort detections to prioritize centered and approaching physical obstacles
  const sorted = [...detections].sort((a, b) => {
    // Center items first
    const aCenter = a.position === 'center' ? 0 : 1;
    const bCenter = b.position === 'center' ? 0 : 1;
    if (aCenter !== bCenter) return aCenter - bCenter;

    // Approaching items first
    const proxOrder = { approaching: 0, nearby: 1, distant: 2 };
    const aProx = proxOrder[a.visual_proximity];
    const bProx = proxOrder[b.visual_proximity];
    if (aProx !== bProx) return aProx - bProx;

    // Highest confidence
    return b.confidence - a.confidence;
  });

  const top = sorted[0];
  const topDir = getDirectionPhrase(top.position);

  // Check for immediate physical hazard directly in front of the user
  const hasUrgentAhead =
    top.is_obstacle &&
    top.position === 'center' &&
    top.visual_proximity === 'approaching';

  // Single object in view
  if (sorted.length === 1) {
    const text = hasUrgentAhead
      ? `Caution: ${top.label} detected ahead.`
      : `${capitalize(top.label)} detected ${topDir}.`;

    return {
      speechText: text,
      isUrgent: hasUrgentAhead,
      sceneSignature: `${top.label}:${top.position}:${top.visual_proximity}`,
    };
  }

  // Exactly two objects in view
  const second = sorted[1];
  const secondDir = getDirectionPhrase(second.position);

  if (hasUrgentAhead) {
    return {
      speechText: `Caution: ${top.label} detected ahead. ${capitalize(second.label)} ${secondDir}.`,
      isUrgent: true,
      sceneSignature: `${top.label}:${top.position}|${second.label}:${second.position}`,
    };
  }

  if (sorted.length === 2) {
    return {
      speechText: `${capitalize(top.label)} detected ${topDir}, and ${second.label} ${secondDir}.`,
      isUrgent: false,
      sceneSignature: `${top.label}:${top.position}|${second.label}:${second.position}`,
    };
  }

  // Three or more objects in view
  return {
    speechText: `Multiple objects detected: ${top.label} ${topDir}, and ${second.label} ${secondDir}.`,
    isUrgent: false,
    sceneSignature: sorted
      .slice(0, 3)
      .map((d) => `${d.label}:${d.position}`)
      .join('|'),
  };
}

