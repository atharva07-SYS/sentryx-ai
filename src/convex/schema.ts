import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // SentryX Detection Reports
    detectionReports: defineTable({
      userId: v.optional(v.id("users")),
      inputType: v.union(v.literal("url"), v.literal("text"), v.literal("image"), v.literal("video")),
      inputContent: v.string(),
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
      confidenceBreakdown: v.optional(v.object({
        trusted: v.number(),
        neutral: v.number(),
        suspicious: v.number(),
      })),
      explainability: v.optional(v.string()),
      recommendations: v.optional(v.array(v.string())),
      frameFindings: v.optional(v.array(v.string())),
    }).index("by_user", ["userId"])
      .index("by_status", ["status"]),

    // Analysis Cache for performance
    analysisCache: defineTable({
      contentHash: v.string(),
      inputType: v.string(),
      result: v.object({
        credibilityScore: v.number(),
        deepfakeStatus: v.optional(v.string()),
        flaggedClaims: v.array(v.any()),
        verifiedSources: v.array(v.any()),
        summary: v.string()
      }),
      expiresAt: v.number(),
    }).index("by_hash", ["contentHash"])
      .index("by_expiry", ["expiresAt"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;