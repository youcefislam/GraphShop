import { Prisma } from "@prisma/client";
import { arg, extendType, intArg, list, nonNull, objectType, stringArg } from "nexus";

export const Client = objectType({
    name: "Client",
    definition(t) {
        t.nonNull.int("id");
        t.nonNull.string("email");
        t.nonNull.int("debt");
        t.nonNull.dateTime("createdAt");
        t.nonNull.dateTime("updatedAt");
    },
})

export const ClientQuery = extendType({
    type: "Query",
    definition(t) {
        t.field("client", {
            type: "Client",
            description: "Admin only, return client's information",
            args: {
                id: nonNull(intArg())
            },
            authorize: (parent, args, context) => context.canAccess(context.userData, "CHIEF"),
            async resolve(parent, args, context) {
                return context.prisma.client.findUnique({
                    where: {
                        id: args.id
                    }
                });
            }
        })
        t.nonNull.list.nonNull.field("clientList", {
            type: "Client",
            description: "Admin only, return list of clients",
            args: {
                email: stringArg(),
                skip: intArg({ default: 0 }),
                take: intArg({ default: 5 }),
                orderBy: arg({ type: list(nonNull("ClientOrderByInput")) })
            },
            authorize: (parent, args, context) => context.canAccess(context.userData, "CHIEF"),
            async resolve(parent, args, context) {
                const where = args.email ? {
                    OR: [
                        { email: { contains: args.email } },
                    ]
                } : {};

                const clientList = await context.prisma.client.findMany({
                    where,
                    skip: args?.skip as number | undefined,
                    take: args?.take as number | undefined,
                    orderBy: args?.orderBy as Prisma.Enumerable<Prisma.ClientOrderByWithRelationInput> | undefined
                });

                return clientList;
            }
        })
    }
})
