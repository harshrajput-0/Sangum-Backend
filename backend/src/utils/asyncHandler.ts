import { Request, Response, NextFunction } from "express";

type AsyncFn = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any>;


const asyncHandler = (requestHandler: AsyncFn) => (    req: Request,
    res: Response,
    next: NextFunction)=>{
        Promise.resolve(requestHandler(req, res, next).catch(next));
    };


    export default asyncHandler
