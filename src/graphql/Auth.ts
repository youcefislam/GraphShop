import { extendType, nonNull, objectType, stringArg } from "nexus";
import * as bcrytp from "bcryptjs"
import * as jwt from "jsonwebtoken"
import { APP_SECRET } from "../utils/auth";

export const ClientAuthPayload = objectType({
    name: "ClientAuthPayload",
    description: "Type of the returned object after client authentication",
    definition(t) {
        t.nonNull.string("token")
        t.field("data", {
            type: "Client"
        })
    },
})

export const AdminAuthPayload = objectType({
    name: "AdminAuthPayload",
    definition(t) {
        t.nonNull.string("token")
    },
})

export const AuthMutation = extendType({
    type: "Mutation",
    definition(t) {
        t.nonNull.field("signIn", {
            type: "ClientAuthPayload",
            description: "Client only",
            args: {
                email: nonNull(stringArg()),
                password: nonNull(stringArg())
            },
            async resolve(parent, args, context) {
                try {
                    const { email } = args

                    // Check any account is linked to the email
                    const client = await context.prisma.client.findUnique({
                        where: {
                            email
                        }
                    })
                    if (!client) throw new Error("Client not found!", { cause: "Known" })

                    // Check the the passwords matches
                    const valid = await bcrytp.compare(args.password, client.password);
                    if (!valid) throw new Error("Password Incorrect!", { cause: "Known" })

                    // Generate token 
                    const token = jwt.sign({ clientId: client.id }, APP_SECRET)

                    return {
                        token,
                        client
                    }
                } catch (error) {
                    throw new context.ErrorHandler(error as Error)
                }
            }
        })

        t.nonNull.field("signup", {
            type: "ClientAuthPayload",
            description: "Client only",
            args: {
                email: nonNull(stringArg()),
                password: nonNull(stringArg())
            },
            async resolve(parent, args, context) {
                try {
                    const { email } = args;

                    // Hash password
                    const password = await bcrytp.hash(args.password, 10)

                    // Create a new client account
                    const client = await context.prisma.client.create({
                        data: {
                            email,
                            password
                        }
                    })

                    // Generate token
                    const token = jwt.sign({ clientId: client.id }, APP_SECRET);

                    return {
                        token,
                        client
                    }
                } catch (error) {
                    throw new context.ErrorHandler(error as Error)
                }
            }
        })

        t.nonNull.field("signInAdmin", {
            type: "AdminAuthPayload",
            description: "Admin only",
            args: {
                email: nonNull(stringArg()),
                password: nonNull(stringArg())
            },
            async resolve(parent, args, context) {
                try {
                    const { email } = args

                    // Check any account is linked to the email
                    const admin = await context.prisma.admin.findUnique({
                        where: {
                            email
                        }
                    })
                    if (!admin) throw new Error("Client not found!", { cause: "Known" })

                    // Check the the passwords matches
                    const valid = await bcrytp.compare(args.password, admin.password);
                    if (!valid) throw new Error("Password Incorrect!", { cause: "Known" })

                    // Generate token
                    const token = jwt.sign({ adminId: admin.id, isAdmin: true, role: admin.role }, APP_SECRET)

                    return {
                        token
                    }
                } catch (error) {
                    throw new context.ErrorHandler(error as Error)
                }
            }
        })
    }
})
