import { handleErrorResponse } from "../helpers/handleResponse.js";

export const errorHandler = (err, req, res, next) => {
    if (err instanceof BadRequestError){
        err.code = 400;
    }
    else if (err instanceof ForbiddenError){
        err.code = 403;
    }
    else if (err instanceof UnAuthorizedError){
        err.code = 401;
    }
    else if (err instanceof NotFoundError){
        err.code = 404;
    }
    else{
        err.code = 500;
    }

    const resError = handleErrorResponse(err.code, err.message);
    res.status(resError.code).json(resError)
};

export class BadRequestError extends Error{
    constructor(message = "BadRequestError"){
        super(message);
        this.code = 400
    }
}

export class ForbiddenError extends Error{
    constructor(message = "ForbiddenError"){
        super(message);
        this.code = 403;
    }
}

export class UnAuthorizedError extends Error{
    constructor(message = "UnAuthorizedError"){
        super(message);
        this.code = 401;
    }
}

export class NotFoundError extends Error{
    constructor(message = "NotFoundError"){
        super(message);
        this.code = 404;
    }
}

export class InternalServerError extends Error{
    constructor(message = "InternalServerError"){
        super(message);
        this.code = 500;
    }
}