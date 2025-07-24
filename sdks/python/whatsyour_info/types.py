from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime


@dataclass
class SocialLinks:
    twitter: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None


@dataclass
class SpotlightButton:
    text: str
    url: str
    color: str


@dataclass
class PublicProfile:
    username: str
    firstName: str
    lastName: str
    bio: str
    avatar: str
    isProUser: bool
    profileUrl: str
    subdomainUrl: str
    createdAt: str
    customDomain: Optional[str] = None
    socialLinks: Optional[Dict[str, str]] = None
    spotlightButton: Optional[Dict[str, str]] = None
    
    def __post_init__(self):
        if self.socialLinks:
            self.socialLinks = SocialLinks(**self.socialLinks)
        if self.spotlightButton:
            self.spotlightButton = SpotlightButton(**self.spotlightButton)


@dataclass
class AuthUser:
    _id: str
    email: str
    username: str
    firstName: str
    lastName: str
    isProUser: bool


@dataclass
class LoginResponse:
    message: str
    user: Dict[str, Any]
    token: Optional[str] = None
    
    def __post_init__(self):
        self.user = AuthUser(**self.user)