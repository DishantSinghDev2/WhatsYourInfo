import Link from 'next/link';

export default function NotFound({ params }: { params: { username: string } }) {
  const { username } = params;

  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Profile Not Found</h1>
        <p className="text-blue-600">
          We couldn’t find a profile for <strong>@{username}</strong>.
        </p>
        <Link
          href={`/register?username=${encodeURIComponent(username)}`}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
        >
          Create this profile now
        </Link>
      </div>
    </div>
  );
}
