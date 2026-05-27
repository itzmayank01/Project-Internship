// ── src/lambdas/completeStage/index.ts ──────────────────────────────
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SendTaskSuccessCommand } from "@aws-sdk/client-sfn";
import { z } from "zod";
import { ddbDocClient, sfnClient, logger, createApiResponse } from "../../shared/utils";

const CompleteStageSchema = z.object({
  stage: z.enum(["it_provisioning", "policy_signoff", "manager_intro"]),
  details: z.record(z.any()).optional(),
  signature: z.string().optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  const employeeId = event.pathParameters?.employee_id;
  logger.info("Received complete-stage request", { requestId, employeeId, body: event.body });

  try {
    if (!employeeId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(createApiResponse(null, "Missing employee_id path parameter", requestId)),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(createApiResponse(null, "Missing request body", requestId)),
      };
    }

    const bodyJson = JSON.parse(event.body);
    const validationResult = CompleteStageSchema.safeParse(bodyJson);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(createApiResponse(null, `Validation Error: ${errorMsg}`, requestId)),
      };
    }

    const { stage, details, signature } = validationResult.data;
    const tableName = process.env.TABLE_NAME;

    if (!tableName) {
      throw new Error("Missing TABLE_NAME environment variable");
    }

    // 1. Fetch employee to retrieve the task token for this stage
    const getResult = await ddbDocClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { employee_id: employeeId },
      })
    );

    const employee = getResult.Item;
    if (!employee) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(createApiResponse(null, "Employee record not found", requestId)),
      };
    }

    const stageProgress = employee.stage_progress?.[stage];
    if (!stageProgress) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(createApiResponse(null, `Stage ${stage} is not initialized`, requestId)),
      };
    }

    if (stageProgress.status === "complete") {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(createApiResponse(null, `Stage ${stage} is already completed`, requestId)),
      };
    }

    const taskToken = stageProgress.task_token;
    if (!taskToken) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(createApiResponse(null, `No active workflow task token found for stage ${stage}`, requestId)),
      };
    }

    // 2. Resolve Step Functions Task
    logger.info("Resolving task token for stage", { employeeId, stage });
    try {
      await sfnClient.send(
        new SendTaskSuccessCommand({
          taskToken: taskToken,
          output: JSON.stringify({
            employee_id: employeeId,
            stage_name: stage,
            status: "complete",
            details: details || {},
            signature: signature || "",
          }),
        })
      );
    } catch (sfnError: any) {
      logger.error("Failed to complete task token on Step Functions", sfnError);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(createApiResponse(null, `Workflow Engine Error: ${sfnError.message}`, requestId)),
      };
    }

    // 3. Update DynamoDB to mark stage complete and update overall onboarding status
    let nextStatusText = "IT_PROVISIONING";
    if (stage === "it_provisioning") nextStatusText = "POLICY_SIGNOFF";
    else if (stage === "policy_signoff") nextStatusText = "MANAGER_INTRO";
    else if (stage === "manager_intro") nextStatusText = "DAY1_READY";

    logger.info("Updating DynamoDB status", { employeeId, nextStatusText });
    await ddbDocClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { employee_id: employeeId },
        UpdateExpression: "SET stage_progress.#stage.status = :complete, stage_progress.#stage.completed_at = :now, onboarding_status = :statusText, updated_at = :now",
        ExpressionAttributeNames: {
          "#stage": stage,
        },
        ExpressionAttributeValues: {
          ":complete": "complete",
          ":statusText": nextStatusText,
          ":now": new Date().toISOString(),
        },
      })
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST",
      },
      body: JSON.stringify(createApiResponse({ employee_id: employeeId, stage, status: "complete" }, null, requestId)),
    };
  } catch (err: any) {
    logger.error("Unexpected error in completeStage handler", err, { requestId });
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(createApiResponse(null, `Internal Server Error: ${err.message}`, requestId)),
    };
  }
};
