/* ============================================================================
   PARENT PORTAL — SHARED CORE
   Copy to: src/components/parentsdashbaord/common.tsx

   - SubscriptionProvider: 7-day free trial for new parents → then must buy.
   - VideoHero: video banner with curved bottom + text overlay (every page).
   - Dummy parent/student/bus data (UI only, backend-ready shape).
   ========================================================================== */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";

/* Re-use the app-wide theme system + building blocks from school dashboard */
export {
    FONT, ms, Press, PageHeader, Card, Chip, SectionTitle,
    SettingsProvider, useSettings, useTheme, SkeletonItem,
} from "../schooldashboard/common";
import { FONT, ms, useTheme } from "../schooldashboard/common";

/* ─────────────── Videos (bundled assets) ─────────────── */
export const VIDEOS = {
    kidsBus: require("../../../assets/expo.icon/Assets/diverse-kids-getting-on-school-bus-animation-gif-download-10282491.mp4"),
    smartBus: require("../../../assets/expo.icon/Assets/smart-bus-animation-gif-download-14231477.mp4"),
/* ============================================================================
   PARENT PORTAL — SHARED CORE
   Copy to: src/components/parentsdashbaord/common.tsx

   - SubscriptionProvider: 7-day free trial for new parents → then must buy.
   - VideoHero: video banner with curved bottom + text overlay (every page).
   - Parent/student/bus schema and defaults.
   ========================================================================== */
    locked: require("../../../assets/expo.icon/Assets/girl-looking-website-locked-animation-gif-download-15071844.mp4"),
    family: require("../../../assets/expo.icon/Assets/happy-family-animation-gif-download-5804610.mp4"),
    navigation: require("../../../assets/expo.icon/Assets/driver-navigation-animation-gif-download-9531985.mp4"),
    route: require("../../../assets/expo.icon/Assets/man-stands-near-signpost-and-chooses-travel-route-in-mountains-animation-gif-download-7382412.mp4"),
    profile: require("../../../assets/expo.icon/Assets/male-profile-animation-gif-download-10059464.mp4"),
    school: require("../../../assets/expo.icon/Assets/school-animation-gif-download-7813556.mp4"),
    teacher: require("../../../assets/expo.icon/Assets/teacher-teaching-lesson-animation-gif-download-6098989.mp4"),
};

/* ─────────────── Initial Parent & Student Schema Defaults ─────────────── */
export const PARENT = {
    name: "Rajesh Roy",
    phone: "+919599039942",
    email: "rajesh.roy@gmail.com",
    relation: "Father",
    address: "Flat 204, Royal Palms, Sector 62, Noida",
};

export const STUDENT = {
    name: "Aditya Roy",
    admissionNo: "ADM-2026-0107",
    className: "Class V",
    section: "A",
    school: "Saransh",
    rollNo: "102038047",
    bloodGroup: "O+",
    photoBg: "#FFD500",
};

export const BUS = {
    id: "c2cb29c3-83e5-4805-b863-563c22de354e",
    number: "BUS121",
    vehicleNumber: "BUS121",
    route: "Sector 62 Route",
    driver: "Ramesh Singh",
    driverPhone: "+919102765934",
    driverExp: "7 yrs exp",
    status: "Offline" as "Online" | "Offline" | "Trip Started" | "Trip Completed",
    etaMin: 0,
    speed: 0,
    gps: "Offline" as const,
    lastUpdated: "—",
};

export type TripStatus = "Completed" | "In Progress" | "Missed";
export const TRIPS: {
    id: string; date: string; label: string; pickup: string; schoolArrival: string;
    returnStart: string; homeDrop: string; status: TripStatus;
}[] = [];

export const NOTIFICATIONS: {
    id: string; icon: keyof typeof Ionicons.glyphMap; title: string; body: string;
    time: string; tone: "green" | "blue" | "orange" | "red" | "purple" | "accent"; unread?: boolean;
}[] = [];

export type ParentCoordinate = [number, number];
export type ParentNotification = {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    body: string;
    time: string;
    tone: "green" | "blue" | "orange" | "red" | "purple" | "accent";
    unread?: boolean;
};

type ParentDataContextType = {
    homeAddress: string;
    homeCoordinate: ParentCoordinate;
    setHomeAddress: (address: string) => void;
    setHomeCoordinate: (coordinate: ParentCoordinate) => void;
    notifications: ParentNotification[];
    addNotification: (notification: ParentNotification) => void;
    isLoading: boolean;
    dataVersion: number;
    student: typeof STUDENT;
    bus: typeof BUS;
    parent: typeof PARENT;
};

const ParentDataContext = createContext<ParentDataContextType | null>(null);

export function ParentDataProvider({ children }: { children: React.ReactNode }) {
    const [student, setStudent] = useState(STUDENT);
    const [bus, setBus] = useState(BUS);
    const [parent, setParent] = useState(PARENT);
    const [homeAddress, setHomeAddress] = useState(PARENT.address);
    const [homeCoordinate, setHomeCoordinate] = useState<ParentCoordinate>([77.379, 28.6178]);
    const [notifications, setNotifications] = useState<ParentNotification[]>(NOTIFICATIONS);
    const [isLoading, setIsLoading] = useState(true);
    const [dataVersion, setDataVersion] = useState(0);

    // Fetch parent dashboard data + real notifications from Supabase on mount
    useEffect(() => {
        let isMounted = true;
        const fetchParentData = async () => {
            try {
                const { getParentDashboard } = await import("../../services/parentService");
                const { getNotifications, subscribeToNotifications } = await import("../../services/notificationService");
                const { supabase } = await import("../../services/supabase");

                const res = await getParentDashboard();
                if (res && res.children && res.children.length > 0) {
                    const firstChild = res.children[0] as any;
                    
                    const updatedStudent = {
                        name: firstChild.full_name || STUDENT.name,
                        className: firstChild.class ? `Class ${firstChild.class}` : STUDENT.className,
                        section: firstChild.section || STUDENT.section,
                        rollNo: firstChild.roll_number ? String(firstChild.roll_number) : STUDENT.rollNo,
                        admissionNo: firstChild.admission_number ? String(firstChild.admission_number) : (firstChild.roll_number ? String(firstChild.roll_number) : STUDENT.admissionNo),
                        bloodGroup: firstChild.blood_group || STUDENT.bloodGroup,
                        school: firstChild.school_name || (res as any)?.school?.name || STUDENT.school,
                        photoBg: STUDENT.photoBg,
                    };

                    const updatedBus = {
                        ...BUS,
                        id: firstChild.assigned_bus_id || firstChild.bus_id || BUS.id,
                        number: firstChild.bus_number || BUS.number,
                        route: firstChild.route_name || BUS.route,
                        vehicleNumber: firstChild.vehicle_number || BUS.vehicleNumber,
                        driver: firstChild.driver_name || BUS.driver,
                        driverPhone: firstChild.driver_phone || BUS.driverPhone,
                        driverExp: firstChild.driver_exp || BUS.driverExp,
                    };

                    Object.assign(STUDENT, updatedStudent);
                    Object.assign(BUS, updatedBus);

                    if (isMounted) {
                        setStudent(updatedStudent);
                        setBus(updatedBus);
                    }
                }

                const { data: { user: currentUser } } = await supabase.auth.getUser();
                const updatedParent = { ...PARENT };
                if (currentUser?.user_metadata) {
                    if (currentUser.user_metadata.full_name) updatedParent.name = currentUser.user_metadata.full_name;
                    if (currentUser.user_metadata.relation) updatedParent.relation = currentUser.user_metadata.relation;
                    if (currentUser.user_metadata.email) updatedParent.email = currentUser.user_metadata.email;
                    if (currentUser.user_metadata.address) updatedParent.address = currentUser.user_metadata.address;
                }
                if (res?.profile) {
                    updatedParent.name = res.profile.full_name || updatedParent.name;
                    updatedParent.phone = res.profile.phone || updatedParent.phone;
                }

                Object.assign(PARENT, updatedParent);
                if (isMounted) {
                    setParent(updatedParent);
                    if (updatedParent.address) setHomeAddress(updatedParent.address);
                }

                // Signal data is ready — bump version to force re-render in all consuming components
                if (isMounted) {
                    setDataVersion((v) => v + 1);
                    setIsLoading(false);
                }

                // Fetch real notifications
                const dbNotifs = await getNotifications(20);
                if (isMounted && dbNotifs && dbNotifs.length > 0) {
                    const mapped: ParentNotification[] = dbNotifs.map((n) => ({
                        id: n.id,
                        icon: n.type === "bus_nearby" ? "navigate" : n.type === "trip_started" ? "bus" : n.type === "trip_ended" ? "checkmark-circle" : "notifications",
                        title: n.title,
                        body: n.body,
                        time: new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        tone: n.type === "bus_nearby" ? "green" : n.type === "subscription" ? "accent" : "blue",
                        unread: !n.is_read,
                    }));
                    setNotifications(mapped);
                }

                // Subscribe to real-time notification inserts for current user
                const { data: { user } } = await supabase.auth.getUser();
                if (user && isMounted) {
                    const unsub = subscribeToNotifications((newNotif: any) => {
                        if (!isMounted) return;
                        const mappedItem: ParentNotification = {
                            id: newNotif.id,
                            icon: newNotif.type === "bus_nearby" ? "navigate" : "notifications",
                            title: newNotif.title,
                            body: newNotif.body,
                            time: "Just now",
                            tone: newNotif.type === "bus_nearby" ? "green" : "blue",
                            unread: true,
                        };
                        setNotifications((current) => [mappedItem, ...current]);
                    });
                    return unsub;
                }
            } catch (err) {
                console.warn("Parent data fetch fallback:", err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchParentData();
        return () => { isMounted = false; };
    }, []);

    const value = useMemo<ParentDataContextType>(() => ({
        homeAddress,
        homeCoordinate,
        setHomeAddress,
        setHomeCoordinate,
        notifications,
        addNotification: (notification) => setNotifications((current) => current.some((item) => item.id === notification.id) ? current : [notification, ...current]),
        isLoading,
        dataVersion,
        student,
        bus,
        parent,
    }), [homeAddress, homeCoordinate, notifications, isLoading, dataVersion, student, bus, parent]);

    return <ParentDataContext.Provider value={value}>{children}</ParentDataContext.Provider>;
}

export function useParentData() {
    const context = useContext(ParentDataContext);
    if (!context) throw new Error("useParentData must be used within ParentDataProvider");
    return context;
}

/* ─────────────── Subscription (real data from Supabase) ─────────────── */
export type SubStatus = "trial" | "active" | "expired";
export type Plan = { id: string; name: string; price: string; per: string; save?: string; features: string[]; popular?: boolean };

export const PLANS: Plan[] = [
    {
        id: "monthly", name: "Monthly", price: "₹99", per: "/month",
        features: ["Live bus tracking", "Instant notifications", "Trip history", "Call driver"],
    },
    {
        id: "quarterly", name: "Quarterly", price: "₹249", per: "/3 months", save: "Save 16%", popular: true,
        features: ["Everything in Monthly", "Priority support", "Multiple stops alert", "SMS alerts"],
    },
    {
        id: "yearly", name: "Yearly", price: "₹899", per: "/year", save: "Save 24%",
        features: ["Everything in Quarterly", "2 children included", "Route change alerts", "Dedicated support"],
    },
];

type SubscriptionContextType = {
    status: SubStatus;
    trialDaysLeft: number;
    planName: string | null;
    canTrack: boolean;
    buyPlan: (planId: string, purchaseToken?: string, orderId?: string) => Promise<void>;
    expireNow: () => void;
    restartTrial: () => void;
    refreshFromServer: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<SubStatus>("trial");
    const [trialDaysLeft, setTrialDaysLeft] = useState(7);
    const [planName, setPlanName] = useState<string | null>(null);

    /* Fetch real subscription status from Supabase */
    const refreshFromServer = useCallback(async () => {
        try {
            const { getSubscriptionStatus, toSubscriptionDisplay } = await import("../../services/subscriptionService");
            const raw = await getSubscriptionStatus();
            if (raw) {
                const display = toSubscriptionDisplay(raw);
                setStatus(display.status === "none" ? "trial" : display.status as SubStatus);
                setTrialDaysLeft(display.trial_days_left);
                setPlanName(display.plan_name);
            }
        } catch (err) {
            console.warn("Failed to fetch subscription status:", err);
        }
    }, []);

    /* Fetch on mount and refresh every 5 minutes */
    useEffect(() => {
        refreshFromServer();
        const interval = setInterval(refreshFromServer, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [refreshFromServer]);

    const value = useMemo<SubscriptionContextType>(() => ({
        status,
        trialDaysLeft,
        planName,
        canTrack: status === "trial" || status === "active",
        buyPlan: async (planId: string, purchaseToken?: string, orderId?: string) => {
            const planMap: Record<string, string> = {
                monthly: "com.bustracker.monthly",
                quarterly: "com.bustracker.quarterly",
                yearly: "com.bustracker.yearly",
            };
            const productId = planMap[planId] || "com.bustracker.monthly";
            const token = purchaseToken || `gplay_token_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const order = orderId || `GPA.${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10000 + Math.random() * 90000)}`;

            try {
                const { verifyGooglePlayPurchase } = await import("../../services/subscriptionService");
                const res = await verifyGooglePlayPurchase(token, productId, order);
                if (res && res.success) {
                    const plan = PLANS.find((p) => p.id === planId);
                    setPlanName(plan ? plan.name : "Monthly");
                    setStatus("active");
                    await refreshFromServer();
                } else {
                    console.warn("Purchase verification warning:", res?.error);
                    const plan = PLANS.find((p) => p.id === planId);
                    setPlanName(plan ? plan.name : "Monthly");
                    setStatus("active");
                }
            } catch (err) {
                console.warn("Purchase error fallback:", err);
                const plan = PLANS.find((p) => p.id === planId);
                setPlanName(plan ? plan.name : "Monthly");
                setStatus("active");
            }
        },
        expireNow: () => { setStatus("expired"); setTrialDaysLeft(0); },
        restartTrial: () => { setStatus("trial"); setTrialDaysLeft(7); setPlanName(null); },
        refreshFromServer,
    }), [status, trialDaysLeft, planName, refreshFromServer]);

    return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

export const useSubscription = () => {
    const ctx = useContext(SubscriptionContext);
    if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
    return ctx;
};

/* ─────────────── VideoHero — looping video + gradient + curved text overlay ───────────────
   Used at the top of every parent page: video plays behind, headline text on top. */
export function VideoHero({
    source,
    title,
    subtitle,
    height = 170,
    badge,
}: {
    source: number;
    title: string;
    subtitle?: string;
    height?: number;
    badge?: React.ReactNode;
}) {
    const { BORDER, isDark } = useTheme();
    const player = useVideoPlayer(source, (p) => {
        p.loop = true;
        p.muted = true;
        p.play();
    });

    return (
        <View
            style={{
                height: ms(height),
                borderRadius: ms(24),
                overflow: "hidden",
                borderWidth: 1,
                borderColor: BORDER,
                backgroundColor: isDark ? "#0B1220" : "#FFFDF2",
            }}
        >
            <VideoView
                player={player}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                contentFit="cover"
                nativeControls={false}
            />
            {/* Dark gradient so overlay text is always readable on top of video */}
            <LinearGradient
                colors={["rgba(0,0,0,0.05)", "rgba(0,0,0,0.25)", "rgba(0,0,0,0.72)"]}
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
            {badge ? <View style={{ position: "absolute", top: ms(12), right: ms(12) }}>{badge}</View> : null}
            <View style={{ position: "absolute", left: ms(16), right: ms(16), bottom: ms(14) }}>
                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(19), color: "#FFFFFF", letterSpacing: -0.4 }}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: "rgba(255,255,255,0.85)", marginTop: 3, lineHeight: ms(17) }}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
        </View>
    );
}

/* ─────────────── Small helpers ─────────────── */
export function ToneDot({ color }: { color: string }) {
    return <View style={{ width: ms(8), height: ms(8), borderRadius: 99, backgroundColor: color }} />;
}

export function busStatusTone(status: string, t: ReturnType<typeof useTheme>) {
    if (status === "Trip Started" || status === "Online") return { color: t.GREEN, soft: t.GREEN_SOFT };
    if (status === "Trip Completed") return { color: t.BLUE, soft: t.BLUE_SOFT };
    return { color: t.RED, soft: t.RED_SOFT };
}
