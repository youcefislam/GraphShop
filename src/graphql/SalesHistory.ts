import { Prisma } from "@prisma/client";
import { arg, extendType, intArg, list, nonNull, objectType } from "nexus";

export const SalesHistory = objectType({
    name: "SalesHistory",
    definition(t) {
        t.nonNull.int("clientId")
        t.nonNull.int("productId")
        t.nonNull.float("total")
        t.nonNull.int("quantity")
        t.nonNull.dateTime("date")
        t.field("product", {
            type: "Product",
            resolve(parent, args, context) {
                return context.prisma.product.findUnique({
                    where: {
                        id: parent.productId
                    }
                })
            }
        })
    },
})

export const SalesHistoryQuery = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.list.nonNull.field("salesHistory", {
            type: "SalesHistory",
            description: "Admin only, Return sales history",
            args: {
                skip: intArg({ default: 0 }),
                take: intArg({ default: 5 }),
                orderBy: arg({ type: list(nonNull("SalesHisOrderByInput")) })
            },
            authorize: (parent, args, context) => context.canAccess(context.userData, "CHIEF"),
            resolve(parent, args, context) {
                return context.prisma.sales_history.findMany({
                    skip: args.skip as number | undefined,
                    take: args.take as number | undefined,
                    orderBy: args?.orderBy as Prisma.Enumerable<Prisma.sales_historyOrderByWithRelationInput> | undefined
                });
            }
        })

        t.nonNull.list.nonNull.field("customerPurchases", {
            type: "SalesHistory",
            description: "Admin only, Return purchases history of a specific client",
            args: {
                clientId: nonNull(intArg()),
                skip: intArg({ default: 0 }),
                take: intArg({ default: 5 }),
                orderBy: arg({ type: list(nonNull("SalesHisOrderByInput")) })
            },
            authorize: (parent, args, context) => context.canAccess(context.userData, "CHIEF"),
            resolve(parent, args, context) {
                const { clientId } = args
                
                return context.prisma.sales_history.findMany({
                    where: {
                        clientId
                    },
                    skip: args?.skip as number | undefined,
                    take: args?.take as number | undefined,
                    orderBy: args?.orderBy as Prisma.Enumerable<Prisma.sales_historyOrderByWithRelationInput> | undefined
                })
            }
        })
    }
})