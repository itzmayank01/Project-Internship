// ── src/lambdas/stage3PolicySignoff/index.ts ───────────────────────
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient, logger } from "../../shared/utils";

interface Stage3Input {
  employee_id: string;
  task_token: string;
}

export const handler = async (event: Stage3Input): Promise<{ status: string }> => {
  const { employee_id, task_token } = event;
  logger.info("Starting Stage 3: Policy Sign-off", { employee_id });

  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    throw new Error("Missing TABLE_NAME environment variable");
  }

  // Update status to in-progress and record the Step Functions task token
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { employee_id },
      UpdateExpression: "SET stage_progress.policy_signoff.status = :status, stage_progress.policy_signoff.task_token = :token, onboarding_status = :statusText, updated_at = :now",
      ExpressionAttributeValues: {
        ":status": "in-progress",
        ":token": task_token,
        ":statusText": "POLICY_SIGNOFF",
        ":now": new Date().toISOString(),
      },
    })
  );

  logger.info("Stage 3 initialized. Waiting for new hire digital signature in portal to complete task token.", { employee_id });
  return { status: "AWAITING_POLICY_SIGNOFF" };
};
