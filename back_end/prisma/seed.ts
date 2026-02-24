import "dotenv/config";
import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

async function main() {
    if (!connectionString) {
        throw new Error("DATABASE_URL is not set");
    }

    const adapter = new PrismaMariaDb(connectionString);
    const prisma = new PrismaClient({ adapter: adapter as any });

    try {
        const roles = [
            { name: "MANAGER" },
            { name: "SUPPORT" },
            { name: "USER" },
        ];

        console.log("Seeding roles...");
        for (const role of roles) {
            await prisma.roles.upsert({
                where: { name: role.name as any },
                update: {},
                create: role as any,
            });
        }

        const managerRole = await prisma.roles.findUnique({ where: { name: "MANAGER" } });
        const supportRole = await prisma.roles.findUnique({ where: { name: "SUPPORT" } });

        if (managerRole && supportRole) {
            const adminPassword = await bcrypt.hash("admin123", 10);
            const jayPassword = await bcrypt.hash("123456", 10);

            console.log("Seeding users...");

            await prisma.users.upsert({
                where: { email: "admin@example.com" },
                update: { password: adminPassword },
                create: {
                    name: "Admin Manager",
                    email: "admin@example.com",
                    password: adminPassword,
                    role_id: managerRole.id,
                },
            });

            await prisma.users.upsert({
                where: { email: "jay@gmail.com" },
                update: { password: jayPassword },
                create: {
                    name: "jay",
                    email: "jay@gmail.com",
                    password: jayPassword,
                    role_id: supportRole.id,
                },
            });

            console.log("Users seeded successfully:");
            console.log(" - admin@example.com / admin123");
            console.log(" - jay@gmail.com / 123456");
        }
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
