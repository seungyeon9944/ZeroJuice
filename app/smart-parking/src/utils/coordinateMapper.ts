/**
 * Coordinate Mapper Utility
 * Converts real-world MQTT coordinates to map percentage coordinates (0-100%)
 */

// Calibration Constants (based on actual parking lot measurements)
// Data collected from ROS navigation system
export const COORD_BOUNDS = {
    // X-axis bounds (meters) - from actual measurements
    X_MIN: -1.1,  // Leftmost point (A1 before)
    X_MAX: 2.5,   // Rightmost point (B1 goal)

    // Y-axis bounds (meters) - from actual measurements
    Y_MIN: -1.1,  // Bottom (A1/A2 goals)
    Y_MAX: 2.6,   // Top (Exit)

    // Yaw offset (degrees) - adjust if 0° doesn't match expected orientation
    YAW_OFFSET: 0,
};

// Reference Points from Actual Measurements
export const REFERENCE_POINTS = {
    ENTRANCE: { x: 2.650588627469613, y: 1.63983509885819 },
    EXIT: { x: 1.2988925748565996, y: 2.5376471372590528 },

    // Parking slot goal positions
    SLOTS: {
        'A1': { x: 0.40347520237517365, y: -1.0552401007958878 },
        'A2': { x: 0.918401550481573, y: -1.0569639687580201 },
        'B1': { x: 2.412332592737062, y: -0.20216668555973988 },
        'C2': { x: 0.2829900732321928, y: 1.1755823309682225 },
    }
};


/**
 * Convert MQTT x coordinate to map percentage (0-100%)
 * MQTT X (up = positive) -> Screen Y (down = positive)
 * Bottom center is (0,0), so X+ goes up -> Screen Y should decrease
 */
export const mqttXToMapPercent = (mqttX: number, mqttY: number): number => {
    const { X_MIN, X_MAX } = COORD_BOUNDS;
    const normalized = (mqttX - X_MIN) / (X_MAX - X_MIN);
    // Invert: X+ (up) -> Y% decreases (0% at top)
    return Math.max(0, Math.min(100, (1 - normalized) * 100));
};

/**
 * Convert MQTT y coordinate to map percentage (0-100%)
 * MQTT Y (left = positive, right = negative) -> Screen X (right = positive)
 * Y+ is left, Y- is right -> Screen X should be inverted
 */
export const mqttYToMapPercent = (mqttX: number, mqttY: number): number => {
    const { Y_MIN, Y_MAX } = COORD_BOUNDS;
    const normalized = (mqttY - Y_MIN) / (Y_MAX - Y_MIN);
    // Invert: Y+ (left) -> X% should be on left (0%), Y- (right) -> X% on right (100%)
    return Math.max(0, Math.min(100, (1 - normalized) * 100));
};

/**
 * Convert MQTT yaw (radians) to map rotation (degrees)
 * MQTT yaw: radians, typically 0=East, π/2=North, π=West, -π/2=South
 * Map rotation: degrees, 0=Up, 90=Right, 180=Down, 270=Left
 * Adjusted for 90° clockwise coordinate transformation
 */
export const mqttYawToMapRotation = (yawRadians: number): number => {
    // Convert radians to degrees
    let degrees = (yawRadians * 180) / Math.PI;

    // Add 90° for coordinate system rotation (clockwise)
    degrees += 90;

    // Apply offset for calibration
    degrees += COORD_BOUNDS.YAW_OFFSET;

    // Normalize to 0-360 range
    degrees = ((degrees % 360) + 360) % 360;

    return degrees;
};

/**
 * Convert full MQTT pose to map coordinates
 */
export interface MqttPose {
    x: number;
    y: number;
    yaw: number; // radians
}

export interface MapCoordinate {
    x: number; // 0-100%
    y: number; // 0-100%
    rotation: number; // degrees
}

export const mqttPoseToMapCoordinate = (pose: MqttPose): MapCoordinate => {
    return {
        x: mqttXToMapPercent(pose.x, pose.y),
        y: mqttYToMapPercent(pose.x, pose.y),
        rotation: mqttYawToMapRotation(pose.yaw),
    };
};
