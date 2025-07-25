'use client';
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SiX, SiLinkedin, SiGithub } from 'react-icons/si';
import toast from 'react-hot-toast';

const serviceList = [
  { name: 'X (Twitter)', icon: SiX },
  { name: 'LinkedIn', icon: SiLinkedin },
  { name: 'GitHub', icon: SiGithub },
  // ... add all other services
];

export default function VerifiedAccountsPanel({ user, onUpdate }) {
  const [connected, setConnected] = useState(user.verifiedAccounts || []);
  
  const handleConnect = (serviceName: string) => {
    // In a real app, this would trigger an OAuth flow.
    // For now, we'll simulate adding a link.
    const url = prompt(`Enter your ${serviceName} profile URL:`);
    if (url) {
      const newAccount = { service: serviceName, url };
      // API call to POST '/api/profile/verified-accounts'
      // On success:
      const updatedAccounts = [...connected, newAccount];
      setConnected(updatedAccounts);
      onUpdate({ verifiedAccounts: updatedAccounts });
      toast.success(`${serviceName} connected!`);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Verified Accounts</h1>
      <Card>
        <CardHeader><CardTitle>Connected Accounts</CardTitle></CardHeader>
        <CardContent>
          {/* List connected accounts here */}
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader><CardTitle>Connect More Services</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {serviceList.map(service => (
            <Button key={service.name} variant="outline" onClick={() => handleConnect(service.name)}>
              <service.icon className="h-5 w-5 mr-2" />
              {service.name}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}