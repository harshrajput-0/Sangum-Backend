import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import * as contactServices from "./contact.service.js";

export const sendMessage = asyncHandler(async (req, res) => {
  await contactServices.sendMessage(req.body);

  res.status(200).json(
    new ApiResponse(200, undefined, "Message sent successfully")
  );
});