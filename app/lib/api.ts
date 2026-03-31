import * as SecureStore from "expo-secure-store";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

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
  bdt: { hour: number; minute: number };
  lunch: MenuEntry | null;
  dinner: MenuEntry | null;
};

export async function getTodayMenus(): Promise<TodayMenus> {
  return request("/api/menus/today");
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type Order = {
  id: string;
  status: string;
  totalPrice: number;
  commitmentFee: number;
  deliveryFee: number;
  trxId: string | null;
  paymentMethod: string | null;
  cutOffReached: boolean;
  orderedAt: string;
  confirmedAt: string | null;
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

export async function getOrders(): Promise<Order[]> {
  return request("/api/orders");
}

export async function createOrder(
  menuId: string,
  deliveryAddress: object
): Promise<Order> {
  return request("/api/orders", {
    method: "POST",
    body: JSON.stringify({ menuId, deliveryAddress }),
  });
}

export async function submitPayment(
  orderId: string,
  trxId: string,
  paymentMethod: "bKash" | "Nagad"
): Promise<Order> {
  return request(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "submit_payment", trxId, paymentMethod }),
  });
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
  return request(`/api/orders/${orderId}`);
}

// ─── User ─────────────────────────────────────────────────────────────────────

export type UserProfile = AuthUser & {
  locationData: object | null;
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
  updates: { name?: string; locationData?: object }
): Promise<UserProfile> {
  return request("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}
