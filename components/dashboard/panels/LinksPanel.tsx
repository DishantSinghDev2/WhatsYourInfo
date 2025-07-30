'use client';

import { useState } from 'react';
import { UserProfile } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Trash2, Save, GripVertical } from 'lucide-react';
import { AnimatePresence, motion, Reorder } from 'framer-motion';

type LinkItem = { _id: string; title: string; url: string };

export interface LinksPanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
  changesSaved: (a: boolean) => void
}

export default function LinksPanel({ user, onUpdate, changesSaved }: LinksPanelProps) {
  const [links, setLinks] = useState<LinkItem[]>(user.links || []);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState({ title: '', url: '' });
  const [reordered, setReordered] = useState(false);

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) {
      toast.error('Title and URL required');
      return;
    }

    setIsAdding(true);
    const toastId = toast.loading('Adding link...');
    try {
      const res = await fetch('/api/profile/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Add failed');

      const updated = [...links, data.link];
      setLinks(updated);
      setNewLink({ title: '', url: '' });
      onUpdate({ links: updated });
      changesSaved(true)
      toast.success('Link added', { id: toastId });
    } catch {
      toast.error('Failed to add link', { id: toastId });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteLink = async (id: string) => {
    const updated = links.filter(l => l._id !== id);
    setLinks(updated);
    onUpdate({ links: updated });

    try {
      await fetch(`/api/profile/links?id=${id}`, { method: 'DELETE' });
      toast.success('Link deleted');
      changesSaved(true)
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleSaveOrder = async () => {
    try {
      const payload = links.map(({ _id, title, url }) => ({ id: _id, title, url }));
      await fetch('/api/profile/links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast.success('Saved order');
      setLinks(links);
      setReordered(false);
      onUpdate({ links });
      changesSaved(true)
    } catch {
      toast.error('Order save failed');
    }
  };

  const handleEditSave = async (id: string) => {
    const updated = links.map(l =>
      l._id === id ? { ...l, ...editingData } : l
    );
    setLinks(updated);
    setEditingId(null);
    onUpdate({ links: updated });

    try {
      await fetch('/api/profile/links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated.map(({ _id, title, url }) => ({ id: _id, title, url }))),
      });
      toast.success('Link updated');
      changesSaved(true)
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6 max-w-xl text-sm">
      <div>
        <h1 className="text-xl font-semibold">Links</h1>
        <p className="text-muted-foreground text-xs">Manage your links. Drag to reorder.</p>
      </div>

      <Reorder.Group
        axis="y"
        values={links}
        onReorder={(newOrder) => {
          setLinks(newOrder);
          setReordered(true);
          changesSaved(false)
          onUpdate({ links: newOrder });
        }}
        className="space-y-2"
      >
        <AnimatePresence>
          {links.map(link => (
            <Reorder.Item
              key={link._id}
              value={link}
              className="bg-gray-100 px-3 py-2 rounded"
              whileDrag={{ scale: 1.02 }}
            >
              <motion.div
                layout
                className="flex items-start justify-between gap-2 cursor-pointer"

              >
                <div className="flex items-start gap-2 flex-1">
                  <GripVertical className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
                  <div className="text-left w-full" onClick={() => {
                    setEditingId(link._id);
                    setEditingData({ title: link.title, url: link.url });
                  }}>
                    <p className="font-medium text-sm truncate">{link.title}</p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline truncate block"
                    >
                      {link.url}
                    </a>

                    <AnimatePresence>
                      {editingId === link._id && (
                        <motion.div
                          key={`${link._id}-editor`}
                          initial={{ opacity: 0, height: 'auto' }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden pt-2 space-y-2"
                        >
                          <Input
                            className="text-sm"
                            value={editingData.title}
                            onChange={(e) => {
                              setEditingData(prev => ({ ...prev, title: e.target.value }))
                              changesSaved(false)
                            }
                            }
                          />
                          <Input
                            className="text-sm"
                            value={editingData.url}
                            onChange={(e) => {
                              setEditingData(prev => ({ ...prev, url: e.target.value }))
                              changesSaved(false)
                            }
                            }
                          />
                          <div className="flex justify-end">
                            <Button size="sm" onClick={(e) => {
                              e.stopPropagation();
                              handleEditSave(link._id);
                            }}>
                              Save
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLink(link._id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </motion.div>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {reordered && (
        <div className="flex justify-end">
          <Button onClick={handleSaveOrder} size="sm" className="gap-2">
            <Save className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      )}

      <div className="pt-6 space-y-2">
        <h2 className="font-medium">Add New Link</h2>
        <Input
          placeholder="Title (e.g. Portfolio)"
          value={newLink.title}
          onChange={(e) => setNewLink((prev) => ({ ...prev, title: e.target.value }))}
        />
        <Input
          placeholder="https://yourlink.com"
          value={newLink.url}
          onChange={(e) => setNewLink((prev) => ({ ...prev, url: e.target.value }))}
        />
        <Button onClick={handleAddLink} disabled={isAdding} className="w-full">
          {isAdding ? 'Adding...' : 'Add Link'}
        </Button>
      </div>
    </div>
  );
}
