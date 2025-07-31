# WhatsYour.Info - The Modern Digital Business Card Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

WhatsYour.Info is a full-featured platform that allows professionals to create, customize, and share a dynamic digital business card. It serves as a central hub for their online presence, complete with social links, galleries, wallets, and advanced developer tools.

### ✨ Core Features

*   **Customizable Public Profiles**: Create a unique `username.whatsyour.info` page with a custom header, background, colors, and layout.
*   **Rich Content Sections**: Add a bio, links, verified social accounts, a photo gallery, crypto wallets, and more.
*   **AI-Powered Bio Generation**: A Pro feature that uses AI to craft a professional bio based on keywords.
*   **Lead Capture**: Pro users can add a contact form to their public profile to capture leads.
*   **Advanced Analytics**: Track profile views, referrers, and visitor insights.
*   **Secure Authentication**: Robust system with local login (email/password), social login (GitHub, Twitter/X), and email verification.
*   **Pro Subscriptions**: Monetization via PayPal for monthly and yearly Pro plans.
*   **Developer-First API**: A comprehensive, versioned REST API (`/api/v1`) for third-party developers.
*   **Full OAuth 2.0 Provider**: Allow other apps to use "Sign in with WhatsYour.Info" with a secure, scoped-based permission system.

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: v18.17 or later
*   **pnpm**: Recommended package manager (`npm install -g pnpm`)
*   **Git**: For cloning the repository
*   **MongoDB**: A running instance. You can use a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster or run it locally via [Docker](https://www.docker.com/).
*   **Cloudflare Worker**: A CloudFlare account to setup our media worker for fetching and uploading images from R2 buckets. We need total of four buckets for this app.

### 1. Clone the Repository

Clone the project to your local machine:

```bash
git clone https://github.com/dishantsinghdev2/whatsyourinfo.git
cd whatsyourinfo
```

### 2. Install Dependencies

Install the project dependencies using `npm`:

```bash
npm install
```

### 3. Set Up Environment Variables

This is the most critical step. The project relies on numerous external services.

1.  Make a copy of the example environment file:

    ```bash
    cp .env.example .env.local
    ```

2.  Open `.env.local` and fill in the values. **Do not commit this file to Git.**

    | Variable | Description | Where to get it |
    | :--- | :--- | :--- |
    | `JWT_SECRET` | A secret key for signing JWTs. | Run `openssl rand -base64 32` in your terminal. |
    | `NEXT_PUBLIC_GEMINI_API_KEY` | API key for Google Gemini (for AI Bio). | Google AI Studio. |
    | `MONGODB_URI` | Connection string for your MongoDB database. | Your MongoDB Atlas dashboard or local setup. |
    | `REDIS_URL` | *(Optional)* For caching or session management if implemented. | A service like Upstash or Redis Labs. |
    | `EMAIL_USER`, `EMAIL_HOST`, `EMAIL_FROM`, `EMAIL_PASS`, `EMAIL_SECURE` | SMTP credentials for sending emails. | An email service like Brevo, SendGrid, or your own SMTP provider. |
    | `R2_WORKER_UPLOAD_URL` | The URL for your Cloudflare R2 upload worker. | Your Cloudflare dashboard after deploying the worker. The worker code is at `/src/worker.ts` |
    | `NEXT_PUBLIC_APP_URL` & `R2_PUBLIC_URL`| The public URL of your app and R2 bucket. | For dev, `http://localhost:3000`. |
    | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | **Sandbox** credentials for PayPal. | [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/). Create a REST API app. |
    | `PAYPAL_PRO_MONTHLY_PLAN_ID`, `PAYPAL_PRO_YEARLY_PLAN_ID`| The IDs of the subscription plans you create. | Create subscription plans in your PayPal Developer dashboard. |
    | `PAYPAL_WEBHOOK_ID` | The ID of the webhook for subscription events. | Create a webhook in your PayPal Developer dashboard. |
    | `NEXTAUTH_SECRET` | A secret for NextAuth.js. | Run `openssl rand -base64 32` in your terminal. |
    | `GITHUB_ID`, `GITHUB_SECRET` | Credentials for GitHub OAuth. | [GitHub Developer Settings](https://github.com/settings/developers). Create a new OAuth App. |
    | `TWITTER_ID`, `TWITTER_SECRET` | Credentials for Twitter/X OAuth. | [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard). Create a new App. |
    | `NEXTAUTH_URL` | The base URL of your application. | For dev, set to `http://localhost:3000`. |

### 4. Run the Development Server

Once your environment variables are set, you can start the development server:

```bash
npm run dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Available Scripts

*   `npm run dev`: Starts the development server with hot-reloading.
*   `npm run build`: Creates a production-ready build of the application.
*   `npm run start`: Starts the application in production mode (requires `npm run build` first).
*   `npm run lint`: Lints the codebase for errors and style issues.

---

## 🚀 Deployment

The recommended platform for deploying this Next.js application is **Vercel**.

### Production Setup

1.  **Push to GitHub**: Make sure your code is pushed to a GitHub repository.
2.  **Import Project on Vercel**: Sign in to Vercel and import the repository. Vercel will automatically detect that it's a Next.js project.
3.  **Configure Environment Variables**:
    *   Go to your project's **Settings > Environment Variables** on Vercel.
    *   Add all the variables from your `.env.local` file. **Use your LIVE credentials from PayPal and other services for the Production environment.**
    *   Create a `CRON_SECRET` variable with a new random string (`openssl rand -base64 32`) to secure your cron job endpoint.
4.  **Set Up the Cron Job**:
    *   Create a `vercel.json` file in the root of your project:
      ```json
      {
        "crons": [
          {
            "path": "/api/cron/purge-deleted-users",
            "schedule": "0 5 * * *"
          }
        ]
      }
      ```
    *   This will automatically trigger the user purge job every day at 5 AM UTC.
5.  **Deploy**: Trigger a deployment on Vercel. Your site will be live!

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.