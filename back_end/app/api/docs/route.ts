import swaggerJsdoc from "swagger-jsdoc";
import options from "@/lib/swagger";

export async function GET() {
    const spec = swaggerJsdoc(options);
    return Response.json(spec);
}
