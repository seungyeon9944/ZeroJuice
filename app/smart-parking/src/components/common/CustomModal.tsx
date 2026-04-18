import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import Svg, { Rect, Defs, Pattern, Path } from 'react-native-svg';
import { ThemeColors } from '../../constants/colors';

interface CustomModalProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    confirmText?: string;
    cancelText?: string;
    onCancel?: () => void;
    colors: ThemeColors;
}

const { width } = Dimensions.get('window');

// Striped Header Component
const StripeHeader = ({ type, colors }: { type: 'success' | 'error' | 'info'; colors: ThemeColors }) => {
    const isError = type === 'error';
    // Industrial Yellow/Black for everything (Theme) OR Red/Black for error?
    // User asked for "stylish", "yellow/black mixed diagonals".
    // Let's use Yellow/Black for standard/info/success highlights, and maybe Red/Black for error if strictly needed,
    // but user mentioned "yellow/black mixed diagonals" specifically as a design reference like parking markers.
    // Let's use Yellow/Black stripes as the brand signature, but the ICON will distinguish conflict/error.

    // Actually, "Yellow/Black" stripes are commonly used for "Caution" or "Industrial".
    // Let's apply a strip at the top.

    return (
        <View style={styles.stripeHeader}>
            <Svg height="12" width="100%">
                <Defs>
                    <Pattern id="stripe-pattern" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
                        <Rect x="0" y="0" width="10" height="20" fill="#F5D04C" />
                        <Rect x="10" y="0" width="10" height="20" fill="#222222" />
                    </Pattern>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#stripe-pattern)" />
            </Svg>
        </View>
    );
};

const CustomModal: React.FC<CustomModalProps> = ({
    visible,
    title,
    message,
    type = 'info',
    onClose,
    confirmText = '확인',
    cancelText = '취소',
    onCancel,
    colors
}) => {
    const isError = type === 'error';

    // Icons (Using simple text/shape for now as we don't have vector icons installed guaranteed yet, 
    // or we can use the ones from PaymentScreen like the 'V' circle if available).
    // Let's make a custom circle icon.

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel || onClose}
        >
            <View style={styles.centeredView}>
                <View style={[styles.modalView, { backgroundColor: colors.surface }]}>

                    <StripeHeader type={type} colors={colors} />

                    <View style={styles.contentContainer}>
                        {/* Icon Circle */}
                        <View style={[
                            styles.iconCircle,
                            { backgroundColor: '#FFF9D5' } // 배경은 항상 노란색
                        ]}>
                            <Image
                                source={isError
                                    ? require('../../../assets/errorLogo.png')       // [에러] 
                                    : require('../../../assets/settingLogo.png') //  일반] 
                                }
                                style={{ width: 50, height: 50 }} // 이미지 크기 조절
                                resizeMode="contain"
                            />
                        </View>

                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{title}</Text>
                        <Text style={[styles.modalText, { color: colors.textSecondary }]}>{message}</Text>

                        <View style={styles.buttonContainer}>
                            {onCancel && (
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton, { backgroundColor: '#F2F2F2' }]} // Soft grey
                                    onPress={onCancel}
                                >
                                    <Text style={[styles.textStyle, { color: '#666666' }]}>{cancelText}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    onCancel ? styles.confirmButton : styles.fullButton,
                                    { backgroundColor: colors.primary } // Always Yellow/Primary
                                ]}
                                onPress={onClose}
                            >
                                <Text style={[styles.textStyle, { color: colors.textOnPrimary }]}>
                                    {confirmText}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slightly lighter overlay
    },
    modalView: {
        width: width * 0.85,
        borderRadius: 24, // Softer corners
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    stripeHeader: {
        width: '100%',
        height: 12, // Thin industrial strip
    },
    contentContainer: {
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        width: '100%',
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconText: {
        fontSize: 32,
        fontWeight: '900',
        // fontFamily: 'Inter-Bold', // If available
    },
    modalTitle: {
        marginBottom: 12,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: -0.5,
    },
    modalText: {
        marginBottom: 32,
        textAlign: 'center',
        fontSize: 15,
        lineHeight: 22,
        opacity: 0.8,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        borderRadius: 16,
        paddingVertical: 16,
        elevation: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullButton: {
        width: '100%',
    },
    confirmButton: {
        flex: 1,
        marginLeft: 8,
    },
    cancelButton: {
        flex: 1,
        marginRight: 8,
    },
    textStyle: {
        fontWeight: '700',
        textAlign: 'center',
        fontSize: 16,
    },
});

export default CustomModal;
