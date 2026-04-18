/**
 * EntryConfirmModal - FUNC-012 입차 확인 모달 (짐 챙기기 확인)
 */
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { ThemeColors } from '../../../App';

interface EntryConfirmModalProps {
    visible: boolean;
    colors: ThemeColors;
    parkingLotName: string;
    onCancel: () => void;
    onConfirm: () => void;
}

const EntryConfirmModal: React.FC<EntryConfirmModalProps> = ({
    visible,
    colors,
    parkingLotName,
    onCancel,
    onConfirm,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <TouchableWithoutFeedback onPress={onCancel}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.container, { backgroundColor: colors.surface }]}>
                            {/* Header Icon */}
                            <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
                                <Text style={styles.iconEmoji}>P</Text>
                            </View>

                            {/* Title */}
                            <Text style={[styles.title, { color: colors.textPrimary }]}>
                                차량에서 내리셨나요?
                            </Text>

                            {/* Parking Lot Info */}
                            <Text style={[styles.parkingLot, { color: colors.textSecondary }]}>
                                {parkingLotName}
                            </Text>

                            {/* Warning Message */}
                            <View style={[styles.warningBox, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
                                <Text style={[styles.warningTitle, { color: colors.warning }]}>
                                    잠깐! 확인해주세요
                                </Text>
                                <Text style={[styles.warningText, { color: colors.textPrimary }]}>
                                    차 안에 소지품이나 귀중품을 두고 내리지 않으셨나요?{'\n'}
                                    짐을 모두 챙기셨는지 확인해주세요.
                                </Text>
                                <Text style={[styles.warningNote, { color: colors.textSecondary }]}>
                                    자동 주차가 시작되면 안전을 위해{'\n'}중도에 멈출 수 없습니다.
                                </Text>
                            </View>

                            {/* Buttons */}
                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                                    onPress={onCancel}
                                >
                                    <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                                        아직 안 내렸어요
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                                    onPress={onConfirm}
                                >
                                    <Text style={[styles.confirmButtonText, { color: colors.textOnPrimary }]}>
                                        확인했습니다
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconEmoji: { fontSize: 40 },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
    parkingLot: { fontSize: 14, marginBottom: 20 },
    warningBox: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 24,
    },
    warningTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
    warningText: { fontSize: 14, lineHeight: 22, marginBottom: 12, textAlign: 'center' },
    warningNote: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
    buttonRow: { flexDirection: 'row', width: '100%' },
    cancelButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginRight: 8,
        borderWidth: 1,
    },
    cancelButtonText: { fontSize: 14, fontWeight: '600' },
    confirmButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmButtonText: { fontSize: 14, fontWeight: '700' },
});

export default EntryConfirmModal;
