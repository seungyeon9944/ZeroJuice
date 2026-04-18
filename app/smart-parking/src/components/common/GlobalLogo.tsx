import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GlobalLogo: React.FC = () => {
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { top: insets.top + 10 }]}>
            <Image
                source={require('../../../assets/splash/zerojuiceLogo.png')}
                style={styles.logo}
                contentFit="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20, // Moved to left
        zIndex: 9999, // Ensure it's on top of everything
        elevation: 10, // Android shadow/elevation
    },
    logo: {
        width: 120, // Increased size
        height: 60,
    },
});

export default GlobalLogo;
