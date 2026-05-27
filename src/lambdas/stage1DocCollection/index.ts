// ── src/lambdas/stage1DocCollection/index.ts ───────────────────────
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient, logger } from "../../shared/utils";

interface Stage1Input {
  employee_id: string;
  task_token: string;
}

export const handler = async (event: Stage1Input): Promise<{ status: string }> => {
  const { employee_id, task_token } = event;
  logger.info("Starting Stage 1: Document Collection", { employee_id });

  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    throw new Error("Missing TABLE_NAME environment variable");
  }

  // Update status to in-progress and record the Step Functions task token
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { employee_id },
      UpdateExpression: "SET stage_progress.document_collection.status = :status, stage_progress.document_collection.task_token = :token, onboarding_status = :statusText, updated_at = :now",
      ExpressionAttributeValues: {
        ":status": "in-progress",
        ":token": task_token,
        ":statusText": "DOCS_PENDING",
        ":now": new Date().toISOString(),
      },
    })
  );

  logger.info("Stage 1 initialized. Waiting for S3 upload validator to complete task token.", { employee_id });
  return { status: "AWAITING_DOCUMENTS" };
};
