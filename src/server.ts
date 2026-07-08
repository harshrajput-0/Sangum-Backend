import { env } from "./config/env.js";

import app from "./app.js"
import connectDB from "./config/db.js";


await connectDB();


const PORT = env.PORT;

app.listen(PORT, () => {
    console.log(`Server is Running on PORT ${PORT}`)
})