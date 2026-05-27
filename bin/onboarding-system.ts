// ── bin/onboarding-system.ts ────────────────────────────────────────
import * as cdk from "aws-cdk-lib";
import { OnboardingStack } from "../lib/onboarding-stack";

const app = new cdk.App();
new OnboardingStack(app, "HRMSOnboardingStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || "us-east-1",
  },
});
