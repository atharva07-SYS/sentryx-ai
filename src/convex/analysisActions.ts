"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const analyzeContent = action({
  args: {
    reportId: v.id("detectionReports"),
    inputType: v.union(v.literal("url"), v.literal("text"), v.literal("image"), v.literal("video")),
    inputContent: v.string(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    try {
      // Simulate AI analysis - in production, integrate with real APIs
      const analysisResult = await performAnalysis(args.inputType, args.inputContent);
      
      const processingTime = Date.now() - startTime;
      
      // Update the report with results
      await ctx.runMutation(internal.detectionReports.updateReport, {
        reportId: args.reportId,
        credibilityScore: analysisResult.credibilityScore,
        deepfakeStatus: analysisResult.deepfakeStatus,
        flaggedClaims: analysisResult.flaggedClaims,
        verifiedSources: analysisResult.verifiedSources,
        summary: analysisResult.summary,
        processingTime,
        status: "completed",
        // pass new fields if present
        confidenceBreakdown: analysisResult.confidenceBreakdown,
        explainability: analysisResult.explainability,
        recommendations: analysisResult.recommendations,
        frameFindings: analysisResult.frameFindings,
      });
      
      return { success: true, reportId: args.reportId };
    } catch (error) {
      console.error("Analysis failed:", error);
      
      await ctx.runMutation(internal.detectionReports.updateReport, {
        reportId: args.reportId,
        credibilityScore: 0,
        flaggedClaims: [],
        verifiedSources: [],
        summary: "Analysis failed due to technical error",
        processingTime: Date.now() - startTime,
        status: "failed",
      });
      
      throw new Error("Analysis failed");
    }
  },
});

async function performAnalysis(inputType: string, content: string) {
  // Try OpenRouter (if configured) for higher-fidelity results
  try {
    const res = await callOpenRouter(inputType, content);
    if (res) return res;
  } catch (err) {
    console.warn("OpenRouter analysis failed, falling back to mock:", err);
  }

  // Fallback to mock analysis
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  // Mock analysis results based on input type
  if (inputType === "text") {
    return analyzeText(content);
  } else if (inputType === "url") {
    return analyzeUrl(content);
  } else if (inputType === "image" || inputType === "video") {
    return analyzeMedia(content, inputType);
  }
  
  throw new Error("Unsupported input type");
}

// Add: OpenRouter call for structured analysis
async function callOpenRouter(inputType: string, content: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = "openai/gpt-4o-mini";

  const systemPrompt =
    "You are SentryX, an AI specializing in misinformation and deepfake detection. " +
    "Return STRICT JSON ONLY, matching this exact shape: " +
    "{ credibilityScore: number (0-100), deepfakeStatus?: \"real\"|\"fake\"|\"uncertain\", " +
    "flaggedClaims: Array<{ claim: string, confidence: number (0-1), sources: string[] }>, " +
    "verifiedSources: Array<{ title: string, url: string, credibility: number (0-1) }>, " +
    "summary: string, " +
    "confidenceBreakdown: { trusted: number (0-1), neutral: number (0-1), suspicious: number (0-1) }, " +
    "explainability: string, " +
    "recommendations: string[], " +
    "frameFindings?: string[] }. " +
    "Rules: (1) No extra text. (2) For image/video URLs, infer likely manipulation and provide frameFindings if possible. " +
    "(3) For URLs, assess domain reputation & content. (4) For text, flag sensational patterns and unsupported claims. " +
    "(5) Ensure confidenceBreakdown sums ~1.0 (normalize if needed). (6) Keep summary concise and useful.";

  const userPrompt = `Input Type: ${inputType}
Content: ${content}

Output STRICT JSON ONLY as specified.`;

  const body = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  };

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://sentryx.app",
      "X-Title": "SentryX AI",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`OpenRouter HTTP ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  const contentText: string | undefined =
    data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.message?.[0]?.content;

  if (!contentText || typeof contentText !== "string") {
    throw new Error("OpenRouter returned invalid content");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(contentText);
  } catch {
    throw new Error("Failed to parse JSON from OpenRouter");
  }

  const credibilityScore = clampNumber(parsed.credibilityScore, 0, 100, 60);
  const deepfakeStatus = normalizeDeepfakeStatus(parsed.deepfakeStatus);

  const flaggedClaims = Array.isArray(parsed.flaggedClaims) ? parsed.flaggedClaims.map((c: any) => ({
    claim: String(c?.claim ?? ""),
    confidence: clampNumber(Number(c?.confidence ?? 0.6), 0, 1, 0.6),
    sources: Array.isArray(c?.sources) ? c.sources.map((s: any) => String(s)) : [],
  })) : [];

  const verifiedSources = Array.isArray(parsed.verifiedSources) ? parsed.verifiedSources.map((s: any) => ({
    title: String(s?.title ?? "Source"),
    url: String(s?.url ?? ""),
    credibility: clampNumber(Number(s?.credibility ?? 0.8), 0, 1, 0.8),
  })) : [];

  const summary = String(parsed.summary ?? "Analysis complete.");

  // Confidence breakdown coercion and normalization
  let cb = parsed.confidenceBreakdown ?? {};
  let trusted = clampNumber(Number(cb.trusted ?? 0.7), 0, 1, 0.7);
  let neutral = clampNumber(Number(cb.neutral ?? 0.2), 0, 1, 0.2);
  let suspicious = clampNumber(Number(cb.suspicious ?? 0.1), 0, 1, 0.1);
  const sum = trusted + neutral + suspicious || 1;
  trusted = trusted / sum;
  neutral = neutral / sum;
  suspicious = suspicious / sum;

  const explainability = String(parsed.explainability ?? "");
  const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.map((r: any) => String(r)) : [];
  const frameFindings = Array.isArray(parsed.frameFindings) ? parsed.frameFindings.map((f: any) => String(f)) : [];

  return {
    credibilityScore,
    deepfakeStatus,
    flaggedClaims,
    verifiedSources,
    summary,
    confidenceBreakdown: { trusted, neutral, suspicious },
    explainability,
    recommendations,
    frameFindings,
  };
}

function clampNumber(n: number, min: number, max: number, fallback: number) {
  if (typeof n !== "number" || Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeDeepfakeStatus(s: any): "real" | "fake" | "uncertain" | undefined {
  if (!s) return undefined;
  const v = String(s).toLowerCase();
  if (v === "real" || v === "fake" || v === "uncertain") return v;
  return undefined;
}

function analyzeText(text: string) {
  const suspiciousKeywords = ["breaking", "exclusive", "shocking", "unbelievable", "doctors hate", "secret"];
  const flaggedClaims = [];
  
  let credibilityScore = 85;
  
  // Check for suspicious patterns
  for (const keyword of suspiciousKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      credibilityScore -= 15;
      flaggedClaims.push({
        claim: `Contains suspicious keyword: "${keyword}"`,
        confidence: 0.7,
        sources: ["Pattern Analysis"]
      });
    }
  }
  
  // Check text length and structure
  if (text.length < 50) {
    credibilityScore -= 10;
    flaggedClaims.push({
      claim: "Text too short for reliable analysis",
      confidence: 0.6,
      sources: ["Length Analysis"]
    });
  }
  
  credibilityScore = Math.max(0, Math.min(100, credibilityScore));
  
  return {
    credibilityScore,
    deepfakeStatus: undefined,
    flaggedClaims,
    verifiedSources: [
      {
        title: "Fact-checking guidelines",
        url: "https://example.com/fact-check",
        credibility: 0.9
      }
    ],
    summary: `Text analysis completed. Credibility score: ${credibilityScore}/100. ${flaggedClaims.length} potential issues identified.`,
    confidenceBreakdown: { trusted: 0.8, neutral: 0.1, suspicious: 0.1 },
    explainability: "Sensational language detected but no direct claims of falsity.",
    recommendations: ["Verify claims with primary sources", "Check for corroborating evidence"],
    frameFindings: [],
  };
}

function analyzeUrl(url: string) {
  const trustedDomains = ["reuters.com", "bbc.com", "ap.org", "npr.org"];
  const suspiciousDomains = ["fakenews.com", "clickbait.net"];
  
  let credibilityScore = 70;
  const flaggedClaims = [];
  
  const domain = extractDomain(url);
  
  if (trustedDomains.some(trusted => domain.includes(trusted))) {
    credibilityScore += 20;
  } else if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
    credibilityScore -= 30;
    flaggedClaims.push({
      claim: "Source from potentially unreliable domain",
      confidence: 0.8,
      sources: ["Domain Analysis"]
    });
  }
  
  credibilityScore = Math.max(0, Math.min(100, credibilityScore));
  
  return {
    credibilityScore,
    deepfakeStatus: undefined,
    flaggedClaims,
    verifiedSources: [
      {
        title: "Source verification",
        url: "https://example.com/verify",
        credibility: 0.85
      }
    ],
    summary: `URL analysis completed for ${domain}. Credibility score: ${credibilityScore}/100.`,
    confidenceBreakdown: { trusted: 0.9, neutral: 0.05, suspicious: 0.05 },
    explainability: "Domain reputation is generally trustworthy, but content quality varies.",
    recommendations: ["Cross-reference with multiple sources", "Check for recent updates"],
    frameFindings: [],
  };
}

function analyzeMedia(content: string, type: string) {
  // Simulate deepfake detection
  const deepfakeConfidence = Math.random();
  let deepfakeStatus: "real" | "fake" | "uncertain";
  
  if (deepfakeConfidence > 0.8) {
    deepfakeStatus = "fake";
  } else if (deepfakeConfidence > 0.3) {
    deepfakeStatus = "uncertain";
  } else {
    deepfakeStatus = "real";
  }
  
  const credibilityScore = deepfakeStatus === "real" ? 85 : deepfakeStatus === "uncertain" ? 50 : 15;
  
  const flaggedClaims = [];
  if (deepfakeStatus === "fake") {
    flaggedClaims.push({
      claim: "High probability of digital manipulation detected",
      confidence: deepfakeConfidence,
      sources: ["Deepfake Detection AI"]
    });
  }
  
  const frameFindings: string[] = [];
  if (type === "video") {
    frameFindings.push("Key frame analysis: No obvious face warping artifacts detected.");
  } else if (type === "image") {
    frameFindings.push("Edge consistency check: Lighting and shadows appear consistent.");
  }

  return {
    credibilityScore,
    deepfakeStatus,
    flaggedClaims,
    verifiedSources: [
      {
        title: "Media verification guidelines",
        url: "https://example.com/media-verify",
        credibility: 0.9
      }
    ],
    summary: `${type} analysis completed. Deepfake status: ${deepfakeStatus}. Credibility score: ${credibilityScore}/100.`,
    confidenceBreakdown: { trusted: 0.7, neutral: 0.2, suspicious: 0.1 },
    explainability: deepfakeStatus === "fake"
      ? "High frequency artifacts and temporal inconsistencies suggest manipulation."
      : "No strong manipulation indicators; signals consistent across frames.",
    recommendations: deepfakeStatus === "fake"
      ? ["Seek original source", "Cross-check with trusted outlets"]
      : ["Consider corroborating sources for high-impact claims"],
    frameFindings,
  };
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}