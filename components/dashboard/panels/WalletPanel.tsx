'use client';

import { useState } from 'react';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';
import { Trash2, PlusCircle, CreditCard, Landmark, Wallet as WalletIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SiPaypal, SiVenmo, SiPatreon, SiBitcoin, SiEthereum,
  SiDogecoin, SiBuymeacoffee, SiKofi, SiCashapp, SiSolana, SiRipple, SiCardano
} from 'react-icons/si';
import { MinimalDialog } from '@/components/ui/MinimalDialog';

// Expanded wallet icons with more cryptos and a generic fallback
const walletIcons: Record<string, any> = {
  'PayPal.me': SiPaypal,
  'Venmo': SiVenmo,
  'Cash App': SiCashapp,
  'Patreon': SiPatreon,
  'BuyMeACoffee': SiBuymeacoffee,
  'Ko-fi': SiKofi,
  'Bitcoin (BTC)': SiBitcoin,
  'Ethereum (ETH)': SiEthereum,
  'Solana (SOL)': SiSolana,
  'Cardano (ADA)': SiCardano,
  'Ripple (XRP)': SiRipple,
  'Dogecoin (DOGE)': SiDogecoin,
  'Custom Payment': Landmark, // Generic icon for custom payments
  'Custom Currency': WalletIcon, // Generic icon for custom currencies
};

const supportedWallets = [
  'PayPal.me', 'Venmo', 'Cash App', 'Patreon', 'BuyMeACoffee', 'Ko-fi',
  'Bitcoin (BTC)', 'Ethereum (ETH)', 'Solana (SOL)'
];

interface WalletPanelProps {
  user: UserProfile;
  onUpdate: (data: Partial<UserProfile>) => void;
  changesSaved: (a: boolean) => void;
}

export default function WalletPanel({ user, onUpdate, changesSaved }: WalletPanelProps) {
  const [wallet, setWallet] = useState(user.wallet || []);
  const [showOnPublic, setShowOnPublic] = useState(user.showWalletOnPublic ?? true);

  // State for active accordion and editing
  const [activeWallet, setActiveWallet] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<string>('');

  // State for dialogs
  const [isPaymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [isCurrencyDialogOpen, setCurrencyDialogOpen] = useState(false);

  // State for forms
  const [newAddress, setNewAddress] = useState('');
  const [customType, setCustomType] = useState('');
  const [customCurrency, setCustomCurrency] = useState('');

  const handleAddWallet = async (type: string, address: string) => {
    if (!type.trim() || !address.trim()) {
      return toast.error('Please provide both a type and an address.');
    }

    const entry = {
      id: new Date().toISOString(),
      paymentType: type,
      address,
    };

    const updatedWallet = [...wallet, entry];
    setWallet(updatedWallet);
    onUpdate({ wallet: updatedWallet });

    // Reset forms and close dialogs
    setNewAddress('');
    setCustomType('');
    setCustomCurrency('');
    setActiveWallet(null);
    setPaymentDialogOpen(false);
    setCurrencyDialogOpen(false);

    try {
      await fetch('/api/profile/wallet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: updatedWallet }),
      });
      changesSaved(true);
      toast.success(`Added ${type} successfully!`);
    } catch {
      toast.error('Failed to save your new wallet.');
      setWallet(wallet); // Revert state on failure
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
      toast.error('Failed to remove wallet.');
    }
  };

  const handleUpdateAddress = async (id: string, newAddress: string) => {
    const updated = wallet.map(w => w.id === id ? { ...w, address: newAddress } : w);
    setWallet(updated);
    onUpdate({ wallet: updated });
    setEditingId(null);
    try {
      await fetch('/api/profile/wallet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: updated }),
      });
      toast.success('Wallet updated!');
    } catch {
      toast.error('Failed to update wallet.');
    }
  };

  const handleTogglePublic = async (val: boolean) => {
    setShowOnPublic(val);
    onUpdate({ showWalletOnPublic: val });
    try {
      await fetch('/api/profile/wallet/show', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showWalletOnPublic: val }),
      });
    } catch {
      toast.error('Failed to update visibility.');
    }
  };

  return (
    <div className="space-y-8 p-1">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
        <p className="text-gray-500">Add payment methods to receive support.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <label htmlFor="show-wallet" className="font-medium text-gray-700">Show on public profile</label>
          <Switch id="show-wallet" checked={showOnPublic} onCheckedChange={handleTogglePublic} />
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
                          onChange={(e) => {
                            setEditingAddress(e.target.value)
                            changesSaved(false)
                          }}
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
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 mb-3">Add New Method</h3>
        <div className="space-y-2">
          {supportedWallets.map(type => {
            const Icon = walletIcons[type];
            const isActive = activeWallet === type;
            return (
              <div key={type}>
                <button
                  onClick={() => setActiveWallet(isActive ? null : type)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                  {type}
                </button>
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pt-2 pl-4"
                    >
                      <div className="flex gap-2">
                        <Input
                          placeholder={`Your ${type} address or username`}
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                        />
                        <Button onClick={() => handleAddWallet(type, newAddress)} size="sm" className="whitespace-nowrap">
                          <PlusCircle className="h-4 w-4 mr-1.5" /> Add
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

      {/* Custom Buttons using MinimalDialog */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={() => setPaymentDialogOpen(true)}>
          <Landmark className="h-4 w-4 mr-2" /> Add Custom Payment
        </Button>
        <Button variant="outline" onClick={() => setCurrencyDialogOpen(true)}>
          <WalletIcon className="h-4 w-4 mr-2" /> Add Custom Currency
        </Button>
      </div>

      <MinimalDialog isOpen={isPaymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} title="Add Custom Payment">
        <div className="space-y-4">
          <Input placeholder="Payment method (e.g., UPI, Gift Card)" value={customType} onChange={e => setCustomType(e.target.value)} />
          <Input placeholder="Address or ID" value={newAddress} onChange={e => setNewAddress(e.target.value)} />
          <Button onClick={() => handleAddWallet(customType || 'Custom Payment', newAddress)} className="w-full">
            Add Payment Method
          </Button>
        </div>
      </MinimalDialog>

      <MinimalDialog isOpen={isCurrencyDialogOpen} onClose={() => setCurrencyDialogOpen(false)} title="Add Custom Currency">
        <div className="space-y-4">
          <Input placeholder="Currency name (e.g., Monero, XMR)" value={customCurrency} onChange={e => setCustomCurrency(e.target.value)} />
          <Input placeholder="Wallet address" value={newAddress} onChange={e => setNewAddress(e.target.value)} />
          <Button onClick={() => handleAddWallet(customCurrency || 'Custom Currency', newAddress)} className="w-full">
            Add Currency
          </Button>
        </div>
      </MinimalDialog>
    </div>
  );
}