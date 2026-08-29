import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Alert,
    useWindowDimensions,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    withDelay,
    withSequence,
    interpolate,
    interpolateColor,
    Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { VideoView, useVideoPlayer } from "expo-video";
import TermsAndConditionsModal from "./termsandconditions";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Design Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Same palette as the login / forgot-password / OTP / role pages. */
const ACCENT = "#FFD60A";
const ACCENT_SOFT = "#FFF6CC";
const ACCENT_DEEP = "#E6BC00";
const INK = "#101010";
const MUTED = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER_IDLE = "#ECEDF0";
const BG_IDLE = "#F7F8FA";
const SUCCESS = "#16A34A";
const DANGER = "#DC2626";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Fonts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Premium pairing â€” Sora (display headings) + Inter (body).
   Already loaded in your root App.tsx (same as the login page). */
const FONT = {
    light: "Inter-Light",
    regular: "Inter-Regular",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
    display: "Sora-Bold",
    displayHeavy: "Sora-ExtraBold",
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Assets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Adjust the relative path to match where you place this file.
   (This matches src/components/ inside your BusTracker project.) */
const HERO_VIDEO = require("../../assets/expo.icon/Assets/school-animation-gif-download-7813556.mp4");

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Steps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   13 fields would force scrolling on one screen â€” a 4-step wizard keeps
   every field visible WITHOUT scrolling on any screen size, and users
   fill 3-4 short fields at a time (easiest possible data entry). */
type FieldKey =
    | "schoolName"
    | "schoolEmail"
    | "schoolPhone"
    | "principalName"
    | "adminName"
    | "adminMobile"
    | "adminEmail"
    | "address"
    | "city"
    | "state"
    | "postalCode"
    | "password"
    | "confirmPassword";

type FieldConfig = {
    key: FieldKey;
    label: string;
    placeholder: string;
    icon: keyof typeof Ionicons.glyphMap;
    keyboard?: "default" | "email-address" | "phone-pad" | "number-pad";
    secure?: boolean;
    maxLength?: number;
    autoCapitalize?: "none" | "words" | "sentences";
    /** row = share one line with the next field (city/state) */
    half?: boolean;
    editable?: boolean;
};

type StepConfig = {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    fields: FieldConfig[];
};

const STEPS: StepConfig[] = [
    {
        title: "School Details",
        subtitle: "Tell us about your school",
        icon: "school-outline",
        fields: [
            { key: "schoolName", label: "School Name", placeholder: "Enter school name", icon: "business-outline", autoCapitalize: "words" },
            { key: "schoolEmail", label: "School Email", placeholder: "school@example.com", icon: "mail-outline", keyboard: "email-address", autoCapitalize: "none" },
            { key: "schoolPhone", label: "School Contact Number", placeholder: "Enter phone number", icon: "call-outline", keyboard: "phone-pad", maxLength: 10 },
            { key: "principalName", label: "Principal Name", placeholder: "Enter principal name", icon: "person-outline", autoCapitalize: "words" },
        ],
    },
    {
        title: "Administrator",
        subtitle: "Who will manage this account?",
        icon: "shield-checkmark-outline",
        fields: [
            { key: "adminName", label: "Administrator Name", placeholder: "Enter administrator name", icon: "person-circle-outline", autoCapitalize: "words" },
            { key: "adminMobile", label: "Administrator Mobile (Registered)", placeholder: "Registered mobile number", icon: "phone-portrait-outline", keyboard: "phone-pad", maxLength: 10, editable: false },
            { key: "adminEmail", label: "Administrator Email", placeholder: "admin@example.com", icon: "at-outline", keyboard: "email-address", autoCapitalize: "none" },
        ],
    },
    {
        title: "School Address",
        subtitle: "Where is your school located?",
        icon: "location-outline",
        fields: [
            { key: "address", label: "Complete Address", placeholder: "Building, street, area", icon: "home-outline", autoCapitalize: "sentences" },
            { key: "city", label: "City", placeholder: "City", icon: "map-outline", autoCapitalize: "words", half: true },
            { key: "state", label: "State", placeholder: "State", icon: "flag-outline", autoCapitalize: "words", half: true },
            { key: "postalCode", label: "Postal Code", placeholder: "Enter postal code", icon: "pin-outline", keyboard: "number-pad", maxLength: 6 },
        ],
    },
    {
        title: "Security",
        subtitle: "Create a strong password",
        icon: "lock-closed-outline",
        fields: [
            { key: "password", label: "Password", placeholder: "Create password (min 6)", icon: "lock-closed-outline", secure: true },
            { key: "confirmPassword", label: "Confirm Password", placeholder: "Re-enter password", icon: "checkmark-done-outline", secure: true },
        ],
    },
];

/* ────────────────────────── Validation ────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

function validateField(key: FieldKey, value: string, all: Record<FieldKey, string>): string | null {
    const v = value.trim();
    switch (key) {
        case "schoolName": return v.length >= 3 ? null : "Enter the school name";
        case "schoolEmail": return EMAIL_RE.test(v) ? null : "Enter a valid school email";
        case "schoolPhone": return PHONE_RE.test(v) ? null : "Enter a valid 10-digit phone";
        case "principalName": return v.length >= 3 ? null : "Enter the principal name";
        case "adminName": return v.length >= 3 ? null : "Enter the administrator name";
        case "adminMobile": return PHONE_RE.test(v) ? null : "Enter a valid 10-digit mobile";
        case "adminEmail": return EMAIL_RE.test(v) ? null : "Enter a valid admin email";
        case "address": return v.length >= 8 ? null : "Enter the complete address";
        case "city": return v.length >= 2 ? null : "Enter city";
        case "state": return v.length >= 2 ? null : "Enter state";
        case "postalCode": return /^\d{6}$/.test(v) ? null : "Enter 6-digit code";
        case "password": return value.length >= 6 ? null : "Min 6 characters";
        case "confirmPassword": return value === all.password && value.length > 0 ? null : "Passwords do not match";
    }
}

export type SchoolSignupData = Record<FieldKey, string>;

type SchoolSignupPageProps = {
    /** Verified mobile number from the previous screen */
    initialPhone?: string;
    /** Back arrow in the header — e.g. () => navigation.goBack() */
    onBack?: () => void;
    /** Fires with ALL form data after the final submit succeeds */
    onSubmit?: (data: SchoolSignupData) => void;
};

const EMPTY: SchoolSignupData = {
    schoolName: "", schoolEmail: "", schoolPhone: "", principalName: "",
    adminName: "", adminMobile: "", adminEmail: "",
    address: "", city: "", state: "", postalCode: "",
    password: "", confirmPassword: "",
};

/* ══════════════════════════ Ultra Premium Big Field ══════════════════════════ */
function Field({
    cfg, value, error, shakeTrigger, onChange, onFocusField, secureShown, onToggleSecure,
    inputRef, onSubmitEditing, isLast, ms,
}: {
    cfg: FieldConfig;
    value: string;
    error: string | null;
    shakeTrigger?: number;
    onChange: (t: string) => void;
    onFocusField: () => void;
    secureShown?: boolean;
    onToggleSecure?: () => void;
    inputRef?: (r: TextInput | null) => void;
    onSubmitEditing?: () => void;
    isLast?: boolean;
    ms: (n: number, f?: number) => number;
}) {
    const focus = useSharedValue(0);
    const fieldShake = useSharedValue(0);
    const valid = value.length > 0 && !error;
    const isLocked = cfg.editable === false;

    useEffect(() => {
        if (shakeTrigger && shakeTrigger > 0) {
            fieldShake.value = withSequence(
                withTiming(-10, { duration: 45 }),
                withTiming(10, { duration: 45 }),
                withTiming(-7, { duration: 45 }),
                withTiming(7, { duration: 45 }),
                withTiming(-4, { duration: 45 }),
                withTiming(4, { duration: 45 }),
                withTiming(0, { duration: 45 }),
            );
        }
    }, [shakeTrigger]);

    const boxStyle = useAnimatedStyle(() => ({
        borderColor: error
            ? DANGER
            : isLocked
            ? "#CBD5E1"
            : interpolateColor(focus.value, [0, 1], [BORDER_IDLE, ACCENT]),
        backgroundColor: isLocked
            ? "#F1F5F9"
            : interpolateColor(focus.value, [0, 1], [BG_IDLE, "#FFFFFF"]),
        shadowOpacity: interpolate(focus.value, [0, 1], [0, 0.1]),
        transform: [{ translateX: fieldShake.value }],
    }));

    const chipStyle = useAnimatedStyle(() => ({
        backgroundColor: isLocked
            ? "#E2E8F0"
            : interpolateColor(focus.value, [0, 1], ["#FFFFFF", ACCENT_SOFT]),
    }));

    return (
        <View style={{ flex: cfg.half ? 1 : undefined }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: ms(7), marginLeft: 2 }}>
                <Text style={{ fontSize: ms(12.5), color: INK, fontFamily: FONT.semibold, letterSpacing: 0.2 }}>
                    {cfg.label}
                </Text>
                {error ? (
                    <Text numberOfLines={1} style={{ fontSize: ms(11), color: DANGER, fontFamily: FONT.regular, flexShrink: 1 }}>
                        {"· " + error}
                    </Text>
                ) : null}
            </View>

            <Animated.View
                style={[
                    boxStyle,
                    {
                        flexDirection: "row", alignItems: "center", gap: ms(10),
                        borderWidth: 1.5, borderRadius: 19,
                        borderTopLeftRadius: ms(24),
                        paddingHorizontal: ms(11), height: ms(56),
                        shadowColor: ACCENT_DEEP, shadowRadius: 12, shadowOffset: { width: 0, height: 5 },
                        elevation: 1,
                    },
                ]}
            >
                {/* Icon chip inside the box */}
                <Animated.View
                    style={[
                        chipStyle,
                        {
                            width: ms(36), height: ms(36),
                            borderRadius: 13, borderTopLeftRadius: ms(17),
                            alignItems: "center", justifyContent: "center",
                            borderWidth: 1, borderColor: isLocked ? "#CBD5E1" : "#F5E6A3",
                        },
                    ]}
                >
                    <Ionicons name={cfg.icon} size={ms(17)} color={isLocked ? "#64748B" : ACCENT_DEEP} />
                </Animated.View>

                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChange}
                    placeholder={cfg.placeholder}
                    placeholderTextColor={FAINT}
                    keyboardType={cfg.keyboard ?? "default"}
                    secureTextEntry={cfg.secure ? !secureShown : false}
                    maxLength={cfg.maxLength}
                    autoCapitalize={cfg.autoCapitalize ?? "sentences"}
                    autoCorrect={false}
                    editable={!isLocked}
                    returnKeyType={isLast ? "done" : "next"}
                    onSubmitEditing={onSubmitEditing}
                    blurOnSubmit={isLast}
                    onFocus={() => {
                        focus.value = withTiming(1, { duration: 180 });
                        onFocusField();
                    }}
                    onBlur={() => {
                        focus.value = withTiming(0, { duration: 180 });
                    }}
                    accessibilityLabel={cfg.label}
                    style={{
                        flex: 1, fontSize: ms(15.5), color: isLocked ? "#334155" : INK,
                        fontFamily: isLocked ? FONT.semibold : FONT.regular, paddingVertical: 0,
                    }}
                />
                {isLocked ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#F0FDF4", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: "#BBF7D0" }}>
                        <Ionicons name="checkmark-circle" size={ms(13)} color={SUCCESS} />
                        <Text style={{ fontSize: ms(10.5), color: SUCCESS, fontFamily: FONT.semibold }}>Verified</Text>
                    </View>
                ) : cfg.secure ? (
                    <Pressable
                        hitSlop={10}
                        onPress={() => {
                            Haptics.selectionAsync();
                            onToggleSecure?.();
                        }}
                        accessibilityLabel={secureShown ? "Hide password" : "Show password"}
                    >
                        <Ionicons name={secureShown ? "eye-off-outline" : "eye-outline"} size={ms(19)} color={MUTED} />
                    </Pressable>
                ) : valid ? (
                    <Ionicons name="checkmark-circle" size={ms(19)} color={SUCCESS} />
                ) : null}
            </Animated.View>
        </View>
    );
}

/* ══════════════════════════ Page ══════════════════════════ */
export default function SchoolSignupPage({ initialPhone = "", onBack, onSubmit }: SchoolSignupPageProps) {
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();

    /* Responsive scale â€” auto-adjusts on small & big screens */
    const BASE = 390;
    const scale = Math.min(Math.max(width / BASE, 0.82), 1.15);
    const ms = useCallback((n: number, f = 0.35) => n + (n * scale - n) * (1 - f), [scale]);
    const isShort = height < 700;

    /* Hero video sizing â€” compact so the form owns the screen */
    const BLOB_SIZE = Math.min(width * (isShort ? 0.3 : 0.38), 150);

    const player = useVideoPlayer(HERO_VIDEO, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    /* â”€â”€ Form state â”€â”€ */
    const [data, setData] = useState<SchoolSignupData>(EMPTY);
    const [errors, setErrors] = useState<Partial<Record<FieldKey, string | null>>>({});
    const [shakeTriggers, setShakeTriggers] = useState<Partial<Record<FieldKey, number>>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsError, setTermsError] = useState(false);
    const [termsModalVisible, setTermsModalVisible] = useState(false);
    const [termsModalTab, setTermsModalTab] = useState<"terms" | "privacy">("terms");

    const [step, setStep] = useState(0);
    const isLastStep = step === STEPS.length - 1;

    const inputRefs = useRef<Partial<Record<FieldKey, TextInput | null>>>({});
    const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => () => { if (submitTimerRef.current) clearTimeout(submitTimerRef.current); }, []);

    /* â”€â”€ Keyboard-aware hero collapse (focus-driven â€” zero jitter) â”€â”€ */
    const headerAnim = useSharedValue(0);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const collapseHeader = useCallback(() => {
        if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
        headerAnim.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    }, []);
    const expandHeader = useCallback(() => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            hideTimerRef.current = null;
            headerAnim.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
        }, 80);
    }, []);

    useEffect(() => {
        const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvt, collapseHeader);
        const hideSub = Keyboard.addListener(hideEvt, expandHeader);
        return () => {
            showSub.remove();
            hideSub.remove();
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [collapseHeader, expandHeader]);

    const heroHeight = BLOB_SIZE + ms(8);
    const heroStyle = useAnimatedStyle(() => ({
        height: interpolate(headerAnim.value, [0, 1], [heroHeight, 0]),
        opacity: interpolate(headerAnim.value, [0, 0.5], [1, 0]),
        overflow: "hidden" as const,
    }));

    /* â”€â”€ Step transition (slide + fade) â”€â”€ */
    const stepAnim = useSharedValue(1);
    const stepDir = useSharedValue(1);

    const goToStep = (next: number) => {
        stepDir.value = next > step ? 1 : -1;
        stepAnim.value = 0;
        setStep(next);
        stepAnim.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    };

    const stepStyle = useAnimatedStyle(() => ({
        opacity: stepAnim.value,
        transform: [{ translateX: interpolate(stepAnim.value, [0, 1], [stepDir.value * 46, 0]) }],
    }));

    /* â”€â”€ Button press â”€â”€ */
    const btnPress = useSharedValue(1);
    const btnStyle = useAnimatedStyle(() => ({
        transform: [{ scale: btnPress.value }],
    }));

    const shake = () => {
        btnPress.value = withSequence(
            withTiming(0.96, { duration: 55 }),
            withTiming(1.02, { duration: 55 }),
            withTiming(0.98, { duration: 55 }),
            withTiming(1, { duration: 55 }),
        );
    };

    /* â”€â”€ Handlers â”€â”€ */
    const setField = (key: FieldKey, raw: string) => {
        const isNumeric = key === "schoolPhone" || key === "adminMobile" || key === "postalCode";
        const v = isNumeric ? raw.replace(/[^0-9]/g, "") : raw;
        setData((d) => ({ ...d, [key]: v }));
        // Clear the field error as soon as the user starts fixing it
        setErrors((e) => (e[key] ? { ...e, [key]: null } : e));
    };

    const validateStep = (idx: number): boolean => {
        const stepFields = STEPS[idx].fields;
        const nextErrors: Partial<Record<FieldKey, string | null>> = {};
        const nextTriggers: Partial<Record<FieldKey, number>> = {};
        let firstBad: FieldKey | null = null;

        for (const f of stepFields) {
            const err = validateField(f.key, data[f.key], data);
            nextErrors[f.key] = err;
            if (err) {
                nextTriggers[f.key] = (shakeTriggers[f.key] || 0) + 1;
                if (!firstBad) firstBad = f.key;
            }
        }
        setErrors((e) => ({ ...e, ...nextErrors }));
        setShakeTriggers((s) => ({ ...s, ...nextTriggers }));

        if (firstBad) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            collapseHeader();
            inputRefs.current[firstBad]?.focus();
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep(step)) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Keyboard.dismiss();
        goToStep(step + 1);
    };

    const handleBackStep = () => {
        Haptics.selectionAsync();
        Keyboard.dismiss();
        if (step === 0) onBack?.();
        else goToStep(step - 1);
    };

    const handleSubmit = async () => {
        if (submitting || submitted) return;
        if (!validateStep(step)) return;
        if (!termsAccepted) {
            setTermsError(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            shake();
            return;
        }
        Keyboard.dismiss();
        setSubmitting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const phone = initialPhone || data.adminMobile || data.schoolPhone;

        try {
            const { checkPhoneAuthorization, sendOtp } = await import("../services/authService");

            // Check if phone number is already registered
            const checkRes = await checkPhoneAuthorization(phone, "school");
            if (!checkRes.success && (checkRes.code === "ALREADY_REGISTERED" || checkRes.error?.toLowerCase().includes("already registered"))) {
                setSubmitting(false);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert(
                    "Account Already Exists",
                    checkRes.error || "This mobile number is already registered in BusTracker. You cannot register the same number twice. Please log in directly."
                );
                return;
            }

            // Send OTP to the unique registered mobile number before proceeding to OTP screen
            const otpResult = await sendOtp(phone);
            if (!otpResult.success) {
                console.warn("OTP send failed:", otpResult.error);
            }
        } catch (err) {
            console.warn("School signup validation error:", err);
        }

        setSubmitting(false);
        setSubmitted(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSubmit?.({
            ...data,
            adminMobile: phone,
            schoolPhone: data.schoolPhone || phone,
        });
    };

    /* Focus chain: pressing "next" on the keyboard jumps to the next field */
    const stepFields = STEPS[step].fields;
    const focusNextOf = (idx: number) => {
        const nextField = stepFields[idx + 1];
        if (nextField) inputRefs.current[nextField.key]?.focus();
        else if (isLastStep) handleSubmit();
        else handleNext();
    };

    /* Group city/state into one row */
    const rows = useMemo(() => {
        const out: FieldConfig[][] = [];
        let i = 0;
        while (i < stepFields.length) {
            if (stepFields[i].half && stepFields[i + 1]?.half) {
                out.push([stepFields[i], stepFields[i + 1]]);
                i += 2;
            } else {
                out.push([stepFields[i]]);
                i += 1;
            }
        }
        return out;
    }, [stepFields]);

    const progress = (step + 1) / STEPS.length;

    return (
        <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            {/* â”€â”€ Curved background sweeps â”€â”€ */}
            <View
                pointerEvents="none"
                style={{
                    position: "absolute", top: -width * 0.32, right: -width * 0.28,
                    width: width * 0.78, height: width * 0.78,
                    borderRadius: width * 0.39, backgroundColor: ACCENT_SOFT,
                }}
            />
            <View
                pointerEvents="none"
                style={{
                    position: "absolute", top: -width * 0.2, right: -width * 0.14,
                    width: width * 0.5, height: width * 0.5,
                    borderRadius: width * 0.25, borderWidth: 1.5, borderColor: "#F5E6A3",
                }}
            />
            <View
                pointerEvents="none"
                style={{
                    position: "absolute", bottom: -width * 0.2, left: -width * 0.22,
                    width: width * 0.44, height: width * 0.44,
                    borderRadius: width * 0.22, backgroundColor: "#FFFBEB",
                }}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingTop: insets.top + ms(6),
                        paddingBottom: Math.max(insets.bottom, 14),
                        paddingHorizontal: ms(22),
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* â”€â”€ Header row: back button + progress bar + step count â”€â”€ */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                        <Pressable
                            onPress={handleBackStep}
                            accessibilityRole="button"
                            accessibilityLabel={step === 0 ? "Go back" : "Previous step"}
                            hitSlop={8}
                            style={({ pressed }) => ({
                                width: ms(40), height: ms(40),
                                borderRadius: 15,
                                borderTopLeftRadius: ms(18), borderBottomRightRadius: ms(18),
                                backgroundColor: pressed ? ACCENT_SOFT : BG_IDLE,
                                borderWidth: 1, borderColor: BORDER_IDLE,
                                alignItems: "center", justifyContent: "center",
                            })}
                        >
                            <Ionicons name="arrow-back" size={ms(19)} color={INK} />
                        </Pressable>

                        {/* Curved progress track */}
                        <View style={{ flex: 1, height: ms(7), borderRadius: 5, backgroundColor: BG_IDLE, overflow: "hidden" }}>
                            <Animated.View
                                style={{
                                    width: `${progress * 100}%`, height: "100%",
                                    borderRadius: 5, backgroundColor: ACCENT,
                                }}
                            />
                        </View>

                        <View
                            style={{
                                backgroundColor: ACCENT_SOFT, borderRadius: 999,
                                paddingHorizontal: ms(10), paddingVertical: 4,
                                borderWidth: 1, borderColor: "#F5E6A3",
                            }}
                        >
                            <Text style={{ fontSize: ms(11), color: "#8A7100", fontFamily: FONT.semibold }}>
                                {step + 1}/{STEPS.length}
                            </Text>
                        </View>
                    </View>

                    {/* â”€â”€ Hero video in curved blob â€” collapses when typing â”€â”€ */}
                    <Animated.View style={[heroStyle, { alignItems: "center", marginTop: ms(8) }]}>
                        <View style={{ width: BLOB_SIZE, height: BLOB_SIZE, alignItems: "center", justifyContent: "center" }}>
                            {/* Watermark word behind the blob */}
                            <Text
                                pointerEvents="none"
                                style={{
                                    position: "absolute", fontSize: BLOB_SIZE * 0.34,
                                    fontFamily: FONT.displayHeavy, color: "#F3F4F6",
                                    letterSpacing: ms(4), transform: [{ rotate: "-4deg" }],
                                }}
                            >
                                SCHOOL
                            </Text>
                            {/* Curved arc hugging the blob */}
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute",
                                    width: BLOB_SIZE * 1.06, height: BLOB_SIZE * 1.06,
                                    borderRadius: BLOB_SIZE * 0.53,
                                    borderWidth: 2, borderColor: "transparent",
                                    borderLeftColor: ACCENT, borderBottomColor: "#F5E6A3",
                                    transform: [{ rotate: "24deg" }],
                                }}
                            />
                            {/* Organic curved blob with the video filling it */}
                            <View
                                style={{
                                    width: BLOB_SIZE * 0.92, height: BLOB_SIZE * 0.92,
                                    backgroundColor: "#FFFFFF",
                                    borderTopLeftRadius: BLOB_SIZE * 0.56,
                                    borderTopRightRadius: BLOB_SIZE * 0.4,
                                    borderBottomRightRadius: BLOB_SIZE * 0.52,
                                    borderBottomLeftRadius: BLOB_SIZE * 0.36,
                                    borderWidth: 2, borderColor: ACCENT_SOFT,
                                    overflow: "hidden",
                                }}
                            >
                                <VideoView
                                    player={player}
                                    style={{ width: "100%", height: "100%" }}
                                    nativeControls={false}
                                    contentFit="cover"
                                />
                            </View>
                            {/* Floating accent dot */}
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute", top: BLOB_SIZE * 0.04, right: BLOB_SIZE * 0.05,
                                    width: ms(12), height: ms(12), borderRadius: 6, backgroundColor: ACCENT,
                                }}
                            />
                        </View>
                    </Animated.View>

                    {/* â”€â”€ Title with curved brush-stroke highlight â”€â”€ */}
                    <View style={{ alignItems: "center", marginTop: ms(6) }}>
                        <View style={{ alignItems: "center", justifyContent: "center" }}>
                            <View
                                pointerEvents="none"
                                style={{
                                    position: "absolute", bottom: ms(1), right: -ms(4),
                                    width: ms(94), height: ms(11),
                                    backgroundColor: ACCENT, opacity: 0.8,
                                    borderTopLeftRadius: ms(10), borderTopRightRadius: ms(3),
                                    borderBottomRightRadius: ms(10), borderBottomLeftRadius: ms(3),
                                    transform: [{ rotate: "-1.5deg" }],
                                }}
                            />
                            <Text style={{ fontSize: ms(22), color: INK, fontFamily: FONT.displayHeavy, letterSpacing: -0.5 }}>
                                School Sign Up
                            </Text>
                        </View>
                        {/* Step title + subtitle */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: ms(6) }}>
                            <Ionicons name={STEPS[step].icon} size={ms(13)} color={ACCENT_DEEP} />
                            <Text style={{ fontSize: ms(13), color: INK, fontFamily: FONT.display }}>
                                {STEPS[step].title}
                            </Text>
                            <Text style={{ fontSize: ms(12), color: FAINT, fontFamily: FONT.regular }}>
                                {"â€” " + STEPS[step].subtitle}
                            </Text>
                        </View>
                    </View>

                    {/* â”€â”€ Step fields (slide + fade between steps) â”€â”€ */}
                    <Animated.View style={[stepStyle, { marginTop: ms(12), gap: ms(10), flexGrow: 1 }]}>
                        {rows.map((row, rIdx) =>
                            row.length === 2 ? (
                                <View key={row[0].key} style={{ flexDirection: "row", gap: ms(10) }}>
                                    {row.map((cfg) => {
                                        const flatIdx = stepFields.indexOf(cfg);
                                        return (
                                            <Field
                                                key={cfg.key}
                                                cfg={cfg}
                                                value={data[cfg.key]}
                                                error={errors[cfg.key] ?? null}
                                                shakeTrigger={shakeTriggers[cfg.key]}
                                                onChange={(t) => setField(cfg.key, t)}
                                                onFocusField={collapseHeader}
                                                inputRef={(r) => { inputRefs.current[cfg.key] = r; }}
                                                onSubmitEditing={() => focusNextOf(flatIdx)}
                                                isLast={flatIdx === stepFields.length - 1 && isLastStep}
                                                ms={ms}
                                            />
                                        );
                                    })}
                                </View>
                            ) : (
                                (() => {
                                    const cfg = row[0];
                                    const flatIdx = stepFields.indexOf(cfg);
                                    const isConfirm = cfg.key === "confirmPassword";
                                    const isPass = cfg.key === "password";
                                    return (
                                        <Field
                                            key={cfg.key}
                                            cfg={cfg}
                                            value={data[cfg.key]}
                                            error={errors[cfg.key] ?? null}
                                            shakeTrigger={shakeTriggers[cfg.key]}
                                            onChange={(t) => setField(cfg.key, t)}
                                            onFocusField={collapseHeader}
                                            secureShown={isPass ? showPassword : isConfirm ? showConfirm : undefined}
                                            onToggleSecure={
                                                isPass ? () => setShowPassword((s) => !s)
                                                    : isConfirm ? () => setShowConfirm((s) => !s)
                                                        : undefined
                                            }
                                            inputRef={(r) => { inputRefs.current[cfg.key] = r; }}
                                            onSubmitEditing={() => focusNextOf(flatIdx)}
                                            isLast={flatIdx === stepFields.length - 1 && isLastStep}
                                            ms={ms}
                                        />
                                    );
                                })()
                            ),
                        )}

                        {/* â”€â”€ Terms & Conditions (final step only) â”€â”€ */}
                        {isLastStep && (
                            <Pressable
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setTermsAccepted(!termsAccepted);
                                    if (termsError) setTermsError(false);
                                }}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: termsAccepted }}
                                style={{
                                    flexDirection: "row", alignItems: "center", gap: ms(10),
                                    padding: ms(11), borderRadius: 16, borderWidth: 1.5,
                                    borderColor: termsError ? DANGER : termsAccepted ? ACCENT : BORDER_IDLE,
                                    backgroundColor: termsAccepted ? "#FFFDF2" : BG_IDLE,
                                    marginTop: ms(2),
                                }}
                            >
                                <View
                                    style={{
                                        width: ms(22), height: ms(22), borderRadius: 8,
                                        backgroundColor: termsAccepted ? ACCENT : "#FFFFFF",
                                        borderWidth: 1.5,
                                        borderColor: termsAccepted ? ACCENT : termsError ? DANGER : "#D1D5DB",
                                        alignItems: "center", justifyContent: "center",
                                    }}
                                >
                                    {termsAccepted && <Ionicons name="checkmark" size={ms(14)} color={INK} />}
                                </View>
                                <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
                                    <Text style={{ fontSize: ms(12), color: MUTED, fontFamily: FONT.regular, lineHeight: ms(17) }}>
                                        {"I accept the "}
                                    </Text>
                                    <Pressable
                                        hitSlop={8}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setTermsModalTab("terms");
                                            setTermsModalVisible(true);
                                        }}
                                    >
                                        <Text style={{ color: INK, fontFamily: FONT.semibold, textDecorationLine: "underline", fontSize: ms(12) }}>
                                            Terms & Conditions
                                        </Text>
                                    </Pressable>
                                    <Text style={{ fontSize: ms(12), color: MUTED, fontFamily: FONT.regular, lineHeight: ms(17) }}>
                                        {" and "}
                                    </Text>
                                    <Pressable
                                        hitSlop={8}
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setTermsModalTab("privacy");
                                            setTermsModalVisible(true);
                                        }}
                                    >
                                        <Text style={{ color: INK, fontFamily: FONT.semibold, textDecorationLine: "underline", fontSize: ms(12) }}>
                                            Privacy Policy
                                        </Text>
                                    </Pressable>
                                </View>
                            </Pressable>
                        )}
                    </Animated.View>

                    {/* â”€â”€ Bottom action button â€” Next / Submit â”€â”€ */}
                    <Animated.View style={[btnStyle, { marginTop: ms(12) }]}>
                        <Pressable
                            onPressIn={() => { btnPress.value = withSpring(0.97, { damping: 20, stiffness: 300 }); }}
                            onPressOut={() => { btnPress.value = withSpring(1, { damping: 16, stiffness: 240 }); }}
                            onPress={isLastStep ? handleSubmit : handleNext}
                            disabled={submitting || submitted}
                            accessibilityRole="button"
                            accessibilityLabel={isLastStep ? "Submit registration" : "Next step"}
                            style={{
                                height: ms(52),
                                borderRadius: 18,
                                borderTopLeftRadius: ms(24), borderBottomRightRadius: ms(24),
                                backgroundColor: submitted ? SUCCESS : ACCENT,
                                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                                shadowColor: submitted ? SUCCESS : ACCENT_DEEP,
                                shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
                                elevation: 5,
                            }}
                        >
                            {submitted ? (
                                <>
                                    <Ionicons name="checkmark-circle" size={ms(19)} color="#FFFFFF" />
                                    <Text style={{ fontSize: ms(15), fontFamily: FONT.display, color: "#FFFFFF" }}>
                                        Registered
                                    </Text>
                                </>
                            ) : submitting ? (
                                <Text style={{ fontSize: ms(15), fontFamily: FONT.display, color: INK }}>
                                    Submittingâ€¦
                                </Text>
                            ) : (
                                <>
                                    <Text style={{ fontSize: ms(15), fontFamily: FONT.display, color: INK, letterSpacing: 0.3 }}>
                                        {isLastStep ? "Submit" : "Continue"}
                                    </Text>
                                    <View
                                        style={{
                                            width: ms(24), height: ms(24), borderRadius: 12,
                                            backgroundColor: INK, alignItems: "center", justifyContent: "center",
                                        }}
                                    >
                                        <Ionicons
                                            name={isLastStep ? "checkmark" : "arrow-forward"}
                                            size={ms(13)}
                                            color={ACCENT}
                                        />
                                    </View>
                                </>
                            )}
                        </Pressable>
                    </Animated.View>

                    {/* â”€â”€ Step dots â”€â”€ */}
                    <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: ms(10) }}>
                        {STEPS.map((_, i) => (
                            <View
                                key={i}
                                style={{
                                    width: i === step ? ms(18) : ms(6),
                                    height: ms(6), borderRadius: 3,
                                    backgroundColor: i === step ? ACCENT : i < step ? ACCENT_DEEP : BORDER_IDLE,
                                }}
                            />
                        ))}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <TermsAndConditionsModal
                visible={termsModalVisible}
                onClose={() => setTermsModalVisible(false)}
                initialTab={termsModalTab}
                accepted={termsAccepted}
                onAccept={() => {
                    setTermsAccepted(true);
                    setTermsError(false);
                }}
            />
        </View>
    );
}
