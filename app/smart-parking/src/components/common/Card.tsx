/**
 * Card - 공용 카드 컴포넌트
 */
import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
    children: ReactNode;
    colors: {
        surface: string;
        border: string;
    };
    variant?: 'default' | 'outlined' | 'elevated';
    style?: ViewStyle;
    padding?: number;
}

const Card: React.FC<CardProps> = ({
    children,
    colors,
    variant = 'default',
    style,
    padding = 16,
}) => {
    const getCardStyle = (): ViewStyle => {
        const base: ViewStyle = {
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding,
        };

        switch (variant) {
            case 'outlined':
                base.borderWidth = 1;
                base.borderColor = colors.border;
                break;
            case 'elevated':
                base.shadowColor = '#000';
                base.shadowOffset = { width: 0, height: 2 };
                base.shadowOpacity = 0.1;
                base.shadowRadius = 8;
                base.elevation = 4;
                break;
        }

        return base;
    };

    return (
        <View style={[getCardStyle(), style]}>
            {children}
        </View>
    );
};

export default Card;
