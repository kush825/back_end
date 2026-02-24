import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authorize } from "@/lib/auth";
import { z } from "zod";

const createUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    role_id: z.number().int(),
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users (MANAGER only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer }
 *                   name: { type: string }
 *                   email: { type: string }
 *                   role: { type: string }
 *                   created_at: { type: string, format: date-time }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function GET(req: NextRequest) {
    const { response } = await authorize(req, ["MANAGER"]);
    if (response) return response;

    try {
        const users = await prisma.users.findMany({
            include: { roles: true },
            orderBy: { created_at: "desc" },
        });

        return NextResponse.json(
            users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.roles.name,
                created_at: u.created_at,
            }))
        );
    } catch (error) {
        console.error("List Users Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (MANAGER only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role_id]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role_id: { type: integer }
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input or email already in use
 */
export async function POST(req: NextRequest) {
    const { response } = await authorize(req, ["MANAGER"]);
    if (response) return response;

    try {
        const body = await req.json();
        const result = createUserSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ message: "Invalid input", errors: result.error.format() }, { status: 400 });
        }

        const { name, email, password, role_id } = result.data;

        const existingUser = await prisma.users.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ message: "Email already in use" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role_id,
            },
            include: { roles: true },
        });

        return NextResponse.json(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.roles.name,
                created_at: user.created_at,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create User Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
