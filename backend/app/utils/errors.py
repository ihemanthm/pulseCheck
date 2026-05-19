"""Custom exception classes for the application"""


class PulseCheckException(Exception):
    """Base exception for PulseCheck"""
    pass


class BolnaAPIError(PulseCheckException):
    """Raised when Bolna API returns an error"""
    pass


class S3UploadError(PulseCheckException):
    """Raised when S3 upload fails"""
    pass


class InvalidPhoneError(PulseCheckException):
    """Raised when phone number is invalid"""
    pass


class CSVParseError(PulseCheckException):
    """Raised when CSV parsing fails"""
    pass


class DuplicateOrderError(PulseCheckException):
    """Raised when trying to create duplicate order"""
    pass


class CallAlreadyExistsError(PulseCheckException):
    """Raised when trying to trigger call for order with active call"""
    pass


class UnauthorizedError(PulseCheckException):
    """Raised when user is not authorized"""
    pass


class NotFoundError(PulseCheckException):
    """Raised when resource is not found"""
    pass
