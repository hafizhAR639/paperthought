export function errorHandler(
  error: any,
  _req: any,
  res: any,
  _next: any,
) {
  console.error('Error:', error);

  if (error.status) {
    return res.status(error.status).json({
      success: false,
      error: error.message,
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}

export function notFoundHandler(_req: any, res: any) {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
}
