import express from "express";
import { createHandler } from "graphql-http/lib/use/express";
import cors from "cors"

import { context } from "./context";
import { schema } from "./schema";

const app = express();

app.use(cors())

app.all("/graphql", createHandler({ schema, context }))


const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server start listening at http://localhost:${PORT}`);
})

