import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/db.configs.js'
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import showRouter from './routes/show.routes.js'
import bookingRouter from './routes/booking.routes.js'
import adminRouter from './routes/admin.routes.js'
import userRouter from './routes/user.routes.js'

const app = express()
const port=3000


await connectDB();

//middleware
app.use(express.json())
app.use(cors())
app.use(clerkMiddleware())

//api routes
app.get('/',(req,res)=> res.send('Server Is Live!'))
app.use('/api/inngest',serve({ client: inngest, functions }))
app.use('/api/show',showRouter)
app.use('/api/booking',bookingRouter)
app.use('/api/admin',adminRouter)
app.use('/api/user',userRouter)

app.listen(port,()=> console.log(`Server listening at http://localhost:${port}`))


