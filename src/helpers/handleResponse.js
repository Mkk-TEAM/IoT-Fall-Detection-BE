export const handleSuccessResponse = (
    code = 200,
    message = "Xử lý thành công",
    meta = null
) => {
    return {
        status: "Success",
        code,
        message,
        meta
    }
};

export const handleErrorResponse = (
    code = 500,
    message = "Interal Server Error"
) => {
    return {
        status: "error",
        code,
        message
    }
}