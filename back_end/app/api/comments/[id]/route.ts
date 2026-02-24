import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { z } from "zod";

const commentSchema = z.object({
    comment: z.string().min(1),
});

/**
 * @swagger
 * /api/comments/{id}:
 *   patch:
 *     summary: Edit a comment
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
 *       200:
 *         description: Comment updated
 *   delete:
 *     summary: Delete a comment
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
 *       204:
 *         description: Comment deleted
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, response } = await authorize(req, ["MANAGER", "SUPPORT", "USER"]);
    if (response) return response;

    const { id } = await params;
    const commentId = parseInt(id);

    try {
        const comment = await prisma.ticket_comments.findUnique({ where: { id: commentId } });
        if (!comment) return NextResponse.json({ message: "Comment not found" }, { status: 404 });

        // Authorization: author or MANAGER
        if (user!.role !== "MANAGER" && comment.user_id !== user!.userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const result = commentSchema.safeParse(body);
        if (!result.success) return NextResponse.json({ message: "Invalid input" }, { status: 400 });

        const updatedComment = await prisma.ticket_comments.update({
            where: { id: commentId },
            data: { comment: result.data.comment },
            include: {
                users: { select: { id: true, name: true, email: true, roles: { select: { name: true } } } },
            },
        });

        return NextResponse.json(updatedComment);
    } catch (error) {
        console.error("Edit Comment Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { user, response } = await authorize(req, ["MANAGER", "SUPPORT", "USER"]);
    if (response) return response;

    const { id } = await params;
    const commentId = parseInt(id);

    try {
        const comment = await prisma.ticket_comments.findUnique({ where: { id: commentId } });
        if (!comment) return NextResponse.json({ message: "Comment not found" }, { status: 404 });

        // Authorization: author or MANAGER
        if (user!.role !== "MANAGER" && comment.user_id !== user!.userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        await prisma.ticket_comments.delete({ where: { id: commentId } });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Delete Comment Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
