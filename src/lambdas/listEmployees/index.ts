// ── src/lambdas/listEmployees/index.ts ─────────────────────────────
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient, logger, createApiResponse } from "../../shared/utils";

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;
  logger.info("Received request to list onboarding records", { requestId, queryParams: event.queryStringParameters });

  try {
    const tableName = process.env.TABLE_NAME;
    if (!tableName) {
      throw new Error("Missing TABLE_NAME environment variable");
    }

    // Perform scan to get all onboarding records
    // In production, for high volume, we would query GSIs or use OpenSearch, but for a 50 employee/month scale, Scan is highly cost-effective and simple.
    // Architectural decision: Scan table for small volume (50/mo) with in-memory filtering.
    const result = await ddbDocClient.send(
      new ScanCommand({
        TableName: tableName,
      })
    );

    const items = result.Items || [];

    // Calculate aggregated metrics for the dashboard
    let inFlightCount = 0;
    let docsPendingCount = 0;
    let joiningTodayCount = 0;
    let completedCount = 0;

    const todayStr = new Date().toISOString().split("T")[0];
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

    items.forEach((emp: any) => {
      if (emp.onboarding_status !== "DAY1_READY" && emp.onboarding_status !== "FAILED") {
        inFlightCount++;
      }
      if (emp.onboarding_status === "DOCS_PENDING") {
        docsPendingCount++;
      }
      if (emp.joining_date === todayStr) {
        joiningTodayCount++;
      }
      if (emp.onboarding_status === "DAY1_READY" && emp.updated_at && emp.updated_at.startsWith(currentMonthStr)) {
        completedCount++;
      }
    });

    const payload = {
      employees: items,
      metrics: {
        in_flight: inFlightCount,
        docs_pending: docsPendingCount,
        joining_today: joiningTodayCount,
        completed_this_month: completedCount,
      },
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET",
      },
      body: JSON.stringify(createApiResponse(payload, null, requestId)),
    };
  } catch (err: any) {
    logger.error("Unexpected error in listEmployees handler", err, { requestId });
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(createApiResponse(null, `Internal Server Error: ${err.message}`, requestId)),
    };
  }
};
