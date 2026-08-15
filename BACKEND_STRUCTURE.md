# 🚍 BusTracker — Backend File Structure (Supabase)
### Complete Hinglish Documentation — Samjho aur Banao!

> **Ye document tab padhna jab bhi backend mein kuch add karna ho.**
> Har file ka kaam, uska path, aur uske andar ka code — sab yahan documented hai.

---

## 📦 Backend Technology Stack

| Technology | Kaam |
|---|---|
| **Supabase** | Backend-as-a-Service (Database + Auth + Realtime + Storage) |
| **PostgreSQL** | Supabase ke andar database (auto-managed) |
| **Supabase Realtime** | Live bus location broadcast (Driver → Parents) |
| **Supabase Auth** | Phone/OTP se login (Driver, School, Parent) |
| **Supabase Storage** | Profile photos, documents upload |
| **Supabase Edge Functions** | Server-side logic (notifications, webhooks) |
| **Row Level Security (RLS)** | Har user sirf apna data dekh sake |

---

## 🗂️ Complete Backend Folder Structure

```
BusTracker/
├── src/
│   ├── lib/                          ← Supabase setup aur shared utilities
│   │   ├── supabase.ts               ← [MAIN] Supabase client initialization
│   │   ├── auth.ts                   ← Auth helper functions (login, logout, OTP)
│   │   └── realtime.ts               ← Realtime channel subscriptions
│   │
│   ├── services/                     ← Ye pehle se hai, aur isme add karenge
│   │   ├── locationService.ts        ← [EXISTING] GPS permission service
│   │   ├── authService.ts            ← [NEW] Login/Signup API calls
│   │   ├── schoolService.ts          ← [NEW] School CRUD operations
│   │   ├── driverService.ts          ← [NEW] Driver data operations
│   │   ├── studentService.ts         ← [NEW] Student CRUD operations
│   │   ├── parentService.ts          ← [NEW] Parent data operations
│   │   ├── busService.ts             ← [NEW] Bus fleet operations
│   │   ├── trackingService.ts        ← [NEW] GPS location update/fetch
│   │   ├── notificationService.ts    ← [NEW] Push notification send/receive
│   │   └── subscriptionService.ts   ← [NEW] Subscription & payment operations
│   │
│   ├── hooks/                        ← [NEW FOLDER] React custom hooks for data
│   │   ├── useAuth.ts                ← Login state aur user session
│   │   ├── useSchool.ts              ← School data fetch hook
│   │   ├── useDriver.ts              ← Driver data hook
│   │   ├── useBus.ts                 ← Bus fleet hook
│   │   ├── useStudents.ts            ← Students list hook
│   │   ├── useParents.ts             ← Parents list hook
│   │   ├── useLiveTracking.ts        ← Realtime bus location hook
│   │   └── useNotifications.ts       ← Notification hook
│   │
│   └── types/                        ← [NEW FOLDER] TypeScript type definitions
│       ├── database.types.ts          ← Supabase auto-generated types
│       ├── auth.types.ts             ← Auth related types
│       ├── bus.types.ts              ← Bus, Driver, Route types
│       ├── school.types.ts           ← School, Student, Parent types
│       └── notification.types.ts     ← Notification types
│
├── supabase/                          ← [NEW FOLDER] Supabase local config
│   ├── config.toml                   ← Supabase project configuration
│   ├── seed.sql                      ← Demo data (Green Valley School etc.)
│   └── migrations/                   ← Database table creation scripts
│       ├── 001_create_users.sql      ← Users table
│       ├── 002_create_schools.sql    ← Schools table
│       ├── 003_create_drivers.sql    ← Drivers table
│       ├── 004_create_buses.sql      ← Buses table
│       ├── 005_create_students.sql   ← Students table
│       ├── 006_create_parents.sql    ← Parents table
│       ├── 007_create_routes.sql     ← Routes & stops table
│       ├── 008_create_tracking.sql   ← Live location table
│       ├── 009_create_notifications.sql ← Notifications table
│       ├── 010_create_subscriptions.sql ← Subscriptions & payments
│       └── 011_enable_rls.sql        ← Row Level Security policies
│
└── .env                              ← Supabase URL + Keys (KABHI GITHUB PE PUSH MAT KARNA!)
```

---

## 🔐 .env File (Environment Variables)

**Path:** `BusTracker/.env`

```env
# Supabase Project URL — Supabase dashboard se milega
EXPO_PUBLIC_SUPABASE_URL=https://xyzxyzxyz.supabase.co

# Supabase Anon Key — Public key, frontend mein safe hai
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Expo Push Notification Token Server URL (optional)
EXPO_PUBLIC_NOTIFICATION_URL=https://your-server.com/notify
```

> ⚠️ `.env` file `.gitignore` mein add karo! Warna secret keys GitHub pe jaayengi.

---

## 📁 src/lib/ — Supabase Core Setup

### 📄 `src/lib/supabase.ts`
> **Kaam:** Supabase client ek baar yahan initialize hota hai. Poora app isse import karta hai.

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database.types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
```

---

### 📄 `src/lib/auth.ts`
> **Kaam:** Login, OTP, Logout — saari auth operations yahan handle hoti hain.

```typescript
// src/lib/auth.ts
import { supabase } from './supabase';

// Phone se OTP bhejo
export const sendOTP = async (phone: string) => {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw new Error(error.message);
};

// OTP verify karo aur login karo
export const verifyOTP = async (phone: string, token: string) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone, token, type: 'sms',
  });
  if (error) throw new Error(error.message);
  return data.session;
};

// Password se login (School Admin & Driver portal)
export const loginWithPhone = async (phone: string, password: string) => {
  const email = `${phone}@bustracker.app`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.session;
};

// Logout karo
export const logout = async () => {
  await supabase.auth.signOut();
};

// Current user ka role lo (driver/school/parent)
export const getCurrentUserRole = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.user_metadata?.role as 'driver' | 'school' | 'parent' | null;
};
```

---

### 📄 `src/lib/realtime.ts`
> **Kaam:** Live bus GPS updates ka Realtime channel. Driver location bhejta hai, Parents receive karte hain.

```typescript
// src/lib/realtime.ts
import { supabase } from './supabase';
import { BusLocation } from '../types/bus.types';

// Driver ki live location broadcast karo
export const broadcastBusLocation = async (
  busId: string, lat: number, lng: number, speed: number
) => {
  const channel = supabase.channel(`bus-${busId}`);
  await channel.send({
    type: 'broadcast',
    event: 'location_update',
    payload: { busId, lat, lng, speed, timestamp: new Date().toISOString() },
  });
};

// Parent dashboard ke liye specific bus subscribe karo
export const subscribeToBusLocation = (
  busId: string,
  onUpdate: (location: BusLocation) => void
) => {
  const channel = supabase
    .channel(`bus-${busId}`)
    .on('broadcast', { event: 'location_update' }, ({ payload }) => {
      onUpdate(payload as BusLocation);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
};

// School Admin ke liye saari buses subscribe karo
export const subscribeToAllBuses = (
  busIds: string[],
  onUpdate: (location: BusLocation) => void
) => {
  const channels = busIds.map((busId) =>
    supabase.channel(`bus-${busId}`)
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        onUpdate(payload as BusLocation);
      })
      .subscribe()
  );
  return () => channels.forEach((ch) => supabase.removeChannel(ch));
};
```

---

## 📁 src/services/ — API Service Layer

> **Rule:** Components directly Supabase ko call nahi karenge. Hamesha services ke zariye!

---

### 📄 `src/services/authService.ts`
> **Kaam:** Signup, Login — Teen roles ke liye (Driver/School/Parent)
> **Kaun use karta hai:** `loginpageonly.tsx`, `schoolsinuppage.tsx`, `driversignup.tsx`

```typescript
// src/services/authService.ts
import { supabase } from '../lib/supabase';

export type UserRole = 'driver' | 'school' | 'parent';

// Naya account banao
export const registerUser = async (params: {
  phone: string;
  password: string;
  name: string;
  role: UserRole;
  extra?: Record<string, any>;
}) => {
  const email = `${params.phone}@bustracker.app`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: params.password,
    options: { data: { role: params.role, name: params.name, phone: params.phone } },
  });
  if (authError) throw new Error(authError.message);

  const userId = authData.user!.id;
  const table = params.role === 'school' ? 'schools'
    : params.role === 'driver' ? 'drivers' : 'parents';

  await supabase.from(table).insert({
    user_id: userId, name: params.name, phone: params.phone, ...params.extra,
  });

  return authData;
};

// Login karo
export const loginUser = async (phone: string, password: string) => {
  const email = `${phone}@bustracker.app`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const role = data.user.user_metadata?.role as UserRole;
  return { session: data.session, role };
};
```

---

### 📄 `src/services/schoolService.ts`
> **Kaam:** School Admin ke liye Students, Buses, Drivers, Parents CRUD.
> **Kaun use karta hai:** `schooldashbaordmain.tsx`, `studentmanagement.tsx`, `busmanagement.tsx`, `drivermanagement.tsx`

```typescript
// src/services/schoolService.ts
import { supabase } from '../lib/supabase';

// ─── School Info ───────────────────────────────────────────────────────────────
export const getMySchool = async (userId: string) => {
  const { data, error } = await supabase
    .from('schools').select('*').eq('user_id', userId).single();
  if (error) throw error;
  return data;
};

// ─── Students CRUD ─────────────────────────────────────────────────────────────
export const getStudents = async (schoolId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('*, parents(name, phone), buses(number, route)')
    .eq('school_id', schoolId).order('name');
  if (error) throw error;
  return data;
};

export const addStudent = async (student: Record<string, any>) => {
  const { data, error } = await supabase.from('students').insert(student).select().single();
  if (error) throw error;
  return data;
};

export const updateStudent = async (id: string, updates: Record<string, any>) => {
  const { data, error } = await supabase
    .from('students').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteStudent = async (id: string) => {
  const { error } = await supabase.from('students').delete().eq('id', id);
  if (error) throw error;
};

// Student ko bus assign karo (busassignment.tsx)
export const assignStudentToBus = async (studentId: string, busId: string | null) => {
  const { error } = await supabase
    .from('students').update({ bus_id: busId }).eq('id', studentId);
  if (error) throw error;
};

// ─── Buses CRUD ────────────────────────────────────────────────────────────────
export const getBuses = async (schoolId: string) => {
  const { data, error } = await supabase
    .from('buses')
    .select('*, drivers(name, phone, license), bus_locations(lat, lng, speed, updated_at)')
    .eq('school_id', schoolId);
  if (error) throw error;
  return data;
};

export const addBus = async (bus: Record<string, any>) => {
  const { data, error } = await supabase.from('buses').insert(bus).select().single();
  if (error) throw error;
  return data;
};

export const updateBus = async (id: string, updates: Record<string, any>) => {
  const { data, error } = await supabase
    .from('buses').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

export const deleteBus = async (id: string) => {
  const { error } = await supabase.from('buses').delete().eq('id', id);
  if (error) throw error;
};

// ─── Drivers ──────────────────────────────────────────────────────────────────
export const getDrivers = async (schoolId: string) => {
  const { data, error } = await supabase
    .from('drivers').select('*, buses(number, route)')
    .eq('school_id', schoolId).order('name');
  if (error) throw error;
  return data;
};

// ─── Parents ──────────────────────────────────────────────────────────────────
export const getParents = async (schoolId: string) => {
  const { data, error } = await supabase
    .from('parents').select('*, students(name, class, section)')
    .eq('school_id', schoolId).order('name');
  if (error) throw error;
  return data;
};
```

---

### 📄 `src/services/trackingService.ts`
> **Kaam:** Driver location update kare, School Admin aur Parents real-time mein dekhte hain.
> **Kaun use karta hai:** `driverdashbaord.tsx`, `livetracking.tsx`, `livetrackingparents.tsx`

```typescript
// src/services/trackingService.ts
import { supabase } from '../lib/supabase';

// Driver apni location update kare
export const updateBusLocation = async (params: {
  busId: string; lat: number; lng: number;
  speed: number; engineStatus: 'ON' | 'OFF';
}) => {
  const { error } = await supabase.from('bus_locations').upsert({
    bus_id: params.busId,
    lat: params.lat, lng: params.lng, speed: params.speed,
    engine_status: params.engineStatus,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'bus_id' });
  if (error) throw error;
};

// Ek bus ki last known location lo
export const getBusLastLocation = async (busId: string) => {
  const { data, error } = await supabase
    .from('bus_locations').select('*').eq('bus_id', busId).single();
  if (error) throw error;
  return data;
};

// Saari buses ki locations (School Admin map ke liye)
export const getAllBusLocations = async (schoolId: string) => {
  const { data, error } = await supabase
    .from('bus_locations')
    .select('*, buses!inner(school_id, number, route, driver_id, status)')
    .eq('buses.school_id', schoolId);
  if (error) throw error;
  return data;
};

// Location sharing on/off toggle
export const setLocationSharingStatus = async (busId: string, isSharing: boolean) => {
  const { error } = await supabase
    .from('buses').update({ is_sharing_location: isSharing }).eq('id', busId);
  if (error) throw error;
};
```

---

### 📄 `src/services/notificationService.ts`
> **Kaam:** School notifications send/receive karo.
> **Kaun use karta hai:** `notificationcenter.tsx` (School send), `notificationsparents.tsx` (Parent receive)

```typescript
// src/services/notificationService.ts
import { supabase } from '../lib/supabase';

export type NotificationTarget = 'all' | 'parents' | 'drivers';

// School Admin notification bheje
export const sendNotification = async (params: {
  schoolId: string; title: string; message: string;
  type: 'emergency' | 'info' | 'delay' | 'holiday';
  target: NotificationTarget;
}) => {
  const { data, error } = await supabase.from('notifications').insert({
    school_id: params.schoolId, title: params.title,
    message: params.message, type: params.type, target: params.target,
    created_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;

  // Edge Function se push notification bhejo
  await supabase.functions.invoke('send-push-notification', {
    body: { notificationId: data.id, target: params.target, schoolId: params.schoolId },
  });

  return data;
};

// Parent ki notifications lo
export const getParentNotifications = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .or(`target.eq.all,target.eq.parents`)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
};

// Notification padhi mark karo
export const markNotificationRead = async (notificationId: string, userId: string) => {
  await supabase.from('notification_reads')
    .upsert({ notification_id: notificationId, user_id: userId, read_at: new Date().toISOString() });
};

// Expo Push Token save karo
export const savePushToken = async (userId: string, token: string) => {
  await supabase.from('push_tokens').upsert({ user_id: userId, token });
};
```

---

### 📄 `src/services/subscriptionService.ts`
> **Kaam:** School subscription, payments, withdrawal.
> **Kaun use karta hai:** `subscription.tsx` (School Admin), `subscriptionparents.tsx` (Parent)

```typescript
// src/services/subscriptionService.ts
import { supabase } from '../lib/supabase';

// School ka subscription plan lo
export const getSchoolSubscription = async (schoolId: string) => {
  const { data, error } = await supabase
    .from('subscriptions').select('*').eq('school_id', schoolId).single();
  if (error) throw error;
  return data;
};

// Payment history lo
export const getPaymentHistory = async (schoolId: string) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*, parents(name, phone)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
};

// Withdrawal request create karo (subscription.tsx ka "Withdraw" button)
export const createWithdrawalRequest = async (params: {
  schoolId: string; amount: number;
  method: 'IMPS' | 'UPI'; accountDetails: string;
}) => {
  const { data, error } = await supabase.from('withdrawal_requests').insert({
    school_id: params.schoolId, amount: params.amount,
    method: params.method, account_details: params.accountDetails, status: 'pending',
  }).select().single();
  if (error) throw error;
  return data;
};

// Parent ka subscription status
export const getParentSubscription = async (parentId: string) => {
  const { data, error } = await supabase
    .from('parent_subscriptions').select('*').eq('parent_id', parentId).single();
  if (error) throw error;
  return data;
};
```

---

## 📁 src/hooks/ — Custom React Hooks

---

### 📄 `src/hooks/useAuth.ts`

```typescript
// src/hooks/useAuth.ts
// Auth state global hook — main.tsx mein use karke routing decide karo

import { useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'driver' | 'school' | 'parent' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(session?.user?.user_metadata?.role ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(session?.user?.user_metadata?.role ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user, role, loading, isLoggedIn: !!session };
};
```

---

### 📄 `src/hooks/useLiveTracking.ts`

```typescript
// src/hooks/useLiveTracking.ts
// Realtime bus tracking hook

import { useEffect, useState } from 'react';
import { subscribeToBusLocation } from '../lib/realtime';
import { getBusLastLocation } from '../services/trackingService';

export type LiveLocation = {
  busId: string; lat: number; lng: number;
  speed: number; timestamp: string;
};

export const useLiveTracking = (busId: string) => {
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBusLastLocation(busId)
      .then((loc) => {
        if (loc) setLocation({ busId, lat: loc.lat, lng: loc.lng, speed: loc.speed, timestamp: loc.updated_at });
      })
      .finally(() => setLoading(false));

    const unsubscribe = subscribeToBusLocation(busId, (newLoc) => setLocation(newLoc));
    return unsubscribe;
  }, [busId]);

  return { location, loading };
};
```

---

## 📁 supabase/migrations/ — Database Tables (SQL)

---

### 📄 `001_create_users.sql`

```sql
-- User profiles — Auth se linked
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('driver', 'school', 'parent')),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
```

---

### 📄 `002_create_schools.sql`

```sql
-- School Admin profiles
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT UNIQUE,                  -- "GVS-2024-113"
    address TEXT,
    principal TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    affiliation_board TEXT,            -- CBSE, ICSE
    logo_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_schools_user_id ON schools(user_id);
```

---

### 📄 `003_create_drivers.sql`

```sql
-- Driver profiles
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    driver_id TEXT UNIQUE,             -- "DRV001"
    phone TEXT NOT NULL,
    license TEXT NOT NULL,             -- "DL-0420110149646"
    experience_years INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Off-Duty')),
    total_trips INTEGER DEFAULT 0,
    rating NUMERIC(2,1) DEFAULT 5.0,
    bus_id UUID,
    shift TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_drivers_school_id ON drivers(school_id);
```

---

### 📄 `004_create_buses.sql`

```sql
-- Bus fleet table
CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    number TEXT NOT NULL,              -- "BUS-01"
    vehicle_number TEXT UNIQUE NOT NULL, -- "DL01AB1234"
    name TEXT,                         -- "Yellow Falcon"
    model TEXT,
    capacity INTEGER DEFAULT 32,
    route TEXT,
    status TEXT DEFAULT 'Offline'
        CHECK (status IN ('Running', 'Offline', 'Maintenance', 'Disabled')),
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    helper_name TEXT,
    helper_phone TEXT,
    color TEXT DEFAULT '#2563EB',
    is_sharing_location BOOLEAN DEFAULT FALSE,
    battery_level INTEGER DEFAULT 100,
    gps_status TEXT DEFAULT 'Offline' CHECK (gps_status IN ('Online', 'Offline')),
    fuel_level INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_buses_school_id ON buses(school_id);
```

---

### 📄 `005_create_students.sql`

```sql
-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    admission_no TEXT,                 -- "ADM-2024-0101"
    student_id TEXT,                   -- "STU-101"
    roll_no TEXT,
    class TEXT,
    section TEXT,
    gender TEXT,
    dob TEXT,
    parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
    bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
    pickup_stop TEXT,
    drop_stop TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_bus_id ON students(bus_id);
```

---

### 📄 `006_create_parents.sql`

```sql
-- Parent profiles
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    father_name TEXT,
    mother_name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    subscription_status TEXT DEFAULT 'Active'
        CHECK (subscription_status IN ('Active', 'Expired')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_parents_user_id ON parents(user_id);
```

---

### 📄 `007_create_routes.sql`

```sql
-- Routes & bus stops
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,               -- "Route A"
    description TEXT,
    total_stops INTEGER DEFAULT 0,
    estimated_duration_mins INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    stop_name TEXT NOT NULL,          -- "Sector 62 Crossing"
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    stop_order INTEGER NOT NULL,      -- Stop ka sequence number
    estimated_time TEXT,              -- "7:10 AM"
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 📄 `008_create_tracking.sql`

```sql
-- Live GPS location — SABSE IMPORTANT TABLE
CREATE TABLE IF NOT EXISTS bus_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID UNIQUE NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    speed NUMERIC(5,1) DEFAULT 0,
    heading NUMERIC(5,1) DEFAULT 0,
    engine_status TEXT DEFAULT 'OFF' CHECK (engine_status IN ('ON', 'OFF')),
    gps_satellites INTEGER DEFAULT 0,
    accuracy NUMERIC(8,2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip history
CREATE TABLE IF NOT EXISTS trip_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES buses(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),
    school_id UUID NOT NULL REFERENCES schools(id),
    route TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    distance_km NUMERIC(8,2),
    status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'cancelled'))
);

CREATE INDEX idx_bus_locations_bus_id ON bus_locations(bus_id);
```

---

### 📄 `009_create_notifications.sql`

```sql
-- Notification system
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info'
        CHECK (type IN ('emergency', 'info', 'delay', 'holiday', 'payment')),
    target TEXT DEFAULT 'all'
        CHECK (target IN ('all', 'parents', 'drivers')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_reads (
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (notification_id, user_id)
);

CREATE TABLE IF NOT EXISTS push_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT DEFAULT 'android',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_school_id ON notifications(school_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

### 📄 `010_create_subscriptions.sql`

```sql
-- Subscription & payments
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID UNIQUE NOT NULL REFERENCES schools(id),
    plan TEXT DEFAULT 'Basic' CHECK (plan IN ('Basic', 'Standard', 'Premium Fleet')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Trial')),
    students_allowed INTEGER DEFAULT 100,
    buses_allowed INTEGER DEFAULT 5,
    commission_pct NUMERIC(4,1) DEFAULT 20.0,
    balance NUMERIC(12,2) DEFAULT 0,
    expiry_date DATE,
    renewal_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    parent_id UUID REFERENCES parents(id),
    amount NUMERIC(10,2) NOT NULL,
    type TEXT CHECK (type IN ('subscription', 'commission', 'refund')),
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
    method TEXT,                      -- "UPI", "Card", "IMPS"
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    amount NUMERIC(10,2) NOT NULL,
    method TEXT CHECK (method IN ('IMPS', 'UPI')),
    account_details TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 📄 `011_enable_rls.sql`
> ⚠️ **SECURITY KA SABSE IMPORTANT PART — Kabhi skip mat karo!**

```sql
-- Row Level Security — Har user sirf apna data dekhe

-- Schools
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admin apna school dekhe" ON schools
    FOR ALL USING (user_id = auth.uid());

-- Drivers
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Driver apna profile dekhe" ON drivers
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "School apne drivers manage kare" ON drivers
    FOR ALL USING (
        school_id IN (SELECT id FROM schools WHERE user_id = auth.uid())
    );

-- Students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School apne students manage kare" ON students
    FOR ALL USING (
        school_id IN (SELECT id FROM schools WHERE user_id = auth.uid())
    );
CREATE POLICY "Parent apne bachche dekhe" ON students
    FOR SELECT USING (
        parent_id IN (SELECT id FROM parents WHERE user_id = auth.uid())
    );

-- Bus Locations
ALTER TABLE bus_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Driver apni bus update kare" ON bus_locations
    FOR ALL USING (
        bus_id IN (SELECT bus_id FROM drivers WHERE user_id = auth.uid())
    );
CREATE POLICY "School apni saari buses dekhe" ON bus_locations
    FOR SELECT USING (
        bus_id IN (
            SELECT id FROM buses WHERE school_id IN (
                SELECT id FROM schools WHERE user_id = auth.uid()
            )
        )
    );
CREATE POLICY "Parent apne bachche ki bus dekhe" ON bus_locations
    FOR SELECT USING (
        bus_id IN (
            SELECT bus_id FROM students WHERE parent_id IN (
                SELECT id FROM parents WHERE user_id = auth.uid()
            )
        )
    );

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School apni notifications bheje" ON notifications
    FOR ALL USING (
        school_id IN (SELECT id FROM schools WHERE user_id = auth.uid())
    );
CREATE POLICY "Login users notifications padhe" ON notifications
    FOR SELECT USING (auth.uid() IS NOT NULL);
```

---

## 📁 supabase/seed.sql — Demo Data

```sql
-- supabase/seed.sql
-- SIRF DEVELOPMENT MEIN RUN KARO!
-- Green Valley School ka demo data

INSERT INTO user_profiles (id, role, name, phone)
VALUES ('00000000-0000-0000-0000-000000000001', 'school', 'Green Valley School', '9898989898');

INSERT INTO schools (id, user_id, name, code, phone, email, principal, address)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Green Valley School', 'GVS-2024-113',
    '+91 120 456 7890', 'office@greenvalley.edu.in',
    'Dr. Meena Sharma', 'Plot 7, Knowledge Park, Sector 62, Noida, UP 201301'
);

INSERT INTO user_profiles (id, role, name, phone)
VALUES ('00000000-0000-0000-0000-000000000002', 'driver', 'Rajesh Kumar', '9876543210');

INSERT INTO drivers (user_id, school_id, name, driver_id, phone, license, status, rating)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000010',
    'Rajesh Kumar', 'DRV001', '+91 98765 43210',
    'DL-0420110149646', 'Active', 4.8
);
```

---

## 🔗 Frontend Integration Guide

### `main.tsx` mein Auth routing:
```typescript
import { useAuth } from '../hooks/useAuth';

// Component ke andar:
const { role, loading, isLoggedIn } = useAuth();

if (loading) return <LoadingScreen />;
if (!isLoggedIn) navigateTo('Login');
else if (role === 'school') navigateTo('SchoolDashboard');
else if (role === 'driver') navigateTo('DriverDashboard');
else if (role === 'parent') navigateTo('ParentDashboard');
```

### `common.tsx` mein dummy data replace karo:
```typescript
// PEHLE (dummy data hardcoded):
const [students] = useState<DStudent[]>(() => STUDENTS.map(...));

// BAAD MEIN (Supabase se live data):
const { students, loading } = useStudents(schoolId);
```

---

## 📋 Implementation Checklist (Step by Step)

```
[ ] 1. supabase.com pe project create karo
[ ] 2. .env file banao — SUPABASE_URL + ANON_KEY daalo
[ ] 3. npm install @supabase/supabase-js @react-native-async-storage/async-storage
[ ] 4. src/lib/ folder banao — supabase.ts, auth.ts, realtime.ts banao
[ ] 5. supabase/ folder banao migrations ke saath
[ ] 6. Migrations 001 se 011 tak Supabase SQL Editor mein run karo
[ ] 7. seed.sql run karo demo data ke liye
[ ] 8. src/services/ files banao (authService, schoolService, etc.)
[ ] 9. src/hooks/ files banao (useAuth, useLiveTracking, etc.)
[ ] 10. src/types/ folder banao — database.types.ts generate karo
[ ] 11. common.tsx mein dummy data ko hooks se replace karo
[ ] 12. main.tsx mein useAuth add karo routing ke liye
[ ] 13. loginpageonly.tsx mein loginUser() call karo
[ ] 14. RLS test karo — alag users se login karke verify karo
[ ] 15. Realtime test karo — Driver location bhejo, Parent pe receive karo
```

---

## ⚡ Quick Start Commands

```bash
# Supabase CLI install karo
npm install -g supabase

# Login karo
supabase login

# Project link karo (Supabase dashboard se project ref lo)
supabase link --project-ref your-project-ref

# Migrations run karo
supabase db push

# Supabase packages install karo app mein
npm install @supabase/supabase-js @react-native-async-storage/async-storage

# TypeScript types auto-generate karo
supabase gen types typescript --local > src/types/database.types.ts
```

---

*Made with ❤️ for BusTracker — Backend Documentation (Hinglish Edition)*
*Last Updated: August 2026*
