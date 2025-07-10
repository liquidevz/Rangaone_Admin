// app\dashboard\users\page.tsx  
"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { UserFormDialog } from "@/components/user-form-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  type User,
  banUser,
  createUser,
  deleteUser,
  fetchUsers,
  unbanUser,
  updateUser,
} from "@/lib/api-users";
import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import {
  Ban,
  Edit,
  RefreshCw,
  Trash2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToBan, setUserToBan] = useState<User | null>(null);
  const [userToUnban, setUserToUnban] = useState<User | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  console.log("UsersPage component rendered", users);

  // Load users data
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Loading users...");
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Handle user creation
  const handleCreateUser = async (userData: any) => {
    try {
      const newUser = await createUser(userData);
      setUsers((prev) => [...prev, newUser]);
      toast({
        title: "User created successfully",
      });
    } catch (err) {
      console.error("Error creating user:", err);
      toast({
        title: "Failed to create user",
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Handle user update
  const handleUpdateUser = async (userData: any) => {
    if (!userToEdit) return;

    try {
      const updatedUser = await updateUser(userToEdit._id, userData);
      setUsers((prev) =>
        prev.map((user) => (user._id === userToEdit._id ? updatedUser : user))
      );
      toast({
        title: "User updated successfully",
      });
    } catch (err) {
      console.error("Error updating user:", err);
      toast({
        title: "Failed to update user",
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete._id);
      setUsers((prev) => prev.filter((user) => user._id !== userToDelete._id));
      toast({
        title: "User deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting user:", err);
      toast({
        title: "Failed to delete user",
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUserToDelete(null);
    }
  };

  // Handle user ban
  const handleBanUser = async () => {
    if (!userToBan) return;

    try {
      await banUser(userToBan._id);
      // Update the user status in the local state

      await loadUsers();
      toast({
        title: "User banned successfully",
      });
    } catch (err) {
      console.error("Error banning user:", err);
      toast({
        title: "Failed to ban user",
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUserToBan(null);
    }
  };

  // Handle user unban
  const handleUnbanUser = async () => {
    if (!userToUnban) return;

    try {
      await unbanUser(userToUnban._id);

      await loadUsers();
      toast({
        title: "User unbanned successfully",
      });
    } catch (err) {
      console.error("Error unbanning user:", err);
      toast({
        title: "Failed to unban user",
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUserToUnban(null);
    }
  };

  // Define table columns
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => {
        const username = row.getValue("username") as string;
        return username || row.original.email.split("@")[0];
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return role ? (
          <Badge
            variant={
              role === "admin"
                ? "default"
                : role === "manager"
                ? "outline"
                : "secondary"
            }
          >
            {role}
          </Badge>
        ) : (
          <Badge variant="secondary">user</Badge>
        );
      },
    },
    {
      accessorKey: "emailVerified",
      header: "Status",
      cell: ({ row }) => {
        const emailVerified = row.getValue("emailVerified") as boolean;
        const isBanned = row.original.isBanned;
        return (
          <Badge
            variant={
              isBanned ? "destructive" : emailVerified ? "success" : "secondary"
            }
          >
            {isBanned ? "Banned" : emailVerified ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const createdAt = row.getValue("createdAt") as string;
        return createdAt
          ? formatDistanceToNow(new Date(createdAt), { addSuffix: true })
          : "Unknown";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const user = row.original;
        const isBanned = user.banInfo;

        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setUserToEdit(user);
                setIsEditDialogOpen(true);
              }}
              className="h-8 w-8"
              title="Edit User"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>

            {isBanned ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUserToUnban(user)}
                className="h-8 w-8"
                title="Unban User"
              >
                <UserCheck className="h-4 w-4" />
                <span className="sr-only">Unban</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setUserToBan(user)}
                className="h-8 w-8"
                title="Ban User"
              >
                <Ban className="h-4 w-4" />
                <span className="sr-only">Ban</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setUserToDelete(user)}
              className="h-8 w-8 text-destructive hover:text-destructive"
              title="Delete User"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage user accounts and permissions.
          </p>
        </div>
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg overflow-hidden">
        {/* Mobile: Add horizontal scroll wrapper for table */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px]">
            <DataTable
              columns={columns}
              data={users}
              searchColumn="email"
              isLoading={loading}
            />
          </div>
        </div>
      </div>

      {/* Create User Dialog */}
      <UserFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateUser}
      />

      {/* Edit User Dialog */}
      {userToEdit && (
        <UserFormDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setUserToEdit(null);
          }}
          onSubmit={handleUpdateUser}
          user={userToEdit}
          title="Edit User"
        />
      )}

      {/* Delete User Confirmation */}
      <ConfirmDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description={`Are you sure you want to delete ${
          userToDelete?.username || userToDelete?.email
        }? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Ban User Confirmation */}
      <ConfirmDialog
        open={!!userToBan}
        onOpenChange={(open) => !open && setUserToBan(null)}
        onConfirm={handleBanUser}
        title="Ban User"
        description={`Are you sure you want to ban ${
          userToBan?.username || userToBan?.email
        }? They will no longer be able to access the system.`}
        confirmText="Ban User"
        cancelText="Cancel"
      />

      {/* Unban User Confirmation */}
      <ConfirmDialog
        open={!!userToUnban}
        onOpenChange={(open) => !open && setUserToUnban(null)}
        onConfirm={handleUnbanUser}
        title="Unban User"
        description={`Are you sure you want to unban ${
          userToUnban?.username || userToUnban?.email
        }? They will regain access to the system.`}
        confirmText="Unban User"
        cancelText="Cancel"
      />
    </div>
  );
}
