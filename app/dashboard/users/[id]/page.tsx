"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchUserById, updateUser, deleteUser, banUser, unbanUser, type User } from "@/lib/api-users"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { UserFormDialog } from "@/components/user-form-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Ban, UserCheck, RefreshCw, Clock, Mail, UserIcon } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false)
  const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Load user data
  const loadUser = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchUserById(params.id)
      setUser(data)
    } catch (err) {
      console.error("Error loading user:", err)
      setError(err instanceof Error ? err.message : "Failed to load user")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [params.id])

  // Handle user update
  const handleUpdateUser = async (userData: any) => {
    try {
      const updatedUser = await updateUser(params.id, userData)
      setUser(updatedUser)
      toast({
        title: "User updated successfully",
      })
    } catch (err) {
      console.error("Error updating user:", err)
      toast({
        title: "Failed to update user",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
      throw err
    }
  }

  // Handle user deletion
  const handleDeleteUser = async () => {
    try {
      await deleteUser(params.id)
      toast({
        title: "User deleted successfully",
      })
      router.push("/dashboard/users")
    } catch (err) {
      console.error("Error deleting user:", err)
      toast({
        title: "Failed to delete user",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  // Handle user ban
  const handleBanUser = async () => {
    try {
      await banUser(params.id)
      // Update the user status in the local state
      setUser((user) => (user ? { ...user, emailVerified: false, status: "inactive", isBanned: true } : null))
      toast({
        title: "User banned successfully",
      })
    } catch (err) {
      console.error("Error banning user:", err)
      toast({
        title: "Failed to ban user",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  // Handle user unban
  const handleUnbanUser = async () => {
    try {
      await unbanUser(params.id)
      // Update the user status in the local state
      setUser((user) => (user ? { ...user, emailVerified: true, status: "active", isBanned: false } : null))
      toast({
        title: "User unbanned successfully",
      })
    } catch (err) {
      console.error("Error unbanning user:", err)
      toast({
        title: "Failed to unban user",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="outline" onClick={() => router.push("/dashboard/users")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={loadUser}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="outline" onClick={() => router.push("/dashboard/users")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested user could not be found.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/dashboard/users")}>Return to Users</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const isBanned = !user.emailVerified || user.isBanned

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.push("/dashboard/users")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadUser}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          {isBanned ? (
            <Button variant="outline" onClick={() => setIsUnbanDialogOpen(true)}>
              <UserCheck className="h-4 w-4 mr-2" />
              Unban
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setIsBanDialogOpen(true)}>
              <Ban className="h-4 w-4 mr-2" />
              Ban
            </Button>
          )}
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>{user.username || user.email.split("@")[0]}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
            <div className="flex gap-2">
              {user.role && (
                <Badge variant={user.role === "admin" ? "default" : user.role === "manager" ? "outline" : "secondary"}>
                  {user.role}
                </Badge>
              )}
              <Badge variant={isBanned ? "destructive" : user.emailVerified ? "success" : "secondary"}>
                {isBanned ? "Banned" : user.emailVerified ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">User Information</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Username:</span>
                  <span className="ml-2">{user.username || "Not set"}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{user.email}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Provider:</span>
                  <span className="ml-2">{user.provider || "Local"}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Email Verified:</span>
                  <span className="ml-2">{user.emailVerified ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Timestamps</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span className="ml-2">
                    {format(new Date(user.createdAt), "PPP")} (
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })})
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">Updated:</span>
                  <span className="ml-2">
                    {format(new Date(user.updatedAt), "PPP")} (
                    {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <UserFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateUser}
        user={user}
        title="Edit User"
      />

      {/* Delete User Confirmation */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description={`Are you sure you want to delete ${user.username || user.email}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Ban User Confirmation */}
      <ConfirmDialog
        open={isBanDialogOpen}
        onOpenChange={setIsBanDialogOpen}
        onConfirm={handleBanUser}
        title="Ban User"
        description={`Are you sure you want to ban ${user.username || user.email}? They will no longer be able to access the system.`}
        confirmText="Ban User"
        cancelText="Cancel"
      />

      {/* Unban User Confirmation */}
      <ConfirmDialog
        open={isUnbanDialogOpen}
        onOpenChange={setIsUnbanDialogOpen}
        onConfirm={handleUnbanUser}
        title="Unban User"
        description={`Are you sure you want to unban ${user.username || user.email}? They will regain access to the system.`}
        confirmText="Unban User"
        cancelText="Cancel"
      />
    </div>
  )
}
