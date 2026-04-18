/**
 * Badge - 상태 배지 컴포넌트
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
    text: string;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
    size?: 'small' | 'medium';
    icon?: string;
    style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
    text,
    variant = 'default',
    size = 'medium',
    icon,
    style,
}) => {
    const getColors = () => {
        switch (variant) {
            case 'success':
                return { bg: '#22C55E20', text: '#22C55E', dot: '#22C55E' };
            case 'warning':
                return { bg: '#F59E0B20', text: '#F59E0B', dot: '#F59E0B' };
            case 'error':
                return { bg: '#EF444420', text: '#EF4444', dot: '#EF4444' };
            case 'info':
                return { bg: '#3B82F620', text: '#3B82F6', dot: '#3B82F6' };
            default:
                return { bg: '#6B728020', text: '#6B7280', dot: '#6B7280' };
        }
    };

    const colors = getColors();
    const isSmall = size === 'small';

    return (
        <View style={[
            styles.container,
            { backgroundColor: colors.bg },
            isSmall ? styles.containerSmall : styles.containerMedium,
            style,
        ]}>
            {icon && <Text style={[styles.icon, isSmall && styles.iconSmall]}>{icon}</Text>}
            <View style={[styles.dot, { backgroundColor: colors.dot }]} />
            <Text style={[
                styles.text,
                { color: colors.text },
                isSmall && styles.textSmall,
            ]}>
                {text}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
    },
    containerSmall: {
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    containerMedium: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    icon: {
        fontSize: 14,
        marginRight: 4,
    },
    iconSmall: {
        fontSize: 12,
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
    },
    textSmall: {
        fontSize: 12,
    },
});

export default Badge;
