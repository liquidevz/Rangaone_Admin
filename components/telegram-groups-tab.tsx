// components/telegram-groups-tab.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Package,
} from "lucide-react";
import {
  TelegramGroup,
  Product,
  getGroups,
  getUnmappedGroups,
  getProducts,
  getGroupMembers,
  type GroupMemberRecord,
  regenerateInvite,
  kickUser,
} from "@/lib/api-telegram-bot";

export function GroupsTab() {
  const { toast } = useToast();
  const [allGroups, setAllGroups] = useState<TelegramGroup[]>([]);
  const [unmappedGroups, setUnmappedGroups] = useState<TelegramGroup[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMemberRecord[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string>("");
  const [inviteResult, setInviteResult] = useState<{ link: string | null; token: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading groups data...');
      const [groupsData, unmappedData, productsData] = await Promise.all([
        getGroups(),
        getUnmappedGroups(),
        getProducts(),
      ]);
      
      console.log('Groups data loaded:', {
        allGroups: groupsData.length,
        unmappedGroups: unmappedData.length,
        products: productsData.length
      });
      
      setAllGroups(groupsData);
      setUnmappedGroups(unmappedData);
      setProducts(productsData);
      
      // Show success message if data is loaded
      if (groupsData.length > 0 || unmappedData.length > 0) {
        toast({
          title: "Success",
          description: `Loaded ${groupsData.length} groups (${unmappedData.length} unmapped)`,
        });
      }
    } catch (error) {
      console.error("Failed to load groups data:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Error",
        description: `Failed to load groups data: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openMembersDialog = async (group: TelegramGroup) => {
    setSelectedGroup(group);
    setIsMembersDialogOpen(true);
    setIsMembersLoading(true);
    try {
      const members = await getGroupMembers(group.telegram_group_id);
      setGroupMembers(members);
    } catch (error) {
      console.error("Failed to load group members:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({ 
        title: "Error", 
        description: `Failed to load group members: ${errorMessage}`, 
        variant: "destructive" 
      });
    } finally {
      setIsMembersLoading(false);
    }
  };

  const handleKick = async (member: GroupMemberRecord) => {
    if (!selectedGroup) return;
    if (!confirm(`Kick user ${member.username || member.telegram_user_id}?`)) return;
    try {
      const res = await kickUser({ telegram_group_id: selectedGroup.telegram_group_id, telegram_user_id: member.telegram_user_id });
      toast({ title: res.success ? "Success" : "Info", description: res.message });
      // Refresh members
      const members = await getGroupMembers(selectedGroup.telegram_group_id);
      setGroupMembers(members);
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to kick user", variant: "destructive" });
    }
  };

  const openInviteDialog = (group: TelegramGroup) => {
    setSelectedGroup(group);
    setInviteToken("");
    setInviteResult(null);
    setIsInviteDialogOpen(true);
  };

  const handleRegenerateInvite = async () => {
    if (!selectedGroup) return;
    try {
      const res = await regenerateInvite({ telegram_group_id: selectedGroup.telegram_group_id, token: inviteToken || undefined });
      setInviteResult({ link: res.invite_link, token: res.token });
      toast({ title: res.success ? "Invite Regenerated" : "Info", description: res.message });
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to regenerate invite", variant: "destructive" });
    }
  };

  const getProductName = (productId: string | null) => {
    if (!productId) return null;
    const product = products.find(p => p.id === productId);
    return product?.name || 'Unknown Product';
  };

  const mappedGroups = allGroups.filter(g => g.product_id !== null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading groups...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              All Telegram groups
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mapped Groups</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mappedGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              Connected to products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unmapped Groups</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unmappedGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              Not connected to products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Groups Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Telegram Groups
              </CardTitle>
              <CardDescription>
                View and manage all Telegram groups
              </CardDescription>
            </div>
            <Button onClick={loadData} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Details</TableHead>
                <TableHead>Product Mapping</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No groups found
                  </TableCell>
                </TableRow>
              ) : (
                allGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{group.telegram_group_name}</div>
                        <div className="text-sm text-muted-foreground font-mono">
                          ID: {group.telegram_group_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {group.product_id ? (
                        <div>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Mapped
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            <Package className="inline h-3 w-3 mr-1" />
                            {getProductName(group.product_id)}
                          </div>
                        </div>
                      ) : (
                        <Badge variant="outline" className="border-orange-500 text-orange-600">
                          Unmapped
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(group.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(group.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openMembersDialog(group)}>Members</Button>
                        <Button variant="outline" size="sm" onClick={() => openInviteDialog(group)}>Regenerate Invite</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Members Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Group Members</DialogTitle>
            <DialogDescription>
              {selectedGroup ? `${selectedGroup.telegram_group_name} (${selectedGroup.telegram_group_id})` : ''}
            </DialogDescription>
          </DialogHeader>
          {isMembersLoading ? (
            <div className="flex items-center justify-center p-4">Loading...</div>
          ) : groupMembers.length === 0 ? (
            <div className="text-sm text-muted-foreground">No members found</div>
          ) : (
            <div className="max-h-96 overflow-auto space-y-2">
              {groupMembers.map((m) => (
                <div key={m.telegram_user_id} className="flex items-center justify-between border rounded p-2">
                  <div>
                    <div className="font-medium">{m.username || `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">ID: {m.telegram_user_id}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleKick(m)}>Kick</Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Regenerate Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Invite Link</DialogTitle>
            <DialogDescription>
              {selectedGroup ? `For ${selectedGroup.telegram_group_name}` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm">Custom Token (optional)</label>
              <Input value={inviteToken} onChange={(e) => setInviteToken(e.target.value)} placeholder="Enter custom token" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleRegenerateInvite}>Regenerate</Button>
            </div>
            {inviteResult && (
              <div className="space-y-1">
                <div className="text-sm">Token: <span className="font-mono">{inviteResult.token}</span></div>
                <div className="text-sm">Invite Link: {inviteResult.link ? <a className="text-blue-600 underline" href={inviteResult.link} target="_blank" rel="noreferrer">Open</a> : 'None'}</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}