"""
What'sYour.Info Python SDK

Official Python SDK for What'sYour.Info API
"""

from .client import WhatsYourInfoSDK
from .exceptions import WhatsYourInfoError, AuthenticationError, NotFoundError
from .types import PublicProfile, AuthUser, LoginResponse

__version__ = "1.0.0"
__all__ = [
    "WhatsYourInfoSDK",
    "WhatsYourInfoError",
    "AuthenticationError", 
    "NotFoundError",
    "PublicProfile",
    "AuthUser",
    "LoginResponse"
]