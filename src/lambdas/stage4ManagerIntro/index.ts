// ── src/lambdas/stage4ManagerIntro/index.ts ────────────────────────
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient, logger } from "../../shared/utils";

interface Stage4Input {
  employee_id: string;
  task_token: string;
}

export const handler = async (event: Stage4Input): Promise<{ status: string }> => {
  const { employee_id, task_token } = event;
  logger.info("Starting Stage 4: Manager Intro", { employee_id });

  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    throw new Error("Missing TABLE_NAME environment variable");
  }

  // Update status to in-progress and record the Step Functions task token
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { employee_id },
      UpdateExpression: "SET stage_progress.manager_intro.status = :status, stage_progress.manager_intro.task_token = :token, onboarding_status = :statusText, updated_at = :now",
      ExpressionAttributeValues: {
        ":status": "in-progress",
        ":token": task_token,
        ":statusText": "MANAGER_INTRO",
        ":now": new Date().toISOString(),
      },
    })
  );

  logger.info("Stage 4 initialized. Waiting for manager check-off to complete task token.", { employee_id });
  return { status: "AWAITING_MANAGER_INTRO" };
};
