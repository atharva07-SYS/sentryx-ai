import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getCurrentUser } from "./users";

export const createReport = mutation({
  args: {
    inputType: v.union(v.literal("url"), v.literal("text"), v.literal("image"), v.literal("video")),
    inputContent: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    const reportId = await ctx.db.insert("detectionReports", {
      userId: user?._id,
      inputType: args.inputType,
      inputContent: args.inputContent,
      credibilityScore: 0,
      flaggedClaims: [],
      verifiedSources: [],
      summary: "",
      processingTime: 0,
      status: "processing",
      // defaults for new fields
      confidenceBreakdown: { trusted: 0, neutral: 0, suspicious: 0 },
      explainability: "",
      recommendations: [],
      frameFindings: [],
    });

    return reportId;
  },
});

export const updateReport = internalMutation({
  args: {
    reportId: v.id("detectionReports"),
    credibilityScore: v.number(),
    deepfakeStatus: v.optional(v.union(v.literal("real"), v.literal("fake"), v.literal("uncertain"))),
    flaggedClaims: v.array(v.object({
      claim: v.string(),
      confidence: v.number(),
      sources: v.array(v.string())
    })),
    verifiedSources: v.array(v.object({
      title: v.string(),
      url: v.string(),
      credibility: v.number()
    })),
    summary: v.string(),
    processingTime: v.number(),
    status: v.union(v.literal("processing"), v.literal("completed"), v.literal("failed")),
    // new optional fields
    confidenceBreakdown: v.optional(v.object({
      trusted: v.number(),
      neutral: v.number(),
      suspicious: v.number(),
    })),
    explainability: v.optional(v.string()),
    recommendations: v.optional(v.array(v.string())),
    frameFindings: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { reportId, ...updates } = args;
    
    await ctx.db.patch(reportId, updates);
    
    return reportId;
  },
});

export const getReport = query({
  args: { reportId: v.id("detectionReports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.reportId);
  },
});

export const getUserReports = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    
    return await ctx.db
      .query("detectionReports")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const getRecentReports = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("detectionReports")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .order("desc")
      .take(10);
  },
});