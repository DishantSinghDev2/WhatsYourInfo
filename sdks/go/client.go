package whatsyourinfo

import (
	"encoding/json"
	"fmt"
	"net/url"
	"time"

	"github.com/go-resty/resty/v2"
)

// Client represents the What'sYour.Info SDK client
type Client struct {
	apiKey  string
	baseURL string
	client  *resty.Client
}

// Config holds configuration for the SDK client
type Config struct {
	APIKey  string
	BaseURL string
	Timeout time.Duration
}

// NewClient creates a new What'sYour.Info SDK client
func NewClient(config Config) *Client {
	if config.BaseURL == "" {
		config.BaseURL = "https://whatsyour.info/api"
	}
	if config.Timeout == 0 {
		config.Timeout = 10 * time.Second
	}

	client := resty.New().
		SetBaseURL(config.BaseURL).
		SetTimeout(config.Timeout).
		SetHeader("Content-Type", "application/json").
		SetHeader("User-Agent", "whatsyour-info-go/1.0.0")

	if config.APIKey != "" {
		client.SetAuthToken(config.APIKey)
	}

	return &Client{
		apiKey:  config.APIKey,
		baseURL: config.BaseURL,
		client:  client,
	}
}

// GetProfile fetches a public profile by username
func (c *Client) GetProfile(username string) (*PublicProfile, error) {
	var profile PublicProfile
	
	resp, err := c.client.R().
		SetResult(&profile).
		SetError(&APIError{}).
		Get(fmt.Sprintf("/public/profile/%s", username))

	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.IsError() {
		if apiErr, ok := resp.Error().(*APIError); ok {
			return nil, fmt.Errorf("API error: %s", apiErr.Error)
		}
		return nil, fmt.Errorf("HTTP error: %s", resp.Status())
	}

	return &profile, nil
}

// SearchProfiles searches for public profiles
func (c *Client) SearchProfiles(query string, limit int) ([]PublicProfile, error) {
	var result struct {
		Profiles []PublicProfile `json:"profiles"`
	}

	resp, err := c.client.R().
		SetQueryParams(map[string]string{
			"q":     query,
			"limit": fmt.Sprintf("%d", limit),
		}).
		SetResult(&result).
		SetError(&APIError{}).
		Get("/public/search")

	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.IsError() {
		if apiErr, ok := resp.Error().(*APIError); ok {
			return nil, fmt.Errorf("API error: %s", apiErr.Error)
		}
		return nil, fmt.Errorf("HTTP error: %s", resp.Status())
	}

	return result.Profiles, nil
}

// AuthenticateUser authenticates a user with email and password
func (c *Client) AuthenticateUser(email, password string) (*LoginResponse, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("API key is required for this operation")
	}

	var response LoginResponse
	
	resp, err := c.client.R().
		SetBody(map[string]string{
			"email":    email,
			"password": password,
		}).
		SetResult(&response).
		SetError(&APIError{}).
		Post("/auth/login")

	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.IsError() {
		if apiErr, ok := resp.Error().(*APIError); ok {
			return nil, fmt.Errorf("authentication failed: %s", apiErr.Error)
		}
		return nil, fmt.Errorf("HTTP error: %s", resp.Status())
	}

	return &response, nil
}

// VerifyToken verifies an authentication token
func (c *Client) VerifyToken(token string) (*AuthUser, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("API key is required for this operation")
	}

	var result struct {
		User AuthUser `json:"user"`
	}

	resp, err := c.client.R().
		SetAuthToken(token).
		SetResult(&result).
		SetError(&APIError{}).
		Get("/auth/verify")

	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.IsError() {
		if apiErr, ok := resp.Error().(*APIError); ok {
			return nil, fmt.Errorf("token verification failed: %s", apiErr.Error)
		}
		return nil, fmt.Errorf("HTTP error: %s", resp.Status())
	}

	return &result.User, nil
}

// GetUserProfile gets authenticated user's profile
func (c *Client) GetUserProfile(token string) (*AuthUser, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("API key is required for this operation")
	}

	var result struct {
		User AuthUser `json:"user"`
	}

	resp, err := c.client.R().
		SetAuthToken(token).
		SetResult(&result).
		SetError(&APIError{}).
		Get("/auth/user")

	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.IsError() {
		if apiErr, ok := resp.Error().(*APIError); ok {
			return nil, fmt.Errorf("failed to get user profile: %s", apiErr.Error)
		}
		return nil, fmt.Errorf("HTTP error: %s", resp.Status())
	}

	return &result.User, nil
}

// CreateOAuthURL creates an OAuth authorization URL
func (c *Client) CreateOAuthURL(clientID, redirectURI, state string) string {
	params := url.Values{}
	params.Set("client_id", clientID)
	params.Set("redirect_uri", redirectURI)
	params.Set("response_type", "code")
	params.Set("scope", "profile email")
	
	if state != "" {
		params.Set("state", state)
	}

	return fmt.Sprintf("https://whatsyour.info/oauth/authorize?%s", params.Encode())
}

// ExchangeCodeForToken exchanges authorization code for access token
func (c *Client) ExchangeCodeForToken(clientID, clientSecret, code, redirectURI string) (*TokenResponse, error) {
	var response TokenResponse

	resp, err := c.client.R().
		SetBody(map[string]string{
			"client_id":     clientID,
			"client_secret": clientSecret,
			"code":          code,
			"redirect_uri":  redirectURI,
			"grant_type":    "authorization_code",
		}).
		SetResult(&response).
		SetError(&APIError{}).
		Post("/oauth/token")

	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}

	if resp.IsError() {
		if apiErr, ok := resp.Error().(*APIError); ok {
			return nil, fmt.Errorf("token exchange failed: %s", apiErr.Error)
		}
		return nil, fmt.Errorf("HTTP error: %s", resp.Status())
	}

	return &response, nil
}

// Static helper functions

// GenerateProfileURL generates a profile URL for a username
func GenerateProfileURL(username string) string {
	return fmt.Sprintf("https://whatsyour.info/%s", username)
}

// GenerateSubdomainURL generates a subdomain URL for a username
func GenerateSubdomainURL(username string) string {
	return fmt.Sprintf("https://%s.whatsyour.info", username)
}

// GenerateAvatarURL generates an avatar URL for a username
func GenerateAvatarURL(username string, size int) string {
	return fmt.Sprintf("https://whatsyour.info/api/avatars/%s?size=%d", username, size)
}