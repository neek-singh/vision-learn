import { NextResponse } from "next/server";

function getRedirectTarget(request: Request): string {
  const customTarget = process.env.NEXT_PUBLIC_MAIN_WEBSITE_URL;
  if (customTarget) return customTarget;

  try {
    const url = new URL(request.url);
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return "http://localhost:3000";
    }
  } catch {}

  return process.env.NODE_ENV === "production" ? "https://visionitinstitute.com" : "http://localhost:3000";
}

export async function POST(request: Request) {
  const isHtml = request.headers.get("accept")?.includes("text/html");
  const redirectTarget = getRedirectTarget(request);

  // If standard browser form POST, redirect with 303 to main website
  // If fetch/AJAX request, respond with fast JSON (200 OK) so client can replace URL without extra roundtrip
  const response = isHtml
    ? NextResponse.redirect(redirectTarget, { status: 303 })
    : NextResponse.json({ success: true, redirect: redirectTarget }, { status: 200 });

  // Clear session cookie completely
  response.cookies.set("vision_learn_session", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.delete("vision_learn_session");

  // NOTE: We deliberately DO NOT set Clear-Site-Data: "cache".
  // Wiping HTTP cache forces the browser to re-download all JS/CSS bundles from scratch,
  // which makes logout and initial page load sluggish. Client IndexedDB/localStorage
  // is purged cleanly by offline-store.ts instead.

  return response;
}

export async function GET(request: Request) {
  const isHtml = request.headers.get("accept")?.includes("text/html");
  const redirectTarget = getRedirectTarget(request);

  const response = isHtml
    ? NextResponse.redirect(redirectTarget, { status: 303 })
    : NextResponse.json({ success: true, redirect: redirectTarget }, { status: 200 });

  response.cookies.set("vision_learn_session", "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.delete("vision_learn_session");

  return response;
}
