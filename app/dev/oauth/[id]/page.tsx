'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/checkbox';
import Header from '@/components/Header';
import { Copy, Eye, EyeOff, Trash2, ArrowLeft, Edit, Save, X, PlusCircle, Trash, Users, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// --- Interfaces and Constants ---

// UPDATED: User interface to allow for null values
interface AuthorizedUser {
    _id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatar: string | null;
    authorizedAt: string;
}


interface OAuthClient {
    _id: string;
    name: string;
    description: string;
    appLogo?: string;
    homepageUrl?: string;
    clientId: string;
    clientSecret: string;
    redirectUris: string[];
    grantedScopes: string[];
    createdAt: string;
    // NEW: Add authorizedUsers to the client interface
    authorizedUsers: AuthorizedUser[];
}

const AVAILABLE_SCOPES = [
    { id: 'profile:read', description: 'Read basic profile information.' },
    { id: 'email:read', description: "Read the user's email address." },
    { id: 'profile:write', description: "Update the user's profile information." },
    { id: 'links:read', description: "Read user's links." },
    { id: 'links:write', description: "Add or update user's links." },
];


// --- Component ---
export default function OAuthClientDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [client, setClient] = useState<OAuthClient | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editData, setEditData] = useState<Partial<OAuthClient>>({});

    useEffect(() => {
        if (!id) return;

        const fetchClientDetails = async () => {
            try {
                const res = await fetch(`/api/dev/oauth-clients?id=${id}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Failed to fetch client details');
                }
                const data = await res.json();
                setClient(data.client);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'An error occurred.');
                router.push('/dev');
            } finally {
                setIsLoading(false);
            }
        };

        fetchClientDetails();
    }, [id, router]);

    // ... (All your existing handlers: handleEditToggle, handleInputChange, etc. remain the same)
    const handleEditToggle = () => {
        if (!client) return;
        if (!isEditing) {
            // Entering edit mode, populate form with current client data
            setEditData({
                name: client.name,
                description: client.description,
                appLogo: client.appLogo,
                homepageUrl: client.homepageUrl,
                redirectUris: [...client.redirectUris],
                grantedScopes: [...client.grantedScopes],
            });
        }
        setIsEditing(!isEditing);
    };

    const handleInputChange = (field: keyof OAuthClient, value: unknown) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    const handleRedirectUriChange = (index: number, value: string) => {
        const newUris = [...(editData.redirectUris || [])];
        newUris[index] = value;
        setEditData(prev => ({ ...prev, redirectUris: newUris }));
    };

    const addRedirectUri = () => {
        const newUris = [...(editData.redirectUris || []), ''];
        setEditData(prev => ({ ...prev, redirectUris: newUris }));
    };

    const removeRedirectUri = (index: number) => {
        const newUris = (editData.redirectUris || []).filter((_, i) => i !== index);
        setEditData(prev => ({ ...prev, redirectUris: newUris }));
    };

    const handleScopeChange = (scopeId: string, checked: boolean) => {
        setEditData(prev => {
            const scopes = new Set(prev.grantedScopes);
            if (checked) scopes.add(scopeId);
            else scopes.delete(scopeId);
            return { ...prev, grantedScopes: Array.from(scopes) };
        });
    };

    const handleSaveChanges = async () => {
        if (!id) return;
        setIsSaving(true);
        try {
            const response = await fetch(`/api/dev/oauth-clients?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editData),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to save changes');
            }

            // Update local client state with new data
            setClient(prev => prev ? { ...prev, ...editData } as OAuthClient : null);
            toast.success('Application updated successfully!');
            setIsEditing(false);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${field} copied to clipboard!`);
    };

    // IMPLEMENTED: The delete logic
    const deleteClient = async () => {
        if (!client || !confirm(`Are you sure you want to delete "${client.name}"? This is irreversible.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/dev/oauth-clients?id=${client._id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete application.');
            }

            toast.success("Application deleted successfully.");
            router.push('/dev');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="text-center py-20">
                    <p>Client not found.</p>
                    <Button onClick={() => router.push('/dev')} className="mt-4">
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    {/* --- Top control buttons --- */}
                    <div className="flex justify-between items-center">
                        <Button variant="outline" onClick={() => router.push('/dev')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                        <div className="flex space-x-2">
                            {isEditing ? (
                                <>
                                    <Button variant="outline" onClick={handleEditToggle} disabled={isSaving}>
                                        <X className="h-4 w-4 mr-2" /> Cancel
                                    </Button>
                                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                                        <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={handleEditToggle}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit Application
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* --- Main Application Details Card --- */}
                    <Card>
                         {/* Card Header, Content, and other sections remain the same */}
                        <CardHeader className="flex flex-row items-start space-x-6">
                            <img
                                src={isEditing ? editData.appLogo || '...' : client?.appLogo || '...'}
                                alt="App Logo"
                                className="w-24 h-24 rounded-lg border object-cover bg-gray-100"
                            />
                            <div>
                                {isEditing ? (
                                    <Input
                                        value={editData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className="text-3xl font-bold p-2 h-auto mb-1"
                                    />
                                ) : (
                                    <CardTitle className="text-3xl font-bold">{client?.name}</CardTitle>
                                )}
                                {isEditing ? (
                                    <Input
                                        value={editData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        className="mt-1"
                                    />
                                ) : (
                                    <CardDescription>{client?.description}</CardDescription>
                                )}
                                {isEditing ? (
                                    <Input
                                        value={editData.homepageUrl}
                                        onChange={(e) => handleInputChange('homepageUrl', e.target.value)}
                                        className="mt-2 text-sm"
                                    />
                                ) : (
                                    <a href={client?.homepageUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-2 block">
                                        {client?.homepageUrl}
                                    </a>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isEditing && (
                                <div className="p-4 border-t">
                                    <h4 className="font-medium mb-3">Application Logo URL</h4>
                                    <Input placeholder="https://example.com/logo.png" value={editData.appLogo || ''} onChange={e => handleInputChange('appLogo', e.target.value)} />
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-gray-700">Client ID</label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <code className="flex-1 bg-gray-100 p-2 rounded text-sm font-mono break-all">{client.clientId}</code>
                                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(client.clientId, 'Client ID')}><Copy className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Client Secret</label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <code className="flex-1 bg-gray-100 p-2 rounded text-sm font-mono break-all">
                                        {showSecret ? client.clientSecret : '•'.repeat(client.clientSecret.length)}
                                    </code>
                                    <Button variant="outline" size="sm" onClick={() => setShowSecret(!showSecret)}>
                                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(client.clientSecret, 'Client Secret')}><Copy className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div>
                                    <h4 className="font-medium mb-2">Redirect URIs</h4>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            {editData.redirectUris?.map((uri, i) => (
                                                <div key={i} className="flex items-center space-x-2">
                                                    <Input value={uri} onChange={e => handleRedirectUriChange(i, e.target.value)} />
                                                    <Button variant="ghost" size="icon" onClick={() => removeRedirectUri(i)}><Trash className="h-4 w-4 text-red-500" /></Button>
                                                </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={addRedirectUri}><PlusCircle className="h-4 w-4 mr-2" />Add URI</Button>
                                        </div>
                                    ) : (
                                        client.redirectUris.map((uri, i) => <code key={i} className="block bg-gray-100 p-2 rounded text-sm font-mono break-all mb-2">{uri}</code>)
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2">Granted Scopes</h4>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            {AVAILABLE_SCOPES.map(scope => (
                                                <div key={scope.id} className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={`edit-${scope.id}`}
                                                        checked={editData.grantedScopes?.includes(scope.id)}
                                                        onCheckedChange={(checked) => handleScopeChange(scope.id, !!checked)}
                                                    />
                                                    <label htmlFor={`edit-${scope.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{scope.id}</label>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <ul className="list-disc list-inside space-y-1">
                                            {client.grantedScopes.map((scope) => <li key={scope}><code className="text-sm">{scope}</code></li>)}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            {!isEditing && (
                                <div className="pt-6 border-t border-red-200">
                                    <h4 className="text-red-600 font-bold">Danger Zone</h4>
                                    <div className="flex justify-between items-center mt-2 p-4 bg-red-50 rounded-lg">
                                        <div>
                                            <p className="font-semibold">Delete Application</p>
                                            <p className="text-sm text-gray-600">This action is irreversible and will permanently delete the application.</p>
                                        </div>
                                        <Button variant="destructive" onClick={deleteClient} disabled={isDeleting}>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            {isDeleting ? 'Deleting...' : 'Delete'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
{/* --- UPDATED: Authorized Users Card with privacy-aware rendering --- */}
                    {!isEditing && client.authorizedUsers && client.authorizedUsers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Users className="h-6 w-6 mr-3" />
                                    Authorized Users ({client.authorizedUsers.length})
                                </CardTitle>
                                <CardDescription>
                                    Users who have granted this application access. Data shown is based on permissions granted.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {client.authorizedUsers.map(user => (
                                        <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                            <div className="flex items-center space-x-4">
                                                <img 
                                                    src={'https://whatsyourinfo-media-worker.dishis.workers.dev' + user.avatar || 'https://avatar.vercel.sh/default'} 
                                                    alt={user.username || 'User Avatar'}
                                                    className="w-10 h-10 rounded-full bg-gray-200"
                                                />
                                                <div>
                                                    <p className="font-semibold text-gray-900">{user.username || 'Name not available'}</p>
                                                    {user.email ? (
                                                      <p className="text-sm text-gray-500">{user.email}</p>
                                                    ) : (
                                                      <p className="text-xs text-amber-600 flex items-center">
                                                          <ShieldAlert className="h-3 w-3 mr-1" />
                                                          Email permission not granted
                                                      </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Authorized on</p>
                                                <p className="text-sm font-medium text-gray-600">{new Date(user.authorizedAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            </div>
        </div>
    );
}