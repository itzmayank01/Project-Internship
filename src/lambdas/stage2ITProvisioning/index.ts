// ── src/lambdas/stage2ITProvisioning/index.ts ──────────────────────
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient, logger } from "../../shared/utils";

interface Stage2Input {
  employee_id: string;
  task_token: string;
}

export const handler = async (event: Stage2Input): Promise<{ status: string }> => {
  const { employee_id, task_token } = event;
  logger.info("Starting Stage 2: IT Provisioning", { employee_id });

  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    throw new Error("Missing TABLE_NAME environment variable");
  }

  // Update status to in-progress and record the Step Functions task token
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { employee_id },
      UpdateExpression: "SET stage_progress.it_provisioning.status = :status, stage_progress.it_provisioning.task_token = :token, onboarding_status = :statusText, updated_at = :now",
      ExpressionAttributeValues: {
        ":status": "in-progress",
        ":token": task_token,
        ":statusText": "IT_PROVISIONING",
        ":now": new Date().toISOString(),
      },
    })
  );

  logger.info("Stage 2 initialized. Waiting for admin check-off via dashboard to complete task token.", { employee_id });
  return { status: "AWAITING_IT_PROVISIONING" };
};
