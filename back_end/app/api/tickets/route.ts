import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { z } from "zod";

const createTicketSchema = z.object({
    title: z.string().min(5),
    description: z.string().min(10),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: List tickets (Role-based filtering)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of tickets. MANAGER sees all, SUPPORT sees assigned, USER sees owned.
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
    const { user, response } = await authorize(req, ["MANAGER", "SUPPORT", "USER"]);
    if (response) return response;

    try {
        let whereClause = {};

        if (user!.role === "SUPPORT") {
            whereClause = { assigned_to: user!.userId };
        } else if (user!.role === "USER") {
            whereClause = { created_by: user!.userId };
        }

        const tickets = await prisma.tickets.findMany({
            where: whereClause,
            include: {
                users_tickets_created_byTousers: { select: { id: true, name: true, email: true, roles: { select: { name: true } } } },
                users_tickets_assigned_toTousers: { select: { id: true, name: true, email: true, roles: { select: { name: true } } } },
            },
            orderBy: { created_at: "desc" },
        });

        return NextResponse.json(tickets);
    } catch (error) {
        console.error("List Tickets Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Create a new ticket (MANAGER or USER only)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description]
 *             properties:
 *               title: { type: string, minLength: 5 }
 *               description: { type: string, minLength: 10 }
 *               priority: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *       400:
 *         description: Invalid input
 */
export async function POST(req: NextRequest) {
    const { user, response } = await authorize(req, ["MANAGER", "USER"]);
    if (response) return response;

    try {
        const body = await req.json();
        const result = createTicketSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ message: "Invalid input", errors: result.error.format() }, { status: 400 });
        }

        const ticket = await prisma.tickets.create({
            data: {
                title: result.data.title,
                description: result.data.description,
                priority: (result.data.priority as any) || "MEDIUM",
                created_by: user!.userId,
                status: "OPEN",
            },
            include: {
                users_tickets_created_byTousers: true,
            },
        });

        return NextResponse.json(ticket, { status: 201 });
    } catch (error) {
        console.error("Create Ticket Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
