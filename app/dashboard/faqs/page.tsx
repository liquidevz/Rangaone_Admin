// app/dashboard/faqs/page.tsx
"use client";

import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { FAQFormDialog } from "@/components/faq-form-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  createFAQ,
  deleteFAQ,
  fetchFAQs,
  updateFAQ,
  type CreateFAQRequest,
  type FAQ,
} from "@/lib/api-faqs";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  Copy,
  Edit,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Download,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePageState } from "@/hooks/use-page-state";
import { useCache } from "@/components/cache-provider";
import { CACHE_KEYS } from "@/lib/cache";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useIsMobile } from "@/hooks/use-mobile";
import { downloadFAQs } from "@/lib/download-utils";

interface FAQsPageState {
  searchQuery: string;
  categoryFilter: string;
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [faqToEdit, setFaqToEdit] = useState<FAQ | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { cacheData, getCachedData, invalidateCache } = useCache();
  
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  
  const { containerRef } = useScrollRestoration({
    key: 'faqs_page',
    enabled: true
  });

  const loadFAQs = async (useCache = true) => {
    try {
      setLoading(true);
      setError(null);
      
      if (useCache) {
        const cachedFaqs = getCachedData<FAQ[]>(CACHE_KEYS.USERS_DATA.replace('users', 'faqs'));
        if (cachedFaqs) {
          setFaqs(cachedFaqs);
          setLoading(false);
          fetchFAQs().then(freshData => {
            setFaqs(freshData);
            cacheData(CACHE_KEYS.USERS_DATA.replace('users', 'faqs'), freshData, 10 * 60 * 1000);
          }).catch(console.error);
          return;
        }
      }
      
      const data = await fetchFAQs();
      setFaqs(data);
      cacheData(CACHE_KEYS.USERS_DATA.replace('users', 'faqs'), data, 10 * 60 * 1000);
    } catch (err) {
      console.error("Error loading FAQs:", err);
      setError(err instanceof Error ? err.message : "Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFAQs();
  }, []);

  useEffect(() => {
    let filtered = [...faqs];

    if (categoryFilter !== "all") {
      filtered = filtered.filter((faq) => faq.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          (typeof faq.answer === 'string' ? faq.answer.toLowerCase().includes(query) : false) ||
          faq.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredFaqs(filtered);
  }, [faqs, categoryFilter, searchQuery]);

  const handleCreateFAQ = async (faqData: CreateFAQRequest) => {
    try {
      const newFAQ = await createFAQ(faqData);
      const updatedFaqs = [newFAQ, ...faqs];
      setFaqs(updatedFaqs);
      cacheData(CACHE_KEYS.USERS_DATA.replace('users', 'faqs'), updatedFaqs, 10 * 60 * 1000);
      toast({
        title: "FAQ created successfully",
      });
    } catch (err) {
      console.error("Error creating FAQ:", err);
      throw err;
    }
  };

  const handleDuplicateFAQ = (faq: FAQ) => {
    setFaqToEdit({
      ...faq,
      id: '',
      question: `${faq.question} (Copy)`,
    });
    setIsCreateDialogOpen(true);
  };

  const handleUpdateFAQ = async (faqData: CreateFAQRequest) => {
    if (!faqToEdit) return;

    try {
      const updatedFAQ = await updateFAQ(faqToEdit.id, faqData);
      setFaqs((prev) =>
        prev.map((faq) => (faq.id === faqToEdit.id ? updatedFAQ : faq))
      );
      toast({
        title: "FAQ updated successfully",
      });
    } catch (err) {
      console.error("Error updating FAQ:", err);
      throw err;
    }
  };

  const handleDeleteFAQ = async () => {
    if (!faqToDelete) return;

    try {
      setIsDeleting(true);
      await deleteFAQ(faqToDelete.id);
      setFaqs((prev) => prev.filter((faq) => faq.id !== faqToDelete.id));
      toast({
        title: "FAQ deleted successfully",
      });
      setFaqToDelete(null);
    } catch (err) {
      console.error("Error deleting FAQ:", err);
      toast({
        title: "Failed to delete FAQ",
        description: err instanceof Error ? err.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
    ];
    const hash = category.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const uniqueCategories = [...new Set(faqs.map(faq => faq.category))].sort();

  const columns: ColumnDef<FAQ>[] = [
    {
      accessorKey: "question",
      header: "Question",
      size: isMobile ? 200 : 300,
      cell: ({ row }: { row: Row<FAQ> }) => (
        <div className={isMobile ? "max-w-[180px]" : "max-w-md"}>
          <div className={`font-medium line-clamp-2 ${isMobile ? 'text-sm' : ''}`}>{row.getValue("question")}</div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      size: isMobile ? 80 : 120,
      cell: ({ row }: { row: Row<FAQ> }) => {
        const category = row.getValue("category") as string;
        return (
          <Badge className={`${getCategoryColor(category)} ${isMobile ? 'text-xs px-1.5 py-0.5' : ''}`} variant="secondary">
            {isMobile ? category.slice(0, 3) : category}
          </Badge>
        );
      },
    },
    ...(!isMobile ? [{
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }: { row: Row<FAQ> }) => {
        const tags = row.original.tags || [];
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    }] : []),
    {
      accessorKey: "createdAt",
      header: "Created",
      size: isMobile ? 70 : 120,
      cell: ({ row }: { row: Row<FAQ> }) => {
        const date = row.getValue("createdAt") as string;
        return (
          <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
            {isMobile 
              ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'numeric' })
              : formatDistanceToNow(new Date(date), { addSuffix: true })
            }
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "",
      size: isMobile ? 40 : 80,
      cell: ({ row }: { row: Row<FAQ> }) => {
        const faq = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} p-0`}>
                <MoreVertical className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setFaqToEdit(faq);
                  setIsEditDialogOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDuplicateFAQ(faq)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFaqToDelete(faq)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div 
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="space-y-4 sm:space-y-6 max-w-full overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">FAQs</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {filteredFaqs.length} of {faqs.length} FAQs
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                downloadFAQs(filteredFaqs, 'csv');
                toast({ title: "Download started", description: "FAQs data is being downloaded as CSV" });
              } catch (error) {
                toast({ title: "Download failed", description: "No data to download", variant: "destructive" });
              }
            }}
            disabled={filteredFaqs.length === 0}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              invalidateCache(CACHE_KEYS.USERS_DATA.replace('users', 'faqs'));
              loadFAQs(false);
            }}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {isMobile ? "Add" : "Add FAQ"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="max-w-full overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <DataTable
            columns={columns}
            data={filteredFaqs}
            isLoading={loading}
          />
        </CardContent>
      </Card>

      <FAQFormDialog
        open={isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) setFaqToEdit(null);
        }}
        onSubmit={handleCreateFAQ}
        faq={faqToEdit || undefined}
      />

      {faqToEdit && (
        <FAQFormDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setFaqToEdit(null);
          }}
          onSubmit={handleUpdateFAQ}
          faq={faqToEdit}
        />
      )}

      <DeleteConfirmationDialog
        open={!!faqToDelete}
        onOpenChange={(open) => !open && setFaqToDelete(null)}
        onConfirm={handleDeleteFAQ}
        title="Delete FAQ"
        description="This will permanently delete the FAQ and all associated data."
        resourceName={faqToDelete?.question}
        resourceType="FAQ"
        isLoading={isDeleting}
      />
    </div>
  );
}