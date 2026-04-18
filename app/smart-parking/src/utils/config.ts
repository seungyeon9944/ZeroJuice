// Kakao Map API Key Configuration
// Replace 'YOUR_KAKAO_JAVASCRIPT_API_KEY' with your actual API key
// Get your API key from: https://developers.kakao.com

export const KAKAO_MAP_API_KEY = 'YOUR_KAKAO_JAVASCRIPT_API_KEY';

// API endpoints (for future backend integration)
export const API_BASE_URL = 'https://i14a201.p.ssafy.io/api/v1';

export const API_ENDPOINTS = {
    CAR_LOCATION: '/car/location',
    PARKING_ENTRY: '/parking/request-entry',
    PARKING_EXIT: '/parking/request-exit',
    PARKING_LOTS_STATUS: '/parking-slots/status',
    PAYMENT_INFO: '/payment', // Base for /payment/{recordId}
    SETTINGS: '/settings',
    // SSE endpoint for real-time vehicle pose
    SSE_VEHICLE_POSE: '/app/parking-location', // append /{userId}
};

// Coordinate System Calibration
// Based on actual ROS navigation measurements
export const COORDINATE_CALIBRATION = {
    // Parking lot bounds (in meters from ROS)
    X_MIN: -1.1,
    X_MAX: 2.5,
    Y_MIN: -1.1,
    Y_MAX: 2.6,

    // Reference points
    ENTRANCE_MQTT: { x: 2.650588627469613, y: 1.63983509885819, yaw: -3.03 },
    EXIT_MQTT: { x: 1.2988925748565996, y: 2.5376471372590528 },

    // Parking slots (goal positions)
    SLOTS: {
        'A1': { x: 0.40347520237517365, y: -1.0552401007958878 },
        'A2': { x: 0.918401550481573, y: -1.0569639687580201 },
        'B1': { x: 2.412332592737062, y: -0.20216668555973988 },
        'C2': { x: 0.2829900732321928, y: 1.1755823309682225 },
    },

    // Yaw calibration offset (degrees)
    YAW_OFFSET: 0,
};
