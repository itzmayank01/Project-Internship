// ── src/shared/utils.ts ─────────────────────────────────────────────
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { SFNClient } from "@aws-sdk/client-sfn";
import { S3Client } from "@aws-sdk/client-s3";
import { SESClient } from "@aws-sdk/client-ses";
import { SNSClient } from "@aws-sdk/client-sns";
import { z } from "zod";

// AWS X-Ray SDK integration
// Architectural decision: AWS SDK v3 clients are wrapped optionally with X-Ray for tracing.
let ddbClientRaw = new DynamoDBClient({});
let cognitoClientRaw = new CognitoIdentityProviderClient({});
let sfnClientRaw = new SFNClient({});
let s3ClientRaw = new S3Client({});
let sesClientRaw = new SESClient({});
let snsClientRaw = new SNSClient({});

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AWSXRay = require("aws-xray-sdk-core");
  ddbClientRaw = AWSXRay.captureAWSv3Client(ddbClientRaw);
  cognitoClientRaw = AWSXRay.captureAWSv3Client(cognitoClientRaw);
  sfnClientRaw = AWSXRay.captureAWSv3Client(sfnClientRaw);
  s3ClientRaw = AWSXRay.captureAWSv3Client(s3ClientRaw);
  sesClientRaw = AWSXRay.captureAWSv3Client(sesClientRaw);
  snsClientRaw = AWSXRay.captureAWSv3Client(snsClientRaw);
} catch (e) {
  // Silent fallback when X-Ray is not available in local tests/runs
}

export const ddbDocClient = DynamoDBDocumentClient.from(ddbClientRaw, {
  marshallOptions: { removeUndefinedValues: true },
});
export const cognitoClient = cognitoClientRaw;
export const sfnClient = sfnClientRaw;
export const s3Client = s3ClientRaw;
export const sesClient = sesClientRaw;
export const snsClient = snsClientRaw;

// Structured Logging Utility
export const logger = {
  info: (message: string, context: Record<string, any> = {}) => {
    console.log(JSON.stringify({ level: "INFO", timestamp: new Date().toISOString(), message, ...context }));
  },
  error: (message: string, error: any, context: Record<string, any> = {}) => {
    console.error(
      JSON.stringify({
        level: "ERROR",
        timestamp: new Date().toISOString(),
        message,
        error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
        ...context,
      })
    );
  },
  warn: (message: string, context: Record<string, any> = {}) => {
    console.warn(JSON.stringify({ level: "WARN", timestamp: new Date().toISOString(), message, ...context }));
  },
};

// Structured API response envelope
export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  meta: {
    requestId: string;
    timestamp: string;
    [key: string]: any;
  };
}

export function createApiResponse<T>(data: T | null, error: string | null, requestId: string, extraMeta: Record<string, any> = {}): ApiResponse<T> {
  return {
    data,
    error,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...extraMeta,
    },
  };
}

// Zod Validation Schema for Employee Onboarding
export const CreateEmployeeSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  department: z.string().min(1, "Department is required"),
  role: z.string().min(1, "Role is required"),
  manager_id: z.string().uuid("Invalid manager ID"),
  joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Joining date must be in YYYY-MM-DD format"),
  employment_type: z.enum(["full_time", "contract", "intern"]),
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
