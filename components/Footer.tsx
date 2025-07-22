import Link from 'next/link';
import { Globe, Twitter, Linkedin, Github } from 'lucide-react';

const footerNavigation = {
  main: [
    { name: 'About', href: '/about' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Blog', href: '/blog' },
    { name: 'Documentation', href: '/docs' },
  ],
  developers: [
    { name: 'API Reference', href: '/docs/api' },
    { name: 'SDKs', href: '/docs/sdks' },
    { name: 'Developer Dashboard', href: '/dev' },
    { name: 'Status', href: '/status' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact', href: '/contact' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
  ],
  social: [
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
    { name: 'GitHub', href: '#', icon: Github },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
        <div className="w-full">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center space-x-2">
                <Globe className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">
                  What'sYour<span className="text-blue-600">.Info</span>
                </span>
              </Link>
              <p className="mt-4 text-sm text-gray-600">
                Your unified digital identity platform. Create, manage, and share your professional profile across the web.
              </p>
              <div className="mt-6 flex space-x-4">
                {footerNavigation.social.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <span className="sr-only">{item.name}</span>
                    <item.icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Product</h3>
              <ul className="mt-4 space-y-2">
                {footerNavigation.main.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Developers</h3>
              <ul className="mt-4 space-y-2">
                {footerNavigation.developers.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Support</h3>
              <ul className="mt-4 space-y-2">
                {footerNavigation.support.map((item) => (
                  <li key={item.name}>
                    <Link href={item.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-12 border-t border-gray-200 pt-8 md:flex md:items-center md:justify-between">
            <p className="text-sm text-gray-600">
              &copy; 2025 DishIs Technologies. All rights reserved.
            </p>
            <p className="mt-4 text-sm text-gray-500 md:mt-0">
              Built with ❤️ for developers and creators worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}