// ── src/lambdas/getUploadUrl/index.ts ──────────────────────────────
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { s3Client, logger, createApiResponse } from "../../shared/utils";

const UploadUrlSchema = z.object({
  employee_id: z.string().uuid("Invalid employee ID"),
  doc_type: z.enum(["id_proof", "degree_certificate", "signed_offer"]),
  content_type: z.enum(["application/pdf", "image/jpeg", "image/png"]),
  filename: z.string().min(1, "Filename is required"),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  logger.info("Received request for S3 pre-signed upload URL", { requestId, body: event.body });

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(createApiResponse(null, "Missing request body", requestId)),
      };
    }

    const bodyJson = JSON.parse(event.body);
    const validationResult = UploadUrlSchema.safeParse(bodyJson);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      logger.warn("Validation failed for pre-signed URL input", { requestId, errorMsg });
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(createApiResponse(null, `Validation Error: ${errorMsg}`, requestId)),
      };
    }

    const { employee_id, doc_type, content_type, filename } = validationResult.data;
    const bucketName = process.env.BUCKET_NAME;

    if (!bucketName) {
      throw new Error("Missing BUCKET_NAME environment variable");
    }

    // Clean filename to prevent path traversal or S3 injection
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const s3Key = `documents/${employee_id}/${doc_type}/${safeFilename}`;

    logger.info("Generating S3 PUT pre-signed URL", { bucketName, s3Key, content_type });

    // Generate standard presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      ContentType: content_type,
      Metadata: {
        "employee-id": employee_id,
        "doc-type": doc_type,
        "original-name": filename,
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    });

    const payload = {
      upload_url: presignedUrl,
      s3_key: s3Key,
      expires_in: 900,
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST",
      },
      body: JSON.stringify(createApiResponse(payload, null, requestId)),
    };
  } catch (err: any) {
    logger.error("Unexpected error in getUploadUrl handler", err, { requestId });
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(createApiResponse(null, `Internal Server Error: ${err.message}`, requestId)),
    };
  }
};
