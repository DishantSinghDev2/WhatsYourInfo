'use client';
import {
  User, Palette, ImageIcon, BadgeCheck, Link as LinkIcon, Wallet, Camera, Wrench, Cog
} from 'lucide-react';
import { motion } from 'framer-motion';
import { UserProfile } from '@/types';
import ProCrownBadge from '../icon/pro';

const navItems = [
  { id: 'profile', title: 'My Profile', description: 'Name, bio, and basic info.', icon: User },
  { id: 'design', title: 'Design', description: 'Colors, images, and layout.', icon: Palette },
  { id: 'avatars', title: 'Avatars', description: 'Manage your profile pictures.', icon: ImageIcon },
  { id: 'links', title: 'Links', description: 'Share your important websites.', icon: LinkIcon },
  { id: 'verified', title: 'Verified Accounts', description: 'Connect your social media.', icon: BadgeCheck },
  { id: 'wallet', title: 'Wallet', description: 'Add payment & crypto addresses.', icon: Wallet},
  { id: 'photos', title: 'Photos', description: 'Create a visual gallery.', icon: Camera, pro: true },
  { id: 'tools', title: 'Tools', description: 'Signatures, redirects, and more.', icon: Wrench },
  { id: 'settings', title: 'Account Settings', description: 'Manage your account data.', icon: Cog },
];

export default function DashboardNav({ setActivePanel, user }: { setActivePanel: (id: string) => void, user: UserProfile }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-gray-500 mb-8">Select a category to edit your profile.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {navItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -4, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="p-4 bg-gray-50 rounded-lg border cursor-pointer"
            onClick={() => setActivePanel(item.id)}
          >
            <div className="flex items-center justify-between">
              <item.icon className="h-6 w-6 text-gray-700" />
              {item.pro && !user.isProUser && <ProCrownBadge />}
            </div>
            <h3 className="text-md font-semibold mt-3">{item.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}