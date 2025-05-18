"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, Pencil, Trash2, RefreshCw, Mail, Upload, MoreHorizontal, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchConfigs, createConfig, updateConfig, deleteConfig, fetchConfigByKey, type Config } from "@/lib/api"
import { ConfigFormDialog } from "@/components/config-form-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { SmtpTestDialog } from "@/components/smtp-test-dialog"
import { BulkUpdateDialog } from "@/components/bulk-update-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ColumnDef } from "@tanstack/react-table"

// Add this helper function at the top of the component
const formatCurrency = (value: number) => {
  // Convert USD to INR
  const inrValue = value * 83.5
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(inrValue)
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<Config[]>([])
  const [filteredConfigs, setFilteredConfigs] = useState<Config[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [smtpTestDialogOpen, setSmtpTestDialogOpen] = useState(false)
  const [bulkUpdateDialogOpen, setBulkUpdateDialogOpen] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<Config | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("configurations")
  const { toast } = useToast()

  const loadConfigs = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchConfigs()
      setConfigs(data)
      setFilteredConfigs(data)
    } catch (error) {
      console.error("Error loading configurations:", error)
      toast({
        title: "Failed to load configurations",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadConfigs()
  }, [loadConfigs])

  // Filter configs when category filter changes
  useEffect(() => {
    if (categoryFilter === "all") {
      setFilteredConfigs(configs)
    } else {
      setFilteredConfigs(configs.filter((config) => config.category === categoryFilter))
    }
  }, [categoryFilter, configs])

  const handleCreateConfig = async (configData: {
    key: string
    value: string
    category?: string
    description?: string
    isSecret?: boolean
  }) => {
    try {
      await createConfig(configData)
      toast({
        title: "Configuration Created",
        description: `Configuration ${configData.key} has been created successfully`,
      })
      loadConfigs()
    } catch (error) {
      console.error("Error creating configuration:", error)
      throw error
    }
  }

  const handleEditConfig = async (configData: {
    key: string
    value: string
    category?: string
    description?: string
    isSecret?: boolean
  }) => {
    try {
      await updateConfig(configData.key, {
        value: configData.value,
        description: configData.description,
        isSecret: configData.isSecret,
      })
      toast({
        title: "Configuration Updated",
        description: `Configuration ${configData.key} has been updated successfully`,
      })
      loadConfigs()
    } catch (error) {
      console.error("Error updating configuration:", error)
      throw error
    }
  }

  const handleDeleteConfig = async () => {
    if (!selectedConfig) return

    try {
      await deleteConfig(selectedConfig.key)
      toast({
        title: "Configuration Deleted",
        description: `Configuration ${selectedConfig.key} has been deleted successfully`,
      })
      setDeleteDialogOpen(false)
      loadConfigs()
    } catch (error) {
      console.error("Error deleting configuration:", error)
      toast({
        title: "Failed to delete configuration",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = async (key: string) => {
    try {
      const config = await fetchConfigByKey(key)
      setSelectedConfig(config)
      setEditDialogOpen(true)
    } catch (error) {
      console.error("Error fetching configuration:", error)
      toast({
        title: "Failed to load configuration",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (config: Config) => {
    setSelectedConfig(config)
    setDeleteDialogOpen(true)
  }

  const getCategoryBadge = (category?: string) => {
    if (!category) return null

    const categoryColors: Record<string, string> = {
      general: "bg-gray-500",
      smtp: "bg-blue-500",
      payment: "bg-green-500",
      security: "bg-red-500",
    }

    return <Badge className={`${categoryColors[category] || "bg-gray-500"} text-white`}>{category}</Badge>
  }

  const columns: ColumnDef<Config>[] = [
    {
      accessorKey: "key",
      header: "Key",
      cell: ({ row }) => <div className="font-medium">{row.getValue("key")}</div>,
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => {
        const value = row.getValue("value") as string
        const isSecret = row.original.isSecret

        // If it's a secret value, mask it
        if (isSecret) {
          return <div className="max-w-[200px] md:max-w-[500px] truncate font-mono text-sm">••••••••</div>
        }

        // Try to detect if value is JSON
        let displayValue = value
        try {
          if (value && (value.startsWith("{") || value.startsWith("["))) {
            const parsedValue = JSON.parse(value)
            displayValue = JSON.stringify(parsedValue).substring(0, 50)
            if (displayValue.length < value.length) {
              displayValue += "..."
            }
          }
        } catch (e) {
          // Not JSON, use as is
        }

        try {
          // If the value is a number, format it as currency
          const numValue = Number(value)
          if (!isNaN(numValue)) {
            displayValue = formatCurrency(numValue)
          }
        } catch (e) {
          // Not a number, use as is
        }

        return <div className="max-w-[200px] md:max-w-[500px] truncate font-mono text-sm">{displayValue}</div>
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as string | undefined
        return getCategoryBadge(category)
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description") as string | undefined
        return description ? <div className="max-w-[200px] truncate">{description}</div> : <div>-</div>
      },
    },
    {
      accessorKey: "updatedAt",
      header: "Last Updated",
      cell: ({ row }) => {
        const updatedAt = row.getValue("updatedAt") as string

        if (!updatedAt) return <div>-</div>

        return <div className="whitespace-nowrap">{new Date(updatedAt).toLocaleString()}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const config = row.original

        return (
          <div className="flex items-center justify-end space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(config.key)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openDeleteDialog(config)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={() => openEditDialog(config.key)} className="hidden md:flex">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(config)} className="hidden md:flex">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage system settings and configurations</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="configurations">Configurations</TabsTrigger>
          <TabsTrigger value="account">Account Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="configurations" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold">Configuration Management</h2>
              <p className="text-muted-foreground">Manage system configuration settings</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setBulkUpdateDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Bulk Update
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSmtpTestDialogOpen(true)}>
                    <Mail className="mr-2 h-4 w-4" />
                    Test SMTP
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => loadConfigs()} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Config</span>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <CardTitle>System Configurations</CardTitle>
                  <CardDescription>View and manage all system configuration settings</CardDescription>
                </div>
                <div className="flex items-center mt-4 sm:mt-0">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <DataTable columns={columns} data={filteredConfigs} pagination />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Account settings content will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Config Dialog */}
      <ConfigFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateConfig}
        title="Create Configuration"
        description="Add a new configuration to the system"
      />

      {/* Edit Config Dialog */}
      {selectedConfig && (
        <ConfigFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSubmit={handleEditConfig}
          initialData={selectedConfig}
          title="Edit Configuration"
          description="Modify an existing configuration"
          isKeyEditable={false}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfig}
        title="Delete Configuration"
        description={`Are you sure you want to delete the configuration "${selectedConfig?.key}"? This action cannot be undone.`}
        confirmText="Delete"
      />

      {/* SMTP Test Dialog */}
      <SmtpTestDialog open={smtpTestDialogOpen} onOpenChange={setSmtpTestDialogOpen} />

      {/* Bulk Update Dialog */}
      <BulkUpdateDialog open={bulkUpdateDialogOpen} onOpenChange={setBulkUpdateDialogOpen} onSuccess={loadConfigs} />
    </div>
  )
}
