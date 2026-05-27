// ── src/lambdas/validateDocument/index.ts ──────────────────────────
import { S3Event } from "aws-lambda";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SendTaskSuccessCommand, SendTaskFailureCommand } from "@aws-sdk/client-sfn";
import { PublishCommand } from "@aws-sdk/client-sns";
import { s3Client, ddbDocClient, sfnClient, snsClient, logger } from "../../shared/utils";

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const handler = async (event: S3Event): Promise<void> => {
  logger.info("Received S3 ObjectCreated event", { recordsCount: event.Records.length });

  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    logger.info("Processing object", { bucketName, objectKey });

    // Key structure: documents/{employee_id}/{doc_type}/{filename}
    const parts = objectKey.split("/");
    if (parts.length < 4 || parts[0] !== "documents") {
      logger.warn("Object key does not match expected structure. Skipping.", { objectKey });
      continue;
    }

    const employeeId = parts[1];
    const docType = parts[2] as "id_proof" | "degree_certificate" | "signed_offer";

    if (!["id_proof", "degree_certificate", "signed_offer"].includes(docType)) {
      logger.warn("Invalid document type parsed from key. Skipping.", { docType });
      continue;
    }

    const tableName = process.env.TABLE_NAME;
    const snsTopicArn = process.env.SNS_TOPIC_ARN;

    if (!tableName || !snsTopicArn) {
      logger.error("Missing required environment variables (TABLE_NAME or SNS_TOPIC_ARN)");
      continue;
    }

    let fileMetadata;
    try {
      fileMetadata = await s3Client.send(
        new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        })
      );
    } catch (headError) {
      logger.error("Failed to perform HEAD on S3 object", headError, { bucketName, objectKey });
      continue;
    }

    const contentType = fileMetadata.ContentType || "";
    const contentLength = fileMetadata.ContentLength || 0;

    logger.info("File metadata fetched", { contentType, contentLength });

    let isPassed = true;
    let rejectReason = "";

    // 1. Re-validate MIME Type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      isPassed = false;
      rejectReason = `Forbidden MIME type: ${contentType}. Permitted types: ${ALLOWED_MIME_TYPES.join(", ")}`;
    }

    // 2. Re-validate File Size
    if (contentLength > MAX_FILE_SIZE_BYTES) {
      isPassed = false;
      rejectReason = `File size exceeds 10MB limit (Actual: ${(contentLength / (1024 * 1024)).toFixed(2)}MB)`;
    }

    // Fetch the employee record first to retrieve task token
    let employeeRecord: any = null;
    try {
      const getResult = await ddbDocClient.send(
        new GetCommand({
          TableName: tableName,
          Key: { employee_id: employeeId },
        })
      );
      employeeRecord = getResult.Item;
    } catch (dbError) {
      logger.error("Failed to fetch employee record from DynamoDB", dbError, { employeeId });
      continue;
    }

    if (!employeeRecord) {
      logger.error("Employee record not found in DynamoDB", null, { employeeId });
      continue;
    }

    const taskToken = employeeRecord.stage_progress?.document_collection?.task_token;

    if (isPassed) {
      logger.info("Document passed validation. Updating DynamoDB record.", { employeeId, docType });
      try {
        await ddbDocClient.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { employee_id: employeeId },
            UpdateExpression: "SET docs.#doc = :docVal, updated_at = :now",
            ExpressionAttributeNames: {
              "#doc": docType,
            },
            ExpressionAttributeValues: {
              ":docVal": {
                s3_key: objectKey,
                status: "verified",
                uploaded_at: new Date().toISOString(),
                file_size_bytes: contentLength,
              },
              ":now": new Date().toISOString(),
            },
          })
        );
      } catch (updateError) {
        logger.error("Failed to update DynamoDB with verified document status", updateError, { employeeId });
        continue;
      }

      // Re-fetch employee record to check status of all docs
      try {
        const getResult = await ddbDocClient.send(
          new GetCommand({
            TableName: tableName,
            Key: { employee_id: employeeId },
          })
        );
        employeeRecord = getResult.Item;
      } catch (dbError) {
        logger.error("Failed to re-fetch employee record", dbError, { employeeId });
      }

      const docs = employeeRecord?.docs || {};
      const allVerified =
        docs.id_proof?.status === "verified" &&
        docs.degree_certificate?.status === "verified" &&
        docs.signed_offer?.status === "verified";

      if (allVerified) {
        logger.info("All documents verified. Resolving Step Functions Task and notifying HR.", { employeeId });

        // Update stage completion status in DynamoDB
        try {
          await ddbDocClient.send(
            new UpdateCommand({
              TableName: tableName,
              Key: { employee_id: employeeId },
              UpdateExpression: "SET stage_progress.document_collection.status = :complete, stage_progress.document_collection.completed_at = :now, onboarding_status = :status, updated_at = :now",
              ExpressionAttributeValues: {
                ":complete": "complete",
                ":status": "IT_PROVISIONING",
                ":now": new Date().toISOString(),
              },
            })
          );
        } catch (dbErr) {
          logger.error("Failed to update stage progress for document collection", dbErr);
        }

        // Call SendTaskSuccess if token exists
        if (taskToken) {
          try {
            await sfnClient.send(
              new SendTaskSuccessCommand({
                taskToken: taskToken,
                output: JSON.stringify({
                  employee_id: employeeId,
                  document_collection_status: "verified",
                }),
              })
            );
          } catch (sfnError) {
            logger.error("Failed to send task success to Step Functions", sfnError);
          }
        }

        // Publish to SNS
        try {
          const message = `HR Admin Notification: Document collection completed successfully for employee.\n\n` +
            `Employee Name: ${employeeRecord.full_name}\n` +
            `Email: ${employeeRecord.email}\n` +
            `Department: ${employeeRecord.department}\n` +
            `Joining Date: ${employeeRecord.joining_date}\n\n` +
            `Documents Summary:\n` +
            `- ID Proof: Verified (${(docs.id_proof.file_size_bytes / 1024).toFixed(1)} KB)\n` +
            `- Degree Certificate: Verified (${(docs.degree_certificate.file_size_bytes / 1024).toFixed(1)} KB)\n` +
            `- Signed Offer: Verified (${(docs.signed_offer.file_size_bytes / 1024).toFixed(1)} KB)\n\n` +
            `Access the dashboard link below to proceed with IT provisioning checkoff:\n` +
            `https://admin-dashboard.company.com/employee/${employeeId}`;

          await snsClient.send(
            new PublishCommand({
              TopicArn: snsTopicArn,
              Subject: `Onboarding Docs Completed: ${employeeRecord.full_name}`,
              Message: message,
            })
          );
        } catch (snsError) {
          logger.error("Failed to publish SNS message to HR topic", snsError);
        }
      }
    } else {
      logger.warn("Document validation failed. Rejecting document.", { employeeId, docType, rejectReason });
      try {
        await ddbDocClient.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { employee_id: employeeId },
            UpdateExpression: "SET docs.#doc = :docVal, updated_at = :now",
            ExpressionAttributeNames: {
              "#doc": docType,
            },
            ExpressionAttributeValues: {
              ":docVal": {
                s3_key: objectKey,
                status: "rejected",
                reject_reason: rejectReason,
                uploaded_at: new Date().toISOString(),
                file_size_bytes: contentLength,
              },
              ":now": new Date().toISOString(),
            },
          })
        );
      } catch (updateError) {
        logger.error("Failed to update DynamoDB with rejected status", updateError, { employeeId });
        continue;
      }

      // Fail-fast logic for document collection
      if (taskToken) {
        try {
          await sfnClient.send(
            new SendTaskFailureCommand({
              taskToken: taskToken,
              error: "DOCUMENT_VALIDATION_FAILED",
              cause: `Document ${docType} was rejected. Reason: ${rejectReason}`,
            })
          );
        } catch (sfnError) {
          logger.error("Failed to send task failure to Step Functions", sfnError);
        }
      }
    }
  }
};
