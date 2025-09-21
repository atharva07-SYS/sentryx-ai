import { motion } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { CredibilityScore } from "./CredibilityScore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  ExternalLink, 
  Download, 
  Share2, 
  Clock,
  Shield,
  Eye,
  CheckCircle,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

interface AnalysisResultsProps {
  report: {
    _id: string;
    inputType: string;
    inputContent: string;
    credibilityScore: number;
    deepfakeStatus?: "real" | "fake" | "uncertain";
    flaggedClaims: Array<{
      claim: string;
      confidence: number;
      sources: string[];
    }>;
    verifiedSources: Array<{
      title: string;
      url: string;
      credibility: number;
    }>;
    summary: string;
    processingTime: number;
    status: string;
  };
}

export function AnalysisResults({ report }: AnalysisResultsProps) {
  const handleDownload = () => {
    const data = {
      reportId: report._id,
      timestamp: new Date().toISOString(),
      credibilityScore: report.credibilityScore,
      summary: report.summary,
      flaggedClaims: report.flaggedClaims,
      verifiedSources: report.verifiedSources
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sentryx-report-${report._id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Report downloaded successfully");
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SentryX Analysis Report',
          text: `Credibility Score: ${report.credibilityScore}/100 - ${report.summary}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Report link copied to clipboard");
    }
  };

  const getDeepfakeIcon = (status?: string) => {
    switch (status) {
      case "real": return <CheckCircle className="h-5 w-5 text-green-400" />;
      case "fake": return <XCircle className="h-5 w-5 text-red-400" />;
      case "uncertain": return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      default: return <Eye className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getDeepfakeLabel = (status?: string) => {
    switch (status) {
      case "real": return "Authentic";
      case "fake": return "Likely Manipulated";
      case "uncertain": return "Uncertain";
      default: return "Not Analyzed";
    }
  };

  return (
    <motion.div
      className="w-full max-w-4xl space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with Score */}
      <GlassCard variant="strong" className="text-center">
        <div className="grid md:grid-cols-3 gap-6 items-center">
          <div>
            <CredibilityScore score={report.credibilityScore} size="lg" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Analysis Complete</span>
            </div>
            
            {report.deepfakeStatus && (
              <div className="flex items-center justify-center gap-2">
                {getDeepfakeIcon(report.deepfakeStatus)}
                <span className="text-sm font-medium">
                  {getDeepfakeLabel(report.deepfakeStatus)}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Processed in {report.processingTime}ms</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleDownload} variant="outline" className="glass-card border-0">
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
            <Button onClick={handleShare} variant="outline" className="glass-card border-0">
              <Share2 className="mr-2 h-4 w-4" />
              Share Results
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Summary */}
      <GlassCard>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Analysis Summary
        </h3>
        <p className="text-muted-foreground leading-relaxed">{report.summary}</p>
      </GlassCard>

      {/* Flagged Claims */}
      {report.flaggedClaims.length > 0 && (
        <GlassCard>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            Flagged Claims ({report.flaggedClaims.length})
          </h3>
          <div className="space-y-4">
            {report.flaggedClaims.map((claim, index) => (
              <motion.div
                key={index}
                className="glass-card p-4 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-red-300 mb-2">{claim.claim}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="glass-card border-0">
                        {Math.round(claim.confidence * 100)}% confidence
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Sources: {claim.sources.join(", ")}
                      </span>
                    </div>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Verified Sources */}
      {report.verifiedSources.length > 0 && (
        <GlassCard>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Verified Sources ({report.verifiedSources.length})
          </h3>
          <div className="space-y-3">
            {report.verifiedSources.map((source, index) => (
              <motion.div
                key={index}
                className="glass-card p-4 rounded-lg"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-green-300 mb-1">{source.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="glass-card border-0">
                        {Math.round(source.credibility * 100)}% credible
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="glass-card border-0"
                    onClick={() => window.open(source.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Input Preview */}
      <GlassCard>
        <h3 className="text-xl font-bold mb-4">Analyzed Content</h3>
        <div className="glass-card p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="glass-card border-0 capitalize">
              {report.inputType}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground break-all">
            {report.inputContent.length > 200 
              ? `${report.inputContent.substring(0, 200)}...` 
              : report.inputContent
            }
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
