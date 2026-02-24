import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";

/**
 * @swagger
 * /api/tickets/{id}:
 *   delete:
 *     summary: Delete a ticket (MANAGER only)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Ticket deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { response } = await authorize(req, ["MANAGER"]);
    if (response) return response;

    const { id } = await params;
    const ticketId = parseInt(id);

    try {
        await prisma.tickets.delete({ where: { id: ticketId } });
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Delete Ticket Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
