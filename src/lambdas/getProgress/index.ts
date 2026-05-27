// ── src/lambdas/getProgress/index.ts ───────────────────────────────
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient, logger, createApiResponse } from "../../shared/utils";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  const employeeId = event.pathParameters?.employee_id;
  logger.info("Received progress request for employee", { requestId, employeeId });

  try {
    if (!employeeId) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(createApiResponse(null, "Missing employee_id path parameter", requestId)),
      };
    }

    const tableName = process.env.TABLE_NAME;
    if (!tableName) {
      throw new Error("Missing TABLE_NAME environment variable");
    }

    const getResult = await ddbDocClient.send(
      new GetCommand({
        TableName: tableName,
        Key: { employee_id: employeeId },
      })
    );

    const item = getResult.Item;
    if (!item) {
      logger.warn("Employee not found", { employeeId });
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(createApiResponse(null, "Employee onboarding record not found", requestId)),
      };
    }

    // Standardized stages array
    const defaultProgress = { status: "pending", completed_at: "", reminded_count: 0 };
    const docColl = item.stage_progress?.document_collection || defaultProgress;
    const itProv = item.stage_progress?.it_provisioning || defaultProgress;
    const polSign = item.stage_progress?.policy_signoff || defaultProgress;
    const mgrIntro = item.stage_progress?.manager_intro || defaultProgress;

    const stagesList = [
      { name: "Document Collection", status: docColl.status, completed_at: docColl.completed_at, reminded_count: docColl.reminded_count || 0 },
      { name: "IT Provisioning", status: itProv.status, completed_at: itProv.completed_at, reminded_count: itProv.reminded_count || 0 },
      { name: "Policy Sign-off", status: polSign.status, completed_at: polSign.completed_at, reminded_count: polSign.reminded_count || 0 },
      { name: "Manager Intro", status: mgrIntro.status, completed_at: mgrIntro.completed_at, reminded_count: mgrIntro.reminded_count || 0 },
    ];

    // Calculate percentage based on completed stages
    let completedCount = 0;
    stagesList.forEach((stage) => {
      if (stage.status === "complete") {
        completedCount++;
      }
    });

    const overallPercent = Math.round((completedCount / stagesList.length) * 100);

    // Calculate current active stage
    let currentStage = "Day 1 Ready";
    for (const stage of stagesList) {
      if (stage.status !== "complete") {
        currentStage = stage.name;
        break;
      }
    }

    const responsePayload = {
      employee_id: employeeId,
      full_name: item.full_name,
      department: item.department,
      role: item.role,
      joining_date: item.joining_date,
      onboarding_status: item.onboarding_status,
      stages: stagesList,
      overall_percent: overallPercent,
      current_stage: currentStage,
      docs: item.docs || {},
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify(createApiResponse(responsePayload, null, requestId)),
    };
  } catch (err: any) {
    logger.error("Unexpected error in getProgress handler", err, { requestId });
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(createApiResponse(null, `Internal Server Error: ${err.message}`, requestId)),
    };
  }
};
