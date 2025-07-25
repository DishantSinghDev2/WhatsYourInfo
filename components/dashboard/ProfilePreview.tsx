'use client';
import { UserProfile } from '@/types';
import { motion } from 'framer-motion';
import { Mail, Link as LinkIcon, MapPin } from 'lucide-react';

// You can create sub-components for cleanliness
const PreviewSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
    >
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">{title}</h2>
        {children}
    </motion.div>
);


export default function ProfilePreview({ user }: { user: UserProfile }) {
  if (!user) return null;

  const { design } = user;
  const themeStyles = {
    backgroundColor: design?.customColors?.background || '#111827', // Dark default
    '--accent-color': design?.customColors?.accent || '#3B82F6',
  };

  return (
    <div
      className="h-full w-full rounded-2xl shadow-2xl transition-all duration-500"
      style={{
        backgroundColor: themeStyles.backgroundColor,
        backgroundImage: design?.backgroundImage ? `url(${design.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
        <div className="h-full w-full p-4 md:p-8 text-white backdrop-blur-sm backdrop-brightness-75 rounded-2xl overflow-y-auto custom-scrollbar-preview">
            
            {/* Header Image */}
            <div className="h-48 rounded-lg mb-[-64px]" style={{
                backgroundColor: 'var(--accent-color)',
                backgroundImage: design?.headerImage ? `url(${design.headerImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}></div>
            
            {/* --- Main Info --- */}
            <div className="flex items-end gap-4 mb-8">
                <img 
                    src={`/api/avatars/${user.username}?t=${new Date().getTime()}`}
                    className="w-32 h-32 rounded-full border-4 object-cover shadow-lg"
                    style={{ borderColor: themeStyles.backgroundColor }}
                />
                <div>
                    <h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1>
                    <p className="text-lg text-gray-300">@{user.username}</p>
                </div>
            </div>

            {/* --- Spotlight Button --- */}
            {user.isProUser && user.spotlightButton?.text && (
                 <a href={user.spotlightButton.url} target="_blank" rel="noopener noreferrer">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="w-full text-center font-bold text-white p-4 rounded-lg mb-6 cursor-pointer" 
                        style={{backgroundColor: user.spotlightButton.color || 'var(--accent-color)'}}
                    >
                       {user.spotlightButton.text}
                    </motion.div>
                </a>
            )}

            {/* --- Bio --- */}
            {user.bio && (
                <PreviewSection title="About Me">
                    <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{user.bio}</p>
                </PreviewSection>
            )}

            {/* --- Links --- */}
            {user.links && user.links.length > 0 && (
                 <PreviewSection title="Links">
                    <div className="space-y-2">
                        {user.links.map(link => (
                            <a href={link.url} key={link._id} target="_blank" rel="noopener noreferrer" 
                               className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
                                <LinkIcon className="h-4 w-4" style={{color: 'var(--accent-color)'}}/>
                                <span className="font-semibold">{link.title}</span>
                            </a>
                        ))}
                    </div>
                </PreviewSection>
            )}
            
            {/* --- Photo Gallery --- */}
            {user.isProUser && user.gallery && user.gallery.length > 0 && (
                <PreviewSection title="Gallery">
                    <div className="grid grid-cols-3 gap-2">
                        {user.gallery.map(item => (
                            <img key={item._id} src={item.url} className="aspect-square object-cover rounded-md"/>
                        ))}
                    </div>
                </PreviewSection>
            )}

        </div>
    </div>
  );
}