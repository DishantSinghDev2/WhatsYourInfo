import NextAuth, { Account, Profile, User } from "next-auth"
import clientPromise from "@/lib/mongodb"
import GitHubProvider from "next-auth/providers/github"
import TwitterProvider from "next-auth/providers/twitter"
import { ObjectId } from "mongodb"
import { getInHouseUserFromRequest } from "@/lib/in-house-auth"

export const authOptions = {
  // NO DATABASE ADAPTER! We are managing the database manually.
  // adapter: MongoDBAdapter(...), <--- REMOVE THIS LINE

  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_ID!,
      clientSecret: process.env.TWITTER_SECRET!,
      version: "2.0",
    }),
  ],
  
  // The callbacks are where all the magic happens now.
  callbacks: {
    /**
     * This callback is invoked when a user successfully returns from a provider.
     * This is where we will link the account to YOUR existing user.
     */
    async signIn({ user, account, profile }: { user: User, account: Account | null, profile?: any }) {
      if (!account || !profile) {
        return false; // Abort if OAuth data is missing
      }

      // 1. Get the currently logged-in user from YOUR in-house system.
      // This requires a helper function that can read your JWT from the request cookies.
      // THIS IS A CONCEPTUAL FUNCTION - YOU MUST IMPLEMENT IT.
      const inHouseUser = await getInHouseUserFromRequest();

      if (!inHouseUser) {
        // If no one is logged in with your system, block the sign-in.
        // This prevents creating orphaned connections.
        console.error("Link Error: User must be logged in with the main system first.");
        return '/login?error=AuthenticationRequired'; // Redirect to login page with an error
      }

      // 2. Prepare the connection data to be saved.
      const connectionData = {
        provider: account.provider, // 'github', 'twitter', etc.
        providerAccountId: account.providerAccountId, // The user's ID on the provider's system
        profileUrl: profile.html_url || profile.url || `https://x.com/${profile.data.username}`,
        username: profile.login || profile.data.username,
      };

      try {
        // 3. Manually update YOUR user document in the database.
        const client = await clientPromise;
        const db = client.db('whatsyourinfo');

        await db.collection('users').updateOne(
          { _id: new ObjectId(inHouseUser._id) },
          {
            // Use $addToSet to prevent duplicate connections
            $addToSet: {
              verifiedAccounts: connectionData
            }
          }
        );
        
        // 4. Since we successfully linked the account, we can allow the flow to complete.
        // We will redirect the user back to their profile settings.
        return true;

      } catch (error) {
        console.error("Database link error:", error);
        return false; // Prevent sign-in on database error
      }
    }
  },
  session: {
    strategy: "jwt", // Required, but we won't be using the session object directly for auth
  },
  secret: process.env.NEXTAUTH_SECRET,
  
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };