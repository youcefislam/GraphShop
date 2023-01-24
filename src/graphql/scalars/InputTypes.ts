import { enumType, inputObjectType } from "nexus"

export const CartUpdateFilter = inputObjectType({
    name: "CartUpdateFilter",
    definition(t) {
        t.nonNull.int("productId")
    },
})

export const CartUpdateSet = inputObjectType({
    name: "CartUpdateSet",
    definition(t) {
        t.nonNull.int("quantity")
    },
})

export const ClientOrderByInput = inputObjectType({
    name: "ClientOrderByInput",
    definition(t) {
        t.field("email", { type: Sort })
    },
})

export const SalesHisOrderByInput = inputObjectType({
    name: "SalesHisOrderByInput",
    definition(t) {
        t.field("total", { type: Sort })
        t.field("quantity", { type: Sort })
        t.field("date", { type: Sort })
    },
})

export const ProductOrderByInput = inputObjectType({
    name: "ProductOrderByInput",
    definition(t) {
        t.field("name", { type: Sort })
        t.field("price", { type: Sort })
        t.field("quantity", { type: Sort })
        t.field("createdAt", { type: Sort })
    },
})

export const Sort = enumType({
    name: "Sort",
    members: ["asc", "desc"]
})