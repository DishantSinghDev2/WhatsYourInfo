'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { UserProfile } from '@/types';
import toast from 'react-hot-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function AccountSettingsPanel({ user }: { user: UserProfile }) {
  const [username, setUsername] = useState(user.username);
  const [isSaving, setIsSaving] = useState(false);

  const handleUsernameChange = async () => {
    // API call to PUT /api/profile/username
    toast.success('Username updated!');
  };

  const handleDeleteAccount = async () => {
    // API call to DELETE /api/profile
    toast.success('Account deleted.');
    // redirect to homepage
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-gray-500">Manage your account-wide settings and data.</p>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Profile URL</CardTitle>
            <CardDescription>Changing your username will change your profile URL. This can break existing links.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
            <span className="text-gray-500">whatsyour.info/</span>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="flex-grow"/>
            <Button onClick={handleUsernameChange}>Save</Button>
        </CardContent>
      </Card>
      <Card className="border-red-500">
        <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">Yes, delete account</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <p className="text-sm text-gray-500 mt-2">Permanently delete your entire account.</p>
        </CardContent>
      </Card>
    </div>
  );
}