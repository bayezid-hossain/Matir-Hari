import * as SecureStore from "expo-secure-store";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

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
  deliveryDate?: string
): Promise<Order> {
  return request("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      menuId,
      deliveryAddress,
      ...(deliveryDate ? { deliveryDate } : {}),
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
  // @ts-ignore - FormData expects { uri, name, type } on mobile
  formData.append("file", {
    uri,
    name: `payment_${Date.now()}.jpg`,
    type: "image/jpeg",
  });

  const token = await SecureStore.getItemAsync("auth_token");
  const res = await fetch(`${BASE_URL}/api/orders/upload`, {
    method: "POST",
    body: formData,
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json;
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
  reason: string
): Promise<Order> {
  return request(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "request_change", cancelReason: reason }),
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
