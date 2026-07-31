import React, { useEffect, useRef, useState } from "react"
import {
    ActivityIndicator,
    Animated,
    Easing,
    Image,
    Pressable,
    SafeAreaView,
    StatusBar,
    Text,
    View,
    useWindowDimensions,
    LayoutAnimation,
    Platform,
    UIManager,
} from "react-native"

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
}
import { Ionicons } from "@expo/vector-icons"
import {
    useFonts,
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
} from "@expo-google-fonts/sora"
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter"
import { Poppins_400Regular, Poppins_500Medium } from "@expo-google-fonts/poppins"

// ---------- Saari images import ----------
const IMG_BUS = require("../../assets/expo.icon/Assets/bugpngphoto.png")
const IMG_CURVE = require("../../assets/expo.icon/Assets/image copy 4-Photoroom.png")
const IMG_ROAD = require("../../assets/expo.icon/Assets/image copy 5.png")
const IMG_2 = require("../../assets/expo.icon/Assets/image copy 2-Photoroom.png")
const IMG_3 = require("../../assets/expo.icon/Assets/image copy 3-Photoroom.png")
const IMG_6 = require("../../assets/expo.icon/Assets/image copy 6.png")
const IMG_7 = require("../../assets/expo.icon/Assets/image copy 7.png")
const IMG_8 = require("../../assets/expo.icon/Assets/image copy 8.png")
const IMG_9 = require("../../assets/expo.icon/Assets/image copy 9.png")
const IMG_COPY = require("../../assets/expo.icon/Assets/image copy-Photoroom.png")
const IMG_MAIN = require("../../assets/expo.icon/Assets/image-Photoroom.png")

const SLIDES = [
    {
        image: IMG_BUS,
        title: "Track your Kid's School Bus -",
        subtitle: "Live GPS tracking se apne bachhe ki bus ki real-time location dekhiye, kabhi bhi, kahin se bhi.",
    },
    // {
    //     image: IMG_2,
    //     title: "Instant Alerts & Notifications",
    //     subtitle: "Bus aane se pehle notification paayiye — pickup aur drop dono ke liye smart alerts.",
    // },
    // {
    //     image: IMG_3,
    //     title: "Safe & Secure Journey",
    //     subtitle: "Verified drivers, secure routes aur complete safety — aapke bachhe ka safar ab tension-free.",
    // },
]

export default function Onboardingpage({ onDone }: { onDone?: () => void }) {
    const [fontsLoaded] = useFonts({
        Sora_400Regular,
        Sora_600SemiBold,
        Sora_700Bold,
        Sora_800ExtraBold,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Poppins_400Regular,
        Poppins_500Medium,
        ClashGrotesk_Regular: require("../../assets/fonts/ClashGrotesk-Regular.otf"),
        ClashGrotesk_Medium: require("../../assets/fonts/ClashGrotesk-Medium.otf"),
        ClashGrotesk_SemiBold: require("../../assets/fonts/ClashGrotesk-Semibold.otf"),
        ClashGrotesk_Bold: require("../../assets/fonts/ClashGrotesk-Bold.otf"),
    })

    const { width, height } = useWindowDimensions()
    const isSmall = height < 700
    const isVerySmall = height < 620
    const isTablet = width >= 768

    const [index, setIndex] = useState(0)
    const slide = SLIDES[index]
    const isLast = index === SLIDES.length - 1

    // Responsive hero image size
    const heroWidth = Math.min(width * (isTablet ? 0.55 : isVerySmall ? 0.65 : 0.8), 420)
    // Responsive text sizes
    const titleSize = isTablet ? 32 : isVerySmall ? 22 : isSmall ? 23 : 26
    const subtitleSize = isVerySmall ? 13 : 15
    // Responsive curve height - give more space to bottom section on very small screens
    const curveHeight = height * (isTablet ? 0.4 : isVerySmall ? 0.52 : isSmall ? 0.48 : 0.45)

    // Responsive button sizes
    const initialBtnWidth = isVerySmall ? 160 : 180
    const finalBtnSize = isVerySmall ? 72 : 84
    const finalInnerSize = finalBtnSize - 18

    // --- Animations ---
    const textAnim = useRef(new Animated.Value(1)).current
    const heroEnter = useRef(new Animated.Value(0)).current
    const heroFloat = useRef(new Animated.Value(0)).current
    const btnPress = useRef(new Animated.Value(1)).current

    // Button Loading Animation
    const [isLoadingReady, setIsLoadingReady] = useState(true)
    const [btnWidth, setBtnWidth] = useState(initialBtnWidth)
    const [btnInnerWidth, setBtnInnerWidth] = useState(initialBtnWidth - 18)

    const loadingOpacity = useRef(new Animated.Value(1)).current
    const iconOpacity = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoadingReady(false)

            // Animate layout changes smoothly
            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring)
            setBtnWidth(finalBtnSize)
            setBtnInnerWidth(finalInnerSize)

            // Crossfade icon and text
            Animated.timing(loadingOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start()
            Animated.timing(iconOpacity, { toValue: 1, duration: 350, delay: 100, useNativeDriver: true }).start()
        }, 2500)
        return () => clearTimeout(timer)
    }, [])

    // Background shapes configs with their own float animations
    const shapes = useRef([
        { float: new Animated.Value(0), size: 110, top: height * 0.14, left: -width * 0.09, color: "#F97316", filled: true, delay: 0, duration: 2600 },
        { float: new Animated.Value(0), size: 26, top: height * 0.19, left: width * 0.84, color: "#10B981", filled: false, delay: 400, duration: 3000 },
        { float: new Animated.Value(0), size: 56, top: height * 0.34, left: width * 0.88, color: "#10B981", filled: true, delay: 800, duration: 2800 },
        { float: new Animated.Value(0), size: 12, top: height * 0.58, left: width * 0.12, color: "#3B82F6", filled: true, delay: 200, duration: 2500 },
        { float: new Animated.Value(0), size: 18, top: height * 0.56, left: width * 0.86, color: "#38BDF8", filled: false, delay: 600, duration: 2900 },
    ]).current

    useEffect(() => {
        // Start floating background shapes
        shapes.forEach(shape => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shape.float, { toValue: 1, duration: shape.duration, delay: shape.delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                    Animated.timing(shape.float, { toValue: 0, duration: shape.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                ])
            ).start()
        })
    }, [shapes])

    useEffect(() => {
        // Trigger hero entrance and float animations when index changes
        heroEnter.setValue(0)
        Animated.timing(heroEnter, { toValue: 1, duration: 550, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }).start()

        const floatLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(heroFloat, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(heroFloat, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        )
        floatLoop.start()

        return () => floatLoop.stop()
    }, [index, heroEnter, heroFloat])

    const goNext = () => {
        if (isLast) {
            onDone?.()
            return
        }
        Animated.timing(textAnim, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
            setIndex((prev) => prev + 1)
            Animated.timing(textAnim, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start()
        })
    }

    if (!fontsLoaded) return <View className="flex-1 bg-white" />

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Floating decorative shapes */}
            {shapes.map((s, i) => (
                <Animated.View
                    key={i}
                    pointerEvents="none"
                    className="absolute"
                    style={{
                        top: s.top, left: s.left, width: s.size, height: s.size, borderRadius: s.size / 2,
                        backgroundColor: s.filled ? s.color : "transparent",
                        borderWidth: s.filled ? 0 : 3,
                        borderColor: s.color,
                        transform: [{ translateY: s.float.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }]
                    }}
                />
            ))}

            <SafeAreaView className="flex-1">


                {/* Hero bus image */}
                <View className="flex-1 items-center justify-center">
                    <Animated.View
                        className="items-center justify-center"
                        style={{
                            opacity: heroEnter,
                            transform: [
                                { translateY: heroFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }) },
                                { scale: heroEnter.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }
                            ]
                        }}
                    >
                        <View className="absolute rounded-full bg-[#FFF7CC]" style={{ width: heroWidth * 1.05, height: heroWidth * 0.82, borderRadius: heroWidth * 0.5 }} />
                        <Image source={slide.image} resizeMode="contain" style={{ width: heroWidth, height: heroWidth * 0.75 }} />
                    </Animated.View>
                </View>
            </SafeAreaView>

            {/* Bottom section (Curved Black Background) */}
            <View style={{ height: curveHeight, width: '100%', alignItems: 'center' }}>

                {/* This massive view creates the smooth top curve */}
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        width: width * 1.5,
                        height: curveHeight + width * 0.75,
                        borderTopLeftRadius: width * 0.75,
                        borderTopRightRadius: width * 0.75,
                        backgroundColor: '#101010'
                    }}
                />

                {/* Content Container */}
                <View
                    className="w-full flex-1 flex-col justify-between"
                    style={{ paddingTop: isVerySmall ? 20 : 48, paddingBottom: isVerySmall ? 20 : 40 }}
                >

                    <View>
                        {/* Title and Subtitle */}
                        <Animated.View
                            className="items-center px-8"
                            style={{
                                opacity: textAnim,
                                transform: [{ translateY: textAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }]
                            }}
                        >
                            <Text className="text-center text-white" style={{ fontFamily: "Inter-Light", fontSize: titleSize, lineHeight: titleSize * 1.3 }}>
                                {slide.title}
                            </Text>
                            <Text className="text-center leading-relaxed text-white/70" style={{ fontFamily: "Inter-Light", fontSize: subtitleSize, marginTop: isVerySmall ? 12 : 20 }}>
                                {slide.subtitle}
                            </Text>
                        </Animated.View>

                        {/* Pagination Dots */}
                        <View className="mt-6 flex-row items-center justify-center gap-2">
                            {SLIDES.map((_, i) => (
                                <View
                                    key={i}
                                    className="rounded-full"
                                    style={{
                                        width: i === index ? 22 : 8, height: 8,
                                        backgroundColor: i === index ? "#FFD60A" : "rgba(255,255,255,0.35)"
                                    }}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Next Button (Animated Loading to Circle) */}
                    <View className="items-center justify-center" style={{ marginBottom: isVerySmall ? 24 : isSmall ? 40 : 64 }}>
                        <Pressable
                            disabled={isLoadingReady}
                            onPress={goNext}
                            onPressIn={() => !isLoadingReady && Animated.spring(btnPress, { toValue: 0.88, friction: 5, useNativeDriver: true }).start()}
                            onPressOut={() => !isLoadingReady && Animated.spring(btnPress, { toValue: 1, friction: 5, useNativeDriver: true }).start()}
                        >
                            {/* Scale wrapper (Native Driver) */}
                            <Animated.View style={{ transform: [{ scale: btnPress }] }}>
                                {/* Width wrapper (LayoutAnimation handles this) */}
                                <View
                                    className="items-center justify-center rounded-full border-2 border-white/20 overflow-hidden"
                                    style={{ width: btnWidth, height: 84 }}
                                >
                                    <View
                                        className="items-center justify-center rounded-full bg-[#FFD60A]"
                                        style={{
                                            width: btnInnerWidth, height: 66,
                                            shadowColor: "#FFD60A", shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 10,
                                            flexDirection: 'row'
                                        }}
                                    >
                                        {/* Loading State */}
                                        <Animated.View style={{ opacity: loadingOpacity, position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <ActivityIndicator color="#101010" size="small" />
                                            <Text className="text-[#101010]" style={{ fontFamily: "Inter-Light", fontSize: 16 }}>Loading...</Text>
                                        </Animated.View>

                                        {/* Final Icon State */}
                                        <Animated.View style={{ opacity: iconOpacity, position: 'absolute' }}>
                                            <Ionicons name={isLast ? "checkmark" : "chevron-forward"} size={30} color="#101010" />
                                        </Animated.View>
                                    </View>
                                </View>
                            </Animated.View>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    )
}
