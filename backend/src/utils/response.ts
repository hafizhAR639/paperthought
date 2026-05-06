import { Response } from 'express';

export function successResponse(res: Response, data: any, message = 'Success', statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function errorResponse(res: Response, error: string, statusCode = 400) {
  res.status(statusCode).json({
    success: false,
    error,
  });
}

export class AppError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'AppError';
  }
}
