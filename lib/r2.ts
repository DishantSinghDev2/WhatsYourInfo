// lib/r2.ts

import { UserProfile } from "@/types";

/**
 * Sends a DELETE request to the Cloudflare Worker to delete an object from R2.
 * @param key The full R2 object key (e.g., "avatars/user-123.jpg").
 * @returns A boolean indicating whether the API call was successful.
 */
async function deleteFromR2(key: string): Promise<boolean> {
  // Determine the 'type' from the key's prefix (avatars/, headers/, etc.)
  const type = key.split('/')[0].slice(0, -1); // "avatars/" -> "avatar"

  if (!['avatar', 'header', 'background'].includes(type)) {
    console.error(`Invalid R2 key type detected: ${type}`);
    return false;
  }

  try {
    const deleteUrl = `${process.env.R2_WORKER_UPLOAD_URL}?key=${encodeURIComponent(key)}&type=${type}`;
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Failed to delete object '${key}' from R2. Status: ${response.status}`, errorBody);
      return false;
    }

    console.log(`Successfully deleted object '${key}' from R2.`);
    return true;
  } catch (error) {
    console.error(`Error during R2 deletion request for key '${key}':`, error);
    return false;
  }
}

/**
 * Deletes all R2 assets associated with a user profile.
 * It collects all image keys and sends deletion requests.
 * @param user The UserProfile object.
 */
export async function deleteAllUserAssets(user: UserProfile) {
  const keysToDelete: string[] = [];

  // Extract the key from the full public URL for each asset
  const r2PublicDomain = (process.env.R2_PUBLIC_DOMAIN || '').replace(/\/$/, '');

  if (user.avatar) {
    // Assuming user.avatar stores the key directly, e.g., "avatars/user-..."
    keysToDelete.push(user.avatar);
  }
  if (user.design?.headerImage) {
    // If you store the full URL, extract the key
    const key = user.design.headerImage.replace(r2PublicDomain + '/', '');
    keysToDelete.push(key);
  }
  if (user.design?.backgroundImage) {
    const key = user.design.backgroundImage.replace(r2PublicDomain + '/', '');
    keysToDelete.push(key);
  }
  // Add any other image assets here (e.g., gallery images)

  if (keysToDelete.length === 0) {
    console.log(`No R2 assets to delete for user ${user.username}.`);
    return;
  }

  console.log(`Preparing to delete ${keysToDelete.length} assets for user ${user.username}:`, keysToDelete);

  // Send all delete requests concurrently for efficiency
  await Promise.all(keysToDelete.map(key => deleteFromR2(key)));
}