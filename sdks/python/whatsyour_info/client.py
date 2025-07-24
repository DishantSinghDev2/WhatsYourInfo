import requests
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode

from .exceptions import WhatsYourInfoError, AuthenticationError, NotFoundError
from .types import PublicProfile, AuthUser, LoginResponse


class WhatsYourInfoSDK:
    """Official Python SDK for What'sYour.Info API"""
    
    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://whatsyour.info/api",
        timeout: int = 10
    ):
        """
        Initialize the SDK
        
        Args:
            api_key: Your API key from https://whatsyour.info/dev
            base_url: Base URL for the API
            timeout: Request timeout in seconds
        """
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'whatsyour-info-python/1.0.0'
        })
        
        if self.api_key:
            self.session.headers['Authorization'] = f'Bearer {self.api_key}'
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """Make HTTP request to API"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        request_headers = self.session.headers.copy()
        if headers:
            request_headers.update(headers)
        
        try:
            response = requests.request(
                method=method,
                url=url,
                json=data,
                params=params,
                headers=request_headers,
                timeout=self.timeout
            )
            
            if response.status_code == 404:
                raise NotFoundError("Resource not found")
            elif response.status_code == 401:
                raise AuthenticationError("Authentication failed")
            elif not response.ok:
                error_data = response.json() if response.content else {}
                raise WhatsYourInfoError(
                    error_data.get('error', f'HTTP {response.status_code}')
                )
            
            return response.json()
            
        except requests.exceptions.RequestException as e:
            raise WhatsYourInfoError(f"Request failed: {str(e)}")
    
    # Public API Methods
    def get_profile(self, username: str) -> PublicProfile:
        """
        Get public profile by username
        
        Args:
            username: The username to fetch
            
        Returns:
            PublicProfile object
        """
        data = self._make_request('GET', f'/public/profile/{username}')
        return PublicProfile(**data)
    
    def search_profiles(self, query: str, limit: int = 10) -> List[PublicProfile]:
        """
        Search public profiles
        
        Args:
            query: Search query
            limit: Maximum number of results
            
        Returns:
            List of PublicProfile objects
        """
        params = {'q': query, 'limit': limit}
        data = self._make_request('GET', '/public/search', params=params)
        return [PublicProfile(**profile) for profile in data['profiles']]
    
    # Authentication Methods
    def authenticate_user(self, email: str, password: str) -> LoginResponse:
        """
        Authenticate user with email and password
        
        Args:
            email: User's email
            password: User's password
            
        Returns:
            LoginResponse object
        """
        self._require_api_key()
        
        data = self._make_request('POST', '/auth/login', {
            'email': email,
            'password': password
        })
        return LoginResponse(**data)
    
    def verify_token(self, token: str) -> AuthUser:
        """
        Verify authentication token
        
        Args:
            token: JWT token to verify
            
        Returns:
            AuthUser object
        """
        self._require_api_key()
        
        headers = {'Authorization': f'Bearer {token}'}
        data = self._make_request('GET', '/auth/verify', headers=headers)
        return AuthUser(**data['user'])
    
    def get_user_profile(self, token: str) -> AuthUser:
        """
        Get authenticated user's profile
        
        Args:
            token: JWT token
            
        Returns:
            AuthUser object
        """
        self._require_api_key()
        
        headers = {'Authorization': f'Bearer {token}'}
        data = self._make_request('GET', '/auth/user', headers=headers)
        return AuthUser(**data['user'])
    
    # OAuth Methods
    def create_oauth_url(
        self,
        client_id: str,
        redirect_uri: str,
        state: Optional[str] = None
    ) -> str:
        """
        Create OAuth authorization URL
        
        Args:
            client_id: OAuth client ID
            redirect_uri: Redirect URI after authorization
            state: Optional state parameter
            
        Returns:
            Authorization URL
        """
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'response_type': 'code',
            'scope': 'profile email'
        }
        
        if state:
            params['state'] = state
        
        return f"https://whatsyour.info/oauth/authorize?{urlencode(params)}"
    
    def exchange_code_for_token(
        self,
        client_id: str,
        client_secret: str,
        code: str,
        redirect_uri: str
    ) -> Dict[str, Any]:
        """
        Exchange authorization code for access token
        
        Args:
            client_id: OAuth client ID
            client_secret: OAuth client secret
            code: Authorization code
            redirect_uri: Redirect URI
            
        Returns:
            Token response with access_token and user data
        """
        data = self._make_request('POST', '/oauth/token', {
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        })
        return data
    
    # Utility Methods
    def _require_api_key(self) -> None:
        """Ensure API key is set"""
        if not self.api_key:
            raise AuthenticationError(
                "API key is required for this operation. "
                "Get your API key at https://whatsyour.info/dev"
            )
    
    @staticmethod
    def generate_profile_url(username: str) -> str:
        """Generate profile URL for username"""
        return f"https://whatsyour.info/{username}"
    
    @staticmethod
    def generate_subdomain_url(username: str) -> str:
        """Generate subdomain URL for username"""
        return f"https://{username}.whatsyour.info"
    
    @staticmethod
    def generate_avatar_url(username: str, size: int = 200) -> str:
        """Generate avatar URL for username"""
        return f"https://whatsyour.info/api/avatars/{username}?size={size}"