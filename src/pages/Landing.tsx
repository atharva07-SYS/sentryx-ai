import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/GlassCard";
import { AnalysisForm } from "@/components/AnalysisForm";
import { AnalysisResults } from "@/components/AnalysisResults";
import { useAuth } from "@/hooks/use-auth";
import { 
  Shield, 
  Zap, 
  Eye, 
  Globe, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  Github,
  Twitter,
  Menu,
  X,
  Sun,
  Moon,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Linkedin, Globe as GlobeIcon } from "lucide-react";

export default function Landing() {
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [currentReportId, setCurrentReportId] = useState<Id<"detectionReports"> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [liveDemoUrl, setLiveDemoUrl] = useState("");
  const [showDemoHint, setShowDemoHint] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [activeInputType, setActiveInputType] = useState<"url" | "text" | "image" | "video">("url");
  const [unifiedInput, setUnifiedInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const createReport = useMutation(api.detectionReports.createReport);
  const analyzeContent = useAction(api.analysisActions.analyzeContent);
  const currentReport = useQuery(
    api.detectionReports.getReport,
    currentReportId ? { reportId: currentReportId } : "skip"
  );

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleAnalysis = async (inputType: string, content: string) => {
    try {
      setIsAnalyzing(true);
      
      // Create report
      const reportId = await createReport({
        inputType: inputType as "url" | "text" | "image" | "video",
        inputContent: content
      });
      
      setCurrentReportId(reportId);
      
      // Start analysis
      await analyzeContent({
        reportId,
        inputType: inputType as "url" | "text" | "image" | "video",
        inputContent: content
      });
      
      toast.success("Analysis completed successfully!");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setCurrentReportId(null);
    setIsAnalyzing(false);
  };

  // Add: smart drop handler for drag-and-drop zone
  const handleDropAnalyze = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      // If files are dropped, we currently only support URLs (no direct file uploads yet)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          toast.info("Direct file uploads are not supported yet. Please paste an Image/Video URL instead.");
          return;
        }
        toast.info("Only URLs and text are supported via drag & drop for now.");
        return;
      }

      const text = e.dataTransfer.getData("text") || e.dataTransfer.getData("text/plain");
      const trimmed = (text || "").trim();
      if (!trimmed) {
        toast.error("No content detected. Drop a URL or text to analyze.");
        return;
      }

      // Heuristic: detect type from dropped text
      const isUrl = /^https?:\/\//i.test(trimmed);
      const isImageUrl = isUrl && /\.(png|jpe?g|gif|webp|svg)$/i.test(trimmed);
      const isVideoUrl = isUrl && /\.(mp4|webm|mov|mkv|avi)$/i.test(trimmed);

      if (isImageUrl) {
        await handleAnalysis("image", trimmed);
        return;
      }
      if (isVideoUrl) {
        await handleAnalysis("video", trimmed);
        return;
      }
      if (isUrl) {
        await handleAnalysis("url", trimmed);
        return;
      }
      // Otherwise treat as text
      await handleAnalysis("text", trimmed);
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze dropped content.");
    }
  };

  const handleDragState = (e: React.DragEvent<HTMLDivElement>, over: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(over);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* AI Grid + Gradient Orbs */}
      <div className="ai-grid" />
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />
      <div className="gradient-orb gradient-orb-3" />

      {/* Live Scan Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <GlassCard variant="strong" className="w-[340px] text-center neon-border">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <span className="ring" />
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              </div>
              <div className="text-lg font-semibold">Scanning content...</div>
              <p className="text-sm text-muted-foreground">AI nodes connecting, verifying sources, detecting deepfakes</p>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Navigation */}
      <motion.nav
        className="sticky top-0 backdrop-blur-md bg-black/10 border-b border-white/10 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 glow">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <a href="#hero" className="text-2xl font-bold tracking-tight">SentryX</a>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#live-demo" className="text-muted-foreground hover:text-foreground transition-colors">
                Live Demo
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How it Works
              </a>
              <a href="#pitch" className="text-muted-foreground hover:text-foreground transition-colors">
                Pitch
              </a>
              <a href="#multi-modal" className="text-muted-foreground hover:text-foreground transition-colors">
                Multi-Modal
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="glass-card border-0"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              {!authLoading && (
                isAuthenticated ? (
                  <Button onClick={() => navigate("/dashboard")} className="glass-strong border-0 glow">
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={() => navigate("/auth")} className="glass-strong border-0 glow">
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden glass-card border-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden glass-strong border-t border-white/10"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#live-demo" className="block text-muted-foreground hover:text-foreground transition-colors">
                Live Demo
              </a>
              <a href="#how-it-works" className="block text-muted-foreground hover:text-foreground transition-colors">
                How it Works
              </a>
              <a href="#pitch" className="block text-muted-foreground hover:text-foreground transition-colors">
                Pitch
              </a>
              <a href="#multi-modal" className="block text-muted-foreground hover:text-foreground transition-colors">
                Multi-Modal
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="glass-card border-0 w-full justify-start"
              >
                {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Button>
              {!authLoading && (
                <Button 
                  onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")} 
                  className="glass-strong border-0 glow w-full"
                >
                  {isAuthenticated ? "Dashboard" : "Sign In"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10">
        {currentReport && currentReport.status === "completed" ? (
          /* Results View */
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-6xl">
              <div className="text-center mb-8">
                <Button
                  onClick={resetAnalysis}
                  variant="outline"
                  className="glass-card border-0 mb-4"
                >
                  ← Analyze New Content
                </Button>
              </div>
              <AnalysisResults report={currentReport} />
            </div>
          </div>
        ) : (
          <>
            {/* Hero Section */}
            <section id="hero" className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
              <motion.div
                className="max-w-5xl mx-auto space-y-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="space-y-6">
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm neon-border"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Zap className="h-4 w-4 text-primary" />
                    SentryX: AI Sentinel Against Misinformation
                  </motion.div>
                  
                  <motion.h1
                    className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Cut through the noise with
                    <br />
                    <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                      Real-time Truth Detection
                    </span>
                  </motion.h1>
                  
                  <motion.p
                    className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Verify articles, media, and claims with AI—instantly. Deepfake spotting, source verification, and credibility scoring in one place.
                  </motion.p>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <Button
                    onClick={() => {
                      const el = document.getElementById("live-demo");
                      el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="glass-strong border-0 glow neon-button"
                    size="lg"
                  >
                    Try Live Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="glass-card border-0"
                    onClick={() => {
                      const el = document.getElementById("features");
                      el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    Explore Features
                  </Button>
                </div>
              </motion.div>
            </section>

            {/* Upload Options Section (Unified) */}
            <section id="upload-options" className="py-16 px-4">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl font-bold tracking-tight mb-3">
                    Multi‑Modal Analyzer
                  </h2>
                  <p className="text-muted-foreground">
                    Paste URL, enter text, or drop content — SentryX will generate a full report.
                  </p>
                </motion.div>

                <GlassCard className="neon-border">
                  <div className="space-y-4">
                    <Tabs value={activeInputType} onValueChange={(v) => setActiveInputType(v as any)}>
                      <TabsList className="glass-card">
                        <TabsTrigger value="url">Paste URL</TabsTrigger>
                        <TabsTrigger value="text">Enter Text</TabsTrigger>
                        <TabsTrigger value="image">Upload Image URL</TabsTrigger>
                        <TabsTrigger value="video">Upload Video URL</TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {/* Drag & Drop Zone */}
                    <div
                      className={`rounded-xl border-2 border-dashed transition-all duration-200 glass-strong ${
                        isDragOver ? "border-primary/70 bg-primary/10 glow-strong" : "border-white/15"
                      }`}
                      onDragOver={(e) => handleDragState(e, true)}
                      onDragEnter={(e) => handleDragState(e, true)}
                      onDragLeave={(e) => handleDragState(e, false)}
                      onDrop={handleDropAnalyze}
                    >
                      <div className="p-5 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <span className="ring" />
                          <span className="text-sm font-semibold">
                            {isDragOver ? "Release to analyze" : "Drag & drop URL or text here to analyze"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tip: Drop an article link to auto-detect. For media, paste an image/video URL using the tabs above.
                        </p>
                      </div>
                    </div>

                    {/* Unified Input */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {activeInputType === "text" ? (
                        <Textarea
                          placeholder="Paste text to analyze..."
                          className="glass-card border-0 min-h-[120px]"
                          value={unifiedInput}
                          onChange={(e) => setUnifiedInput(e.target.value)}
                          disabled={isAnalyzing}
                        />
                      ) : (
                        <Input
                          placeholder={
                            activeInputType === "url"
                              ? "https://example.com/article"
                              : activeInputType === "image"
                              ? "https://example.com/image.jpg"
                              : "https://example.com/video.mp4"
                          }
                          className="glass-card border-0"
                          value={unifiedInput}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setUnifiedInput(e.target.value)}
                          disabled={isAnalyzing}
                        />
                      )}
                      <Button
                        onClick={() => handleAnalysis(activeInputType, unifiedInput)}
                        disabled={isAnalyzing || !unifiedInput.trim()}
                        className="neon-button glow glass-strong border-0"
                      >
                        {isAnalyzing ? (
                          <>
                            <span className="ring mr-2" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-4 w-4" />
                            Scan {activeInputType === "url" ? "URL" : activeInputType === "text" ? "Text" : activeInputType === "image" ? "Image" : "Video"}
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Progress steps hint */}
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                      <span className="px-2 py-1 rounded-full glass-card">Collect</span>
                      <span>→</span>
                      <span className="px-2 py-1 rounded-full glass-card">Analyze</span>
                      <span>→</span>
                      <span className="px-2 py-1 rounded-full glass-card">Verify</span>
                      <span>→</span>
                      <span className="px-2 py-1 rounded-full glass-card">Report</span>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  className="text-center mb-16"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl font-bold tracking-tight mb-4">
                    Advanced Detection Capabilities
                  </h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Interactive intelligence built to expose misinformation and deepfakes
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      frontIcon: Globe,
                      backIcon: CheckCircle,
                      title: "Fake News Detection",
                      front: "Scan articles and posts for misleading claims.",
                      back: "AI flags risky language, validates sources, and surfaces credibility markers in seconds."
                    },
                    {
                      frontIcon: Eye,
                      backIcon: AlertTriangle,
                      title: "Deepfake Spotting",
                      front: "Analyze images and videos for manipulation.",
                      back: "Detect tampering patterns and get a \"real/fake/uncertain\" assessment with confidence."
                    },
                    {
                      frontIcon: Shield,
                      backIcon: Zap,
                      title: "Real-Time Truth Reports",
                      front: "Instant, shareable credibility reports.",
                      back: "Summaries, sources, and a dynamic score you can export and share."
                    }
                  ].map((card, i) => (
                    <motion.div
                      key={i}
                      className="flip"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flip-inner rounded-2xl neon-border">
                        <div className="flip-face glass-strong rounded-2xl p-6 h-full">
                          <div className="p-2 rounded-lg bg-primary/20 w-fit mb-4">
                            <card.frontIcon className="h-6 w-6 text-primary" />
                          </div>
                          <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                          <p className="text-muted-foreground">{card.front}</p>
                        </div>
                        <div className="flip-face flip-back glass-strong rounded-2xl p-6 h-full absolute inset-0">
                          <div className="p-2 rounded-lg bg-accent/20 w-fit mb-4">
                            <card.backIcon className="h-6 w-6 text-accent" />
                          </div>
                          <h4 className="font-semibold mb-2">What you get</h4>
                          <p className="text-muted-foreground">{card.back}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Live Demo Section */}
            <section id="live-demo" className="py-20 px-4">
              <div className="max-w-3xl mx-auto">
                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl font-bold tracking-tight mb-3">
                    Live Demo
                  </h2>
                  <p className="text-muted-foreground">
                    Paste a news URL and hit Scan. Watch the neon engine work.
                  </p>
                </motion.div>

                <GlassCard variant="strong" className="neon-border">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="https://example.com/article"
                      className="glass-card border-0"
                      value={liveDemoUrl}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setLiveDemoUrl(e.target.value)}
                      disabled={isAnalyzing}
                      onFocus={() => setShowDemoHint(true)}
                    />
                    <Button
                      onClick={() => handleAnalysis("url", liveDemoUrl)}
                      disabled={isAnalyzing || !liveDemoUrl.trim()}
                      className="neon-button glow glass-strong border-0"
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="ring mr-2" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Scan
                        </>
                      )}
                    </Button>
                  </div>
                  {showDemoHint && !isAnalyzing && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Pro tip: Use a known news article URL to see source verification kick in.
                    </p>
                  )}
                </GlassCard>

                <div className="mt-8 grid md:grid-cols-3 gap-4">
                  {[
                    { label: "Sample Verdict", value: "Likely Credible", color: "text-green-400" },
                    { label: "Avg. Scan Time", value: "<3s", color: "text-cyan-300" },
                    { label: "Flags Found", value: "0-2", color: "text-purple-300" },
                  ].map((item, idx) => (
                    <GlassCard key={idx} className="text-center">
                      <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                      <div className="text-sm text-muted-foreground">{item.label}</div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            </section>

            {/* How it Works Timeline */}
            <section id="how-it-works" className="py-20 px-4">
              <div className="max-w-5xl mx-auto">
                <motion.div
                  className="text-center mb-16"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl font-bold tracking-tight mb-4">
                    How SentryX Works
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    Collect → Analyze → Verify → Report
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-4 gap-6">
                  {[
                    { step: "Collect", desc: "Securely ingest text, URLs, images, and videos." },
                    { step: "Analyze", desc: "Run AI models for pattern, domain, and deepfake checks." },
                    { step: "Verify", desc: "Cross-check with trusted sources and signals." },
                    { step: "Report", desc: "Output a score, summary, and shareable report." },
                  ].map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <GlassCard className="h-full text-center neon-border">
                        <div className="text-3xl font-bold text-primary/70 mb-2">{String(i + 1).padStart(2, "0")}</div>
                        <h3 className="text-xl font-semibold mb-2">{s.step}</h3>
                        <p className="text-muted-foreground">{s.desc}</p>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Hackathon Pitch Section */}
            <section id="pitch" className="py-20 px-4">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  className="text-center mb-14"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl font-bold tracking-tight mb-4">Why SentryX</h2>
                  <p className="text-xl text-muted-foreground">
                    Built for impact. Designed to win hackathons.
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: "Inspiration",
                      desc: "Combating misinformation at scale with real-time, explainable AI.",
                      color: "from-cyan-400/20 to-purple-400/20"
                    },
                    {
                      title: "Challenges",
                      desc: "Balancing speed, accuracy, and clarity with multi-modal inputs.",
                      color: "from-purple-400/20 to-green-400/20"
                    },
                    {
                      title: "Accomplishments",
                      desc: "Unified pipeline: credibility scores, deepfake analysis, and sources.",
                      color: "from-green-400/20 to-cyan-400/20"
                    },
                    {
                      title: "What's Next",
                      desc: "Browser extensions, public APIs, and verified publisher partnerships.",
                      color: "from-cyan-400/20 to-purple-400/20"
                    },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                    >
                      <div className={`rounded-2xl p-6 glass-strong neon-border bg-gradient-to-br ${item.color}`}>
                        <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                        <p className="text-muted-foreground">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Multi-Modal Inputs Section */}
            <section id="multi-modal" className="py-20 px-4">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  className="text-center mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-4xl font-bold tracking-tight mb-4">Analyze Any Content Type</h2>
                  <p className="text-xl text-muted-foreground">
                    Paste text, image URL, or video URL — SentryX will generate a full report.
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Text Input */}
                  <GlassCard className="neon-border">
                    <div className="space-y-3">
                      <div className="text-lg font-semibold">Text</div>
                      <Textarea
                        placeholder="Paste text to analyze..."
                        className="glass-card border-0 min-h-[140px]"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        disabled={isAnalyzing}
                      />
                      <Button
                        onClick={() => handleAnalysis("text", textInput)}
                        disabled={isAnalyzing || !textInput.trim()}
                        className="neon-button glow glass-strong border-0 w-full"
                      >
                        {isAnalyzing ? "Scanning..." : "Scan Text"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Tip: Include the main paragraph or claim for fastest results.
                      </p>
                    </div>
                  </GlassCard>

                  {/* Image URL */}
                  <GlassCard className="neon-border">
                    <div className="space-y-3">
                      <div className="text-lg font-semibold">Image URL</div>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        className="glass-card border-0"
                        value={imageUrl}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setImageUrl(e.target.value)}
                        disabled={isAnalyzing}
                      />
                      <Button
                        onClick={() => handleAnalysis("image", imageUrl)}
                        disabled={isAnalyzing || !imageUrl.trim()}
                        className="neon-button glow glass-strong border-0 w-full"
                      >
                        {isAnalyzing ? "Scanning..." : "Scan Image"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Checks for manipulation signs and returns a deepfake status.
                      </p>
                    </div>
                  </GlassCard>

                  {/* Video URL */}
                  <GlassCard className="neon-border">
                    <div className="space-y-3">
                      <div className="text-lg font-semibold">Video URL</div>
                      <Input
                        placeholder="https://example.com/video.mp4"
                        className="glass-card border-0"
                        value={videoUrl}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setVideoUrl(e.target.value)}
                        disabled={isAnalyzing}
                      />
                      <Button
                        onClick={() => handleAnalysis("video", videoUrl)}
                        disabled={isAnalyzing || !videoUrl.trim()}
                        className="neon-button glow glass-strong border-0 w-full"
                      >
                        {isAnalyzing ? "Scanning..." : "Scan Video"}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Runs frame checks and reports deepfake likelihood with findings.
                      </p>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 glass-strong border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold">SentryX</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a
                href="https://devpost.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Shield className="h-5 w-5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
            
            <p className="text-sm text-muted-foreground">
              © 2024 SentryX. Powered by{" "}
              <a
                href="https://vly.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                vly.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}