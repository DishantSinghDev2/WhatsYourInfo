'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SiRobotframework, SiMaildotru, SiImessage, SiMinutemailer, SiCarrd } from 'react-icons/si';

import AIProfileBuilder from '@/components/dashboard/tools/AIProfileBuilder';
import DigitalBusinessCard from '@/components/dashboard/tools/DigitalBusinessCard';
import EmailSignature from '@/components/dashboard/tools/EmailSignature';
import PrivateMessages from '@/components/dashboard/tools/PrivateMessages';
import SmartRedirects from '@/components/dashboard/tools/SmartRedirects';
import { UserProfile } from '@/types';
import ProCrownBadge from '@/components/icon/pro';

const tools = [
  { id: 'ai-builder', title: 'AI Profile Builder', icon: SiRobotframework },
  { id: 'card', title: 'Digital Card', icon: SiCarrd },
  { id: 'signature', title: 'Email Signature', icon: SiMaildotru },
  { id: 'messages', title: 'Private Email', icon: SiImessage },
  { id: 'redirects', title: 'Smart Redirects', icon: SiMinutemailer, pro: true },
];

interface ToolsProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void
}

const toolComponents: Record<string, React.ComponentType<ToolsProps>> = {
  'ai-builder': AIProfileBuilder,
  'card': DigitalBusinessCard,
  'signature': EmailSignature,
  'messages': PrivateMessages,
  'redirects': SmartRedirects,
};

export interface ToolsPanelProps { user: UserProfile, onUpdate: (data: Partial<UserProfile>) => void, aTool?: string | null, changesSaved: (a: boolean) => void }

export default function ToolsPanel({ user, onUpdate, aTool, changesSaved }: ToolsPanelProps ) {
  const [activeTool, setActiveTool] = useState<string | null>(aTool || null);
  const ActiveTool = activeTool ? toolComponents[activeTool] : null;

  if (ActiveTool) {
    return (
      <motion.div
        key={activeTool}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <ActiveTool user={user} onUpdate={onUpdate} changesSaved={changesSaved} />
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Tools</h1>
        <p className="text-gray-500 text-sm">Supercharge your profile with these powerful tools.</p>
      </div>

      <div className="flex flex-col gap-3">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 transition"
          >
            <tool.icon className="h-5 w-5 text-blue-600" />
            {tool.title}
            {tool.pro && (
              <ProCrownBadge />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
