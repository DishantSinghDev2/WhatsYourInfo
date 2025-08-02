import { Button } from '@/components/ui/Button';
import { Ghost } from 'lucide-react';

export default function UserNotFound({
  params,
}: {
  params: { username: string };
}) {
  const { username } = params;


  return (
    <div className="min-h-screen bg-white text-blue-700 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <Ghost className="mx-auto h-16 w-16 text-blue-500" />
        <h1 className="text-3xl font-bold">Profile Not Found</h1>
        <p className="text-lg text-blue-600">
          We couldn't find a profile for <span className="font-semibold">@{username}</span>.
        </p>
        <form action={`/register?username=${encodeURIComponent(username)}`}>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-base font-medium shadow-lg"
          >
            Create this profile now
          </Button>
        </form>
      </div>
    </div>
  );
}
