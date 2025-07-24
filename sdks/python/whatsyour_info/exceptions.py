"""
Exceptions for What'sYour.Info SDK
"""


class WhatsYourInfoError(Exception):
    """Base exception for What'sYour.Info SDK"""
    pass


class AuthenticationError(WhatsYourInfoError):
    """Authentication related errors"""
    pass


class NotFoundError(WhatsYourInfoError):
    """Resource not found errors"""
    pass


class ValidationError(WhatsYourInfoError):
    """Input validation errors"""
    pass


class RateLimitError(WhatsYourInfoError):
    """Rate limit exceeded errors"""
    pass