import { SignJWT, jwtVerify } from "jose";

const jwtSecret =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "production" ? "" : "dev_jwt_secret_local_only");

if (!jwtSecret && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is missing.");
}

const SECRET = new TextEncoder().encode(jwtSecret || "dev_jwt_secret_local_only");

export async function createToken(payload: { id: string; student_id: string; name: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { id: string; student_id: string; name: string };
  } catch (error) {
    return null;
  }
}
