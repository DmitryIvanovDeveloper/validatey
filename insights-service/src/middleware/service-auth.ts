import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

const HEADER_NAME = "x-service-token";

export function requireServiceAuth(req: Request, res: Response, next: NextFunction): void {
  const incomingToken = req.header(HEADER_NAME);
  if (!incomingToken || incomingToken !== env.INTERNAL_SERVICE_TOKEN) {
    res.status(401).json({
      error: "Unauthorized service call",
      hint: `Pass ${HEADER_NAME} header`,
    });
    return;
  }
  next();
}
