<?php

namespace WhatsYourInfo;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Exception\RequestException;
use WhatsYourInfo\Exceptions\WhatsYourInfoException;
use WhatsYourInfo\Exceptions\AuthenticationException;
use WhatsYourInfo\Exceptions\NotFoundException;

/**
 * What'sYour.Info PHP SDK Client
 */
class Client
{
    private string $apiKey;
    private string $baseUrl;
    private HttpClient $httpClient;

    /**
     * Create a new SDK client
     *
     * @param array $config Configuration options
     */
    public function __construct(array $config = [])
    {
        $this->apiKey = $config['api_key'] ?? '';
        $this->baseUrl = rtrim($config['base_url'] ?? 'https://whatsyour.info/api', '/');
        
        $headers = [
            'Content-Type' => 'application/json',
            'User-Agent' => 'whatsyour-info-php/1.0.0',
        ];

        if ($this->apiKey) {
            $headers['Authorization'] = 'Bearer ' . $this->apiKey;
        }

        $this->httpClient = new HttpClient([
            'base_uri' => $this->baseUrl,
            'timeout' => $config['timeout'] ?? 10,
            'headers' => $headers,
        ]);
    }

    /**
     * Get public profile by username
     *
     * @param string $username
     * @return array
     * @throws WhatsYourInfoException
     */
    public function getProfile(string $username): array
    {
        try {
            $response = $this->httpClient->get("/public/profile/{$username}");
            return json_decode($response->getBody()->getContents(), true);
        } catch (RequestException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Search public profiles
     *
     * @param string $query
     * @param int $limit
     * @return array
     * @throws WhatsYourInfoException
     */
    public function searchProfiles(string $query, int $limit = 10): array
    {
        try {
            $response = $this->httpClient->get('/public/search', [
                'query' => [
                    'q' => $query,
                    'limit' => $limit,
                ]
            ]);
            
            $data = json_decode($response->getBody()->getContents(), true);
            return $data['profiles'] ?? [];
        } catch (RequestException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Authenticate user with email and password
     *
     * @param string $email
     * @param string $password
     * @return array
     * @throws WhatsYourInfoException
     */
    public function authenticateUser(string $email, string $password): array
    {
        $this->requireApiKey();

        try {
            $response = $this->httpClient->post('/auth/login', [
                'json' => [
                    'email' => $email,
                    'password' => $password,
                ]
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (RequestException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Verify authentication token
     *
     * @param string $token
     * @return array
     * @throws WhatsYourInfoException
     */
    public function verifyToken(string $token): array
    {
        $this->requireApiKey();

        try {
            $response = $this->httpClient->get('/auth/verify', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return $data['user'] ?? [];
        } catch (RequestException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Get authenticated user's profile
     *
     * @param string $token
     * @return array
     * @throws WhatsYourInfoException
     */
    public function getUserProfile(string $token): array
    {
        $this->requireApiKey();

        try {
            $response = $this->httpClient->get('/auth/user', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token,
                ]
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            return $data['user'] ?? [];
        } catch (RequestException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Create OAuth authorization URL
     *
     * @param string $clientId
     * @param string $redirectUri
     * @param string|null $state
     * @return string
     */
    public function createOAuthUrl(string $clientId, string $redirectUri, ?string $state = null): string
    {
        $params = [
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'profile email',
        ];

        if ($state) {
            $params['state'] = $state;
        }

        return 'https://whatsyour.info/oauth/authorize?' . http_build_query($params);
    }

    /**
     * Exchange authorization code for access token
     *
     * @param string $clientId
     * @param string $clientSecret
     * @param string $code
     * @param string $redirectUri
     * @return array
     * @throws WhatsYourInfoException
     */
    public function exchangeCodeForToken(
        string $clientId,
        string $clientSecret,
        string $code,
        string $redirectUri
    ): array {
        try {
            $response = $this->httpClient->post('/oauth/token', [
                'json' => [
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'code' => $code,
                    'redirect_uri' => $redirectUri,
                    'grant_type' => 'authorization_code',
                ]
            ]);

            return json_decode($response->getBody()->getContents(), true);
        } catch (RequestException $e) {
            $this->handleException($e);
        }
    }

    /**
     * Generate profile URL for username
     *
     * @param string $username
     * @return string
     */
    public static function generateProfileUrl(string $username): string
    {
        return "https://whatsyour.info/{$username}";
    }

    /**
     * Generate subdomain URL for username
     *
     * @param string $username
     * @return string
     */
    public static function generateSubdomainUrl(string $username): string
    {
        return "https://{$username}.whatsyour.info";
    }

    /**
     * Generate avatar URL for username
     *
     * @param string $username
     * @param int $size
     * @return string
     */
    public static function generateAvatarUrl(string $username, int $size = 200): string
    {
        return "https://whatsyour.info/api/avatars/{$username}?size={$size}";
    }

    /**
     * Require API key for operation
     *
     * @throws AuthenticationException
     */
    private function requireApiKey(): void
    {
        if (empty($this->apiKey)) {
            throw new AuthenticationException(
                'API key is required for this operation. Get your API key at https://whatsyour.info/dev'
            );
        }
    }

    /**
     * Handle HTTP exceptions
     *
     * @param RequestException $e
     * @throws WhatsYourInfoException
     */
    private function handleException(RequestException $e): void
    {
        $response = $e->getResponse();
        
        if ($response) {
            $statusCode = $response->getStatusCode();
            $body = $response->getBody()->getContents();
            $data = json_decode($body, true);
            $message = $data['error'] ?? $e->getMessage();

            switch ($statusCode) {
                case 401:
                    throw new AuthenticationException($message);
                case 404:
                    throw new NotFoundException($message);
                default:
                    throw new WhatsYourInfoException($message);
            }
        }

        throw new WhatsYourInfoException($e->getMessage());
    }
}