// components/settings/SettingsNav.tsx

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield } from 'lucide-react';

export function SettingsNav() {
  const pathname = usePathname();
  const navItems = [
    { href: '/settings', label: 'Account', icon: User },
    { href: '/settings/security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="border-b mb-8">
      <nav className="flex space-x-6">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 pb-3 border-b-2 font-medium transition-colors ${
              pathname === item.href
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}