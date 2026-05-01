import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002"), {
    status: 303,
  });

  response.cookies.delete("vision_learn_session");

  return response;
}
