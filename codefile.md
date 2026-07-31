# BusTracker Project Codebase Explanation (Hinglish)

Bhai, is file me maine pure app ke flow aur architecture ko detail me explain kiya hai taaki jab aap apna custom code likho, toh aapko exactly pata ho ki konsi file kya karti hai aur data kaise flow hota hai.

---

## 1. Project ki Structure aur Routing (Expo Router)

Ye app **Expo Router** use karta hai, jiska matlab hai ki aapke screens folders aur files ke naam pe based hote hain. Isko **File-Based Routing** bolte hain.

### `src/app/_layout.tsx`
- **Kaam:** Ye pure app ka "Wrapper" ya main layout hai.
- **Logic:** Yahan par hum themes (Dark Mode / Light Mode) set karte hain aur `<AppTabs />` render karte hain jisse neeche wala bottom navigation bar aata hai. Ye file decide karti hai ki pure app ke charo taraf ka frame kaisa hoga.

### `src/app/index.tsx`
- **Kaam:** Ye app ki "Home Screen" hai (jab app open hota hai toh ye pehla page dikhta hai).
- **Logic:** Is file me kuch khaas nahi likha, bas isne hamare main logic ko ek dusre component `<MainComponent />` ko saump diya hai taaki file choti aur clean rahe.

### `src/app/explore.tsx`
- **Kaam:** Ye "Explore" tab wali screen hai.
- **Logic:** Yahan par sirf static UI elements dikhaye gaye hain (cards, badges). Iska main maqsad hai user ko info dikhana.

---

## 2. Main Logic aur State Management

### `src/components/main.tsx`
Ye app ki **sabse important file** hai. Sara dimaag yahi par lagaya gaya hai. 
- **Data:** Yahan par `SAMPLE_BUSES` aur `SAMPLE_TIMELINE` namak array me dummy data rakha gaya hai (jise baad me aap apne backend API se replace kar sakte ho).
- **State (useState):**
  - `refreshing`: Jab user page ko pull-down karke refresh karta hai, toh ye state app ko batata hai ki spinner dikhana hai ya nahi.
  - `searchQuery`: Jab user search bar me type karta hai, wo text yahan save hota hai.
  - `selectedBus`: Jab user kisi bus pe click karta hai, toh konsi bus click hui hai uska data isme save hota hai taaki uski timeline aur driver ki info dikhayi ja sake.
- **Logic:** `filteredBuses` array original bus list ko search ke hisaab se filter karta hai. Agar search match nahi karta, toh ek "No buses found" wala message (Empty State) dikhaya jata hai.

---

## 3. Bus System ke Specific Components

Bade page ko chote-chote tukdon me baanta gaya hai taaki code maintain karna asan ho. In tukdon ko Components bolte hain.

### `BusCard.tsx`
- **Kaam:** List mein ek individual bus ki ticket/card dikhana.
- **Logic:** Ye apne andar `BusData` namak props leta hai aur bus ka number, route, speed, status aur ETA render karta hai. Isme "Details" aur "Track Live" ke buttons hain jo click hone par main.tsx ko batate hain ki "Mujh par click hua hai" (`onSelectBus` event pass hota hai).

### `StopTimeline.tsx`
- **Kaam:** Jab user kisi bus pe click kare, toh uska poora route rasta dikhana.
- **Logic:** Isko ek array of `stops` milta hai. Ye array par `.map()` chalata hai aur har ek stop ke liye ek gola aur line banata hai. Agar stop nikal chuka hai (passed), toh us gola me "tick" (✓) ban jata hai. Agar bus wahin hai (current), toh gola dhadakta hai (pulse animation).

### `DriverInfoCard.tsx`
- **Kaam:** Driver ki photo, naam aur rating dikhana.
- **Logic:** Ye bahot simple component hai jo bahar se input (name, rating, experience) lekar screen par show kar deta hai. Isme ek call button bhi hai.

---

## 4. Reusable UI Components (Design Blocks)

Ye wo components hain jo sirf Bus ke nahi hain, aap inko app me kahin bhi (settings me, profile me) use kar sakte ho.

### `Card.tsx`
- **Kaam:** Ek dabba/box banana jiske border gol (rounded) hon aur shadow (parchai) ho.
- **Logic:** Isme hum `variant` pass karte hain jaise `variant="elevated"` ya `variant="glass"`. Ander ek switch case function laga hai (`getVariantStyles()`) jo us variant ke hisab se Tailwind CSS ki classes laga deta hai.

### `Badge.tsx`
- **Kaam:** Chote-chote colorful labels banana (jaise "Live", "Delayed", "On Time").
- **Logic:** Card.tsx ki tarah hi, yahan bhi variants pass hote hain. Agar status 'live' hai toh ye Tailwind classes se Green color banata hai aur usme ek dhadakti hui (animate-pulse) dot laga deta hai.

---

## 5. Styling (NativeWind & Tailwind CSS)

Ye app Tailwind CSS use karta hai. Isliye aapko alag se `StyleSheet.create({})` nahi likhna padta.
- Classes jaise `flex-row`, `items-center`, `justify-between`, `text-blue-500` sidhe UI ko style kar dete hain. 
- **Dark Mode:** Classes ke aage `dark:` laga dene se wo styling dark mode me automatically apply ho jati hai (jaise `bg-white dark:bg-slate-900`).

## Summary For Custom Code

Bhai agar aap apna code likhna chalu karte ho:
1. **Naya page** banana ho toh usko `src/app/` ke ander `.tsx` file bana ke rakh do.
2. **Design elements** banane ho toh pehle dekh lo ki `src/components/ui/` me Card ya Badge jaisa kuch pehle se hai kya.
3. **Data laana ho** API se toh API call hamesha us page (jaise `main.tsx`) ke andar karna aur wahan se props ke through chote components (`BusCard`) ko data pass karna.

All the best bhai! Agar koi bhi line of code na samajh aaye toh mujhse puch lena.
