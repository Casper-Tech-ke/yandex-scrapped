import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scrapeRouter from "./scrape";
import streamRouter from "./stream";

const router: IRouter = Router();

router.use(healthRouter);
router.use(scrapeRouter);
router.use(streamRouter);

export default router;
