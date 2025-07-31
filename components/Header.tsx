'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { Menu, X, LogOut, Settings, LayoutDashboard, ChevronDown, Loader2, CreditCard, Users, Code } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { User } from '@/lib/auth';
import toast from 'react-hot-toast';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { AnimatePresence, motion } from 'framer-motion';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Blog', href: '/blog' },
  { name: 'Docs', href: '/docs' },
  { name: 'Tools', href: '/tools' },
];

const motionProps = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3 },
};

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else if (response.status === 401) {
          setUser(null); // Explicitly set user to null on 401
        }
      } catch {
        toast.error('Error fetching user profile.');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Logged out successfully!');
      setUser(null);
    } catch {
      toast.error('Logout failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-[51]">
      {/* Set a fixed height to prevent layout shift */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8 h-20">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
            <Image
              src="/logotext.svg"
              alt="WhatsYour.Info Logo"
              width={200}
              height={32}
              priority
            />
          </Link>
        </div>

        <div className="flex lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Desktop Navigation */}
        <AnimatePresence mode="wait" initial={false}>
          {user ? (
            <motion.div
              key="user-nav"
              className="hidden lg:flex lg:flex-1 lg:justify-end"
              {...motionProps}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div
                    className="group flex items-center gap-2 cursor-pointer rounded-full hover:bg-gray-100 transition p-1 px-2"
                  >
                    <img
                      src={user.avatar?.startsWith('http') ? user.avatar : `/api/avatars/${user.username}?size=128`}
                      alt="User Avatar"
                      className="rounded-full object-cover border w-9 h-9"
                    />
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-800 whitespace-nowrap">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-600 transition-transform group-hover:rotate-180" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mt-2" align="end">
                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center cursor-pointer">
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/billing" className="flex items-center cursor-pointer">
                      <CreditCard className="w-4 h-4 mr-2" /> Billing
                    </Link>
                  </DropdownMenuItem>
                  {user.isProUser && <DropdownMenuItem asChild>
                    <Link href="/leads" className="flex items-center cursor-pointer">
                      <Users className="w-4 h-4 mr-2" /> Leads
                    </Link>
                  </DropdownMenuItem>}
                  <DropdownMenuItem asChild>
                    <Link href="/dev" className="flex items-center cursor-pointer">
                      <Code className="w-4 h-4 mr-2" /> Developers
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="flex items-center text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Logging out…' : 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ) : (
            <motion.div
              key="guest-nav"
              className="hidden lg:flex lg:items-center lg:gap-x-12"
              {...motionProps}
            >
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-blue-600',
                    pathname === item.href ? 'text-blue-600' : 'text-gray-700'
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex items-center gap-x-4 ml-8">
                <Link href="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="fixed inset-0 z-[70] bg-black/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <motion.div
              className="fixed inset-y-0 right-0 z-[70] w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-center justify-between">
                <Link href="/" className="-m-1.5 p-1.5 flex items-center space-x-2">
                  <Image src="/logotext.svg" alt="WhatsYour.Info" width={180} height={28} />
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} aria-label="Close mobile menu">
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10">
                  <div className="space-y-2 py-6">
                    {user ? (
                      <>
                        <Link href="/dashboard" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                          Dashboard
                        </Link>
                        <Link href="/billing" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                          Billing
                        </Link>
                        {user.isProUser && (
                          <Link href="/leads" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                            Leads
                          </Link>
                        )}
                        <Link href="/dev" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                          Developers
                        </Link>
                        <Link href="/settings" className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                          Settings
                        </Link>
                      </>
                    ) : (
                      <>
                        {navigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                          >
                            {item.name}
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                  <div className="py-6 space-y-2">
                    {user ? (
                      <>
                        <div className="px-3 py-2">
                          <p className="text-base font-semibold text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start -mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-red-600 hover:bg-red-50"
                          onClick={handleLogout}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Logging out...' : 'Logout'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                        >
                          Sign in
                        </Link>
                        <Link
                          href="/register"
                          className="w-full block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white bg-blue-600 hover:bg-blue-700 text-center"
                        >
                          Get Started
                        </Link>
                      </>
                    )}
                  </div>

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}