'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function LeadCaptureForm({ username }: { username: string }) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          name: formData.get('name'),
          email: formData.get('email'),
          message: formData.get('message'),
          source: 'profile',
        }),
      });

      if (response.ok) {
        setStatus('success');
        e.currentTarget.reset();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <textarea
          name="message"
          placeholder="Your Message"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Button type="submit" className="w-full">
        Send Message
      </Button>
      {status === 'success' && (
        <p className="text-green-600 text-sm mt-2">Message sent successfully!</p>
      )}
      {status === 'error' && (
        <p className="text-red-600 text-sm mt-2">Failed to send message. Try again.</p>
      )}
    </form>
  );
}
