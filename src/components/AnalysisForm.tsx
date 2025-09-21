import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { GlassCard } from "./GlassCard";
import { motion } from "framer-motion";
import { FileText, Globe, Image, Video, Loader2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AnalysisFormProps {
  onSubmit: (type: string, content: string) => void;
  isLoading: boolean;
}

export function AnalysisForm({ onSubmit, isLoading }: AnalysisFormProps) {
  const [activeTab, setActiveTab] = useState("text");
  const [formData, setFormData] = useState({
    text: "",
    url: "",
    image: "",
    video: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = formData[activeTab as keyof typeof formData];
    
    if (!content.trim()) {
      toast.error("Please enter content to analyze");
      return;
    }

    onSubmit(activeTab, content);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <GlassCard className="w-full max-w-2xl" variant="strong">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/20">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Analyze Content</h2>
            <p className="text-muted-foreground">
              Submit text, URLs, images, or videos for misinformation detection
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 glass-card">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                URL
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-4">
              <TabsContent value="text" className="space-y-4">
                <div>
                  <Label htmlFor="text-input">Text Content</Label>
                  <Textarea
                    id="text-input"
                    placeholder="Paste the text you want to analyze for misinformation..."
                    className="min-h-32 glass-card border-0 resize-none"
                    value={formData.text}
                    onChange={(e) => updateFormData("text", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div>
                  <Label htmlFor="url-input">Website URL</Label>
                  <Input
                    id="url-input"
                    type="url"
                    placeholder="https://example.com/article"
                    className="glass-card border-0"
                    value={formData.url}
                    onChange={(e) => updateFormData("url", e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    We'll analyze the content and source credibility
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="image" className="space-y-4">
                <div>
                  <Label htmlFor="image-input">Image URL</Label>
                  <Input
                    id="image-input"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="glass-card border-0"
                    value={formData.image}
                    onChange={(e) => updateFormData("image", e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Deepfake and manipulation detection for images
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="video" className="space-y-4">
                <div>
                  <Label htmlFor="video-input">Video URL</Label>
                  <Input
                    id="video-input"
                    type="url"
                    placeholder="https://example.com/video.mp4"
                    className="glass-card border-0"
                    value={formData.video}
                    onChange={(e) => updateFormData("video", e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Advanced deepfake detection for video content
                  </p>
                </div>
              </TabsContent>
            </div>

            <Button
              type="submit"
              className="w-full mt-6 glass-strong border-0 glow"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Analyze Content
                </>
              )}
            </Button>
          </Tabs>
        </form>
      </motion.div>
    </GlassCard>
  );
}
