import { Cart, Product } from "@prisma/client";
import { objectType, extendType, nonNull, intArg } from "nexus";

export const CartElement = objectType({
    name: "CartElement",
    definition(t) {
        t.nonNull.int("quantity")
        t.nonNull.dateTime("addedAt")
        t.nonNull.dateTime("updatedAt")
        t.nonNull.int("clientId")
        t.nonNull.int("productId")
        t.field("product", {
            type: "Product",
            resolve(parent, args, context) {
                return context.prisma.cart.findUnique({
                    where: {
                        clientId_productId: {
                            clientId: parent.clientId,
                            productId: parent.productId
                        }
                    }
                }).product();
            }
        })
    },
})

export const PurchasesElement = objectType({
    name: "PurchasesElement",
    description: "Type of purchases list element",
    definition(t) {
        t.dateTime("addedAt")
        t.dateTime("updatedAt")
        t.int("clientIt")
        t.int("productId")
        t.int("quantity")
        t.field("product", { type: "Product" })
        t.nonNull.int("total")
    },
})

export const Receipt = objectType({
    name: "Receipt",
    description: "Type of receipt containing information about what client bought",
    definition(t) {
        t.nonNull.string("message");
        t.nonNull.float("total");
        t.nonNull.float("totalDebt");
        t.nonNull.list.nonNull.field("purchases", {
            type: "PurchasesElement"
        })
    },
})



export const CartQuery = extendType({
    type: "Query",
    definition(t) {
        t.list.nonNull.field("myCart", {
            type: "CartElement",
            description: "Client only, return all the products in the client's cart",
            authorize: (parent, args, context) => context.canAccess(context.userData),
            async resolve(parent, args, context) {
                const { clientId } = context.userData;

                return context.prisma.cart.findMany({
                    where: {
                        clientId
                    }
                });
            }
        })
    }
})

export const CartMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("addToCart", {
            type: "CartElement",
            description: "Client only, add a product to client's cart",
            args: {
                productId: nonNull(intArg()),
                quantity: nonNull(intArg())
            },
            authorize: (parent, args, context) => context.canAccess(context.userData),
            async resolve(parent, args, context) {
                try {
                    const { clientId } = context.userData;
                    const { productId, quantity } = args;

                    // Validate the requested quantity
                    if (quantity < 1 || quantity > 5) throw new Error("Invalid Quantity (1~5)", { cause: "Known" })

                    // Check the availability of the quantity 
                    const product = await context.prisma.product.findUnique({
                        where: {
                            id: productId
                        }
                    })
                    if (!product) throw new Error("Product not found!", { cause: "Known" })
                    if (product.quantity < quantity) throw new Error("Insufficient Qty in stock!", { cause: "Known" })

                    // Check the client' cart
                    const cart = await context.prisma.cart.findMany({
                        where: {
                            clientId
                        }
                    });
                    if (cart.length > 5) throw new Error("Cart is full!", { cause: "Known" });
                    if (cart.find(record => record.productId === productId)) throw new Error("Product already in cart", { cause: "Known" })

                    // Reserve the quantity for the client
                    const [updatedProduct, cartElement] = await context.prisma.$transaction([
                        context.prisma.product.update({
                            where: {
                                id: productId
                            },
                            data: {
                                quantity: { decrement: quantity },
                            }
                        })
                        ,
                        context.prisma.cart.create({
                            data: {
                                clientId: clientId as number,
                                productId,
                                quantity,
                            }
                        })
                    ])

                    // After approximately 5 minutes, we cancel the reserved quantity if its not bought
                    // Canceling the timer when the client buy the product can be implemented
                    setTimeout(() => {
                        try {
                            return context.prisma.$transaction([
                                context.prisma.product.update({
                                    where: {
                                        id: productId
                                    },
                                    data: {
                                        quantity: { increment: quantity }
                                    }
                                }),
                                context.prisma.cart.delete({
                                    where: {
                                        clientId_productId: {
                                            clientId: clientId as number,
                                            productId
                                        }
                                    }
                                })
                            ])
                        } catch (error) {
                            // Report failure
                            console.log(`Cart entity C-${clientId}:${productId} auto-deletion failed`, error);
                        }
                    }, 5 * 60 * 1000);

                    return cartElement;
                } catch (error) {
                    throw new context.ErrorHandler(error as Error)
                }
            }
        })

        t.list.nonNull.field("removeFromCart", {
            type: "CartElement",
            description: "Client only, remove a product from the client's cart",
            args: {
                productId: nonNull(intArg())
            },
            authorize: (parent, args, context) => context.canAccess(context.userData),
            async resolve(parent, args, context) {
                try {
                    const { clientId } = context.userData;
                    const { productId } = args

                    // Cancel the product reservation
                    await context.prisma.$transaction(async (tx) => {
                        const cartElement = await tx.cart.delete({
                            where: {
                                clientId_productId: {
                                    productId,
                                    clientId: clientId as number
                                }
                            }
                        })

                        await tx.product.update({
                            where: {
                                id: productId
                            },
                            data: {
                                quantity: { increment: cartElement.quantity }
                            }
                        })
                    })


                    return context.prisma.cart.findMany({
                        where: {
                            clientId: clientId
                        }
                    })
                } catch (error) {
                    throw new context.ErrorHandler(error as Error)
                }

            }
        })

        t.nonNull.field("updateCart", {
            type: "CartElement",
            description: "Client only, update product in client's cart, by overwriting the reserved quantity",
            args: {
                filter: nonNull("CartUpdateFilter"),
                set: nonNull("CartUpdateSet")
            },
            authorize: (parent, args, context) => context.canAccess(context.userData),
            async resolve(parent, args, context) {
                try {
                    const id = context.userData.clientId;
                    const { filter, set } = args;

                    // Validate the requested quantity
                    if (set.quantity < 1 || set.quantity > 5) throw new Error("Invalid Quantity (1~5)", { cause: "Known" })

                    // Check the client' cart
                    const cartElement = await context.prisma.cart.findUnique({
                        where: {
                            clientId_productId: {
                                clientId: id as number,
                                productId: filter.productId
                            }
                        }
                    })
                    if (!cartElement) throw new Error("Product not in your cart", { cause: "Known" })

                    // Set the update op data
                    const update = { quantity: {} }
                    const diff = cartElement.quantity - set.quantity

                    if (diff > 0) Object.assign(update, { quantity: { increment: diff } })
                    else if (diff < 0) Object.assign(update, { quantity: { decrement: Math.abs(diff) } })
                    else throw new Error("Old and new quantity are equal", { cause: "Known" })

                    // Update the cart and the product
                    const [productUpdate, cartUpdate] = await context.prisma.$transaction(
                        [
                            context.prisma.product.update({
                                where: {
                                    id: filter.productId
                                },
                                data: update
                            })
                            ,
                            context.prisma.cart.update({
                                where: {
                                    clientId_productId: {
                                        productId: filter.productId,
                                        clientId: id as number
                                    }
                                }, data: { quantity: set.quantity, updatedAt: new Date() }
                            })
                        ]
                    )
                    return cartUpdate
                } catch (error) {
                    throw new context.ErrorHandler(error as Error)
                }
            }
        })

        t.field("clearCart", {
            type: "ReturnMessage",
            description: "Client only, clear the client's cart",
            authorize: (parent, args, context) => context.canAccess(context.userData),
            async resolve(parent, args, context) {
                try {
                    const clientId = context.userData.clientId;

                    const cart = await context.prisma.cart.findMany({
                        where: {
                            clientId
                        }
                    })

                    // Cancel the reserved quantity
                    await context.prisma.$transaction(async (tx) => {
                        cart.forEach((cartElement) => {
                            return tx.product.update({
                                where: {
                                    id: cartElement.productId
                                },
                                data: {
                                    quantity: { increment: cartElement.quantity }
                                }
                            })
                        })

                        await tx.cart.deleteMany({
                            where: {
                                clientId
                            }
                        })
                    })

                    return {
                        message: "Cart cleared!"
                    }
                } catch (error) {
                    throw new context.ErrorHandler(error as Error)
                }
            }
        })

        t.field("buyCart", {
            type: "Receipt",
            description: "Client only, buy all the products in the client's cart",
            authorize: (parent, args, context) => context.canAccess(context.userData),
            async resolve(parent, args, context) {
                try {

                    const { clientId } = context.userData;
                    let totalPrice = 0;

                    // Check the cart' content
                    let cartList = await context.prisma.cart.findMany({
                        where: {
                            clientId: clientId as number
                        },
                        include: {
                            product: true
                        }
                    })
                    if (cartList.length === 0) throw new Error("Cart is empty!", { cause: "Known" })

                    // Calculate the total for each cart product
                    const cartListWithTotal = cartList.map((element) => {
                        const price = element.quantity * element.product.price;
                        totalPrice += price;
                        Object.assign(element, { total: price })
                        return element
                    }) as Array<Cart & { product: Product, total: number }>


                    // Apply the changes
                    const [cartCount, salesCount, client] = await context.prisma.$transaction([
                        context.prisma.cart.deleteMany({
                            where: {
                                clientId: clientId
                            }
                        }),
                        context.prisma.sales_history.createMany({
                            data: cartListWithTotal.map((p) => ({
                                clientId: p.clientId,
                                productId: p.productId,
                                quantity: p.quantity,
                                total: p.total
                            }))
                        }),
                        context.prisma.client.update({
                            where: {
                                id: clientId
                            },
                            data: {
                                debt: { increment: totalPrice }
                            }
                        })
                    ])

                    return {
                        message: "Purchase Done!",
                        total: totalPrice,
                        totalDebt: client.debt,
                        purchases: cartListWithTotal
                    }
                } catch (error) {
                    throw new context.ErrorHandler(error as Error)
                }
            }
        })
    }
})