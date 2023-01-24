import * as jwt from "jsonwebtoken"
import { ErrorHandler, prisma } from "../context";

export const APP_SECRET = process.env.APP_SECRET as string;

export interface AuthTokenPayload {
    clientId?: number,
    adminId?: number,
    role?: string,
    error?: {
        message: string
    }
}

export async function decodeAuthHeader(authHeader: String): Promise<AuthTokenPayload> {
    try {
        const token = authHeader.replace("Bearer ", "");

        const data = jwt.verify(token, APP_SECRET) as AuthTokenPayload

        // Check if the user exist in database
        const user = data.adminId ? await prisma.admin.findUnique({
            where: {
                id: data.adminId
            }
        }) : await prisma.client.findUnique({
            where: {
                id: data.clientId
            }
        })

        if (!user) throw new Error("Invalid Token", { cause: "Known" })

        return data;
    } catch (error) {
        throw new ErrorHandler(error as Error)
    }
}