import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function unauthorized(message = "Unauthorized") {
  return err(message, 401);
}

export function notFound(message = "Not found") {
  return err(message, 404);
}

export function forbidden(message = "Forbidden") {
  return err(message, 403);
}
