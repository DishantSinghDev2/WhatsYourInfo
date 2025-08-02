// app/types/index.ts

export interface UserProfile {
  _id: string;
  type: 'personal' | 'business' | 'official'
  isOfficial?: boolean;
  designation?: string;
  profileVisibility: 'public' | 'private';
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  bio?: string;
  avatar?: string;
  isProUser: boolean;
  deactivatedAt?: Date;
  paypalSubscriptionId?: string;
  proStarted?: Date;
  nextDue?: Date;
  twoFactorEnabled: boolean; // Is 2FA active for this user?
  twoFactorSecret?: string; // Encrypted secret for authenticator apps (TOTP)
  recoveryEmail?: string; // A separate, verified email for recovery
  recoveryCodes?: string[]; // Array of *hashed* one-time use recovery codes
  sessionId?: string;
  customDomain?: string;
  emailVerified: boolean;
  settings?: {
    privateMessagesEnabled: boolean
  };
  spotlightButton?: {
    text: string;
    url: string;
    color: string;
  };
  verifiedAccounts: {
    provider: string;
    providerAccountId: string;
    profileUrl: string;
    username: string;
  }[];
  showWalletOnPublic?: boolean;
  interests?: string[];
  wallet?: {
    id: string;
    paymentType: string;
    address: string;
  }[];
  gallery?: {
    _id: string;      // Unique identifier for the gallery item
    key: string;      // R2 object key (e.g., "gallery/username/timestamp.png")
    caption?: string;
    url?: string; // only for sending data from photos panel to preview
  }[];
  design: {
    theme: string;
    customColors: {
      background: string;
      surface: string;
      accent: string;
    };
    headerImage?: string;
    backgroundImage?: string;
    backgroundBlur?: number;  // Blur in pixels (e.g., 0 to 20)
    backgroundOpacity?: number; // Opacity percentage for the color overlay (e.g., 0 to 100)
    sections: string[]; // Updated from [] to string[]
    visibility: { [key: string]: boolean }; // Updated to a key-boolean map
  };
  links?: { _id: string; title: string; url: string; }[];
  createdAt: Date;
  updatedAt: Date;
}