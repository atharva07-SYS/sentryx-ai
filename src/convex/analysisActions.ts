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
  // Simulate processing delay
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
    summary: `Text analysis completed. Credibility score: ${credibilityScore}/100. ${flaggedClaims.length} potential issues identified.`
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
    summary: `URL analysis completed for ${domain}. Credibility score: ${credibilityScore}/100.`
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
    summary: `${type} analysis completed. Deepfake status: ${deepfakeStatus}. Credibility score: ${credibilityScore}/100.`
  };
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
