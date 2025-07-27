'use client';

import { useState } from 'react';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';
import { Trash2, PlusCircle, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SiPaypal, SiVenmo, SiPatreon, SiBitcoin, SiEthereum,
  SiDogecoin, SiBuymeacoffee, SiKofi, SiCashapp
} from 'react-icons/si';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

const walletIcons: Record<string, any> = {
  'PayPal.me': SiPaypal,
  'Venmo': SiVenmo,
  'Patreon': SiPatreon,
  'Bitcoin (BTC)': SiBitcoin,
  'Ethereum (ETH)': SiEthereum,
  'Dogecoin (DOGE)': SiDogecoin,
  'BuyMeACoffee': SiBuymeacoffee,
  'Ko-fi': SiKofi,
  'Cash App': SiCashapp
};

const supportedWallets = Object.keys(walletIcons);

interface WalletPanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
  changesSaved: (a: boolean) => void;
}

export default function WalletPanel({ user, onUpdate, changesSaved }: WalletPanelProps) {
  const [wallet, setWallet] = useState(user.wallet || []);
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [showOnPublic, setShowOnPublic] = useState(user.showWalletOnPublic ?? true);

  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customType, setCustomType] = useState('');
  const [customIcon, setCustomIcon] = useState<string>('CreditCard');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<string>('');


  const handleAddWallet = async (type: string, address: string, icon?: string) => {
    if (!type || !address) return toast.error('Type and address required');

    const entry = {
      id: new Date().toISOString(),
      paymentType: type,
      address,
      icon
    };

    const updated = [...wallet, entry];
    setWallet(updated);
    onUpdate({ wallet: updated });
    setNewAddress('');
    setActiveWallet(null);
    setCustomType('');
    setCustomIcon('');

    try {
      await fetch('/api/profile/wallet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: updated }),
      });
      toast.success(`${type} added`);
      changesSaved(true)
    } catch {
      toast.error('Failed to save');
    }
  };

  const handleTogglePublic = async (val: boolean) => {
    setShowOnPublic(val);
    onUpdate({ showWalletOnPublic: val });

    try {
      await fetch('/api/profile/show-wallet-toggle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showWalletOnPublic: val }),
      });
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  const handleRemove = async (id: string) => {
    const updated = wallet.filter(w => w.id !== id);
    setWallet(updated);
    onUpdate({ wallet: updated });

    try {
      await fetch('/api/profile/wallet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: updated }),
      });
      changesSaved(true)
    } catch {
      toast.error('Failed to remove');
    }
  };

  const IconRender = ({ icon }: { icon?: string }) => {
    const Icon = (icon && walletIcons[icon]) || CreditCard;
    return <Icon className="h-4 w-4" />;
  };

  if (!user.isProUser) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Wallet</h1>
        <p className="text-sm text-gray-500 mt-2">
          This is a Pro feature. Upgrade your account to add payment links.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm">
      <div>
        <h1 className="text-xl font-semibold">Wallet</h1>
        <div className="flex items-center justify-between mt-2">
          <label className="text-sm font-medium">Show wallet on public profile</label>
          <Switch checked={showOnPublic} onCheckedChange={handleTogglePublic} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Your wallet information will still be available via our API. <a href="/docs#wallet" className="underline">Learn more</a>
        </p>
      </div>

      {/* Current Wallets */}
      <div className="space-y-2">
        <AnimatePresence>
          {wallet.map(item => {
            const isEditing = editingId === item.id;
            const Icon = walletIcons[item.paymentType] || CreditCard;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-gray-100 rounded px-3 py-2"
              >
                <button
                  className="w-full flex items-center justify-between"
                  onClick={() => {
                    setEditingId(isEditing ? null : item.id);
                    setEditingAddress(item.address);
                  }}
                >
                  <div className="flex items-center gap-2 text-left">
                    <Icon className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{item.paymentType}</p>
                      <p className="text-xs text-gray-600 truncate max-w-[250px]">{item.address}</p>
                    </div>
                  </div>
                  <Trash2
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(item.id);
                    }}
                    className="h-4 w-4 text-red-500"
                  />
                </button>

                <AnimatePresence>
                  {isEditing && (
                    <motion.div
                      key={`${item.id}-edit`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-2"
                    >
                      <Input
                        placeholder={`Edit your ${item.paymentType} address`}
                        value={editingAddress}
                        onChange={(e) => {setEditingAddress(e.target.value)
      changesSaved(false)}}
                        className="text-sm"
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          onClick={async () => {
                            const updated = wallet.map(w =>
                              w.id === item.id ? { ...w, address: editingAddress } : w
                            );
                            setWallet(updated);
                            onUpdate({ wallet: updated });
                            setEditingId(null);

                            try {
                              await fetch('/api/profile/wallet', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ wallet: updated }),
                              });
                              toast.success('Wallet updated');
                            } catch {
                              toast.error('Update failed');
                            }
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {wallet.length === 0 && <p className="text-gray-400 text-center">No addresses added yet.</p>}
      </div>

      {/* Predefined Wallets */}
      <div>
        <p className="font-medium mb-2">Add new wallet</p>
        <div className="space-y-2">
          {supportedWallets.map(type => {
            const Icon = walletIcons[type];
            const isActive = activeWallet === type;

            return (
              <div key={type} className="space-y-1">
                <button
                  onClick={() => {
                    setActiveWallet(isActive ? null : type);
                    setNewAddress('');
                  }}
                  className={`w-full flex items-center justify-start gap-2 px-3 py-2 rounded-md text-sm transition ${isActive ? 'bg-black text-white' : 'bg-gray-100 text-black'
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {type}
                </button>

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      key={`${type}-input`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pl-2 pt-2"
                    >
                      <Input
                        placeholder={`Enter your ${type} address or username`}
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        className="text-sm"
                      />
                      <div className="flex justify-end mt-2">
                        <Button onClick={() => handleAddWallet(type, newAddress)} size="sm">
                          <PlusCircle className="h-4 w-4 mr-2" /> Add Address
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Button Dialog */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
        <Dialog open={customDialogOpen} onOpenChange={setCustomDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="justify-start">➕ Add custom payment</Button>
          </DialogTrigger>
          <DialogContent className="space-y-4">
            <p className="font-semibold">Custom Payment</p>
            <Input placeholder="Label (e.g. UPI, Razorpay)" value={customType} onChange={e => setCustomType(e.target.value)} />
            <Input placeholder="Payment Address" value={newAddress} onChange={e => setNewAddress(e.target.value)} />
            <Button onClick={() => {
              handleAddWallet(customType, newAddress, customIcon);
              setCustomDialogOpen(false);
            }}>
              Add Custom
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="justify-start">💱 Add custom currency</Button>
          </DialogTrigger>
          <DialogContent>
            <p className="text-sm">Coming soon</p>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
