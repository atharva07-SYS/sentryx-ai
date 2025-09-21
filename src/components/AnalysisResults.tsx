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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

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
    confidenceBreakdown?: {
      trusted: number;
      neutral: number;
      suspicious: number;
    };
    explainability?: string;
    recommendations?: string[];
    frameFindings?: string[];
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

  const handleExportPdf = () => {
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    const doc = `
      <html>
        <head>
          <title>SentryX Report</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial; padding: 24px; color: #111; }
            h1,h2,h3 { margin: 0 0 8px; }
            .muted { color: #444; }
            .section { border: 1px solid #ddd; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
            .row { display: flex; gap: 16px; align-items: center; }
            .badge { display:inline-block; border:1px solid #aaa; border-radius:9999px; padding:2px 10px; font-size:12px; }
            ul { margin: 8px 0 0 18px; }
          </style>
        </head>
        <body>
          <h1>SentryX Analysis Report</h1>
          <div class="muted">Report ID: ${report._id} • Processed in ${report.processingTime}ms</div>
          <div class="section">
            <h2>Trust Score: ${report.credibilityScore}/100</h2>
            <div class="muted">Input (${report.inputType}): ${report.inputContent}</div>
          </div>
          <div class="section">
            <h3>Summary</h3>
            <p>${report.summary}</p>
          </div>
          ${report.deepfakeStatus ? `
          <div class="section">
            <h3>Deepfake Check</h3>
            <div>Status: ${report.deepfakeStatus}</div>
            ${report.frameFindings && report.frameFindings.length ? `<ul>${report.frameFindings.map(f => `<li>${f}</li>`).join("")}</ul>` : ""}
          </div>` : ""}
          ${report.flaggedClaims.length ? `
          <div class="section">
            <h3>Flagged Claims</h3>
            <ul>
              ${report.flaggedClaims.map(c => `<li><strong>${c.claim}</strong> — ${Math.round(c.confidence*100)}% confidence • Sources: ${c.sources.join(", ")}</li>`).join("")}
            </ul>
          </div>` : ""}
          ${report.verifiedSources.length ? `
          <div class="section">
            <h3>Verified Sources</h3>
            <ul>
              ${report.verifiedSources.map(s => `<li><strong>${s.title}</strong> — ${Math.round(s.credibility*100)}% credible — ${s.url}</li>`).join("")}
            </ul>
          </div>` : ""}
          ${report.confidenceBreakdown ? `
          <div class="section">
            <h3>Confidence Breakdown</h3>
            <div>Trusted: ${Math.round(report.confidenceBreakdown.trusted*100)}% • Neutral: ${Math.round(report.confidenceBreakdown.neutral*100)}% • Suspicious: ${Math.round(report.confidenceBreakdown.suspicious*100)}%</div>
          </div>` : ""}
          ${report.explainability ? `
          <div class="section">
            <h3>Explainability</h3>
            <p>${report.explainability}</p>
          </div>` : ""}
          ${report.recommendations && report.recommendations.length ? `
          <div class="section">
            <h3>Recommendations</h3>
            <ul>${report.recommendations.map(r => `<li>${r}</li>`).join("")}</ul>
          </div>` : ""}
        </body>
      </html>
    `;
    win.document.write(doc);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 100);
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

  // Add: helpers for new UI
  const trustedSourcesCount = report.verifiedSources.filter(s => (s.credibility ?? 0) >= 0.7).length;
  const totalSources = report.verifiedSources.length;
  const suspiciousClaims = report.flaggedClaims.length;
  const verdictSafe = report.credibilityScore >= 70 && suspiciousClaims <= 1;

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
    <TooltipProvider>
      <motion.div
        className="w-full max-w-4xl space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header with Score and Actions */}
        <GlassCard variant="strong" className="text-center">
          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="space-y-3">
              <CredibilityScore score={report.credibilityScore} size="lg" gauge />
              <Progress value={report.credibilityScore} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Shield charging...
              </div>
            </div>

            <div className="space-y-3">
              <div className={`flex items-center justify-center gap-2 ${report.credibilityScore >= 70 ? "glow-strong" : "glow"}`}>
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold">
                  {report.credibilityScore >= 70 ? "🟢 Trustworthy" : report.credibilityScore >= 40 ? "🟡 Mixed Signals" : "🔴 Doubtful"}
                </span>
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
                Download (JSON)
              </Button>
              <Button onClick={handleExportPdf} variant="outline" className="glass-card border-0">
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button onClick={handleShare} variant="outline" className="glass-card border-0">
                <Share2 className="mr-2 h-4 w-4" />
                Share Results
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* Add: Chat-Style Assistant Summary */}
        <GlassCard className="neon-border">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 font-semibold">
              <span>🛡️ SentryX</span>
              <Badge variant="outline" className="glass-card border-0">AI Guardian</Badge>
            </div>
            <p className="text-sm leading-relaxed">
              I scanned this content. {report.credibilityScore >= 70 ? "Most of it checks out ✅" : "There are concerns ⚠️"} — here's what stood out:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              <li>{trustedSourcesCount} trusted references found{totalSources > 0 ? ` out of ${totalSources} sources` : ""}.</li>
              <li>{suspiciousClaims} claim(s) need attention.</li>
              {report.deepfakeStatus && <li>Deepfake check: {getDeepfakeLabel(report.deepfakeStatus)}.</li>}
            </ul>
          </div>
        </GlassCard>

        {/* Tabbed Report */}
        <GlassCard>
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="glass-card">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="proof">Proof</TabsTrigger>
              <TabsTrigger value="deepfake">Deepfake Check</TabsTrigger>
              <TabsTrigger value="recommendation">Recommendation</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-6 space-y-4">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Verdict
              </h3>
              <p className="text-muted-foreground leading-relaxed">{report.summary}</p>

              {/* Add: Color-coded highlight flip cards */}
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div className="flip">
                  <div className="flip-inner rounded-xl neon-border">
                    <div className="flip-face glass-strong rounded-xl p-4 h-full">
                      <div className="text-green-300 font-semibold mb-1">✅ Verified Claims</div>
                      <p className="text-sm text-muted-foreground">Strong corroboration from trusted sources</p>
                    </div>
                    <div className="flip-face flip-back glass-strong rounded-xl p-4 h-full absolute inset-0">
                      <p className="text-sm">
                        {trustedSourcesCount} trusted sources (≥70% credibility){totalSources ? ` out of ${totalSources} total` : ""}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flip">
                  <div className="flip-inner rounded-xl neon-border">
                    <div className="flip-face glass-strong rounded-xl p-4 h-full">
                      <div className="text-yellow-300 font-semibold mb-1">⚠️ Suspicious Gaps</div>
                      <p className="text-sm text-muted-foreground">Claims lacking citations or evidence</p>
                    </div>
                    <div className="flip-face flip-back glass-strong rounded-xl p-4 h-full absolute inset-0">
                      <p className="text-sm">{suspiciousClaims} flagged claim(s) requiring verification.</p>
                    </div>
                  </div>
                </div>

                <div className="flip">
                  <div className="flip-inner rounded-xl neon-border">
                    <div className="flip-face glass-strong rounded-xl p-4 h-full">
                      <div className="text-cyan-300 font-semibold mb-1">🔗 Trusted Sources Found</div>
                      <p className="text-sm text-muted-foreground">Reputable outlets referenced</p>
                    </div>
                    <div className="flip-face flip-back glass-strong rounded-xl p-4 h-full absolute inset-0">
                      <p className="text-sm">
                        Examples: {report.verifiedSources.slice(0, 2).map(s => s.title).join(", ") || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flip">
                  <div className="flip-inner rounded-xl neon-border">
                    <div className="flip-face glass-strong rounded-xl p-4 h-full">
                      <div className="text-red-300 font-semibold mb-1">🚨 Potential Misinformation</div>
                      <p className="text-sm text-muted-foreground">Emotionally manipulative or clickbait patterns</p>
                    </div>
                    <div className="flip-face flip-back glass-strong rounded-xl p-4 h-full absolute inset-0">
                      <p className="text-sm">
                        {suspiciousClaims > 0 ? "Some language and unsupported claims detected." : "No strong manipulation signals found."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {report.confidenceBreakdown && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">Confidence Breakdown</h4>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Trusted, Neutral, and Suspicious proportions used to derive Trust Score.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden glass-card border-0 flex">
                    <div
                      className="h-3 bg-green-400/70"
                      style={{ width: `${Math.round((report.confidenceBreakdown.trusted ?? 0) * 100)}%` }}
                    />
                    <div
                      className="h-3 bg-yellow-400/70"
                      style={{ width: `${Math.round((report.confidenceBreakdown.neutral ?? 0) * 100)}%` }}
                    />
                    <div
                      className="h-3 bg-red-400/70"
                      style={{ width: `${Math.round((report.confidenceBreakdown.suspicious ?? 0) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Trusted: {Math.round((report.confidenceBreakdown.trusted ?? 0)*100)}%</span>
                    <span>Neutral: {Math.round((report.confidenceBreakdown.neutral ?? 0)*100)}%</span>
                    <span>Suspicious: {Math.round((report.confidenceBreakdown.suspicious ?? 0)*100)}%</span>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Proof tab (formerly Sources) */}
            <TabsContent value="proof" className="mt-6 space-y-4">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Proof ({report.verifiedSources.length})
              </h3>
              <div className="space-y-3">
                {report.verifiedSources.map((source, index) => (
                  <motion.div
                    key={index}
                    className="glass-card p-4 rounded-lg"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
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
            </TabsContent>

            <TabsContent value="deepfake" className="mt-6 space-y-4">
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Deepfake Check
              </h3>
              <div className="flex items-center gap-3 text-sm">
                {getDeepfakeIcon(report.deepfakeStatus)}
                <span className="font-medium">{getDeepfakeLabel(report.deepfakeStatus)}</span>
              </div>
              {report.frameFindings && report.frameFindings.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold">Frame Analysis</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {report.frameFindings.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
            </TabsContent>

            {/* Recommendation tab (combines verdict + flagged + explainability + suggestions) */}
            <TabsContent value="recommendation" className="mt-6 space-y-6">
              <GlassCard className="neon-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <Shield className="h-5 w-5 text-primary" />
                    Final Verdict
                  </div>
                  <Badge variant="outline" className="glass-card border-0">
                    {verdictSafe ? "Safe to read" : "Don't trust yet"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {verdictSafe
                    ? "🟢 70%+ Truth score and minimal red flags. You can read this with confidence."
                    : "🔴 Score or flags suggest caution. Verify key claims before sharing."}
                </p>
              </GlassCard>

              {report.flaggedClaims.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
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
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="font-medium text-red-300 mb-2 cursor-pointer">
                                  {claim.claim}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                Why flagged: language patterns, missing citations, or conflicting sources.
                              </TooltipContent>
                            </Tooltip>
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
                </div>
              )}

              {(report.explainability || (report.recommendations && report.recommendations.length)) && (
                <div>
                  <Separator className="my-4" />
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Explainability & Recommendations
                  </h3>
                  {report.explainability && (
                    <p className="text-muted-foreground leading-relaxed mb-3">
                      {report.explainability}
                    </p>
                  )}
                  {report.recommendations && report.recommendations.length > 0 && (
                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                      {report.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </GlassCard>

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
    </TooltipProvider>
  );
}