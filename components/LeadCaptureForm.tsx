'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import tinycolor from 'tinycolor2';
import { ChevronDown, Mail, User, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function isGradient(value: string) {
  return value?.startsWith('linear-gradient');
}

function isDarkColor(color: string) {
  try {
    return tinycolor(color).isDark();
  } catch {
    return false;
  }
}

export default function LeadCaptureForm({
  username,
  design
}: {
  username: string;
  design: {
    customColors?: {
      accent?: string;
      background?: string;
      surface?: string;
    };
  };
}) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expanded, setExpanded] = useState(false);

  const { accent = '#111827', background = '#ffffff', surface = '#f9fafb' } = design?.customColors || {};

  const isAccentGradient = isGradient(accent);
  const isSurfaceGradient = isGradient(surface);

  const textColor = isAccentGradient ? '#fff' : isDarkColor(accent) ? '#fff' : '#000';
  const surfaceTextColor = isSurfaceGradient ? '#fff' : isDarkColor(surface) ? '#fff' : '#000';

  const buttonStyle = isAccentGradient
    ? { backgroundImage: accent, color: '#fff', border: 'none' }
    : { backgroundColor: accent, color: textColor };

  const formSurfaceStyle = isSurfaceGradient
    ? { backgroundImage: surface, color: surfaceTextColor }
    : { backgroundColor: surface, color: surfaceTextColor };

  return (
    <div
      className="mt-5 bg-black/5 max-w-full mx-auto rounded-md px-3"
      
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-sm sm:text-base font-semibold py-4 flex justify-between items-center"
      >
        <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Get in Touch with <span className="underline">@{username}</span>
        </h2>
        <ChevronDown
          className={`w-6 h-6 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.form
            onSubmit={async (e) => {
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
            }}
            className="w-full space-y-4 mt-4 p-4 rounded-md overflow-hidden shadow-md"
            style={formSurfaceStyle}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                name="name"
                placeholder="Your Name"
                required
                className="pl-10 text-sm"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="email"
                name="email"
                placeholder="Your Email"
                required
                className="pl-10 text-sm"
              />
            </div>

            <div className="relative">
              <MessageCircle className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
              <textarea
                name="message"
                placeholder="Your Message"
                rows={4}
                required
                className="w-full text-sm pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
              />
            </div>

            <Button
              type="submit"
              className="w-full text-sm font-semibold rounded-md shadow-sm"
              style={buttonStyle}
            >
              Send Message
            </Button>

            {status === 'success' && (
              <p className="text-green-600 text-xs sm:text-sm mt-2 text-center">
                Message sent successfully!
              </p>
            )}
            {status === 'error' && (
              <p className="text-red-600 text-xs sm:text-sm mt-2 text-center">
                Failed to send message. Try again.
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
