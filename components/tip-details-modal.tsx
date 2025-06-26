// components\tip-details-modal.tsx  
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
  Download,
  ExternalLink,
  Target,
  TrendingUp,
  BarChart3,
  Clock,
  Lightbulb,
  Info,
  Building2,
  Activity,
  IndianRupee,
} from "lucide-react";
import type { Tip } from "@/lib/api-tips";
import type { Portfolio } from "@/lib/api";

interface TipDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tip: Tip | null;
  portfolio?: Portfolio;
}

export function TipDetailsModal({
  open,
  onOpenChange,
  tip,
  portfolio,
}: TipDetailsModalProps) {
  if (!tip) return null;

  const isGeneralTip = !tip.portfolio;

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
    value,
    icon: Icon,
    className = ""
  }: { 
    label: string; 
    value: string | React.ReactNode; 
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
  }) => (
    <div className={`p-3 rounded-lg bg-muted/30 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <div className="font-semibold">{value}</div>
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
          {/* Header Card with Stock and Type */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-xl font-bold text-blue-600">{tip.stockId}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {isGeneralTip ? (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-sm text-purple-600 font-medium">General Tip</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-600">{portfolio?.name || 'Portfolio Tip'}</span>
                        </div>
                      )}
                    </div>
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

          {/* Investment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Investment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tip.action && (
                  <DisplayField
                    label="Recommended Action"
                    value={
                      <Badge className={getActionColor(tip.action)}>
                        {tip.action.charAt(0).toUpperCase() + tip.action.slice(1)}
                      </Badge>
                    }
                    icon={TrendingUp}
                  />
                )}
                
                {tip.horizon && (
                  <DisplayField
                    label="Time Horizon"
                    value={tip.horizon}
                    icon={Clock}
                  />
                )}

                {tip.status && (
                  <DisplayField
                    label="Current Status"
                    value={
                      <Badge className={getStatusColor(tip.status)}>
                        {tip.status}
                      </Badge>
                    }
                    icon={Info}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Price Levels & Recommendations */}
          {(tip.buyRange || tip.addMoreAt || tip.targetPrice || tip.targetPercentage) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Price Levels & Targets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tip.buyRange && (
                    <DisplayField
                      label="Recommended Buy Range"
                      value={`₹${tip.buyRange}`}
                      icon={TrendingUp}
                    />
                  )}
                  {tip.addMoreAt && (
                    <DisplayField
                      label="Add More At"
                      value={`₹${tip.addMoreAt}`}
                      icon={IndianRupee}
                    />
                  )}
                  {tip.targetPrice && (
                    <DisplayField
                      label="Target Price"
                      value={`₹${tip.targetPrice}`}
                      icon={Target}
                    />
                  )}
                  {tip.targetPercentage && (
                    <DisplayField
                      label="Expected Returns"
                      value={`${tip.targetPercentage}%`}
                      icon={BarChart3}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
                      icon={IndianRupee}
                    />
                  )}
                  {tip.exitStatus && (
                    <DisplayField
                      label="Exit Status"
                      value={tip.exitStatus}
                      icon={Info}
                    />
                  )}
                  {tip.exitStatusPercentage && (
                    <DisplayField
                      label="Exit Returns"
                      value={tip.exitStatusPercentage}
                      icon={BarChart3}
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
                <DisplayField
                  label="Created On"
                  value={new Date(tip.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  icon={Calendar}
                />
                
                <DisplayField
                  label="Last Updated"
                  value={new Date(tip.updatedAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  icon={Clock}
                />
                
                <DisplayField
                  label="Tip Type"
                  value={isGeneralTip ? (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-purple-600 font-medium">General Tip</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="text-blue-600">Portfolio Specific</span>
                    </div>
                  )}
                  icon={Info}
                />
                
                {tip.portfolio && (
                  <DisplayField
                    label="Portfolio ID"
                    value={<span className="font-mono text-xs">{tip.portfolio}</span>}
                    icon={Building2}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}