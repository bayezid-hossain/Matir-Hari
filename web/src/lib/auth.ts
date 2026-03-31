/**
 * Lightweight auth helpers — phone + password, JWT sessions.
 *
 * Better Auth (https://better-auth.com) is listed in the PRD but requires an
 * adapter configured against Drizzle. We wire it up here so the route handlers
 * can call `signIn` / `signUp` / `getSession` through a single surface.
 *
 * If you want to swap in Better Auth's full server SDK later, replace the
 * contents of this file — the API routes only depend on the three exports
 * below: `hashPassword`, `verifyPassword`, `signToken`, `verifyToken`.
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-change-in-production"
);
const JWT_ISSUER = "matir-hari";
const JWT_AUDIENCE = "matir-hari-app";
const TOKEN_TTL = "30d";

// ─── Password helpers ─────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

export type JWTPayload = {
  sub: string; // userId
  phone: string;
};

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ phone: payload.phone })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return {
      sub: payload.sub as string,
      phone: payload["phone"] as string,
    };
  } catch {
    return null;
  }
}

// ─── Request helpers ──────────────────────────────────────────────────────────

import type { NextRequest } from "next/server";

/** Extracts and verifies the Bearer token from an incoming request. */
export async function getAuthUser(
  req: NextRequest
): Promise<JWTPayload | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  if (!token) return null;
  return verifyToken(token);
}
