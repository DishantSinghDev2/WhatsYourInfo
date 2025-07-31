// app/delete/page.tsx

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { CheckCircle, LogIn } from 'lucide-react';

const DELETION_GRACE_PERIOD_DAYS = 30; // Define your grace period here

export default function AccountDeletedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg text-center bg-white p-8 sm:p-12 border rounded-xl shadow-sm">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-6" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Your Account is Scheduled for Deletion
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Your account and all associated data will be permanently deleted in{' '}
              <strong>{DELETION_GRACE_PERIOD_DAYS} days</strong>.
              An email with this information has been sent to your inbox.
            </p>
            <div className="mt-8 border-t pt-6">
                <h2 className="font-semibold text-gray-800">Changed your mind?</h2>
                <p className="mt-2 text-gray-600">
                    You can easily recover your account and stop the deletion process. Simply log back in anytime within the next {DELETION_GRACE_PERIOD_DAYS} days.
                </p>
                <div className="mt-6">
                    <Button asChild size="lg">
                        <Link href="/login">
                            <LogIn className="h-4 w-4 mr-2" />
                            Log In to Recover Account
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}