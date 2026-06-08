export function handleSuccessResponse(data = null, message = "Request processed successfully", meta = undefined) {
  const response = {
    success: true,
    data,
    message,
  };

  if (meta !== undefined) {
    response.meta = meta;
  }

  return response;
}

export function handleErrorResponse(code = "INTERNAL_SERVER_ERROR", message = "Internal server error", details = undefined) {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details !== undefined) {
    response.error.details = details;
  }

  return response;
}
