'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { UserProfile } from '@/types';
import toast from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supportedWallets = ['PayPal.me', 'Venmo', 'Patreon', 'Bitcoin (BTC)', 'Ethereum (ETH)', 'Dogecoin (DOGE)'];

interface WalletPanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
}

export default function WalletPanel({ user, onUpdate }: WalletPanelProps) {
  const [wallet, setWallet] = useState(user.wallet || []);
  const [newAddress, setNewAddress] = useState({ paymentType: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);
  
  if (!user.isProUser) {
    return (
        <div>
            <h1 className="text-2xl font-bold">Wallet</h1>
            <p className="text-gray-500 mt-4">This is a Pro feature. Upgrade your account to add payment links.</p>
            {/* Add an "Upgrade" button here */}
        </div>
    )
  }

  const handleAdd = () => {
    if (!newAddress.paymentType || !newAddress.address) {
        toast.error('Please select a type and enter an address.');
        return;
    }
    const updatedWallet = [...wallet, { ...newAddress, id: new Date().toISOString() }];
    setWallet(updatedWallet);
    onUpdate({ wallet: updatedWallet });
    setNewAddress({ paymentType: '', address: '' });
  };

  const handleRemove = (id: string) => {
    const updatedWallet = wallet.filter(w => w.id !== id);
    setWallet(updatedWallet);
    onUpdate({ wallet: updatedWallet });
  };

  const handleSave = async () => {
    setIsSaving(true);
    toast.loading('Saving wallet...', { id: 'wallet-save' });
    try {
        await fetch('/api/profile/wallet', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet }),
        });
        toast.success('Wallet saved!', { id: 'wallet-save' });
    } catch (error) {
        toast.error('Could not save wallet.', { id: 'wallet-save' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-gray-500">Add payment and crypto addresses to make it easy for others to send you money.</p>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>Your Addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
              <AnimatePresence>
                {wallet.map(item => (
                    <motion.div 
                        key={item.id} 
                        layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                        <div>
                            <p className="font-semibold">{item.paymentType}</p>
                            <p className="text-sm text-gray-600">{item.address}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                    </motion.div>
                ))}
              </AnimatePresence>
              {wallet.length === 0 && <p className="text-sm text-center text-gray-500 py-4">No addresses added yet.</p>}
          </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Add New Address</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <Select onValueChange={(value) => setNewAddress(prev => ({...prev, paymentType: value}))} value={newAddress.paymentType}>
                <SelectTrigger><SelectValue placeholder="Select payment type..." /></SelectTrigger>
                <SelectContent>
                    {supportedWallets.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                </SelectContent>
            </Select>
            <Input 
                placeholder="Enter address or username"
                value={newAddress.address}
                onChange={(e) => setNewAddress(prev => ({...prev, address: e.target.value}))}
            />
            <Button onClick={handleAdd} className="w-full"><PlusCircle className="h-4 w-4 mr-2"/>Add Address</Button>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}><Save className="h-4 w-4 mr-2"/>{isSaving ? 'Saving...' : 'Save Wallet'}</Button>
      </div>
    </div>
  );
}