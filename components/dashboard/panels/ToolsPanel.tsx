'use client';

import { useState } from 'react';
import { Bot, CreditCard, Mail, MessageSquare, Route } from 'lucide-react';
import AIProfileBuilder from '@/components/dashboard/tools/AIProfileBuilder';
import DigitalBusinessCard from '@/components/dashboard/tools/DigitalBusinessCard';
import EmailSignature from '@/components/dashboard/tools/EmailSignature';
import PrivateMessages from '@/components/dashboard/tools/PrivateMessages';
import SmartRedirects from '@/components/dashboard/tools/SmartRedirects';
import { UserProfile } from '@/types';
import { motion } from 'framer-motion';

const tools = [
  { id: 'ai-builder', title: 'AI Profile Builder', description: 'Generate a professional bio using AI.', icon: Bot },
  { id: 'card', title: 'Digital Card', description: 'Create a downloadable business card.', icon: CreditCard },
  { id: 'signature', title: 'Email Signature', description: 'Generate a professional email signature.', icon: Mail },
  { id: 'messages', title: 'Private Messages', description: 'Allow visitors to contact you privately.', icon: MessageSquare },
  { id: 'redirects', title: 'Smart Redirects', description: 'Create short links like /youtube.', icon: Route, pro: true },
];

const toolComponents: { [key: string]: React.ComponentType<any> } = {
  'ai-builder': AIProfileBuilder,
  'card': DigitalBusinessCard,
  'signature': EmailSignature,
  'messages': PrivateMessages,
  'redirects': SmartRedirects,
};

export default function ToolsPanel({ user, onUpdate }: { user: UserProfile, onUpdate: (data: Partial<UserProfile>) => void }) {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const ActiveToolComponent = activeTool ? toolComponents[activeTool] : null;

  return (
    <div>
      <h1 className="text-2xl font-bold">Tools</h1>
      <p className="text-gray-500 mb-8">Supercharge your profile with these powerful tools.</p>
      
      {ActiveToolComponent ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => setActiveTool(null)} className="mb-4 text-sm text-blue-600 hover:underline">← Back to all tools</button>
          <ActiveToolComponent user={user} onUpdate={onUpdate} />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <motion.div 
              key={tool.id}
              whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" }}
              className="p-6 bg-white rounded-lg border cursor-pointer" 
              onClick={() => setActiveTool(tool.id)}
            >
              <div className="flex items-center justify-between">
                <tool.icon className="h-8 w-8 text-blue-600" />
                {tool.pro && <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">PRO</span>}
              </div>
              <h3 className="text-lg font-semibold mt-4">{tool.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}