// ── src/lambdas/reminder/index.ts ──────────────────────────────────
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { SendEmailCommand } from "@aws-sdk/client-ses";
import { ddbDocClient, sesClient, logger } from "../../shared/utils";

interface ReminderPayload {
  employee_id: string;
  stage_name: "document_collection" | "it_provisioning" | "policy_signoff" | "manager_intro";
}

export const handler = async (event: ReminderPayload): Promise<{ status: string; count?: number }> => {
  const { employee_id, stage_name } = event;
  logger.info("Executing reminder checker", { employee_id, stage_name });

  const tableName = process.env.TABLE_NAME;
  const sesFromEmail = process.env.SES_FROM_EMAIL;
  const portalUrl = process.env.PORTAL_URL || "https://onboarding.company.com";

  if (!tableName || !sesFromEmail) {
    throw new Error("Missing environment variables (TABLE_NAME or SES_FROM_EMAIL)");
  }

  // 1. Fetch employee record
  const getResult = await ddbDocClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { employee_id },
    })
  );

  const employee = getResult.Item;
  if (!employee) {
    logger.warn("Employee not found for reminder", { employee_id });
    return { status: "SKIPPED_NOT_FOUND" };
  }

  const stage = employee.stage_progress?.[stage_name];
  if (!stage) {
    logger.warn("Stage not found in employee progress", { employee_id, stage_name });
    return { status: "SKIPPED_INVALID_STAGE" };
  }

  // 2. Check if stage is already completed
  if (stage.status === "complete") {
    logger.info("Stage is already complete. No reminder needed.", { employee_id, stage_name });
    return { status: "SKIPPED_ALREADY_COMPLETE" };
  }

  // 3. Check and increment reminded count
  const remindedCount = stage.reminded_count || 0;
  if (remindedCount >= 3) {
    logger.info("Maximum reminder count (3) reached for this stage.", { employee_id, stage_name });
    return { status: "SKIPPED_MAX_REMINDERS_REACHED" };
  }

  const newCount = remindedCount + 1;
  logger.info("Incrementing reminder count and sending email", { employee_id, stage_name, newCount });

  // Update reminded count in DynamoDB
  await ddbDocClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { employee_id },
      UpdateExpression: "SET stage_progress.#stage.reminded_count = :count, updated_at = :now",
      ExpressionAttributeNames: {
        "#stage": stage_name,
      },
      ExpressionAttributeValues: {
        ":count": newCount,
        ":now": new Date().toISOString(),
      },
    })
  );

  // Map stage code-names to user-friendly titles
  const stageTitles: Record<string, string> = {
    document_collection: "Document Collection",
    it_provisioning: "IT Provisioning Setup",
    policy_signoff: "Policy Sign-off",
    manager_intro: "Manager Introduction",
  };

  const stageTitle = stageTitles[stage_name] || stage_name;
  const deepLink = `${portalUrl}/onboarding/${employee_id}?stage=${stage_name}`;

  // 4. Send SES email to new hire
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Action Required: Onboarding Reminder</title>
      <style>
        body { font-family: 'DM Sans', sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px; }
        .container { max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; padding: 40px; }
        h1 { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 0; }
        p { font-size: 16px; line-height: 1.6; color: #334155; }
        .button { display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: 600; margin: 24px 0; }
        .footer { font-size: 12px; color: #64748b; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Reminder: Complete your ${stageTitle}</h1>
        <p>Hi ${employee.full_name},</p>
        <p>This is a reminder that you have an outstanding task in your onboarding flow. Please complete the <strong>${stageTitle}</strong> stage to ensure you are ready for Day 1.</p>
        
        <a href="${deepLink}" class="button">Complete Onboarding Task</a>
        
        <p>This is reminder ${newCount} of 3 for this stage. If you need assistance, please reply to this email or contact support.</p>
        <p class="footer">This is an automated communication from the HRMS Digital Onboarding System.</p>
      </div>
    </body>
    </html>
  `;

  await sesClient.send(
    new SendEmailCommand({
      Source: sesFromEmail,
      Destination: { ToAddresses: [employee.email] },
      Message: {
        Subject: { Data: `Action Required: Onboarding Reminder - ${stageTitle} (${newCount}/3)` },
        Body: { Html: { Data: emailHtml } },
      },
    })
  );

  return { status: "REMINDER_SENT", count: newCount };
};
