import { formatDetectionSpeech } from '../src/utils/speechFormatter.ts';
import type { DetectionItem } from '../src/types/index.ts';

function runTests() {
  console.log('--- Testing Speech Formatting and Directional Phrasing ---');

  // Test 1: Empty detections
  const t1 = formatDetectionSpeech([]);
  console.log('1. Empty detections:', t1.speechText, '| Signature:', t1.sceneSignature);
  if (t1.speechText !== 'Path clear ahead.') throw new Error('Test 1 failed');

  // Test 2: Single person ahead
  const itemPerson: DetectionItem = {
    label: 'person',
    confidence: 0.88,
    box: [0.1, 0.4, 0.8, 0.6],
    position: 'center',
    visual_proximity: 'nearby',
    is_obstacle: true,
    advisory_text: 'Person detected ahead center.',
  };
  const t2 = formatDetectionSpeech([itemPerson]);
  console.log('2. Person centered:', t2.speechText, '| Urgent:', t2.isUrgent);
  if (t2.speechText !== 'Person detected ahead.') throw new Error('Test 2 failed');

  // Test 3: Chair on the left
  const itemChair: DetectionItem = {
    label: 'chair',
    confidence: 0.79,
    box: [0.4, 0.1, 0.8, 0.3],
    position: 'left',
    visual_proximity: 'nearby',
    is_obstacle: true,
    advisory_text: 'Chair detected on your left.',
  };
  const t3 = formatDetectionSpeech([itemChair]);
  console.log('3. Chair left:', t3.speechText);
  if (t3.speechText !== 'Chair detected on the left.') throw new Error('Test 3 failed');

  // Test 4: Approaching hazard ahead
  const itemApproachingPerson: DetectionItem = {
    label: 'person',
    confidence: 0.92,
    box: [0.05, 0.35, 0.95, 0.65],
    position: 'center',
    visual_proximity: 'approaching',
    is_obstacle: true,
    advisory_text: 'Caution: Person detected ahead center.',
  };
  const t4 = formatDetectionSpeech([itemApproachingPerson]);
  console.log('4. Approaching person:', t4.speechText, '| Urgent:', t4.isUrgent);
  if (t4.speechText !== 'Caution: person detected ahead.' || !t4.isUrgent) {
    throw new Error('Test 4 failed');
  }

  // Test 5: Two objects (Person center + Chair left)
  const t5 = formatDetectionSpeech([itemPerson, itemChair]);
  console.log('5. Two objects:', t5.speechText);
  if (t5.speechText !== 'Person detected ahead, and chair on the left.') {
    throw new Error('Test 5 failed');
  }

  // Test 6: Three or more objects
  const itemBackpack: DetectionItem = {
    label: 'backpack',
    confidence: 0.75,
    box: [0.5, 0.7, 0.8, 0.9],
    position: 'right',
    visual_proximity: 'distant',
    is_obstacle: true,
    advisory_text: 'Backpack on your right.',
  };
  const t6 = formatDetectionSpeech([itemPerson, itemChair, itemBackpack]);
  console.log('6. Multiple objects:', t6.speechText);
  if (!t6.speechText.startsWith('Multiple objects detected:')) {
    throw new Error('Test 6 failed');
  }

  // Test 7: Deduplication signature verification
  console.log('7. Signatures:');
  console.log('   t2 sig:', t2.sceneSignature);
  console.log('   t5 sig:', t5.sceneSignature);
  console.log('   t6 sig:', t6.sceneSignature);
  if (t2.sceneSignature === t5.sceneSignature) throw new Error('Signatures must differ when scene changes');

  console.log('\nAll speech formatting and directional tests passed successfully!');
}

runTests();
