'use client';
import { useRef } from 'react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function EmailSignature({ user }: { user: any }) {
    const signatureRef = useRef<HTMLDivElement>(null);
    const profileUrl = `https://whatsyour.info/${user.username}`;
    
    const copySignature = () => {
        if (signatureRef.current) {
            const range = document.createRange();
            range.selectNode(signatureRef.current);
            window.getSelection()?.removeAllRanges();
            window.getSelection()?.addRange(range);
            try {
                document.execCommand('copy');
                toast.success('Signature copied to clipboard!');
            } catch (err) {
                toast.error('Failed to copy.');
            }
            window.getSelection()?.removeAllRanges();
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Email Signature</h2>
            <p className="text-sm text-gray-500">Click "Copy Signature" and paste it into your email client's signature settings.</p>
            <div className="p-4 border rounded-lg">
                <div ref={signatureRef} style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>{user.firstName} {user.lastName}</p>
                    {user.bio && <p style={{ margin: '2px 0', color: '#555' }}>{user.bio.split('\n')[0]}</p>}
                    <p style={{ margin: '2px 0' }}>
                        <a href={profileUrl} style={{ color: '#007bff', textDecoration: 'none' }}>View My Profile</a>
                        {user.socialLinks?.linkedin && <> | <a href={user.socialLinks.linkedin} style={{ color: '#007bff', textDecoration: 'none' }}>LinkedIn</a></>}
                    </p>
                </div>
            </div>
            <Button onClick={copySignature}>Copy Signature</Button>
        </div>
    );
}