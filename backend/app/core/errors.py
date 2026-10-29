from typing import Any, Dict, Optional
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.logging import logger


class AppException(Exception):
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        message: str = "An unexpected error occurred",
        code: str = "INTERNAL_SERVER_ERROR",
        details: Optional[Any] = None,
    ):
        self.status_code = status_code
        self.message = message
        self.code = code
        self.details = details
        super().__init__(message)


class AuthenticationError(AppException):
    def __init__(self, message: str = "Authentication required", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            message=message,
            code="UNAUTHORIZED",
            details=details,
        )


class ForbiddenError(AppException):
    def __init__(self, message: str = "Access denied for this resource", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            message=message,
            code="FORBIDDEN",
            details=details,
        )


class NotFoundError(AppException):
    def __init__(self, message: str = "Requested resource was not found", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            message=message,
            code="NOT_FOUND",
            details=details,
        )


class ConflictError(AppException):
    def __init__(self, message: str = "Resource conflict detected", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            message=message,
            code="CONFLICT",
            details=details,
        )


class PayloadTooLargeError(AppException):
    def __init__(self, message: str = "Payload exceeds maximum allowed size", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            message=message,
            code="PAYLOAD_TOO_LARGE",
            details=details,
        )


class UnsupportedMediaTypeError(AppException):
    def __init__(self, message: str = "Unsupported media type", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            message=message,
            code="UNSUPPORTED_MEDIA_TYPE",
            details=details,
        )


class RateLimitError(AppException):
    def __init__(self, message: str = "Rate limit exceeded. Please try again later.", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            details=details,
        )


class BadGatewayError(AppException):
    def __init__(self, message: str = "External service unavailable or returned an error", details: Optional[Any] = None):
        super().__init__(
            status_code=status.HTTP_502_BAD_GATEWAY,
            message=message,
            code="BAD_GATEWAY",
            details=details,
        )


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException):
        logger.warning(f"AppException: [{exc.code}] {exc.message} on {request.method} {request.url.path}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                }
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.info(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")
        return JSONResponse(
            status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Input validation failed",
                    "details": exc.errors(),
                }
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected internal server error occurred",
                }
            },
        )
