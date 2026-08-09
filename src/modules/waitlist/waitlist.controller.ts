import { Request, Response } from "express";
import { Waitlist } from "./waitlist.model.js";
import asyncHandler from "../../utils/asyncHandler.js";

export const joinWaitlist = asyncHandler( async(req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if(!email){
            return res.status(400).json({messsage: "Email is missing"});
        }

        const existing = await Waitlist.findOne({ email });

        if(existing) {
            return res.status(400).json({ message: "This Email already exist in waitlist"});
        }

        await Waitlist.create({ email });

        return res.status(200).json({
            message: "Successfully joined the waitlist"
        })


    } catch (error) {
        console.error(error);

        return res.status(500).json({ message: "Something went wrond" });
    }
})