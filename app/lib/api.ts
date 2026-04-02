import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');
const BASE_URL = RAW_API_URL.endsWith("/") ? RAW_API_URL.slice(0, -1) : RAW_API_URL;
console.log("[API] BASE_URL =", BASE_URL, "| EXPO_PUBLIC_API_URL =", process.env.EXPO_PUBLIC_API_URL ?? "(not set)");
/** Convert server-relative image paths to absolute URLs for mobile use. */
function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("auth_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error ?? `HTTP ${res.status}`);
  }
  return json.data as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  trustScore: number;
};

export async function register(
  name: string,
  phone: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, phone, password }),
  });
}

export async function login(
  phone: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

export async function resetPassword(
  phone: string,
  newPassword: string
): Promise<{ message: string }> {
  return request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ phone, newPassword }),
  });
}

// ─── Menus ────────────────────────────────────────────────────────────────────

export type MenuEntry = {
  id: string;
  name: string;
  type: "Lunch" | "Dinner";
  description: string;
  itemsDescription: string;
  imageUrl: string | null;
  price: number;
  cutoffPassed: boolean;
  cutoffTime: string;
};

export type TodayMenus = {
  date: string;
  requestedDate: string;
  bdt: { hour: number; minute: number };
  lunch: MenuEntry | null;
  dinner: MenuEntry | null;
};

function fixMenuImageUrls(data: TodayMenus): TodayMenus {
  return {
    ...data,
    lunch: data.lunch ? { ...data.lunch, imageUrl: resolveImageUrl(data.lunch.imageUrl) } : null,
    dinner: data.dinner ? { ...data.dinner, imageUrl: resolveImageUrl(data.dinner.imageUrl) } : null,
  };
}

export async function getTodayMenus(): Promise<TodayMenus> {
  const data = await request<TodayMenus>("/api/menus/today");
  return fixMenuImageUrls(data);
}

export async function getMenusByDate(date: string): Promise<TodayMenus> {
  const data = await request<TodayMenus>(`/api/menus/today?date=${encodeURIComponent(date)}`);
  return fixMenuImageUrls(data);
}

// ─── Location ─────────────────────────────────────────────────────────────────

export type SavedLocation = {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
};

export type LocationData = {
  locations: SavedLocation[];
  activeId: string | null;
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export type Order = {
  id: string;
  status: string;
  totalPrice: number;
  commitmentFee: number;
  deliveryFee: number;
  trxId: string | null;
  paymentMethod: string | null;
  paymentScreenshot: string | null;
  cutOffReached: boolean;
  deliveryDate: string | null;
  quantity: number;
  changeRequest: {
    requestedQuantity: number;
    reason: string;
    requestedAt: string;
    previousStatus: string;
  } | null;
  orderedAt: string;
  confirmedAt: string | null;
  cookingStartedAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  menu: {
    id: string;
    name: string;
    type: "Lunch" | "Dinner";
    description: string;
    imageUrl: string | null;
    price: number;
  };
};

function fixOrderImageUrl(order: Order): Order {
  return { ...order, menu: { ...order.menu, imageUrl: resolveImageUrl(order.menu.imageUrl) } };
}

export async function getOrders(): Promise<Order[]> {
  const data = await request<Order[]>("/api/orders");
  return data.map(fixOrderImageUrl);
}

export async function createOrder(
  menuId: string,
  deliveryAddress: object,
  deliveryDate?: string,
  quantity = 1
): Promise<Order> {
  return request("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      menuId,
      deliveryAddress,
      ...(deliveryDate ? { deliveryDate } : {}),
      ...(quantity > 1 ? { quantity } : {}),
    }),
  });
}

export async function submitPayment(
  orderId: string,
  trxId: string,
  paymentMethod: "bKash" | "Nagad",
  paymentScreenshot?: string
): Promise<Order> {
  return request(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "submit_payment", trxId, paymentMethod, paymentScreenshot }),
  });
}

export async function uploadPaymentScreenshot(
  uri: string
): Promise<{ url: string }> {
  const formData = new FormData();
  const filename = uri.split("/").pop();
  const match = /\.(\w+)$/.exec(filename || "");
  const type = match ? `image/${match[1]}` : "image/jpeg";

  // @ts-ignore
  formData.append("file", {
    uri: uri,
    name: filename || `payment_${Date.now()}.jpg`,
    type: type,
  });

  const token = await SecureStore.getItemAsync("auth_token");
  try {
    const res = await fetch(`${BASE_URL}/api/orders/upload`, {
      method: "POST",
      body: formData,
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      let errorMessage = "Upload failed";
      try {
        const errJson = JSON.parse(text);
        errorMessage = errJson.error || errorMessage;
      } catch {
        errorMessage = `Server responded with ${res.status}`;
      }
      throw new Error(errorMessage);
    }

    return await res.json();
  } catch (error: any) {
    if (error.message === 'Network request failed') {
      throw new Error(`Connection error: ensure the API URL (${BASE_URL}) is reachable from your mobile device.`);
    }
    throw error;
  }
}

export async function cancelOrder(
  orderId: string,
  cancelReason: string
): Promise<Order> {
  return request(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "cancel", cancelReason }),
  });
}

export async function requestChange(
  orderId: string,
  cancelReason: string,
  requestedQuantity?: number
): Promise<Order> {
  return request(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({
      action: "request_change",
      cancelReason,
      ...(requestedQuantity ? { requestedQuantity } : {}),
    }),
  });
}

export async function getOrderById(orderId: string): Promise<Order> {
  const data = await request<Order>(`/api/orders/${orderId}`);
  return fixOrderImageUrl(data);
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type UserProfile = AuthUser & {
  locationData: LocationData | null;
  createdAt: string;
  perks: {
    codUnlocked: boolean;
    ordersUntilCod: number;
    progressPercent: number;
  };
};

export async function getMe(): Promise<UserProfile> {
  return request("/api/users/me");
}

export async function updateMe(
  updates: { name?: string; locationData?: LocationData }
): Promise<UserProfile> {
  return request("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId: string | null;
  read: boolean;
  createdAt: string;
};

export async function getNotifications(): Promise<Notification[]> {
  return request("/api/users/me/notifications");
}

export async function markNotificationsRead(): Promise<{ message: string }> {
  return request("/api/users/me/notifications", {
    method: "PATCH",
  });
}
