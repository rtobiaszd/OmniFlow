import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[Error] ${statusCode} - ${message}`);
  if (err.stack) console.error(err.stack);

  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};
