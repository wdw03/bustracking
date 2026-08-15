import { AdminRecord, Metric } from "./pagekit";

/* ─── School names (used for dropdown filter) ─── */
export const SCHOOL_NAMES = [
    "Bluebells Public School",
    "St. Xavier's Academy",
    "Green Valley School",
    "Little Stars International",
];

/* ─── School Details (full details for school management) ─── */
export type SchoolDetail = {
    id: string; name: string; admin: string; email: string; phone: string;
    address: string; city: string; state: string; pincode: string;
    plan: string; planExpiry: string; status: string;
    studentCount: number; parentCount: number; busCount: number; driverCount: number;
    registeredOn: string; principal: string; principalPhone: string;
    gstNumber: string; website: string;
};

export const schoolDetails: SchoolDetail[] = [
    { id: "SCH-101", name: "Bluebells Public School", admin: "Rohan Mehta", email: "admin@bluebells.edu.in", phone: "+91 11 2649 8800", address: "Mother Teresa Crescent, New Delhi", city: "New Delhi", state: "Delhi", pincode: "110023", plan: "Enterprise", planExpiry: "31 Mar 2027", status: "active", studentCount: 842, parentCount: 714, busCount: 12, driverCount: 14, registeredOn: "12 Aug 2026", principal: "Dr. Anjali Mathur", principalPhone: "+91 98100 12345", gstNumber: "07AABCB1234C1ZD", website: "www.bluebells.edu.in" },
    { id: "SCH-102", name: "St. Xavier's Academy", admin: "Ananya Singh", email: "transport@stxaviers.ac.in", phone: "+91 124 456 7890", address: "Sector 49, Sohna Road", city: "Gurugram", state: "Haryana", pincode: "122018", plan: "Growth", planExpiry: "10 Feb 2027", status: "active", studentCount: 510, parentCount: 466, busCount: 8, driverCount: 9, registeredOn: "10 Aug 2026", principal: "Fr. Thomas D'Souza", principalPhone: "+91 98765 43210", gstNumber: "06AABCS5678D1ZE", website: "www.stxaviers.ac.in" },
    { id: "SCH-103", name: "Green Valley School", admin: "Amit Sharma", email: "info@greenvalley.in", phone: "+91 120 430 1122", address: "Sector 62, Near IIIT Delhi", city: "Noida", state: "Uttar Pradesh", pincode: "201309", plan: "Pending", planExpiry: "—", status: "pending", studentCount: 328, parentCount: 0, busCount: 6, driverCount: 4, registeredOn: "Awaiting approval", principal: "Mrs. Kavita Rao", principalPhone: "+91 99990 00112", gstNumber: "—", website: "www.greenvalleyschool.in" },
    { id: "SCH-104", name: "Little Stars International", admin: "Priya Kapoor", email: "admin@littlestars.edu", phone: "+91 141 298 4455", address: "C-Scheme, MI Road", city: "Jaipur", state: "Rajasthan", pincode: "302001", plan: "Starter", planExpiry: "Blocked", status: "blocked", studentCount: 214, parentCount: 190, busCount: 4, driverCount: 5, registeredOn: "05 Jul 2026", principal: "Mr. Rajesh Jain", principalPhone: "+91 94140 55667", gstNumber: "08AABCL9012F1ZG", website: "www.littlestars.edu" },
];

export const schoolMetrics: Metric[] = [
    { label: "Total schools", value: 4, icon: "business", color: "#2563EB", note: "1 pending" },
    { label: "Active schools", value: 2, icon: "checkmark-circle", color: "#16A34A" },
    { label: "Blocked schools", value: 1, icon: "ban", color: "#DC2626" },
];

export const schools: AdminRecord[] = [
    {
        id: "SCH-101",
        title: "Bluebells Public School",
        subtitle: "Rohan Mehta · New Delhi",
        status: "active",
        icon: "business",
        fields: [
            "📍 Mother Teresa Crescent, New Delhi · PIN: 110023",
            "👤 Principal: Dr. Anjali Mathur (+91 98100 12345)",
            "👥 842 Students · 714 Parents · 12 Buses · 14 Drivers",
            "💳 Enterprise Plan · Expires: 31 Mar 2027",
            "✉️ admin@bluebells.edu.in · 🌐 www.bluebells.edu.in",
            "📄 GST: 07AABCB1234C1ZD · Reg: 12 Aug 2026",
        ],
    },
    {
        id: "SCH-102",
        title: "St. Xavier's Academy",
        subtitle: "Ananya Singh · Gurugram",
        status: "active",
        icon: "business",
        fields: [
            "📍 Sector 49, Sohna Road, Gurugram · PIN: 122018",
            "👤 Principal: Fr. Thomas D'Souza (+91 98765 43210)",
            "👥 510 Students · 466 Parents · 8 Buses · 9 Drivers",
            "💳 Growth Plan · Expires: 10 Feb 2027",
            "✉️ transport@stxaviers.ac.in · 🌐 www.stxaviers.ac.in",
            "📄 GST: 06AABCS5678D1ZE · Reg: 10 Aug 2026",
        ],
    },
    {
        id: "SCH-103",
        title: "Green Valley School",
        subtitle: "Amit Sharma · Noida",
        status: "pending",
        icon: "business",
        fields: [
            "📍 Sector 62, Near IIIT Delhi, Noida · PIN: 201309",
            "👤 Principal: Mrs. Kavita Rao (+91 99990 00112)",
            "👥 Registration request · 328 students declared · 6 buses",
            "💳 Plan: Awaiting Approval",
            "✉️ info@greenvalley.in · 🌐 www.greenvalleyschool.in",
            "📄 Documents awaiting admin review",
        ],
    },
    {
        id: "SCH-104",
        title: "Little Stars International",
        subtitle: "Priya Kapoor · Jaipur",
        status: "blocked",
        icon: "business",
        fields: [
            "📍 C-Scheme, MI Road, Jaipur · PIN: 302001",
            "👤 Principal: Mr. Rajesh Jain (+91 94140 55667)",
            "👥 214 Students · 190 Parents · 4 Buses · 5 Drivers",
            "💳 Starter Plan · Account Blocked by Super Admin",
            "✉️ admin@littlestars.edu · 🌐 www.littlestars.edu",
            "📄 GST: 08AABCL9012F1ZG · Reg: 05 Jul 2026",
        ],
    },
];

export const parents: AdminRecord[] = [
    { id: "PAR-201", title: "Neha Verma", subtitle: "Bluebells Public School · Aarav Verma", status: "active", icon: "people", fields: ["Class 6-A · Bus 101 · Driver Vikram Yadav", "Subscription active · Expires 30 Sep 2026 · 9876543210"] },
    { id: "PAR-202", title: "Sanjay Gupta", subtitle: "St. Xavier's Academy · Ishita Singh", status: "active", icon: "people", fields: ["Class 9-B · Bus 203 · Driver Rahul Khan", "Subscription active · Expires 14 Oct 2026 · 9102765934"] },
    { id: "PAR-203", title: "Meera Joshi", subtitle: "Green Valley School · Kabir Joshi", status: "blocked", icon: "people", fields: ["Class 4-A · Bus 305 · Driver Arjun Malik", "Subscription inactive · 9999000011"] },
    { id: "PAR-204", title: "Rajesh Sharma", subtitle: "Bluebells Public School · Priya Sharma", status: "active", icon: "people", fields: ["Class 3-B · Bus 102 · Driver Deepak Singh", "Subscription active · Expires 15 Nov 2026 · 9810234567"] },
    { id: "PAR-205", title: "Sunita Kapoor", subtitle: "St. Xavier's Academy · Arjun Kapoor", status: "active", icon: "people", fields: ["Class 7-C · Bus 204 · Driver Suresh Pal", "Subscription active · Expires 20 Dec 2026 · 9899112233"] },
    { id: "PAR-206", title: "Vikram Malhotra", subtitle: "Little Stars International · Ananya Malhotra", status: "blocked", icon: "people", fields: ["Class 5-A · Bus 410 · Unassigned", "Account blocked · 9414055667"] },
    { id: "PAR-207", title: "Priyanka Das", subtitle: "Bluebells Public School · Rohan Das", status: "active", icon: "people", fields: ["Class 8-A · Bus 103 · Driver Manoj Kumar", "Subscription active · Expires 28 Sep 2026 · 9871122334"] },
    { id: "PAR-208", title: "Amit Tiwari", subtitle: "Green Valley School · Shreya Tiwari", status: "active", icon: "people", fields: ["Class 2-B · Bus 306 · Driver Arjun Malik", "Subscription active · Expires 05 Oct 2026 · 9999887766"] },
    { id: "PAR-209", title: "Deepika Reddy", subtitle: "St. Xavier's Academy · Karthik Reddy", status: "active", icon: "people", fields: ["Class 10-A · Bus 205 · Driver Rahul Khan", "Subscription active · Expires 12 Nov 2026 · 9876001122"] },
    { id: "PAR-210", title: "Manish Agarwal", subtitle: "Little Stars International · Divya Agarwal", status: "inactive", icon: "people", fields: ["Class 1-A · Bus 411 · Unassigned", "Subscription expired · 9414099887"] },
    { id: "PAR-211", title: "Kavita Patel", subtitle: "Bluebells Public School · Dev Patel", status: "active", icon: "people", fields: ["Class 4-C · Bus 104 · Driver Vikram Yadav", "Subscription active · Expires 18 Oct 2026 · 9810556677"] },
    { id: "PAR-212", title: "Ravi Jain", subtitle: "St. Xavier's Academy · Neha Jain", status: "active", icon: "people", fields: ["Class 6-B · Bus 206 · Driver Suresh Pal", "Subscription active · Expires 22 Nov 2026 · 9899445566"] },
];

export const students: AdminRecord[] = [
    { id: "STU-401", title: "Aarav Verma", subtitle: "Bluebells Public School · Class 6-A", status: "active", icon: "school", fields: ["Admission: BB-2026-0401 · Roll 14", "Parent Neha Verma · Bus 101 · Driver Vikram Yadav"] },
    { id: "STU-402", title: "Ishita Singh", subtitle: "St. Xavier's Academy · Class 9-B", status: "active", icon: "school", fields: ["Admission: SX-2026-0180 · Roll 08", "Parent Sanjay Gupta · Bus 203 · Driver Rahul Khan"] },
    { id: "STU-403", title: "Priya Sharma", subtitle: "Bluebells Public School · Class 3-B", status: "active", icon: "school", fields: ["Admission: BB-2026-0289 · Roll 22", "Parent Rajesh Sharma · Bus 102 · Driver Deepak Singh"] },
    { id: "STU-404", title: "Arjun Kapoor", subtitle: "St. Xavier's Academy · Class 7-C", status: "active", icon: "school", fields: ["Admission: SX-2026-0312 · Roll 05", "Parent Sunita Kapoor · Bus 204 · Driver Suresh Pal"] },
    { id: "STU-405", title: "Kabir Joshi", subtitle: "Green Valley School · Class 4-A", status: "active", icon: "school", fields: ["Admission: GV-2026-0145 · Roll 11", "Parent Meera Joshi · Bus 305 · Driver Arjun Malik"] },
];

export const drivers: AdminRecord[] = [
    { id: "DRV-301", title: "Vikram Yadav", subtitle: "Bluebells Public School · Bus 101", status: "active", icon: "person", fields: ["9810839381 · License verified · Police check verified", "Route Dwarka Morning · Last GPS just now"] },
    { id: "DRV-302", title: "Rahul Khan", subtitle: "St. Xavier's Academy · Bus 203", status: "active", icon: "person", fields: ["9899001122 · License verified · Documents verified", "Route Golf Course Road · Last GPS 1 min ago"] },
    { id: "DRV-303", title: "Arjun Malik", subtitle: "Green Valley School · Bus 305", status: "inactive", icon: "person", fields: ["9898112233 · Verification pending", "Route Sector 62 · Assigned but not sharing GPS"] },
    { id: "DRV-304", title: "Deepak Singh", subtitle: "Bluebells Public School · Bus 102", status: "active", icon: "person", fields: ["9810445566 · License verified · Police check verified", "Route Rohini Morning · Last GPS 2 min ago"] },
    { id: "DRV-305", title: "Suresh Pal", subtitle: "St. Xavier's Academy · Bus 204", status: "active", icon: "person", fields: ["9899334455 · License verified · Documents verified", "Route Sohna Road · Last GPS just now"] },
    { id: "DRV-306", title: "Manoj Kumar", subtitle: "Bluebells Public School · Bus 103", status: "active", icon: "person", fields: ["9810778899 · License verified · Police check verified", "Route Vasant Kunj · Last GPS 3 min ago"] },
    { id: "DRV-307", title: "Ramesh Gupta", subtitle: "Little Stars International · Bus 410", status: "blocked", icon: "person", fields: ["9414033445 · License expired · Verification failed", "Route Mansarovar · Account blocked"] },
    { id: "DRV-308", title: "Ajay Verma", subtitle: "Green Valley School · Bus 306", status: "active", icon: "person", fields: ["9999223344 · License verified · Documents verified", "Route Sector 62 Ext. · Last GPS 5 min ago"] },
];

export const buses: AdminRecord[] = [
    { id: "BUS-101", title: "Bus 101 · DL 01 AB 1021", subtitle: "Bluebells Public School · Vikram Yadav", status: "running", icon: "bus", fields: ["34 km/h · Dwarka → School Campus · 42 students · 38 parents", "GPS just now · Route active"] },
    { id: "BUS-203", title: "Bus 203 · HR 26 C 8872", subtitle: "St. Xavier's Academy · Rahul Khan", status: "running", icon: "bus", fields: ["22 km/h · Golf Course Road → School · 36 students · 31 parents", "GPS 1 min ago · Route active"] },
    { id: "BUS-305", title: "Bus 305 · UP 16 Y 2024", subtitle: "Green Valley School · Arjun Malik", status: "stopped", icon: "bus", fields: ["0 km/h · Sector 62 → School · 28 students · 25 parents", "GPS 8 min ago · Waiting at stop"] },
    { id: "BUS-410", title: "Bus 410 · RJ 14 P 4511", subtitle: "Little Stars International · Unassigned", status: "offline", icon: "bus", fields: ["0 km/h · Mansarovar → School · 20 students · 18 parents", "Last GPS yesterday"] },
    { id: "BUS-102", title: "Bus 102 · DL 01 CD 3456", subtitle: "Bluebells Public School · Deepak Singh", status: "running", icon: "bus", fields: ["28 km/h · Rohini → School · 38 students · 35 parents", "GPS 2 min ago · Route active"] },
    { id: "BUS-204", title: "Bus 204 · HR 26 D 9901", subtitle: "St. Xavier's Academy · Suresh Pal", status: "running", icon: "bus", fields: ["18 km/h · Sohna Road → School · 30 students · 27 parents", "GPS just now · Route active"] },
];

export const payments: AdminRecord[] = [
    { id: "PAY-8401", title: "WD-20260814-01 · ₹28,400", subtitle: "Bluebells Public School · Withdrawal", status: "pending", icon: "wallet", fields: ["HDFC bank transfer · ****4482 · Requested 14 Aug 2026", "Available balance ₹84,200 · Admin note required"] },
    { id: "PAY-8402", title: "SUB-20260813-92 · ₹999", subtitle: "Sanjay Gupta · St. Xavier's Academy", status: "completed", icon: "card", fields: ["UPI sanjay@upi · Transaction completed 13 Aug 2026", "St. Xavier's Academy · Growth plan"] },
    { id: "PAY-8403", title: "WD-20260812-08 · ₹12,600", subtitle: "St. Xavier's Academy · Withdrawal", status: "processing", icon: "wallet", fields: ["ICICI bank transfer · ****0901 · Requested 12 Aug 2026", "Processing by Super Admin"] },
    { id: "PAY-8404", title: "SUB-20260811-45 · ₹499", subtitle: "Rajesh Sharma · Bluebells Public School", status: "completed", icon: "card", fields: ["UPI rajesh@upi · Transaction completed 11 Aug 2026", "Bluebells Public School · Starter plan"] },
    { id: "PAY-8405", title: "SUB-20260810-78 · ₹999", subtitle: "Sunita Kapoor · St. Xavier's Academy", status: "completed", icon: "card", fields: ["UPI sunita@upi · Transaction completed 10 Aug 2026", "St. Xavier's Academy · Growth plan"] },
    { id: "PAY-8406", title: "WD-20260809-03 · ₹8,200", subtitle: "Green Valley School · Withdrawal", status: "pending", icon: "wallet", fields: ["SBI bank transfer · ****7712 · Requested 09 Aug 2026", "Available balance ₹22,400"] },
    { id: "REF-20260810-12", title: "Refund · ₹999", subtitle: "Meera Joshi · Green Valley School", status: "pending", icon: "return-down-back", fields: ["Original payment SUB-20260801-12 · Reason: plan cancellation", "UPI meera@upi · Requested 10 Aug 2026"] },
];

export const subscriptions: AdminRecord[] = [
    { id: "SUB-20260813-92", title: "Sanjay Gupta · Growth plan", subtitle: "Ishita Singh · St. Xavier's Academy", status: "active", icon: "card", fields: ["₹999 · Started 13 Aug 2026 · Expires 13 Sep 2026", "UPI transaction · Auto-renew enabled"] },
    { id: "SUB-20260801-12", title: "Meera Joshi · Starter plan", subtitle: "Kabir Joshi · Green Valley School", status: "expired", icon: "card", fields: ["₹499 · Started 01 Aug 2026 · Expired 10 Aug 2026", "Renewal cancelled by parent"] },
    { id: "SUB-20260811-45", title: "Rajesh Sharma · Starter plan", subtitle: "Priya Sharma · Bluebells Public School", status: "active", icon: "card", fields: ["₹499 · Started 11 Aug 2026 · Expires 11 Sep 2026", "UPI transaction · Auto-renew enabled"] },
    { id: "SUB-20260810-78", title: "Sunita Kapoor · Growth plan", subtitle: "Arjun Kapoor · St. Xavier's Academy", status: "active", icon: "card", fields: ["₹999 · Started 10 Aug 2026 · Expires 10 Sep 2026", "UPI transaction · Auto-renew enabled"] },
];
