package whatsyourinfo

import "time"

// PublicProfile represents a public user profile
type PublicProfile struct {
	Username        string                 `json:"username"`
	FirstName       string                 `json:"firstName"`
	LastName        string                 `json:"lastName"`
	Bio             string                 `json:"bio"`
	Avatar          string                 `json:"avatar"`
	IsProUser       bool                   `json:"isProUser"`
	CustomDomain    *string                `json:"customDomain,omitempty"`
	SocialLinks     map[string]string      `json:"socialLinks"`
	SpotlightButton *SpotlightButton       `json:"spotlightButton,omitempty"`
	CreatedAt       time.Time              `json:"createdAt"`
	ProfileURL      string                 `json:"profileUrl"`
	SubdomainURL    string                 `json:"subdomainUrl"`
}

// SpotlightButton represents a spotlight CTA button
type SpotlightButton struct {
	Text  string `json:"text"`
	URL   string `json:"url"`
	Color string `json:"color"`
}

// AuthUser represents an authenticated user
type AuthUser struct {
	ID        string `json:"_id"`
	Email     string `json:"email"`
	Username  string `json:"username"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	IsProUser bool   `json:"isProUser"`
}

// LoginResponse represents a login response
type LoginResponse struct {
	Message string   `json:"message"`
	User    AuthUser `json:"user"`
	Token   *string  `json:"token,omitempty"`
}

// TokenResponse represents an OAuth token response
type TokenResponse struct {
	AccessToken string   `json:"access_token"`
	TokenType   string   `json:"token_type"`
	ExpiresIn   int      `json:"expires_in"`
	User        AuthUser `json:"user"`
}

// APIError represents an API error response
type APIError struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

func (e *APIError) Error() string {
	if e.Message != "" {
		return e.Message
	}
	return e.Error
}