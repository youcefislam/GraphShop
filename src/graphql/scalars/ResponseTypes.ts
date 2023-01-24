import { objectType } from "nexus"

export const ReturnMessage = objectType({
    name: "ReturnMessage",
    definition(t) {
        t.nonNull.string("message")
    },
})