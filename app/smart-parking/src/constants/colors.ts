/**
 * 앱 컬러 팔레트 - 주스 테마 (노랑 & 화이트/다크)
 */

// 라이트 모드
export const COLORS = {
    // Primary - 노랑 (Yellow)
    primary: '#FFD700',
    primaryDark: '#E6C200',
    primaryLight: '#FFDF33',

    // Background
    background: '#FFFFFF',
    surface: '#FFFFFF',

    // Text
    textPrimary: '#1A1A1A',
    textSecondary: '#6B7280',
    textDisabled: '#9CA3AF',
    textOnPrimary: '#1A1A1A',  // 노랑 위 검정 텍스트

    // UI Elements
    border: '#E5E7EB',
    divider: '#F3F4F6',

    // Semantic Colors
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
};

// 다크 모드
export const DARK_COLORS = {
    // Primary - 노랑 (Yellow) 유지
    primary: '#FFD700',
    primaryDark: '#E6C200',
    primaryLight: '#FFDF33',

    // Background
    background: '#121212',
    surface: '#1E1E1E',

    // Text
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textDisabled: '#6B7280',
    textOnPrimary: '#1A1A1A',  // 노랑 위 검정 텍스트

    // UI Elements
    border: '#374151',
    divider: '#2D2D2D',

    // Semantic Colors
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
};

export type ThemeColors = typeof COLORS;
