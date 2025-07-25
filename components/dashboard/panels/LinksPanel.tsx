'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { UserProfile } from '@/types';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical, PlusCircle, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Define the Link type for the frontend
type LinkItem = { _id: string; title: string; url: string; };

interface LinksPanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
}

export default function LinksPanel({ user, onUpdate }: LinksPanelProps) {
  const [links, setLinks] = useState<LinkItem[]>(user.links || []);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) {
      toast.error('Both title and URL are required.');
      return;
    }
    setIsAdding(true);
    const toastId = toast.loading('Adding link...');
    try {
      const response = await fetch('/api/profile/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add link.');
      
      const updatedLinks = [...links, data.link];
      setLinks(updatedLinks);
      onUpdate({ links: updatedLinks }); // Update live preview
      setNewLink({ title: '', url: '' }); // Reset form
      toast.success('Link added!', { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add link.', { id: toastId });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    const originalLinks = [...links];
    // Optimistic UI update
    const updatedLinks = links.filter(link => link._id !== linkId);
    setLinks(updatedLinks);
    onUpdate({ links: updatedLinks });

    try {
      const response = await fetch(`/api/profile/links?id=${linkId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete on server.');
      toast.success('Link removed.');
    } catch (error) {
      toast.error('Failed to remove link. Reverting.');
      setLinks(originalLinks); // Revert on failure
      onUpdate({ links: originalLinks });
    }
  };

  const handleOnDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setLinks(items);
    onUpdate({ links: items });
    
    // Persist the new order to the backend
    try {
      const linksToSave = items.map(l => ({ id: l._id, title: l.title, url: l.url }));
      await fetch('/api/profile/links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linksToSave),
      });
    } catch (error) {
      toast.error('Could not save new link order.');
      setLinks(links); // Revert on failure
      onUpdate({ links });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Links</h1>
        <p className="text-gray-500">Share your favorite links with the world. Drag to reorder.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Links</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="links">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  <AnimatePresence>
                    {links.map((link, index) => (
                      <Draggable key={link._id} draggableId={link._id} index={index}>
                        {(provided) => (
                          <motion.div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -50 }}
                          >
                            <GripVertical className="h-5 w-5 text-gray-400" />
                            <div className="flex-grow">
                              <p className="font-medium">{link.title}</p>
                              <p className="text-sm text-gray-500 truncate">{link.url}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteLink(link._id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                  </AnimatePresence>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add New Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            placeholder="Link Title (e.g., My Portfolio)"
            value={newLink.title}
            onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
          />
          <Input 
            type="url"
            placeholder="https://example.com"
            value={newLink.url}
            onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
          />
          <Button onClick={handleAddLink} disabled={isAdding} className="w-full">
            <PlusCircle className="h-4 w-4 mr-2" />
            {isAdding ? 'Adding...' : 'Add Link'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}