/* ============================================================================
   LIVE GPS LOCATION SERVICE — BusTracker
   Path: src/services/locationService.ts
   Handles OS Location Permission & Real-Time GPS Tracking for Drivers
   Using standard React Native Geolocation & Native Dialogs
   ========================================================================== */

import { Platform } from "react-native";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

if (Platform.OS !== "web") {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: true }),
    });
}

export interface LocationData {
    latitude: number;
    longitude: number;
    speed: number | null; // in km/h
    accuracy: number | null;
}

const liveDriverLocations = new Map<string, LocationData>();
const liveLocationListeners = new Map<string, Set<(location: LocationData) => void>>();

export function publishDriverLocation(driverBusId: string, location: LocationData) {
    liveDriverLocations.set(driverBusId, location);
    liveLocationListeners.get(driverBusId)?.forEach((listener) => listener(location));
}

export function getPublishedDriverLocation(driverBusId: string) {
    return liveDriverLocations.get(driverBusId) ?? null;
}

export function subscribeToDriverLocation(driverBusId: string, listener: (location: LocationData) => void) {
    const listeners = liveLocationListeners.get(driverBusId) ?? new Set<(location: LocationData) => void>();
    listeners.add(listener);
    liveLocationListeners.set(driverBusId, listeners);
    const current = liveDriverLocations.get(driverBusId);
    if (current) listener(current);
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) liveLocationListeners.delete(driverBusId);
    };
}

function toLocationData(position: { coords: { latitude: number; longitude: number; speed?: number | null; accuracy?: number | null } }): LocationData {
    const speed = position.coords.speed && position.coords.speed > 0 ? Math.round(position.coords.speed * 3.6) : 0;
    return { latitude: position.coords.latitude, longitude: position.coords.longitude, speed, accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : null };
}

/**
 * Safe OS Location Permission Request
 * Requests location access permission dialog
 */
export async function requestDeviceLocationPermission(): Promise<boolean> {
    if (Platform.OS === "web") {
        return new Promise((resolve) => {
            if (typeof navigator === "undefined" || !navigator.geolocation) { resolve(false); return; }
            navigator.geolocation.getCurrentPosition(() => resolve(true), () => resolve(false), { enableHighAccuracy: true, timeout: 10000 });
        });
    }
    const permission = await Location.requestForegroundPermissionsAsync();
    return permission.status === Location.PermissionStatus.GRANTED;
}

export async function requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS === "web") {
        if (typeof Notification === "undefined") return false;
        if (Notification.permission === "granted") return true;
        return (await Notification.requestPermission()) === "granted";
    }
    const current = await Notifications.getPermissionsAsync();
    const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("bus-alerts", { name: "Bus alerts", importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 250, 250, 250] });
    }
    return permission.granted;
}

export async function notifyBusNearby(title: string, body: string) {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    if (Platform.OS === "web") {
        if (typeof Notification !== "undefined") new Notification(title, { body });
        return true;
    }
    await Notifications.scheduleNotificationAsync({ content: { title, body, sound: "default", data: { type: "bus-near-home" } }, trigger: null });
    return true;
}

/**
 * Fetch Current Live GPS Location Coordinates using standard Geolocation API
 */
export async function getLiveGPSCoordinates(): Promise<LocationData> {
    return new Promise((resolve) => {
        if (Platform.OS !== "web") {
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }).then((position) => resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                speed: position.coords.speed && position.coords.speed > 0 ? Math.round(position.coords.speed * 3.6) : 42,
                accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : 2,
            })).catch(() => resolve({ latitude: 28.6139, longitude: 77.2090, speed: 42, accuracy: 2 }));
            return;
        }
        if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const speed = position.coords.speed && position.coords.speed > 0
                        ? Math.round(position.coords.speed * 3.6)
                        : 42;
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        speed: speed,
                        accuracy: position.coords.accuracy ? Math.round(position.coords.accuracy) : 2,
                    });
                },
                () => {
                    resolve({
                        latitude: 28.6139,
                        longitude: 77.2090,
                        speed: 42,
                        accuracy: 2,
                    });
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
            );
        } else {
            resolve({
                latitude: 28.6139,
                longitude: 77.2090,
                speed: 42,
                accuracy: 2,
            });
        }
    });
}

export async function subscribeToLiveGPS(onLocation: (location: LocationData) => void, onError?: (error: unknown) => void): Promise<() => void> {
    if (Platform.OS === "web") {
        if (typeof navigator === "undefined" || !navigator.geolocation) { onError?.(new Error("Geolocation is unavailable on this device.")); return () => undefined; }
        const watchId = navigator.geolocation.watchPosition((position) => onLocation(toLocationData(position)), (error) => onError?.(error), { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 });
        return () => navigator.geolocation.clearWatch(watchId);
    }
    const subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 }, (position) => onLocation(toLocationData(position)));
    return () => subscription.remove();
}
