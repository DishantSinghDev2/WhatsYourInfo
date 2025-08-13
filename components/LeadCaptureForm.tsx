'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea'; // Import the new component
import tinycolor from 'tinycolor2';
import { ChevronDown, Mail, User, MessageCircle, Loader2 } from 'lucide-react';
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

// --- SECURITY: Helper to validate a hex color string ---
function isValidHex(color: string) {
    if (!color || typeof color !== 'string') return false;
    // Allows 3, 6, or 8 digit hex codes
    return /^#([0-9a-fA-F]{3}){1,2}$/i.test(color) || /^#([0-9a-fA-F]{8})$/i.test(color);
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
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'submitting'>('idle');
  const [expanded, setExpanded] = useState(false);

  // --- SECURITY: Validate colors before use, with safe fallbacks ---
  const accent = isValidHex(design?.customColors?.accent ?? '') ? design.customColors!.accent! : '#111827';
  const surface = isValidHex(design?.customColors?.surface ?? '') ? design.customColors!.surface! : '#f9fafb';
  
  // Gradient logic can remain, as it's not a direct injection vector if colors are clean
  const isAccentGradient = isGradient(design?.customColors?.accent ?? '');
  const isSurfaceGradient = isGradient(design?.customColors?.surface ?? '');

  const textColor = isAccentGradient ? '#fff' : isDarkColor(accent) ? '#fff' : '#000';
  const surfaceTextColor = isSurfaceGradient ? '#fff' : isDarkColor(surface) ? '#fff' : '#000';

  const buttonStyle = isAccentGradient
    ? { backgroundImage: design.customColors!.accent, color: '#fff', border: 'none' }
    : { backgroundColor: accent, color: textColor };

  const formSurfaceStyle = isSurfaceGradient
    ? { backgroundImage: design.customColors!.surface, color: surfaceTextColor }
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
          Get in Touch with @{username}
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
              if (status === 'submitting') return;
              setStatus('submitting');
              
              const formData = new FormData(e.currentTarget);
              try {
                // --- BUG FIX: Corrected API path ---
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
                style={{ color: 'inherit' }} // Ensures text color is inherited
                disabled={status === 'submitting'}
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
                style={{ color: 'inherit' }}
                disabled={status === 'submitting'}
              />
            </div>

            <div className="relative">
              <MessageCircle className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
              {/* --- UI FIX: Use consistent Textarea component --- */}
              <Textarea
                name="message"
                placeholder="Your Message"
                rows={4}
                required
                className="pl-10 text-sm"
                style={{ color: 'inherit' }}
                disabled={status === 'submitting'}
              />
            </div>

            <Button
              type="submit"
              className="w-full text-sm font-semibold rounded-md shadow-sm"
              style={buttonStyle}
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Message'}
            </Button>

            {status === 'success' && (
              <p className="text-green-600 text-xs sm:text-sm mt-2 text-center">
                Message sent successfully!
              </p>
            )}
            {status === 'error' && (
              <p className="text-red-600 text-xs sm:text-sm mt-2 text-center">
                Failed to send message. Please try again.
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}