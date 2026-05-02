import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url, {
    status: 303,
  });

  response.cookies.delete("vision_learn_session");

  return response;
}

export async function GET(request: Request) {
  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url, {
    status: 303,
  });

  response.cookies.delete("vision_learn_session");

  return response;
}
