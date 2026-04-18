/**
 * Coordinate Calibration Test
 * Use this to verify that MQTT coordinates map correctly to the parking lot image
 */

import { mqttPoseToMapCoordinate } from '../utils/coordinateMapper';
import { REFERENCE_POINTS } from '../utils/coordinateMapper';

// Test all reference points
console.log('=== Coordinate Calibration Test ===\n');

// Test Entrance
const entranceMap = mqttPoseToMapCoordinate({
    x: REFERENCE_POINTS.ENTRANCE.x,
    y: REFERENCE_POINTS.ENTRANCE.y,
    yaw: -3.03
});
console.log('Entrance:');
console.log(`  MQTT: (${REFERENCE_POINTS.ENTRANCE.x.toFixed(2)}, ${REFERENCE_POINTS.ENTRANCE.y.toFixed(2)})`);
console.log(`  Map:  (${entranceMap.x.toFixed(1)}%, ${entranceMap.y.toFixed(1)}%)`);
console.log(`  Rotation: ${entranceMap.rotation.toFixed(1)}°\n`);

// Test Exit
const exitMap = mqttPoseToMapCoordinate({
    x: REFERENCE_POINTS.EXIT.x,
    y: REFERENCE_POINTS.EXIT.y,
    yaw: 0
});
console.log('Exit:');
console.log(`  MQTT: (${REFERENCE_POINTS.EXIT.x.toFixed(2)}, ${REFERENCE_POINTS.EXIT.y.toFixed(2)})`);
console.log(`  Map:  (${exitMap.x.toFixed(1)}%, ${exitMap.y.toFixed(1)}%)\n`);

// Test Parking Slots
Object.entries(REFERENCE_POINTS.SLOTS).forEach(([slotId, coords]) => {
    const mapCoord = mqttPoseToMapCoordinate({
        x: coords.x,
        y: coords.y,
        yaw: 0
    });
    console.log(`${slotId}:`);
    console.log(`  MQTT: (${coords.x.toFixed(2)}, ${coords.y.toFixed(2)})`);
    console.log(`  Map:  (${mapCoord.x.toFixed(1)}%, ${mapCoord.y.toFixed(1)}%)\n`);
});

console.log('=== Expected Map Positions ===');
console.log('Entrance should be around: 70% right, 65% down');
console.log('Exit should be around: 45% right, 20% down');
console.log('A1/A2 should be at bottom (85% down)');
console.log('B1 should be at right side (70% right)');
console.log('C2 should be at top-left (35% down)');
