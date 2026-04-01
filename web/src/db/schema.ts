import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  json,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const mealTypeEnum = pgEnum("meal_type", ["Lunch", "Dinner"]);

export const orderStatusEnum = pgEnum("order_status", [
  "PendingPayment",
  "Confirmed",
  "Cooking",
  "OutForDelivery",
  "Delivered",
  "Cancelled",
  "PendingAdminAction",
]);

export const paymentMethodEnum = pgEnum("payment_method", ["bKash", "Nagad"]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  trustScore: integer("trust_score").notNull().default(0),
  // Stored as LocationData: { locations: SavedLocation[], activeId: string | null }
  // Legacy rows may store { address, lat, lng } — treat those as empty.
  locationData: json("location_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const menus = pgTable("menus", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  // 0 = Sunday … 6 = Saturday
  dayOfWeek: integer("day_of_week").notNull(),
  type: mealTypeEnum("type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  itemsDescription: text("items_description").notNull(),
  imageUrl: text("image_url"),
  price: integer("price").notNull(), // in BDT (paisa omitted for simplicity)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  menuId: text("menu_id")
    .notNull()
    .references(() => menus.id),
  status: orderStatusEnum("status").notNull().default("PendingPayment"),
  trxId: text("trx_id"),
  paymentMethod: paymentMethodEnum("payment_method"),
  totalPrice: integer("total_price").notNull(), // full meal price
  commitmentFee: integer("commitment_fee").notNull().default(50),
  deliveryFee: integer("delivery_fee").notNull().default(30),
  // { lat, lng, address }
  deliveryAddress: json("delivery_address"),
  // "YYYY-MM-DD" BDT. null = legacy same-day order.
  deliveryDate: text("delivery_date"),
  cutOffReached: boolean("cut_off_reached").notNull().default(false),
  cancelReason: text("cancel_reason"),
  adminNote: text("admin_note"),
  // Timestamps for each stage
  orderedAt: timestamp("ordered_at").notNull().defaultNow(),
  paymentSubmittedAt: timestamp("payment_submitted_at"),
  confirmedAt: timestamp("confirmed_at"),
  cookingStartedAt: timestamp("cooking_started_at"),
  outForDeliveryAt: timestamp("out_for_delivery_at"),
  deliveredAt: timestamp("delivered_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── App Settings ─────────────────────────────────────────────────────────────
// Key-value store for global configuration. Keys:
//   delivery_fee_mode    : "fixed" | "auto"
//   delivery_fee_fixed   : integer string (BDT) — used when mode = fixed
//   delivery_fee_base    : integer string (BDT) — base fee for auto mode
//   delivery_fee_per_km  : integer string (BDT per km) — for auto mode
//   kitchen_lat          : decimal string — for distance calculation in auto mode
//   kitchen_lng          : decimal string

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "cutoff_reminder" | "order_confirmed" | "out_for_delivery" | "payment_verified"
  title: text("title").notNull(),
  message: text("message").notNull(),
  orderId: text("order_id"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  sessions: many(sessions),
  notifications: many(notifications),
}));

export const menusRelations = relations(menus, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  menu: one(menus, { fields: [orders.menuId], references: [menus.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
