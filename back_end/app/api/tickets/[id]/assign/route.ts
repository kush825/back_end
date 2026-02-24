import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { z } from "zod";

const assignSchema = z.object({
    userId: z.number().int(),
});

/**
 * @swagger
 * /api/tickets/{id}/assign:
 *   patch:
 *     summary: Assign a ticket to a Support or Manager (MANAGER or SUPPORT only)
 *     tags: [Tickets]
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
 *             required: [userId]
 *             properties:
 *               userId: { type: integer }
 *     responses:
 *       200:
 *         description: Ticket assigned successfully
 *       400:
 *         description: Invalid input or user role
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { response } = await authorize(req, ["MANAGER", "SUPPORT"]);
    if (response) return response;

    const { id } = await params;
    const ticketId = parseInt(id);

    try {
        const body = await req.json();
        const result = assignSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ message: "Invalid input" }, { status: 400 });
        }

        const targetUser = await prisma.users.findUnique({
            where: { id: result.data.userId },
            include: { roles: true },
        });

        if (!targetUser || targetUser.roles.name === "USER") {
            return NextResponse.json({ message: "Tickets cannot be assigned to users with role USER" }, { status: 400 });
        }

        const ticket = await prisma.tickets.update({
            where: { id: ticketId },
            data: { assigned_to: result.data.userId },
            include: {
                users_tickets_assigned_toTousers: true,
            },
        });

        return NextResponse.json(ticket);
    } catch (error) {
        console.error("Assign Ticket Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
