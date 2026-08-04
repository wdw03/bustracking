/* ============================================================================
   SUBSCRIPTION MANAGEMENT — School Admin (COMPLETE)
   Copy to: src/components/schooldashboard/pages/subscription.tsx

   Features:
   - Plan card + usage bars
   - Earnings dedicated page (which parent paid, how much)
   - Parent subscription list (subscribed + not subscribed)
   - Withdraw flow: Amount → UPI (name+ID) / IMPS (name, bank, A/C, IFSC, branch) → Processing → Complete
   - Processing requests page (all pending withdrawals)
   - Transaction history with clickable detail pages
   - Search buttons everywhere
   ========================================================================== */

import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, ScrollView, Text, TextInput, View, BackHandler } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    BUSES, Card, Chip, FONT, InfoRow, PARENTS, PageHeader, Press,
    SCHOOL, STUDENTS, SectionTitle, SkeletonItem, ms, useSchoolData, useTheme,
    ORANGE, ORANGE_SOFT, GREEN, GREEN_SOFT, BLUE, BLUE_SOFT
} from "../common";

/* ─── TYPES ─── */
type WithdrawStep = "idle" | "details" | "processing" | "complete";
type SubPage = "main" | "earnings" | "processing" | "parentSubs" | "txnDetail";

type Transaction = {
    id: string; text: string; amt: string; time: string; color: string; soft: string;
    icon: keyof typeof Ionicons.glyphMap; status: "Completed" | "Processing" | "Failed";
    method?: string; txnId?: string; accountName?: string; bankName?: string; upiId?: string;
};

type ParentEarning = {
    id: string; parentName: string; phone: string; plan: string; amount: number;
    paidDate: string; commission: number; status: "Active" | "Expired";
};

type ProcessingRequest = {
    id: string; amount: number; method: "UPI" | "IMPS"; requestedAt: string;
    status: "Processing" | "Under Review" | "Queued";
    accountName: string; upiId?: string; bankName?: string; accountNumber?: string; ifsc?: string;
};

/* ─── DUMMY DATA ─── */
const TRANSACTIONS: Transaction[] = [
    { id: "t1", text: "Withdrawal · UPI", amt: "-₹5,000", time: "28 Jan 2026", color: ORANGE, soft: ORANGE_SOFT, icon: "arrow-up-circle", status: "Completed", method: "UPI", txnId: "TXN20260128A5K", accountName: "Green Valley School", bankName: "HDFC Bank", upiId: "greenvalley@upi" },
    { id: "t2", text: "Commission · 42 parent plans", amt: "+₹3,360", time: "15 Jan 2026", color: GREEN, soft: GREEN_SOFT, icon: "arrow-down-circle", status: "Completed", txnId: "COM20260115B3K" },
    { id: "t3", text: "Commission · 61 parent plans", amt: "+₹4,880", time: "01 Jan 2026", color: GREEN, soft: GREEN_SOFT, icon: "arrow-down-circle", status: "Completed", txnId: "COM20260101C4K" },
    { id: "t4", text: "Plan renewal · Premium Fleet", amt: "-₹11,999", time: "12 Dec 2025", color: BLUE, soft: BLUE_SOFT, icon: "diamond", status: "Completed", method: "UPI", txnId: "PLN20251212D11K", accountName: "Green Valley School", upiId: "greenvalley@upi" },
];

const PARENT_EARNINGS: ParentEarning[] = [
    { id: "pe1", parentName: "Rohit Sharma", phone: "+91 98100 11223", plan: "Monthly · ₹199", amount: 199, paidDate: "02 Jan 2026", commission: 40, status: "Active" },
    { id: "pe2", parentName: "Kiran Patel", phone: "+91 98200 22334", plan: "Yearly · ₹1,999", amount: 1999, paidDate: "05 Jan 2026", commission: 400, status: "Active" },
    { id: "pe3", parentName: "Deepak Verma", phone: "+91 98300 33445", plan: "Monthly · ₹199", amount: 199, paidDate: "10 Jan 2026", commission: 40, status: "Active" },
    { id: "pe4", parentName: "Manish Gupta", phone: "+91 98500 55667", plan: "Quarterly · ₹499", amount: 499, paidDate: "12 Jan 2026", commission: 100, status: "Active" },
    { id: "pe5", parentName: "Amit Kumar", phone: "+91 99100 99887", plan: "Monthly · ₹199", amount: 199, paidDate: "15 Jan 2026", commission: 40, status: "Active" },
    { id: "pe6", parentName: "Priya Singh", phone: "+91 99200 88776", plan: "Yearly · ₹1,999", amount: 1999, paidDate: "18 Jan 2026", commission: 400, status: "Active" },
    { id: "pe7", parentName: "Suresh Iyer", phone: "+91 98400 44556", plan: "Monthly · ₹199", amount: 199, paidDate: "01 Nov 2025", commission: 40, status: "Expired" },
];

const PROCESSING_REQUESTS: ProcessingRequest[] = [
    { id: "pr1", amount: 3000, method: "UPI", requestedAt: "04 Aug 2026, 11:30 PM", status: "Processing", accountName: "Green Valley School", upiId: "greenvalley@upi" },
    { id: "pr2", amount: 8000, method: "IMPS", requestedAt: "02 Aug 2026, 3:45 PM", status: "Under Review", accountName: "Green Valley School", bankName: "HDFC Bank", accountNumber: "****9012", ifsc: "HDFC0001234" },
    { id: "pr3", amount: 1500, method: "UPI", requestedAt: "30 Jul 2026, 9:10 AM", status: "Queued", accountName: "Green Valley School", upiId: "greenvalley@upi" },
];

/* ─── COMPONENT ─── */
export default function SubscriptionPage({ onBack }: { onBack: () => void }) {
    const insets = useSafeAreaInsets();
    const { buses, students, parents, isLoading } = useSchoolData();
    const sub = SCHOOL.subscription;
    const [method, setMethod] = useState<"UPI" | "IMPS">("UPI");
    const [amount, setAmount] = useState("");
    const [step, setStep] = useState<WithdrawStep>("idle");
    const [subPage, setSubPage] = useState<SubPage>("main");
    const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
    const [selectedEarning, setSelectedEarning] = useState<ParentEarning | null>(null);
    const [selectedProcessing, setSelectedProcessing] = useState<ProcessingRequest | null>(null);

    // UPI fields
    const [upiName, setUpiName] = useState("");
    const [upiId, setUpiId] = useState("");

    // IMPS fields
    const [accountName, setAccountName] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifscCode, setIfscCode] = useState("");
    const [branchName, setBranchName] = useState("");

    // Search states
    const [earningQuery, setEarningQuery] = useState("");
    const [parentSubQuery, setParentSubQuery] = useState("");
    const [processingQuery, setProcessingQuery] = useState("");

    // Completed txn
    const [completedTxn, setCompletedTxn] = useState<{ txnId: string; amt: string; method: string; date: string } | null>(null);

    const { INK, PAGE_BG, CARD_BG, BORDER, ACCENT, ACCENT_DEEP, ACCENT_SOFT, MUTED, FAINT, BLUE, BLUE_SOFT, GREEN, GREEN_SOFT, RED, RED_SOFT, PURPLE, PURPLE_SOFT, ORANGE, ORANGE_SOFT, isDark } = useTheme();

    // Animations
    const spinAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const onHardwareBack = () => {
            if (selectedTxn) { setSelectedTxn(null); return true; }
            if (selectedEarning) { setSelectedEarning(null); return true; }
            if (selectedProcessing) { setSelectedProcessing(null); return true; }
            if (step === "details") { setStep("idle"); return true; }
            if (step === "complete") { setStep("idle"); setAmount(""); return true; }
            if (step === "processing") { return true; }
            if (subPage !== "main") { setSubPage("main"); return true; }
            return false;
        };
        const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
        return () => sub.remove();
    }, [selectedTxn, selectedEarning, selectedProcessing, step, subPage]);

    useEffect(() => {
        if (step === "processing") {
            Animated.loop(Animated.timing(spinAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })).start();
            const timer = setTimeout(() => {
                const txnId = `TXN${Date.now().toString(36).toUpperCase()}`;
                setCompletedTxn({ txnId, amt: `₹${Number(amount).toLocaleString("en-IN")}`, method, date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) });
                setStep("complete");
            }, 3000);
            return () => clearTimeout(timer);
        }
        if (step === "complete") {
            fadeAnim.setValue(0); scaleAnim.setValue(0);
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            ]).start();
        }
    }, [step]);

    const spinInterp = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
    const studentsUsed = students.length;
    const usagePct = Math.min(studentsUsed / sub.studentsAllowed, 1);
    const busPct = Math.min(buses.length / sub.busesAllowed, 1);
    const totalEarnings = PARENT_EARNINGS.reduce((s, e) => s + e.commission, 0);
    const activeParents = parents.filter(p => p.subscription === "Active");
    const expiredParents = parents.filter(p => p.subscription === "Expired");

    const startWithdraw = () => {
        const amt = Number(amount);
        if (!amt || amt <= 0) return Alert.alert("Enter amount", "Please enter a valid withdrawal amount.");
        if (amt > sub.balance) return Alert.alert("Insufficient balance", `Available balance is ₹${sub.balance.toLocaleString("en-IN")}.`);
        setStep("details");
    };

    const submitPayment = () => {
        if (method === "UPI") {
            if (!upiName.trim()) return Alert.alert("Missing name", "Please enter account holder name.");
            if (!upiId.trim() || !upiId.includes("@")) return Alert.alert("Invalid UPI ID", "Please enter a valid UPI ID (e.g. name@upi).");
        } else {
            if (!accountName.trim()) return Alert.alert("Missing details", "Account holder name is required.");
            if (!bankName.trim()) return Alert.alert("Missing details", "Bank name is required.");
            if (!accountNumber.trim()) return Alert.alert("Missing details", "Account number is required.");
            if (!ifscCode.trim()) return Alert.alert("Missing details", "IFSC code is required.");
        }
        setStep("processing");
    };

    const resetAll = () => {
        setStep("idle"); setAmount(""); setUpiName(""); setUpiId("");
        setAccountName(""); setBankName(""); setAccountNumber(""); setIfscCode(""); setBranchName("");
        setCompletedTxn(null);
    };

    /* ═══════════════════════════════════════════════════════════════
       SUB-PAGE: EARNING DETAIL (single parent earning)
       ═══════════════════════════════════════════════════════════════ */
    if (selectedEarning) {
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title={selectedEarning.parentName} subtitle="Earning Details" onBack={() => setSelectedEarning(null)} topInset={insets.top}
                    right={<Chip text={selectedEarning.status} color={selectedEarning.status === "Active" ? GREEN : RED} soft={selectedEarning.status === "Active" ? GREEN_SOFT : RED_SOFT} />} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }}>
                    <View style={{ backgroundColor: INK, borderRadius: ms(22), padding: ms(20), alignItems: "center", overflow: "hidden" }}>
                        <View style={{ position: "absolute", top: -ms(30), right: -ms(30), width: ms(100), height: ms(100), borderRadius: ms(50), backgroundColor: "rgba(255,213,0,0.12)" }} />
                        <View style={{ width: ms(52), height: ms(52), borderRadius: ms(18), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center", marginBottom: ms(10) }}>
                            <Ionicons name="cash" size={ms(24)} color={GREEN} />
                        </View>
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(28), color: GREEN }}>+₹{selectedEarning.commission}</Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: "#9CA3AF", marginTop: 4 }}>Commission earned from this parent</Text>
                    </View>
                    <SectionTitle icon="person" title="Parent Details" />
                    <Card>
                        <InfoRow icon="person" label="Parent Name" value={selectedEarning.parentName} color={PURPLE} soft={PURPLE_SOFT} />
                        <InfoRow icon="call" label="Phone" value={selectedEarning.phone} color={GREEN} soft={GREEN_SOFT} />
                        <InfoRow icon="diamond" label="Plan" value={selectedEarning.plan} color={BLUE} soft={BLUE_SOFT} />
                        <InfoRow icon="cash" label="Amount Paid" value={`₹${selectedEarning.amount.toLocaleString("en-IN")}`} color={ORANGE} soft={ORANGE_SOFT} />
                        <InfoRow icon="calendar" label="Payment Date" value={selectedEarning.paidDate} color={PURPLE} soft={PURPLE_SOFT} />
                        <InfoRow icon="trending-up" label="Your Commission (20%)" value={`₹${selectedEarning.commission}`} color={GREEN} soft={GREEN_SOFT} />
                        <InfoRow icon="checkmark-circle" label="Subscription Status" value={selectedEarning.status} color={selectedEarning.status === "Active" ? GREEN : RED} soft={selectedEarning.status === "Active" ? GREEN_SOFT : RED_SOFT} />
                    </Card>
                </ScrollView>
            </View>
        );
    }

    /* ═══════════════════════════════════════════════════════════════
       SUB-PAGE: PROCESSING REQUEST DETAIL
       ═══════════════════════════════════════════════════════════════ */
    if (selectedProcessing) {
        const stColor = selectedProcessing.status === "Processing" ? ORANGE : selectedProcessing.status === "Under Review" ? BLUE : PURPLE;
        const stSoft = selectedProcessing.status === "Processing" ? ORANGE_SOFT : selectedProcessing.status === "Under Review" ? BLUE_SOFT : PURPLE_SOFT;
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title="Request Details" subtitle={`#${selectedProcessing.id.toUpperCase()}`} onBack={() => setSelectedProcessing(null)} topInset={insets.top}
                    right={<Chip text={selectedProcessing.status} color={stColor} soft={stSoft} />} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }}>
                    <View style={{ backgroundColor: INK, borderRadius: ms(22), padding: ms(20), alignItems: "center", overflow: "hidden" }}>
                        <View style={{ position: "absolute", top: -ms(30), right: -ms(30), width: ms(100), height: ms(100), borderRadius: ms(50), backgroundColor: "rgba(255,213,0,0.12)" }} />
                        <View style={{ width: ms(52), height: ms(52), borderRadius: ms(18), backgroundColor: ORANGE_SOFT, alignItems: "center", justifyContent: "center", marginBottom: ms(10) }}>
                            <Ionicons name="hourglass" size={ms(24)} color={ORANGE} />
                        </View>
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(28), color: "#FFFFFF" }}>₹{selectedProcessing.amount.toLocaleString("en-IN")}</Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: "#9CA3AF", marginTop: 4 }}>Withdrawal request via {selectedProcessing.method}</Text>
                    </View>
                    <SectionTitle icon="receipt" title="Request Info" />
                    <Card>
                        <InfoRow icon="time" label="Requested At" value={selectedProcessing.requestedAt} color={PURPLE} soft={PURPLE_SOFT} />
                        <InfoRow icon="flash" label="Method" value={selectedProcessing.method} color={ACCENT_DEEP} soft={ACCENT_SOFT} />
                        <InfoRow icon="person" label="Account Name" value={selectedProcessing.accountName} color={GREEN} soft={GREEN_SOFT} />
                        {selectedProcessing.upiId && <InfoRow icon="at" label="UPI ID" value={selectedProcessing.upiId} color={BLUE} soft={BLUE_SOFT} />}
                        {selectedProcessing.bankName && <InfoRow icon="business" label="Bank" value={selectedProcessing.bankName} color={BLUE} soft={BLUE_SOFT} />}
                        {selectedProcessing.accountNumber && <InfoRow icon="card" label="Account Number" value={selectedProcessing.accountNumber} color={ORANGE} soft={ORANGE_SOFT} />}
                        {selectedProcessing.ifsc && <InfoRow icon="code-slash" label="IFSC" value={selectedProcessing.ifsc} color={PURPLE} soft={PURPLE_SOFT} />}
                        <InfoRow icon="sync" label="Status" value={selectedProcessing.status} color={stColor} soft={stSoft} />
                    </Card>
                </ScrollView>
            </View>
        );
    }

    /* ═══════════════════════════════════════════════════════════════
       SUB-PAGE: TRANSACTION DETAIL
       ═══════════════════════════════════════════════════════════════ */
    if (selectedTxn) {
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title="Transaction Details" subtitle={selectedTxn.txnId ?? selectedTxn.id} onBack={() => setSelectedTxn(null)} topInset={insets.top}
                    right={<Chip text={selectedTxn.status} color={selectedTxn.status === "Completed" ? GREEN : selectedTxn.status === "Processing" ? ORANGE : RED} soft={selectedTxn.status === "Completed" ? GREEN_SOFT : selectedTxn.status === "Processing" ? ORANGE_SOFT : RED_SOFT} />} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }}>
                    <View style={{ backgroundColor: INK, borderRadius: ms(22), padding: ms(20), alignItems: "center", overflow: "hidden" }}>
                        <View style={{ position: "absolute", top: -ms(30), right: -ms(30), width: ms(100), height: ms(100), borderRadius: ms(50), backgroundColor: "rgba(255,213,0,0.12)" }} />
                        <View style={{ width: ms(52), height: ms(52), borderRadius: ms(18), backgroundColor: selectedTxn.soft, alignItems: "center", justifyContent: "center", marginBottom: ms(10) }}>
                            <Ionicons name={selectedTxn.icon} size={ms(24)} color={selectedTxn.color} />
                        </View>
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(28), color: selectedTxn.amt.startsWith("+") ? GREEN : "#FFFFFF" }}>{selectedTxn.amt}</Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: "#9CA3AF", marginTop: 4 }}>{selectedTxn.text}</Text>
                    </View>
                    <SectionTitle icon="receipt" title="Details" />
                    <Card>
                        <InfoRow icon="finger-print" label="Transaction ID" value={selectedTxn.txnId ?? "—"} color={BLUE} soft={BLUE_SOFT} />
                        <InfoRow icon="calendar" label="Date" value={selectedTxn.time} color={PURPLE} soft={PURPLE_SOFT} />
                        <InfoRow icon="checkmark-circle" label="Status" value={selectedTxn.status} color={selectedTxn.status === "Completed" ? GREEN : ORANGE} soft={selectedTxn.status === "Completed" ? GREEN_SOFT : ORANGE_SOFT} />
                        {selectedTxn.method && <InfoRow icon="flash" label="Payment Method" value={selectedTxn.method} color={ACCENT_DEEP} soft={ACCENT_SOFT} />}
                        {selectedTxn.accountName && <InfoRow icon="person" label="Account Name" value={selectedTxn.accountName} color={GREEN} soft={GREEN_SOFT} />}
                        {selectedTxn.upiId && <InfoRow icon="at" label="UPI ID" value={selectedTxn.upiId} color={ORANGE} soft={ORANGE_SOFT} />}
                        {selectedTxn.bankName && <InfoRow icon="business" label="Bank" value={selectedTxn.bankName} color={BLUE} soft={BLUE_SOFT} />}
                    </Card>
                </ScrollView>
            </View>
        );
    }

    /* ═══════════════════════════════════════════════════════════════
       WITHDRAW FLOW: PROCESSING
       ═══════════════════════════════════════════════════════════════ */
    if (step === "processing") {
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center", paddingHorizontal: ms(40) }}>
                <Animated.View style={{ transform: [{ rotate: spinInterp }], marginBottom: ms(24) }}>
                    <View style={{ width: ms(80), height: ms(80), borderRadius: ms(40), borderWidth: 4, borderColor: ACCENT, borderTopColor: "transparent" }} />
                </Animated.View>
                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(22), color: INK, textAlign: "center" }}>Payment Processing...</Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: ms(13), color: MUTED, textAlign: "center", marginTop: ms(8), lineHeight: ms(20) }}>
                    Processing your withdrawal of ₹{Number(amount).toLocaleString("en-IN")} via {method}.
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: ms(20), backgroundColor: ACCENT_SOFT, paddingHorizontal: ms(16), paddingVertical: ms(10), borderRadius: ms(14) }}>
                    <Ionicons name="shield-checkmark" size={ms(16)} color={GREEN} />
                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK }}>Secure transaction in progress</Text>
                </View>
            </View>
        );
    }

    /* ═══════════════════════════════════════════════════════════════
       WITHDRAW FLOW: COMPLETE
       ═══════════════════════════════════════════════════════════════ */
    if (step === "complete" && completedTxn) {
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center", paddingHorizontal: ms(30) }}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
                    <View style={{ width: ms(90), height: ms(90), borderRadius: ms(45), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: ms(20) }}>
                        <Ionicons name="checkmark-circle" size={ms(50)} color={GREEN} />
                    </View>
                </Animated.View>
                <Animated.View style={{ opacity: fadeAnim, alignItems: "center", width: "100%" }}>
                    <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(24), color: INK, textAlign: "center" }}>Payment Complete! ✅</Text>
                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(13), color: MUTED, textAlign: "center", marginTop: ms(8) }}>Your withdrawal has been processed successfully.</Text>
                    <View style={{ backgroundColor: "#FFFFFF", borderRadius: ms(20), borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", padding: ms(18), marginTop: ms(24), width: "100%", gap: ms(10) }}>
                        {[
                            { label: "Amount", value: completedTxn.amt, bold: true },
                            { label: "Method", value: completedTxn.method, icon: method === "UPI" ? "flash" : "business" as keyof typeof Ionicons.glyphMap },
                            { label: "Transaction ID", value: completedTxn.txnId, color: BLUE },
                            { label: "Date", value: completedTxn.date },
                        ].map((r, i) => (
                            <View key={r.label}>
                                {i > 0 && <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.04)", marginBottom: ms(10) }} />}
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED }}>{r.label}</Text>
                                    <Text style={{ fontFamily: r.bold ? FONT.displayHeavy : FONT.semibold, fontSize: r.bold ? ms(18) : ms(13), color: r.color ?? INK }}>{r.value}</Text>
                                </View>
                            </View>
                        ))}
                        <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.04)" }} />
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(12), color: MUTED }}>Status</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: GREEN_SOFT, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GREEN }} />
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11), color: GREEN }}>Completed</Text>
                            </View>
                        </View>
                    </View>
                    <Press onPress={resetAll} style={{ height: ms(54), borderRadius: ms(18), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: ms(24), width: "100%" }}>
                        <Ionicons name="checkmark-done" size={ms(18)} color={INK} />
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>Done</Text>
                    </Press>
                </Animated.View>
            </View>
        );
    }

    /* ═══════════════════════════════════════════════════════════════
       WITHDRAW FLOW: ENTER PAYMENT DETAILS
       ═══════════════════════════════════════════════════════════════ */
    if (step === "details") {
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title="Withdraw Funds" subtitle={`₹${Number(amount).toLocaleString("en-IN")} via ${method}`} onBack={() => setStep("idle")} topInset={insets.top} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} keyboardShouldPersistTaps="handled">
                    <View style={{ flexDirection: "row", gap: ms(8), marginBottom: ms(16) }}>
                        {(["UPI", "IMPS"] as const).map((m) => (
                            <Press key={m} onPress={() => setMethod(m)} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: ms(48), borderRadius: ms(16), backgroundColor: method === m ? ACCENT_SOFT : PAGE_BG, borderWidth: 1.5, borderColor: method === m ? ACCENT : BORDER }}>
                                <Ionicons name={m === "UPI" ? "flash" : "business"} size={ms(16)} color={method === m ? ACCENT_DEEP : MUTED} />
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: method === m ? INK : MUTED }}>{m}</Text>
                                {method === m && <Ionicons name="checkmark-circle" size={ms(16)} color={ACCENT_DEEP} />}
                            </Press>
                        ))}
                    </View>

                    {method === "UPI" ? (
                        <Card style={{ gap: ms(14) }}>
                            <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>UPI Details</Text>
                            <PayField icon="person" label="Account Holder Name *" value={upiName} onChangeText={setUpiName} placeholder="e.g. Green Valley School" autoCapitalize="words" />
                            <PayField icon="flash" label="UPI ID *" value={upiId} onChangeText={setUpiId} placeholder="e.g. schoolname@upi" />
                        </Card>
                    ) : (
                        <Card style={{ gap: ms(14) }}>
                            <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>Bank Account Details (IMPS)</Text>
                            <PayField icon="person" label="Account Holder Name *" value={accountName} onChangeText={setAccountName} placeholder="e.g. Green Valley School" autoCapitalize="words" />
                            <PayField icon="business" label="Bank Name *" value={bankName} onChangeText={setBankName} placeholder="e.g. HDFC Bank" autoCapitalize="words" />
                            <PayField icon="card" label="Account Number *" value={accountNumber} onChangeText={setAccountNumber} placeholder="e.g. 123456789012" keyboardType="number-pad" />
                            <PayField icon="code-slash" label="IFSC Code *" value={ifscCode} onChangeText={(v) => setIfscCode(v.toUpperCase())} placeholder="e.g. HDFC0001234" autoCapitalize="characters" />
                            <PayField icon="location" label="Branch Name" value={branchName} onChangeText={setBranchName} placeholder="e.g. Noida Sector 62" autoCapitalize="words" />
                        </Card>
                    )}

                    <SectionTitle icon="receipt" title="Summary" />
                    <Card>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: ms(4) }}>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(13), color: MUTED }}>Amount</Text>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(16), color: INK }}>₹{Number(amount).toLocaleString("en-IN")}</Text>
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: ms(4) }}>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(13), color: MUTED }}>Method</Text>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>{method}</Text>
                        </View>
                    </Card>

                    <Press onPress={submitPayment} style={{ height: ms(54), borderRadius: ms(18), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: ms(22) }}>
                        <Ionicons name="paper-plane" size={ms(18)} color={INK} />
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: INK }}>Submit Withdrawal</Text>
                    </Press>
                </ScrollView>
            </View>
        );
    }

    /* ═══════════════════════════════════════════════════════════════
       SUB-PAGE: EARNINGS (dedicated page)
       ═══════════════════════════════════════════════════════════════ */
    if (subPage === "earnings") {
        const filtered = PARENT_EARNINGS.filter(e => e.parentName.toLowerCase().includes(earningQuery.toLowerCase()) || e.phone.includes(earningQuery));
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title="Earnings" subtitle={`₹${totalEarnings.toLocaleString("en-IN")} total commission`} onBack={() => setSubPage("main")} topInset={insets.top}
                    right={<Chip text={`${PARENT_EARNINGS.length} payments`} color={GREEN} soft={GREEN_SOFT} />} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} keyboardShouldPersistTaps="handled">
                    {/* Search */}
                    <View style={{ flexDirection: "row", gap: ms(8), marginBottom: ms(14) }}>
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(50), gap: 8 }}>
                            <Ionicons name="search" size={ms(16)} color={FAINT} />
                            <TextInput value={earningQuery} onChangeText={setEarningQuery} placeholder="Search parent name or phone" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13), color: INK }} />
                        </View>
                        <Press onPress={() => setEarningQuery(earningQuery.trim())} style={{ width: ms(50), height: ms(50), borderRadius: ms(16), backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="search" size={ms(17)} color={ACCENT} />
                        </Press>
                    </View>

                    {/* Summary */}
                    <View style={{ flexDirection: "row", gap: ms(10), marginBottom: ms(14) }}>
                        <View style={{ flex: 1, backgroundColor: GREEN_SOFT, borderRadius: ms(16), padding: ms(14), alignItems: "center" }}>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(20), color: GREEN }}>₹{totalEarnings.toLocaleString("en-IN")}</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED }}>Total Commission</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: BLUE_SOFT, borderRadius: ms(16), padding: ms(14), alignItems: "center" }}>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(20), color: BLUE }}>{PARENT_EARNINGS.length}</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED }}>Paid Parents</Text>
                        </View>
                    </View>

                    {filtered.map((e) => (
                        <Press key={e.id} onPress={() => setSelectedEarning(e)} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", padding: ms(14), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                            <View style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(16), color: GREEN }}>{e.parentName.charAt(0)}</Text>
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(14), color: INK }}>{e.parentName}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{e.plan} · {e.paidDate}</Text>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(14), color: GREEN }}>+₹{e.commission}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(10), color: FAINT }}>of ₹{e.amount}</Text>
                            </View>
                            <View style={{ width: ms(24), height: ms(24), borderRadius: ms(8), backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="chevron-forward" size={ms(13)} color={FAINT} />
                            </View>
                        </Press>
                    ))}
                </ScrollView>
            </View>
        );
    }

    /* ═══════════════════════════════════════════════════════════════
       SUB-PAGE: PROCESSING REQUESTS
       ═══════════════════════════════════════════════════════════════ */
    if (subPage === "processing") {
        const filtered = PROCESSING_REQUESTS.filter(r => r.method.toLowerCase().includes(processingQuery.toLowerCase()) || r.accountName.toLowerCase().includes(processingQuery.toLowerCase()));
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title="Processing Requests" subtitle={`${PROCESSING_REQUESTS.length} pending withdrawals`} onBack={() => setSubPage("main")} topInset={insets.top} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} keyboardShouldPersistTaps="handled">
                    <View style={{ flexDirection: "row", gap: ms(8), marginBottom: ms(14) }}>
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(50), gap: 8 }}>
                            <Ionicons name="search" size={ms(16)} color={FAINT} />
                            <TextInput value={processingQuery} onChangeText={setProcessingQuery} placeholder="Search method or account" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13), color: INK }} />
                        </View>
                        <Press onPress={() => setProcessingQuery(processingQuery.trim())} style={{ width: ms(50), height: ms(50), borderRadius: ms(16), backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="search" size={ms(17)} color={ACCENT} />
                        </Press>
                    </View>

                    {filtered.length === 0 ? (
                        <View style={{ alignItems: "center", paddingVertical: ms(42) }}>
                            <Ionicons name="checkmark-done-circle-outline" size={ms(40)} color={GREEN} />
                            <Text style={{ fontFamily: FONT.semibold, color: MUTED, marginTop: 8 }}>No pending requests</Text>
                        </View>
                    ) : filtered.map((r) => {
                        const stC = r.status === "Processing" ? ORANGE : r.status === "Under Review" ? BLUE : PURPLE;
                        const stS = r.status === "Processing" ? ORANGE_SOFT : r.status === "Under Review" ? BLUE_SOFT : PURPLE_SOFT;
                        return (
                            <Press key={r.id} onPress={() => setSelectedProcessing(r)} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", padding: ms(14), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                                <View style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: ORANGE_SOFT, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name="hourglass" size={ms(20)} color={ORANGE} />
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(14), color: INK }}>₹{r.amount.toLocaleString("en-IN")} · {r.method}</Text>
                                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{r.requestedAt}</Text>
                                </View>
                                <Chip text={r.status} color={stC} soft={stS} />
                                <View style={{ width: ms(24), height: ms(24), borderRadius: ms(8), backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center" }}>
                                    <Ionicons name="chevron-forward" size={ms(13)} color={FAINT} />
                                </View>
                            </Press>
                        );
                    })}
                </ScrollView>
            </View>
        );
    }

    /* ═══════════════════════════════════════════════════════════════
       SUB-PAGE: PARENT SUBSCRIPTIONS (who subscribed / who didn't)
       ═══════════════════════════════════════════════════════════════ */
    if (subPage === "parentSubs") {
        const filteredActive = activeParents.filter(p => p.name.toLowerCase().includes(parentSubQuery.toLowerCase()) || p.phone.includes(parentSubQuery));
        const filteredExpired = expiredParents.filter(p => p.name.toLowerCase().includes(parentSubQuery.toLowerCase()) || p.phone.includes(parentSubQuery));
        return (
            <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
                <PageHeader title="Parent Subscriptions" subtitle={`${activeParents.length} active · ${expiredParents.length} expired`} onBack={() => setSubPage("main")} topInset={insets.top} />
                <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} keyboardShouldPersistTaps="handled">
                    <View style={{ flexDirection: "row", gap: ms(8), marginBottom: ms(14) }}>
                        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: ms(16), borderWidth: 1, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(50), gap: 8 }}>
                            <Ionicons name="search" size={ms(16)} color={FAINT} />
                            <TextInput value={parentSubQuery} onChangeText={setParentSubQuery} placeholder="Search parent name or phone" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.regular, fontSize: ms(13), color: INK }} />
                        </View>
                        <Press onPress={() => setParentSubQuery(parentSubQuery.trim())} style={{ width: ms(50), height: ms(50), borderRadius: ms(16), backgroundColor: INK, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="search" size={ms(17)} color={ACCENT} />
                        </Press>
                    </View>

                    {/* Summary cards */}
                    <View style={{ flexDirection: "row", gap: ms(10), marginBottom: ms(8) }}>
                        <View style={{ flex: 1, backgroundColor: GREEN_SOFT, borderRadius: ms(16), padding: ms(14), alignItems: "center" }}>
                            <Ionicons name="checkmark-circle" size={ms(22)} color={GREEN} />
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(20), color: GREEN, marginTop: 4 }}>{activeParents.length}</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED }}>Subscribed</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: RED_SOFT, borderRadius: ms(16), padding: ms(14), alignItems: "center" }}>
                            <Ionicons name="close-circle" size={ms(22)} color={RED} />
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(20), color: RED, marginTop: 4 }}>{expiredParents.length}</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: MUTED }}>Not Subscribed</Text>
                        </View>
                    </View>

                    <SectionTitle icon="checkmark-circle" title={`Subscribed Parents (${filteredActive.length})`} />
                    {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                        <View key={`a-${i}`} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", padding: ms(14), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                            <SkeletonItem height={ms(44)} width={ms(44)} borderRadius={ms(15)} />
                            <View style={{ flex: 1 }}>
                                <SkeletonItem height={ms(14)} width="50%" />
                                <SkeletonItem height={ms(11.5)} width="70%" style={{ marginTop: 4 }} />
                            </View>
                            <SkeletonItem height={ms(24)} width={ms(50)} borderRadius={999} />
                        </View>
                    )) : filteredActive.map((p) => (
                        <View key={p.id} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", padding: ms(14), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                            <View style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="person" size={ms(20)} color={GREEN} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(14), color: INK }}>{p.name}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{p.phone} · {p.studentIds.length} student{p.studentIds.length > 1 ? "s" : ""}</Text>
                            </View>
                            <Chip text="Active" color={GREEN} soft={GREEN_SOFT} />
                        </View>
                    ))}

                    <SectionTitle icon="close-circle" title={`Not Subscribed (${filteredExpired.length})`} />
                    {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                        <View key={`e-${i}`} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", padding: ms(14), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                            <SkeletonItem height={ms(44)} width={ms(44)} borderRadius={ms(15)} />
                            <View style={{ flex: 1 }}>
                                <SkeletonItem height={ms(14)} width="50%" />
                                <SkeletonItem height={ms(11.5)} width="70%" style={{ marginTop: 4 }} />
                            </View>
                            <SkeletonItem height={ms(24)} width={ms(50)} borderRadius={999} />
                        </View>
                    )) : filteredExpired.map((p) => (
                        <View key={p.id} style={{ backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", padding: ms(14), marginBottom: ms(10), flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                            <View style={{ width: ms(44), height: ms(44), borderRadius: ms(15), backgroundColor: RED_SOFT, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="person" size={ms(20)} color={RED} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(14), color: INK }}>{p.name}</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>{p.phone} · {p.studentIds.length} student{p.studentIds.length > 1 ? "s" : ""}</Text>
                            </View>
                            <Chip text="Expired" color={RED} soft={RED_SOFT} />
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    /* ═══════════════════════════════════════════════════════════════
       MAIN SUBSCRIPTION PAGE
       ═══════════════════════════════════════════════════════════════ */
    return (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <PageHeader title="Subscription" subtitle="Plan, usage & earnings" onBack={onBack} topInset={insets.top}
                right={<Chip text={sub.status} color={GREEN} soft={GREEN_SOFT} />} />
            <ScrollView contentContainerStyle={{ padding: ms(16), paddingBottom: ms(40) }} showsVerticalScrollIndicator={false}>
                {/* Plan card */}
                <View style={{ backgroundColor: INK, borderRadius: ms(22), padding: ms(18), overflow: "hidden" }}>
                    <View style={{ position: "absolute", top: -ms(30), right: -ms(30), width: ms(120), height: ms(120), borderRadius: ms(60), backgroundColor: "rgba(255,213,0,0.15)" }} />
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Ionicons name="diamond" size={ms(18)} color={ACCENT} />
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: "#FFFFFF" }}>{sub.plan}</Text>
                    </View>
                    <View style={{ flexDirection: "row", marginTop: ms(14), gap: ms(16) }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: "#9CA3AF" }}>Expiry Date</Text>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: "#FFFFFF" }}>{sub.expiry}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11), color: "#9CA3AF" }}>Renewal Date</Text>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13.5), color: "#FFFFFF" }}>{sub.renewal}</Text>
                        </View>
                    </View>
                </View>

                {/* Usage */}
                <SectionTitle icon="analytics" title="Current Usage" />
                <Card>
                    {isLoading ? (
                        <View style={{ gap: ms(12) }}>
                            <View>
                                <SkeletonItem height={ms(12.5)} width="40%" style={{ marginBottom: 6 }} />
                                <SkeletonItem height={ms(9)} width="100%" borderRadius={999} />
                            </View>
                            <View>
                                <SkeletonItem height={ms(12.5)} width="40%" style={{ marginBottom: 6 }} />
                                <SkeletonItem height={ms(9)} width="100%" borderRadius={999} />
                            </View>
                        </View>
                    ) : (
                        [
                            { label: `Students · ${studentsUsed} / ${sub.studentsAllowed}`, pct: usagePct, color: ORANGE },
                            { label: `Buses · ${buses.length} / ${sub.busesAllowed}`, pct: busPct, color: BLUE },
                        ].map((u) => (
                            <View key={u.label} style={{ marginBottom: ms(12) }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK, marginBottom: 6 }}>{u.label}</Text>
                                <View style={{ height: ms(9), borderRadius: 999, backgroundColor: PAGE_BG, overflow: "hidden" }}>
                                    <View style={{ width: `${u.pct * 100}%` as any, height: "100%", borderRadius: 999, backgroundColor: u.color }} />
                                </View>
                            </View>
                        ))
                    )}
                </Card>

                {/* Quick access cards */}
                <SectionTitle icon="grid" title="Quick Access" />
                <View style={{ flexDirection: "row", gap: ms(10), marginBottom: ms(4) }}>
                    <Press onPress={() => setSubPage("earnings")} style={{ flex: 1, backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", padding: ms(14), alignItems: "center", gap: ms(8) }}>
                        <View style={{ width: ms(42), height: ms(42), borderRadius: ms(14), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="trending-up" size={ms(20)} color={GREEN} />
                        </View>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK }}>Earnings</Text>
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(15), color: GREEN }}>₹{totalEarnings.toLocaleString("en-IN")}</Text>
                    </Press>
                    <Press onPress={() => setSubPage("processing")} style={{ flex: 1, backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", padding: ms(14), alignItems: "center", gap: ms(8) }}>
                        <View style={{ width: ms(42), height: ms(42), borderRadius: ms(14), backgroundColor: ORANGE_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="hourglass" size={ms(20)} color={ORANGE} />
                        </View>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK }}>Processing</Text>
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(15), color: ORANGE }}>{PROCESSING_REQUESTS.length}</Text>
                    </Press>
                    <Press onPress={() => setSubPage("parentSubs")} style={{ flex: 1, backgroundColor: CARD_BG, borderRadius: ms(18), borderWidth: 1, borderColor: "rgba(0,0,0,0.04)", padding: ms(14), alignItems: "center", gap: ms(8) }}>
                        <View style={{ width: ms(42), height: ms(42), borderRadius: ms(14), backgroundColor: PURPLE_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="people" size={ms(20)} color={PURPLE} />
                        </View>
                        <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK }}>Parents</Text>
                        <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(15), color: PURPLE }}>{PARENTS.length}</Text>
                    </Press>
                </View>

                {/* Parent subscription strip */}
                <SectionTitle icon="people" title="Parent Subscriptions"
                    right={
                        <Press onPress={() => setSubPage("parentSubs")} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: ACCENT_SOFT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: ACCENT_DEEP }}>View All</Text>
                            <Ionicons name="arrow-forward" size={ms(12)} color={ACCENT_DEEP} />
                        </Press>
                    }
                />
                <View style={{ flexDirection: "row", gap: ms(10), marginBottom: ms(4) }}>
                    <View style={{ flex: 1, backgroundColor: GREEN_SOFT, borderRadius: ms(16), padding: ms(14), flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                        <Ionicons name="checkmark-circle" size={ms(20)} color={GREEN} />
                        <View>
                            {isLoading ? <SkeletonItem height={ms(18)} width={ms(30)} style={{ marginBottom: 2 }} /> : <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: GREEN }}>{activeParents.length}</Text>}
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10), color: MUTED }}>Subscribed</Text>
                        </View>
                    </View>
                    <View style={{ flex: 1, backgroundColor: RED_SOFT, borderRadius: ms(16), padding: ms(14), flexDirection: "row", alignItems: "center", gap: ms(10) }}>
                        <Ionicons name="close-circle" size={ms(20)} color={RED} />
                        <View>
                            {isLoading ? <SkeletonItem height={ms(18)} width={ms(30)} style={{ marginBottom: 2 }} /> : <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(18), color: RED }}>{expiredParents.length}</Text>}
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10), color: MUTED }}>Not Subscribed</Text>
                        </View>
                    </View>
                </View>

                {/* Earnings + withdraw */}
                <SectionTitle icon="wallet" title="Earnings (20% Commission)"
                    right={
                        <Press onPress={() => setSubPage("earnings")} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: ACCENT_SOFT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: ACCENT_DEEP }}>Details</Text>
                            <Ionicons name="arrow-forward" size={ms(12)} color={ACCENT_DEEP} />
                        </Press>
                    }
                />
                <Card>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: ms(12) }}>
                        <View style={{ width: ms(48), height: ms(48), borderRadius: ms(16), backgroundColor: GREEN_SOFT, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="cash" size={ms(22)} color={GREEN} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(11.5), color: MUTED }}>Available Balance</Text>
                            <Text style={{ fontFamily: FONT.displayHeavy, fontSize: ms(24), color: INK }}>₹{sub.balance.toLocaleString("en-IN")}</Text>
                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: FAINT }}>{sub.commissionPct}% of every parent subscription</Text>
                        </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: BORDER, marginVertical: ms(14) }} />

                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12.5), color: INK, marginBottom: 8 }}>Withdraw via</Text>
                    <View style={{ flexDirection: "row", gap: ms(8), marginBottom: ms(12) }}>
                        {(["UPI", "IMPS"] as const).map((m) => (
                            <Press key={m} onPress={() => setMethod(m)} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: ms(46), borderRadius: ms(15), backgroundColor: method === m ? ACCENT_SOFT : PAGE_BG, borderWidth: 1.5, borderColor: method === m ? ACCENT : BORDER }}>
                                <Ionicons name={m === "UPI" ? "flash" : "business"} size={ms(15)} color={method === m ? ACCENT_DEEP : MUTED} />
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: method === m ? INK : MUTED }}>{m}</Text>
                                {method === m && <Ionicons name="checkmark-circle" size={ms(15)} color={ACCENT_DEEP} />}
                            </Press>
                        ))}
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: PAGE_BG, borderRadius: ms(15), borderWidth: 1.5, borderColor: BORDER, paddingHorizontal: ms(12), height: ms(50), gap: 8, marginBottom: ms(12) }}>
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(15), color: MUTED }}>₹</Text>
                        <TextInput value={amount} onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder="Enter amount to withdraw" placeholderTextColor={FAINT} style={{ flex: 1, fontFamily: FONT.semibold, fontSize: ms(14.5), color: INK }} />
                    </View>

                    <Press onPress={startWithdraw} style={{ height: ms(52), borderRadius: ms(17), backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}>
                        <Ionicons name="arrow-down-circle" size={ms(17)} color={INK} />
                        <Text style={{ fontFamily: FONT.display, fontSize: ms(14.5), color: INK }}>Withdraw Balance</Text>
                    </Press>
                </Card>

                {/* Processing strip */}
                {PROCESSING_REQUESTS.length > 0 && (
                    <>
                        <SectionTitle icon="hourglass" title="Processing Requests"
                            right={
                                <Press onPress={() => setSubPage("processing")} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: ACCENT_SOFT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                                    <Text style={{ fontFamily: FONT.semibold, fontSize: ms(11.5), color: ACCENT_DEEP }}>View All</Text>
                                    <Ionicons name="arrow-forward" size={ms(12)} color={ACCENT_DEEP} />
                                </Press>
                            }
                        />
                        <Card style={{ padding: 0, overflow: "hidden" }}>
                            {PROCESSING_REQUESTS.slice(0, 2).map((r, i) => {
                                const stC = r.status === "Processing" ? ORANGE : r.status === "Under Review" ? BLUE : PURPLE;
                                const stS = r.status === "Processing" ? ORANGE_SOFT : r.status === "Under Review" ? BLUE_SOFT : PURPLE_SOFT;
                                return (
                                    <Press key={r.id} onPress={() => setSelectedProcessing(r)} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), padding: ms(13), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(0,0,0,0.04)" }}>
                                        <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: ORANGE_SOFT, alignItems: "center", justifyContent: "center" }}>
                                            <Ionicons name="hourglass" size={ms(17)} color={ORANGE} />
                                        </View>
                                        <View style={{ flex: 1, minWidth: 0 }}>
                                            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>₹{r.amount.toLocaleString("en-IN")} · {r.method}</Text>
                                            <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: FAINT }}>{r.requestedAt}</Text>
                                        </View>
                                        <Chip text={r.status} color={stC} soft={stS} />
                                    </Press>
                                );
                            })}
                        </Card>
                    </>
                )}

                {/* Payment history */}
                <SectionTitle icon="receipt" title="Transaction History" />
                <Card style={{ padding: 0, overflow: "hidden" }}>
                    {TRANSACTIONS.map((t, i) => (
                        <Press key={t.id} onPress={() => setSelectedTxn(t)} style={{ flexDirection: "row", alignItems: "center", gap: ms(10), padding: ms(13), borderTopWidth: i === 0 ? 0 : 1, borderTopColor: "rgba(0,0,0,0.04)" }}>
                            <View style={{ width: ms(38), height: ms(38), borderRadius: ms(13), backgroundColor: t.soft, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name={t.icon} size={ms(17)} color={t.color} />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <Text style={{ fontFamily: FONT.semibold, fontSize: ms(13), color: INK }}>{t.text}</Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: FAINT }}>{t.time}</Text>
                                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: FAINT }} />
                                    <Text style={{ fontFamily: FONT.regular, fontSize: ms(10.5), color: FAINT }}>{t.txnId}</Text>
                                </View>
                            </View>
                            <Text style={{ fontFamily: FONT.display, fontSize: ms(13.5), color: t.amt.startsWith("+") ? GREEN : INK }}>{t.amt}</Text>
                            <View style={{ width: ms(24), height: ms(24), borderRadius: ms(8), backgroundColor: PAGE_BG, alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name="chevron-forward" size={ms(13)} color={FAINT} />
                            </View>
                        </Press>
                    ))}
                </Card>
            </ScrollView>
        </View>
    );
}

/* ─── REUSABLE FORM FIELD ─── */
function PayField({ icon, label, value, onChangeText, placeholder, keyboardType, autoCapitalize }: {
    icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onChangeText: (v: string) => void;
    placeholder: string; keyboardType?: "default" | "number-pad" | "phone-pad"; autoCapitalize?: "none" | "words" | "characters";
}) {
    return (
        <View>
            <Text style={{ fontFamily: FONT.semibold, fontSize: ms(12), color: INK, marginBottom: 6 }}>{label}</Text>
            <View style={{ height: ms(50), borderRadius: ms(14), borderWidth: 1, borderColor: BORDER, backgroundColor: "#FCFCFD", flexDirection: "row", alignItems: "center", paddingHorizontal: ms(11), gap: 8 }}>
                <View style={{ width: ms(30), height: ms(30), borderRadius: ms(10), backgroundColor: ACCENT_SOFT, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={icon} size={ms(14)} color={ACCENT_DEEP} />
                </View>
                <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={FAINT} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={{ flex: 1, fontFamily: FONT.regular, color: INK, fontSize: ms(13), paddingVertical: 0 }} />
            </View>
        </View>
    );
}
