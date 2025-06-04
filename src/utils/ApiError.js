class ApiError extends Error{
    constructor(statusCode, message = "Something went wrong",errors = [],stack = ""){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

//export the ApiError class
// This class can be used to create custom error objects with a status code, message, and optional errors array.
export {ApiError}