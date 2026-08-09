import { Router } from "express";
import { validate } from "../../middlewares/validation.middleware.js";
import { contactSchema } from "./contact.validation.js";
import * as contactController from "./contact.controllers.js"

const router = Router();


router.post(
  "/contact",
  validate(contactSchema),
  contactController.sendMessage
);


export default router;