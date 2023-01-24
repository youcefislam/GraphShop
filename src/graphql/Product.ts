import { Prisma } from "@prisma/client";
import { objectType, extendType, nonNull, stringArg, intArg, floatArg, inputObjectType, arg, list } from "nexus"

export const Product = objectType({
    name: "Product",
    definition(t) {
        t.nonNull.int("id");
        t.nonNull.string("name");
        t.string("description");
        t.nonNull.float("price");
        t.nonNull.int("quantity");
        t.dateTime("createdAt");
        t.dateTime("updatedAt");
    },
})

export const ProductUpdateFilter = inputObjectType({
    name: "ProductUpdateFilter",
    definition(t) {
        t.nonNull.int("id")
    },
})

export const ProductUpdateSet = inputObjectType({
    name: "ProductUpdateSet",
    definition(t) {
        t.string("name")
        t.string("description")
        t.float("price")
        t.int("quantity")
    },
})

export const ProductQuery = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.list.nonNull.field("productsList", {
            type: "Product",
            description: "Return list of all available products",
            args: {
                name: stringArg(),
                skip: intArg({ default: 0 }),
                take: intArg({ default: 5 }),
                orderBy: arg({ type: list(nonNull("ProductOrderByInput")) })
            },
            async resolve(parent, args, context) {
                const where = args.name ? {
                    OR: [
                        { name: { contains: args.name } },
                    ]
                } : {};

                const productList = await context.prisma.product.findMany({
                    where,
                    skip: args?.skip as number | undefined,
                    take: args?.take as number | undefined,
                    orderBy: args?.orderBy as Prisma.Enumerable<Prisma.ProductOrderByWithRelationInput> | undefined
                });
                return productList;
            }
        })
        t.field("product", {
            type: "Product",
            args: {
                id: nonNull(intArg())
            },
            async resolve(parent, args, context) {
                return context.prisma.product.findUnique({
                    where: {
                        id: args.id
                    }
                });;
            }
        })
    }
})

export const ProductMutation = extendType({
    type: "Mutation",
    definition(t) {

        t.nonNull.field("addProduct", {
            type: "Product",
            description: "Admin only, Add a new product",
            args: {
                name: nonNull(stringArg()),
                description: stringArg(),
                price: nonNull(floatArg()),
                quantity: nonNull(intArg()),
            },
            authorize: (parent, args, context) => context.canAccess(context.userData, "CHIEF"),
            async resolve(parent, args, context) {
                try {
                    const { name, description, price, quantity } = args;

                    const newProduct = await context.prisma.product.create({
                        data: {
                            name: name,
                            description: description as string,
                            price: price,
                            quantity: quantity
                        }
                    })

                    return newProduct;
                } catch (error) {
                    throw new context.ErrorHandler(error as Error)
                }
            }
        })

        t.nonNull.field("updateProduct", {
            type: "Product",
            description: "Admin only, update a product",
            args: {
                filter: nonNull(ProductUpdateFilter),
                set: nonNull(ProductUpdateSet)
            },
            authorize: (parent, args, context) => context.canAccess(context.userData, "CHIEF"),
            async resolve(parent, args, context) {
                try {
                    const updatedProduct = await context.prisma.product.update({
                        where: args.filter,
                        data: {
                            ...args.set as object,
                            updatedAt: new Date()
                        }
                    })
                    return updatedProduct;
                } catch (error) {
                    throw new context.ErrorHandler(error as Error)
                }
            }
        })

        t.nonNull.field("removeProduct", {
            type: "Product",
            description: "Admin only, remove a product",
            args: {
                id: nonNull(intArg())
            },
            authorize: (parent, args, context) => context.canAccess(context.userData, "CHIEF"),
            async resolve(parent, args, context) {
                try {
                    const { id } = args;
                    const trash = await context.prisma.product.delete({
                        where: {
                            id
                        }
                    })
                    return trash;
                } catch (error) {
                    throw new context.ErrorHandler(error as Error)
                }
            }
        })
    }
})