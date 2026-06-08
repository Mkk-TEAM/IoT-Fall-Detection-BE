export const handleSuccessResponse = (
  code = 200,
  message = "Xử lý thành công",
  data = null,
) => ({
  success: true,
  code,
  message,
  data,
});

export const handleErrorResponse = (
  code = 500,
  message = "Internal Server Error",
  errorCode = "INTERNAL_SERVER_ERROR",
  details = null,
) => {
  const response = {
    success: false,
    code,
    error: {
      code: errorCode,
      message,
    },
  };

  if (details !== null && details !== undefined) {
    response.error.details = details;
  }

  return response;
};
