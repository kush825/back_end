import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { z } from "zod";

const statusSchema = z.object({
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

const VALID_TRANSITIONS: Record<string, string[]> = {
    OPEN: ["IN_PROGRESS"],
    IN_PROGRESS: ["RESOLVED"],
    RESOLVED: ["CLOSED"],
    CLOSED: [],
};

/**
 * @swagger
 * /api/tickets/{id}/status:
 *   patch:
 *     summary: Update ticket status (MANAGER or SUPPORT)
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status or invalid transition
 *       404:
 *         description: Ticket not found
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, response } = await authorize(req, ["MANAGER", "SUPPORT"]);
    if (response) return response;

    const { id } = await params;
    const ticketId = parseInt(id);

    try {
        const body = await req.json();
        const result = statusSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ message: "Invalid status" }, { status: 400 });
        }

        const newStatus = result.data.status;

        const ticket = await prisma.tickets.findUnique({ where: { id: ticketId } });
        if (!ticket) {
            return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
        }

        // Validate transition
        if (ticket.status && !VALID_TRANSITIONS[ticket.status].includes(newStatus) && ticket.status !== newStatus) {
            return NextResponse.json({ message: `Invalid transition from ${ticket.status} to ${newStatus}` }, { status: 400 });
        }

        const [updatedTicket] = await prisma.$transaction([
            prisma.tickets.update({
                where: { id: ticketId },
                data: { status: newStatus as any },
            }),
            prisma.ticket_status_logs.create({
                data: {
                    ticket_id: ticketId,
                    old_status: (ticket.status as any) || "OPEN",
                    new_status: newStatus as any,
                    changed_by: user!.userId,
                },
            }),
        ]);

        return NextResponse.json(updatedTicket);
    } catch (error) {
        console.error("Update Status Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
