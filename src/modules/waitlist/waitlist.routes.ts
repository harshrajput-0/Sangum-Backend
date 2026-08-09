import { Router } from "express";
import { validate } from "../../middlewares/validation.middleware.js";
import { waitlistSchema } from "./waitlist.validation.js";
import * as waitlistController from "./waitlist.controller.js"

const router = Router();


router.post(
  "/waitlist",
  validate(waitlistSchema),
  waitlistController.joinWaitlist
);


export default router;