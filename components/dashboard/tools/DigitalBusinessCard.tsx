'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {QRCode} from 'qrcode.react';
import { Button } from '@/components/ui/Button';

export default function DigitalBusinessCard({ user }: { user: any }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [bgColor, setBgColor] = useState('#ffffff');
    const [textColor, setTextColor] = useState('#000000');

    const handleDownload = () => {
        if (cardRef.current === null) return;
        toPng(cardRef.current, { cacheBust: true })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = 'digital-card.png';
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => console.error(err));
    };
    
    const profileUrl = `https://whatsyour.info/${user.username}`;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">Digital Business Card</h2>
            <div className="flex justify-center p-4">
                <div 
                    ref={cardRef} 
                    className="w-96 h-56 rounded-xl p-6 flex flex-col justify-between shadow-lg"
                    style={{ backgroundColor: bgColor, color: textColor }}
                >
                    <div>
                        <h3 className="text-2xl font-bold">{user.firstName} {user.lastName}</h3>
                        <p className="opacity-80">@{user.username}</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <img src={`/api/avatars/${user.username}`} className="w-16 h-16 rounded-full border-2" style={{ borderColor: textColor }}/>
                        <div className="bg-white p-1 rounded-md">
                            <QRCode value={profileUrl} size={64} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-4">
                <label>Background: <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} /></label>
                <label>Text: <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} /></label>
            </div>
            <Button onClick={handleDownload}>Download Card</Button>
        </div>
    );
}