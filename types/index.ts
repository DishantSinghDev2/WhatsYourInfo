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
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  spotlightButton?: {
    text: string;
    url: string;
    color: string;
  };
  verifiedAccounts: {
    service: string; // e.g., 'twitter', 'github'
    username: string;
    url: string;
  }[];
  interests: string[];
  wallet: {
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
    headerImage: string;
    backgroundImage: string;
  };
  createdAt: Date;
  updatedAt: Date;
  links?: { _id: string; title: string; url: string; }[];
}