/* ============================================================================
   PARENT PORTAL — SHARED CORE
   Copy to: src/components/parentsdashbaord/common.tsx

   - SubscriptionProvider: 7-day free trial for new parents → then must buy.
   - VideoHero: video banner with curved bottom + text overlay (every page).
   - Dummy parent/student/bus data (UI only, backend-ready shape).
   ========================================================================== */

import React, { createContext, useContext, useMemo, useState } from "react";
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
    locked: require("../../../assets/expo.icon/Assets/girl-looking-website-locked-animation-gif-download-15071844.mp4"),
    family: require("../../../assets/expo.icon/Assets/happy-family-animation-gif-download-5804610.mp4"),
    navigation: require("../../../assets/expo.icon/Assets/driver-navigation-animation-gif-download-9531985.mp4"),
    route: require("../../../assets/expo.icon/Assets/man-stands-near-signpost-and-chooses-travel-route-in-mountains-animation-gif-download-7382412.mp4"),
    profile: require("../../../assets/expo.icon/Assets/male-profile-animation-gif-download-10059464.mp4"),
    school: require("../../../assets/expo.icon/Assets/school-animation-gif-download-7813556.mp4"),
    teacher: require("../../../assets/expo.icon/Assets/teacher-teaching-lesson-animation-gif-download-6098989.mp4"),
};

/* ─────────────── Dummy data (frontend only) ─────────────── */
export const PARENT = {
    name: "Rakesh Sharma",
    phone: "+91 98765 43210",
    email: "rakesh.sharma@gmail.com",
    relation: "Father",
    address: "B-204, Green Valley Apartments, Sector 62, Noida",
};

export const STUDENT = {
    name: "Aarav Sharma",
    admissionNo: "ADM-2024-0413",
    className: "Class 5",
    section: "B",
    school: "Sunrise Public School",
    rollNo: "23",
    bloodGroup: "B+",
    photoBg: "#FFD500",
};

export const BUS = {
    id: "b1",
    number: "Bus 12",
    vehicleNumber: "UP 16 CT 4412",
    route: "Route 7 · Sector 62 → School",
    driver: "Ramesh Kumar",
    driverPhone: "+91 91234 56780",
    driverExp: "8 yrs experience",
    status: "Trip Started" as "Online" | "Offline" | "Trip Started" | "Trip Completed",
    etaMin: 12,
    speed: 34,
    gps: "Online" as const,
    lastUpdated: "Just now",
};

export type TripStatus = "Completed" | "In Progress" | "Missed";
export const TRIPS: {
    id: string; date: string; label: string; pickup: string; schoolArrival: string;
    returnStart: string; homeDrop: string; status: TripStatus;
}[] = [
        { id: "t1", date: "Today", label: "Morning + Return Trip", pickup: "7:12 AM", schoolArrival: "7:48 AM", returnStart: "2:05 PM", homeDrop: "— (in progress)", status: "In Progress" },
        { id: "t2", date: "Yesterday", label: "Morning + Return Trip", pickup: "7:10 AM", schoolArrival: "7:45 AM", returnStart: "2:04 PM", homeDrop: "2:42 PM", status: "Completed" },
        { id: "t3", date: "Mon, 3 Aug", label: "Morning + Return Trip", pickup: "7:14 AM", schoolArrival: "7:52 AM", returnStart: "2:06 PM", homeDrop: "2:45 PM", status: "Completed" },
        { id: "t4", date: "Fri, 31 Jul", label: "Morning + Return Trip", pickup: "7:09 AM", schoolArrival: "7:44 AM", returnStart: "2:03 PM", homeDrop: "2:40 PM", status: "Completed" },
        { id: "t5", date: "Thu, 30 Jul", label: "Morning Trip Only", pickup: "7:11 AM", schoolArrival: "7:47 AM", returnStart: "—", homeDrop: "Picked up by parent", status: "Completed" },
    ];

export const NOTIFICATIONS: {
    id: string; icon: keyof typeof Ionicons.glyphMap; title: string; body: string;
    time: string; tone: "green" | "blue" | "orange" | "red" | "purple" | "accent"; unread?: boolean;
}[] = [
        { id: "n1", icon: "bus", title: "Bus Started", body: "Bus 12 has started the return trip from school.", time: "2 min ago", tone: "green", unread: true },
        { id: "n2", icon: "time", title: "Bus Arriving Soon", body: "Bus 12 is about 12 minutes away from your stop.", time: "5 min ago", tone: "blue", unread: true },
        { id: "n3", icon: "checkmark-circle", title: "Student Boarded Successfully", body: "Aarav boarded Bus 12 at 2:06 PM from school.", time: "18 min ago", tone: "green", unread: true },
        { id: "n4", icon: "school", title: "Student Reached School", body: "Aarav reached school safely at 7:48 AM.", time: "Today, 7:48 AM", tone: "purple" },
        { id: "n5", icon: "swap-horizontal", title: "Return Trip Started", body: "Return trip for Route 7 has started on time.", time: "Today, 2:05 PM", tone: "blue" },
        { id: "n6", icon: "home", title: "Student Dropped Safely", body: "Aarav was dropped at home stop yesterday at 2:42 PM.", time: "Yesterday", tone: "green" },
        { id: "n7", icon: "person", title: "Driver Changed", body: "Ramesh Kumar is now the assigned driver for Bus 12.", time: "2 days ago", tone: "orange" },
        { id: "n8", icon: "map", title: "Route Updated", body: "Route 7 pickup point moved 50m closer to your gate.", time: "3 days ago", tone: "blue" },
        { id: "n9", icon: "megaphone", title: "School Announcement", body: "School will remain closed on Friday for staff training.", time: "4 days ago", tone: "purple" },
        { id: "n10", icon: "card", title: "Subscription Reminder", body: "Your free trial ends soon. Subscribe to keep live tracking.", time: "5 days ago", tone: "accent" },
        { id: "n11", icon: "warning", title: "Emergency Notification", body: "Heavy rain alert on Route 7. Buses may run 10 min late.", time: "1 week ago", tone: "red" },
    ];

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
};

const ParentDataContext = createContext<ParentDataContextType | null>(null);

export function ParentDataProvider({ children }: { children: React.ReactNode }) {
    const [homeAddress, setHomeAddress] = useState(PARENT.address);
    const [homeCoordinate, setHomeCoordinate] = useState<ParentCoordinate>([77.379, 28.6178]);
    const [notifications, setNotifications] = useState<ParentNotification[]>(NOTIFICATIONS);

    const value = useMemo<ParentDataContextType>(() => ({
        homeAddress,
        homeCoordinate,
        setHomeAddress,
        setHomeCoordinate,
        notifications,
        addNotification: (notification) => setNotifications((current) => current.some((item) => item.id === notification.id) ? current : [notification, ...current]),
    }), [homeAddress, homeCoordinate, notifications]);

    return <ParentDataContext.Provider value={value}>{children}</ParentDataContext.Provider>;
}

export function useParentData() {
    const context = useContext(ParentDataContext);
    if (!context) throw new Error("useParentData must be used within ParentDataProvider");
    return context;
}

/* ─────────────── Subscription (7-day free trial → paid) ─────────────── */
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
    canTrack: boolean;              // trial OR active
    buyPlan: (planId: string) => void;
    expireNow: () => void;          // demo helper — simulate trial ended
    restartTrial: () => void;       // demo helper
};

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    /* New parent → starts on a 7-day free trial (dummy: 5 days remaining) */
    const [status, setStatus] = useState<SubStatus>("trial");
    const [trialDaysLeft, setTrialDaysLeft] = useState(5);
    const [planName, setPlanName] = useState<string | null>(null);

    const value = useMemo<SubscriptionContextType>(() => ({
        status,
        trialDaysLeft,
        planName,
        canTrack: status === "trial" || status === "active",
        buyPlan: (planId: string) => {
            const plan = PLANS.find((p) => p.id === planId);
            setPlanName(plan ? plan.name : "Monthly");
            setStatus("active");
        },
        expireNow: () => { setStatus("expired"); setTrialDaysLeft(0); },
        restartTrial: () => { setStatus("trial"); setTrialDaysLeft(7); setPlanName(null); },
    }), [status, trialDaysLeft, planName]);

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
