import {
  User,
  Palette,
  Image as ImageIcon,
  BadgeCheck,
  Link as LinkIcon,
  Heart,
  Wallet,
  Camera,
  Cog,
} from 'lucide-react';

const navItems = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'design', label: 'Design', icon: Palette },
  { id: 'avatars', label: 'Avatars', icon: ImageIcon },
  { id: 'verified', label: 'Verified Accounts', icon: BadgeCheck },
  { id: 'links', label: 'Links', icon: LinkIcon },
  { id: 'interests', label: 'Interests', icon: Heart },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'photos', label: 'Photos', icon: Camera },
  { id: 'settings', label: 'Account Settings', icon: Cog },
];

interface DashboardSidebarProps {
  activePanel: string;
  setActivePanel: (panel: string) => void;
}

export default function DashboardSidebar({ activePanel, setActivePanel }: DashboardSidebarProps) {
  return (
    <nav className="w-20 lg:w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
      <div className="font-bold text-lg hidden lg:block mb-6">Settings</div>
      <ul className="space-y-2">
        {navItems.map(item => (
          <li key={item.id}>
            <button
              onClick={() => setActivePanel(item.id)}
              className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                activePanel === item.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
            >
              <item.icon className="h-5 w-5 mr-0 lg:mr-3" />
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}