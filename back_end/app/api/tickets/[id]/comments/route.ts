import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { z } from "zod";

const commentSchema = z.object({
    comment: z.string().min(1),
});

/**
 * @swagger
 * /api/tickets/{id}/comments:
 *   get:
 *     summary: List comments for a ticket
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of comments
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket not found
 *   post:
 *     summary: Add a comment to a ticket
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comment]
 *             properties:
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Ticket not found
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, response } = await authorize(req, ["MANAGER", "SUPPORT", "USER"]);
    if (response) return response;

    const { id } = await params;
    const ticketId = parseInt(id);

    try {
        const ticket = await prisma.tickets.findUnique({
            where: { id: ticketId },
        });

        if (!ticket) {
            return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
        }

        // Role-based logic: MANAGER sees all, SUPPORT sees if assigned, USER sees if owner
        if (user!.role === "SUPPORT" && ticket.assigned_to !== user!.userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
        if (user!.role === "USER" && ticket.created_by !== user!.userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const comments = await prisma.ticket_comments.findMany({
            where: { ticket_id: ticketId },
            include: {
                users: { select: { id: true, name: true, email: true, roles: { select: { name: true } } } },
            },
            orderBy: { created_at: "asc" },
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("List Comments Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, response } = await authorize(req, ["MANAGER", "SUPPORT", "USER"]);
    if (response) return response;

    const { id } = await params;
    const ticketId = parseInt(id);

    try {
        const ticket = await prisma.tickets.findUnique({ where: { id: ticketId } });
        if (!ticket) return NextResponse.json({ message: "Ticket not found" }, { status: 404 });

        // Role-based logic: MANAGER can comment, SUPPORT if assigned, USER if owner
        if (user!.role === "SUPPORT" && ticket.assigned_to !== user!.userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }
        if (user!.role === "USER" && ticket.created_by !== user!.userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const result = commentSchema.safeParse(body);
        if (!result.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });

        const comment = await prisma.ticket_comments.create({
            data: {
                ticket_id: ticketId,
                user_id: user!.userId,
                comment: result.data.comment,
            },
            include: {
                users: { select: { id: true, name: true, email: true, roles: { select: { name: true } } } },
            },
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Create Comment Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
