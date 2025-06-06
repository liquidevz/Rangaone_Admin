"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  DollarSign,
  Download,
  ExternalLink,
  Target,
  TrendingUp,
  BarChart3,
  Clock,
  Lightbulb,
  Info,
} from "lucide-react";
import type { Portfolio } from "@/lib/api";
import type { Tip } from "@/lib/api-tips";

interface TipDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tip: Tip | null;
  portfolio?: Portfolio;
}

export function TipDetailsDialog({
  open,
  onOpenChange,
  tip,
  portfolio,
}: TipDetailsDialogProps) {
  if (!tip) return null;

  const selectedStock = portfolio?.holdings?.find(
    (holding) => holding.symbol === tip.stockId
  );

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getActionColor = (action?: string) => {
    if (!action) return "bg-gray-100 text-gray-800";
    
    switch (action.toLowerCase()) {
      case "buy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "sell":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "partial sell":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "partial profit":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "hold":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const DisplayField = ({ 
    label, 
    value 
  }: { 
    label: string; 
    value: string; 
  }) => (
    <div className="p-3 rounded-lg bg-muted/30">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            {tip.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Card with Stock and Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-xl font-bold text-blue-600">{tip.stockId}</h3>
                    {selectedStock && (
                      <p className="text-sm text-muted-foreground">
                        {selectedStock.sector} • {selectedStock.stockCapType || "N/A"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Badge className={getStatusColor(tip.status)}>
                    {tip.status}
                  </Badge>
                  {tip.action && (
                    <Badge className={getActionColor(tip.action)}>
                      {tip.action.charAt(0).toUpperCase() + tip.action.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            {selectedStock && (
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-muted-foreground">Current Price</p>
                      <p className="font-semibold">₹{selectedStock.buyPrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-muted-foreground">Portfolio Weight</p>
                      <p className="font-semibold">{selectedStock.weight.toFixed(2)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-semibold">{selectedStock.quantity.toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Value</p>
                    <p className="font-semibold text-green-600">
                      ₹{selectedStock.minimumInvestmentValueStock.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Tip Description */}
          {tip.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Tip Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-base">{tip.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Detailed Content */}
          {tip.content && tip.content.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tip.content.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-muted/10">
                      <h4 className="font-semibold text-lg mb-3 text-blue-700">{item.key}</h4>
                      <div className="prose prose-sm max-w-none">
                        <p className="leading-relaxed whitespace-pre-wrap">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Levels & Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Price Levels & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tip.buyRange && (
                  <DisplayField
                    label="Recommended Buy Range"
                    value={`₹${tip.buyRange}`}
                  />
                )}
                {tip.addMoreAt && (
                  <DisplayField
                    label="Add More At"
                    value={`₹${tip.addMoreAt}`}
                  />
                )}
                {tip.targetPrice && (
                  <DisplayField
                    label="Target Price"
                    value={`₹${tip.targetPrice}`}
                  />
                )}
                {tip.targetPercentage && (
                  <DisplayField
                    label="Expected Returns"
                    value={`${tip.targetPercentage}%`}
                  />
                )}
                {tip.horizon && (
                  <DisplayField
                    label="Time Horizon"
                    value={tip.horizon}
                  />
                )}
                {tip.action && (
                  <DisplayField
                    label="Recommended Action"
                    value={tip.action.charAt(0).toUpperCase() + tip.action.slice(1)}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Exit Strategy */}
          {(tip.exitPrice || tip.exitStatus || tip.exitStatusPercentage) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Exit Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tip.exitPrice && (
                    <DisplayField
                      label="Exit Price"
                      value={`₹${tip.exitPrice}`}
                    />
                  )}
                  {tip.exitStatus && (
                    <DisplayField
                      label="Exit Status"
                      value={tip.exitStatus}
                    />
                  )}
                  {tip.exitStatusPercentage && (
                    <DisplayField
                      label="Exit Returns"
                      value={tip.exitStatusPercentage}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Resources */}
          {((tip.downloadLinks && tip.downloadLinks.length > 0) || tip.tipUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tip.tipUrl && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Reference URL:</p>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => window.open(tip.tipUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {tip.tipUrl}
                    </Button>
                  </div>
                )}
                
                {tip.downloadLinks && tip.downloadLinks.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Download Resources:</p>
                    <div className="space-y-2">
                      {tip.downloadLinks.map((link, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => window.open(link.url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {link.name || `Download ${index + 1}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tip Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tip Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Created On</p>
                    <p className="font-medium">{new Date(tip.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{new Date(tip.updatedAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                </div>
                {tip.portfolio && (
                  <div className="md:col-span-2">
                    <p className="text-muted-foreground">Portfolio ID</p>
                    <p className="font-medium font-mono text-xs">{tip.portfolio}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}