import express from "express";
import authRouter from "./auth.router.js";

const rootRouter = express.Router();    

rootRouter.use('/auth', authRouter);

export default rootRouter;
