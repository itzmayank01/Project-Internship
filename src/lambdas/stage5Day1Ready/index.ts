// ── src/lambdas/stage5Day1Ready/index.ts ───────────────────────────
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient, logger } from "../../shared/utils";

interface Stage5Input {
  employee_id: string;
}

export const handler = async (event: Stage5Input): Promise<{ status: string }> => {
  const { employee_id } = event;
  logger.info("Executing Stage 5: Day 1 Ready", { employee_id });

  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    throw new Error("Missing TABLE_NAME environment variable");
  }

  // Update employee record to indicate terminal success state
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { employee_id },
      UpdateExpression: "SET onboarding_status = :statusText, updated_at = :now",
      ExpressionAttributeValues: {
        ":statusText": "DAY1_READY",
        ":now": new Date().toISOString(),
      },
    })
  );

  logger.info("Stage 5 execution complete. Employee onboarding successfully finalized.", { employee_id });
  return { status: "DAY1_READY" };
};
