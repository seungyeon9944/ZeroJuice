/**
 * Button - 공용 버튼 컴포넌트
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    icon?: string;
    colors: {
        primary: string;
        textOnPrimary: string;
        surface: string;
        textPrimary: string;
        border: string;
    };
    style?: ViewStyle;
    textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    colors,
    style,
    textStyle,
}) => {
    const getButtonStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
        };

        // Size
        switch (size) {
            case 'small':
                baseStyle.paddingVertical = 8;
                baseStyle.paddingHorizontal = 16;
                break;
            case 'large':
                baseStyle.paddingVertical = 18;
                baseStyle.paddingHorizontal = 24;
                break;
            default:
                baseStyle.paddingVertical = 14;
                baseStyle.paddingHorizontal = 20;
        }

        // Variant
        switch (variant) {
            case 'secondary':
                baseStyle.backgroundColor = colors.surface;
                baseStyle.borderWidth = 1;
                baseStyle.borderColor = colors.border;
                break;
            case 'outline':
                baseStyle.backgroundColor = 'transparent';
                baseStyle.borderWidth = 2;
                baseStyle.borderColor = colors.primary;
                break;
            case 'danger':
                baseStyle.backgroundColor = '#EF4444';
                break;
            case 'ghost':
                baseStyle.backgroundColor = 'transparent';
                break;
            default:
                baseStyle.backgroundColor = colors.primary;
        }

        if (disabled || loading) {
            baseStyle.opacity = 0.5;
        }

        return baseStyle;
    };

    const getTextStyle = (): TextStyle => {
        const base: TextStyle = {
            fontWeight: '600',
        };

        // Size
        switch (size) {
            case 'small':
                base.fontSize = 14;
                break;
            case 'large':
                base.fontSize = 18;
                break;
            default:
                base.fontSize = 16;
        }

        // Variant
        switch (variant) {
            case 'secondary':
            case 'ghost':
                base.color = colors.textPrimary;
                break;
            case 'outline':
                base.color = colors.primary;
                break;
            case 'danger':
                base.color = '#FFFFFF';
                break;
            default:
                base.color = colors.textOnPrimary;
        }

        return base;
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[getButtonStyle(), style]}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'primary' ? colors.textOnPrimary : colors.textPrimary}
                    size="small"
                />
            ) : (
                <>
                    {icon && <Text style={{ marginRight: 8, fontSize: size === 'small' ? 14 : 18 }}>{icon}</Text>}
                    <Text style={[getTextStyle(), textStyle]}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

export default Button;
