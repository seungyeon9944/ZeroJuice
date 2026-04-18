/**
 * SplashScreen - Video & Logo
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Dimensions, Animated } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as SplashScreenPlugin from 'expo-splash-screen';
import { COLORS } from '../../constants';

interface SplashScreenProps {
    colors: any;
    onFinish?: () => void;
}

const { width, height } = Dimensions.get('window');

const SplashScreen: React.FC<SplashScreenProps> = ({ colors, onFinish }) => {
    // Video Ref
    const videoRef = useRef<Video>(null);

    // State to ensure synchronized appearance
    const [isReady, setIsReady] = React.useState(false);

    // 1. Loading Bar Animation (5 seconds to match App.tsx)
    const animation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Hide the native splash screen as soon as this component mounts
        const hideSplash = async () => {
            try {
                await SplashScreenPlugin.hideAsync();
            } catch (e) {
                console.warn('Error hiding splash screen:', e);
            }
        };
        hideSplash();

        if (isReady) {
            Animated.timing(animation, {
                toValue: 1,
                duration: 5000,
                useNativeDriver: false, // width animation doesn't support native driver
            }).start();
        }
    }, [isReady]);

    const widthInterpolated = animation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>

            {/* Top Logo */}
            <View style={styles.topLogoContainer}>
                <Image
                    source={require('../../../assets/splash/zerojuiceLogo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
            </View>

            {/* Middle Video - 90% Size */}
            <View style={[styles.videoContainer, { marginTop: -40 }]}>
                {/* Added negative margin to pull it up slightly if needed, or just let space-between handle it */}
                <Video
                    ref={videoRef as any}
                    style={styles.video}
                    source={require('../../../assets/splash/zerojuiceSplash.mp4')}
                    resizeMode={ResizeMode.COVER} // Changed to COVER to fill the 90% box properly without borders if ratio mismatch
                    shouldPlay
                    isLooping={false}
                    positionMillis={0}
                    isMuted={true}
                    onError={(e) => console.log('Video Error:', e)}
                    onLoad={() => {
                        console.log('Video Loaded');
                        setIsReady(true);
                    }}
                    onPlaybackStatusUpdate={(status) => {
                        if (status.isLoaded && status.didJustFinish) {
                            if (onFinish) onFinish();
                        }
                    }}
                />
            </View>

            {/* Bottom Loading Bar - Animated */}
            <View style={styles.bottomContainer}>
                <View style={styles.loaderContainer}>
                    <View style={styles.loadingBarBackground}>
                        <Animated.View style={[styles.loadingBarFill, { backgroundColor: COLORS.primary, width: widthInterpolated }]} />
                    </View>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        </View>

    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAFA', paddingVertical: 40 }, // Bg changed to #FAFAFA per user observation
    topLogoContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 20, /* Moved higher (was 60) */
        height: 250, /* Reserved more height for larger logo */
    },
    logoImage: { width: 400, height: 240 }, /* Doubled size (was 200x120) */
    videoContainer: {
        width: width * 0.9,
        height: height * 0.65, /* Slightly reduced height to accommodate larger logo */
        justifyContent: 'center',
        alignItems: 'center',
    },
    video: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 50,
        width: '100%',
        alignItems: 'center',
    },
    loaderContainer: {
        width: '70%',
        alignItems: 'center',
    },
    loadingBarBackground: {
        width: '100%',
        height: 6,
        backgroundColor: '#E0E0E0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    loadingBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    loadingText: { marginTop: 12, fontSize: 14, color: '#888' },
    versionText: { position: 'absolute', bottom: 40, fontSize: 12 },
});

export default SplashScreen;
