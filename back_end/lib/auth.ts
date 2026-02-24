import jwt from "jsonwebtoken";
import { type NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export interface JWTPayload {
    userId: number;
    email: string;
    role: "MANAGER" | "SUPPORT" | "USER";
}

export function signToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        return null;
    }
}

export async function authorize(
    req: NextRequest,
    allowedRoles: ("MANAGER" | "SUPPORT" | "USER")[]
) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { user: null, response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);

    if (!payload) {
        return { user: null, response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
    }

    if (!allowedRoles.includes(payload.role)) {
        return { user: payload, response: NextResponse.json({ message: "Forbidden" }, { status: 403 }) };
    }

    return { user: payload, response: null };
}
