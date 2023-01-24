import { PrismaClient } from "@prisma/client"
import { Request } from "graphql-http"
import { Request as ExpressRequest } from "express";
import { AuthTokenPayload, decodeAuthHeader } from "./utils/auth";
import { JsonWebTokenError } from "jsonwebtoken";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";

export const prisma = new PrismaClient({ log: ["query"] });

// If server goes down, we invoke this bootstrap to make sure the existed carts got cleared in time
(async () => {
    const globalCart = await prisma.cart.findMany({})
    const date = new Date();

    // Set a timer for each cart element
    globalCart.forEach((cartElement) => {
        const expiresIn = (cartElement.addedAt.getTime() + 5 * 60 * 1000) - date.getTime();
        const delay = expiresIn > 0 ? expiresIn : 0
        setTimeout(() => {
            return prisma.$transaction([
                prisma.product.update({
                    where: {
                        id: cartElement.productId
                    },
                    data: {
                        quantity: { increment: cartElement.quantity }
                    }
                }),
                prisma.cart.delete({
                    where: {
                        clientId_productId: {
                            clientId: cartElement.clientId,
                            productId: cartElement.productId
                        }
                    }
                })
            ])
        }, delay)
    })
})()

export class ErrorHandler extends Error {
    constructor(error: Error) {
        let message = error.cause === "Known" ? error.message : "Unknown Error!"
        if (error instanceof PrismaClientKnownRequestError) message = error.meta?.cause as string
        else if (error instanceof JsonWebTokenError) message = "Invalid token";
        super(message);
    }
}

export interface Context {
    prisma: PrismaClient,
    canAccess: { (data: AuthTokenPayload, role?: string | null): boolean },
    userData: AuthTokenPayload,
    ErrorHandler: typeof ErrorHandler
}


export const context = async (req: Request<ExpressRequest, any>) => {
    const request = req.raw;
    const token = request && request.headers.authorization ? await decodeAuthHeader(request.headers.authorization) : null

    return {
        prisma,
        canAccess: (data: AuthTokenPayload, role: string | null = null): boolean => {
            if (role)
                return data?.role === role && data?.adminId !== undefined
            return data.clientId !== undefined
        },
        userData: token,
        ErrorHandler
    }
}
