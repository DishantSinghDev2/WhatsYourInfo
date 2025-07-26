// app/types/index.ts
export interface UserProfile {
    _id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  bio?: string;
  avatar?: string;
  isProUser: boolean;
  customDomain?: string;
  emailVerified: boolean;
  spotlightButton?: {
    text: string;
    url: string;
    color: string;
  };
  verifiedAccounts: {
    provider: string; // e.g., 'twitter', 'github'
    providerAccountId: string;
    profileUrl: string;
    username: string
  }[];
  showWalletOnPublic: boolean;
  interests: string[];
  wallet: {
    id: string;
    paymentType: string; // e.g., 'paypal', 'btc'
    address: string;
  }[];
  gallery: {
    imageUrl: string;
    caption: string;
  }[];
  design: {
    theme: string; // e.g., 'classic', 'sunset'
    customColors: {
      background: string;
      surface: string;
      accent: string;
    };
    headerImage?: string;
    backgroundImage?: string;
    sections?: [];
    visibility?: [];
  };
  createdAt: Date;
  updatedAt: Date;
  links?: { _id: string; title: string; url: string; }[];
}