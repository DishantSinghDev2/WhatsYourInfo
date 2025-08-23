import Image from 'next/image';

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2">
      {/* --- Left Side: Banner (Shared across login and 2FA) --- */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-blue-600 p-12 text-white text-center">
        <Image
          src="/logo.png"
          alt="WhatsYour.Info Logo"
          width={80}
          height={80}
          className="filter brightness-0 invert"
        />
        <h1 className="mt-8 text-4xl font-bold tracking-tight">
          Your Digital Identity, Perfected.
        </h1>
        <p className="mt-4 max-w-lg text-lg text-blue-100">
          Manage your profile, connect with others, and control your information with privacy you can trust.
        </p>
      </div>

      {/* --- Right Side: Form Area (Renders the specific page) --- */}
      <div className="flex flex-col items-center justify-center w-full bg-gray-50 p-6 sm:p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 lg:hidden">
            <Image src="/logo.svg" alt="WhatsYour.Info" width={42} height={42} className="mx-auto" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}