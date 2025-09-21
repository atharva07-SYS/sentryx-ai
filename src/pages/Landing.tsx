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
  Moon
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function Landing() {
  const { isLoading: authLoading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [currentReportId, setCurrentReportId] = useState<Id<"detectionReports"> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />
      <div className="gradient-orb gradient-orb-3" />
      
      {/* Navigation */}
      <motion.nav
        className="relative z-50 glass-strong border-b border-white/10"
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
              <span className="text-2xl font-bold tracking-tight">SentryX</span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                How it Works
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
              <a href="#how-it-works" className="block text-muted-foreground hover:text-foreground transition-colors">
                How it Works
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
            <section className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
              <motion.div
                className="max-w-4xl mx-auto space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="space-y-6">
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Zap className="h-4 w-4 text-primary" />
                    AI-Powered Truth Detection
                  </motion.div>
                  
                  <motion.h1
                    className="text-5xl md:text-7xl font-bold tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Combat{" "}
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Misinformation
                    </span>
                    <br />
                    with SentryX
                  </motion.h1>
                  
                  <motion.p
                    className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Real-time misinformation & deepfake detection powered by advanced AI. 
                    Verify content authenticity, detect manipulated media, and get credibility scores instantly.
                  </motion.p>
                </div>

                {/* Analysis Form */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <AnalysisForm onSubmit={handleAnalysis} isLoading={isAnalyzing} />
                </motion.div>

                {/* Stats */}
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <GlassCard className="text-center" hover>
                    <div className="text-3xl font-bold text-primary mb-2">99.2%</div>
                    <div className="text-sm text-muted-foreground">Detection Accuracy</div>
                  </GlassCard>
                  <GlassCard className="text-center" hover>
                    <div className="text-3xl font-bold text-primary mb-2">&lt;3s</div>
                    <div className="text-sm text-muted-foreground">Average Analysis Time</div>
                  </GlassCard>
                  <GlassCard className="text-center" hover>
                    <div className="text-3xl font-bold text-primary mb-2">50M+</div>
                    <div className="text-sm text-muted-foreground">Content Analyzed</div>
                  </GlassCard>
                </motion.div>
              </motion.div>
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
                    Comprehensive analysis tools to identify misinformation and manipulated content
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    {
                      icon: Shield,
                      title: "Credibility Scoring",
                      description: "Get instant credibility scores from 0-100 based on source reliability, fact-checking, and content analysis."
                    },
                    {
                      icon: Eye,
                      title: "Deepfake Detection",
                      description: "Advanced AI algorithms detect manipulated images and videos with high accuracy."
                    },
                    {
                      icon: Globe,
                      title: "Source Verification",
                      description: "Cross-reference claims with verified sources and fact-checking databases."
                    },
                    {
                      icon: Zap,
                      title: "Real-time Analysis",
                      description: "Lightning-fast processing delivers results in seconds, not minutes."
                    },
                    {
                      icon: CheckCircle,
                      title: "Multi-format Support",
                      description: "Analyze text, URLs, images, and videos all in one platform."
                    },
                    {
                      icon: AlertTriangle,
                      title: "Claim Flagging",
                      description: "Automatically identify and highlight suspicious claims with confidence scores."
                    }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <GlassCard hover className="h-full">
                        <div className="p-2 rounded-lg bg-primary/20 w-fit mb-4">
                          <feature.icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="py-20 px-4">
              <div className="max-w-4xl mx-auto">
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
                    Advanced AI pipeline for comprehensive content analysis
                  </p>
                </motion.div>

                <div className="space-y-8">
                  {[
                    {
                      step: "01",
                      title: "Content Ingestion",
                      description: "Submit text, URLs, images, or videos through our secure interface"
                    },
                    {
                      step: "02", 
                      title: "AI Analysis",
                      description: "Multiple AI models analyze content for manipulation, bias, and factual accuracy"
                    },
                    {
                      step: "03",
                      title: "Source Verification",
                      description: "Cross-reference claims with trusted databases and fact-checking sources"
                    },
                    {
                      step: "04",
                      title: "Results & Report",
                      description: "Receive detailed analysis with credibility scores and actionable insights"
                    }
                  ].map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.2 }}
                    >
                      <GlassCard className="flex items-center gap-6 p-8">
                        <div className="text-4xl font-bold text-primary/50 min-w-[80px]">
                          {step.step}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                          <p className="text-muted-foreground text-lg">{step.description}</p>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
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