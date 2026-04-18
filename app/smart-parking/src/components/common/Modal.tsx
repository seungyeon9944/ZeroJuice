/**
 * Modal - 공용 모달 컴포넌트
 */
import React, { ReactNode } from 'react';
import { View, Text, Modal as RNModal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

interface ModalProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    colors: {
        background: string;
        surface: string;
        textPrimary: string;
        textSecondary: string;
        border: string;
    };
    showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
    visible,
    onClose,
    title,
    children,
    colors,
    showCloseButton = true,
}) => {
    return (
        <RNModal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.container, { backgroundColor: colors.surface }]}>
                            {(title || showCloseButton) && (
                                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                                    {title && (
                                        <Text style={[styles.title, { color: colors.textPrimary }]}>
                                            {title}
                                        </Text>
                                    )}
                                    {showCloseButton && (
                                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                            <Text style={[styles.closeText, { color: colors.textSecondary }]}>✕</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            <View style={styles.content}>
                                {children}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </RNModal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        fontSize: 18,
    },
    content: {
        padding: 20,
    },
});

export default Modal;
