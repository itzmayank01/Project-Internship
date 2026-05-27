// ── lib/onboarding-stack.ts ─────────────────────────────────────────
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sns_subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as fs from "fs";
import * as path from "path";

export class OnboardingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. DYNAMODB TABLE
    const employeeTable = new dynamodb.Table(this, "EmployeeTable", {
      partitionKey: { name: "employee_id", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev demo. Production: RETAIN
    });

    // GSIs
    employeeTable.addGlobalSecondaryIndex({
      indexName: "by_department",
      partitionKey: { name: "department", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "joining_date", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    employeeTable.addGlobalSecondaryIndex({
      indexName: "by_manager",
      partitionKey: { name: "manager_id", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "joining_date", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    employeeTable.addGlobalSecondaryIndex({
      indexName: "by_joining_date",
      partitionKey: { name: "joining_date", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "employee_id", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    employeeTable.addGlobalSecondaryIndex({
      indexName: "by_status",
      partitionKey: { name: "onboarding_status", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "joining_date", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 2. S3 BUCKET FOR DOCUMENTS
    const docsBucket = new s3.Bucket(this, "DocumentsBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ["*"], // Lock down to portal domain in prod
          allowedHeaders: ["*"],
          exposedHeaders: ["ETag"],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });

    // 3. COGNITO USER POOL
    const userPool = new cognito.UserPool(this, "OnboardingUserPool", {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      mfa: cognito.Mfa.OPTIONAL,
      passwordPolicy: {
        minLength: 10,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(7),
      },
      customAttributes: {
        employee_id: new cognito.StringAttribute({ mutable: false }),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, "OnboardingUserPoolClient", {
      userPool,
      authFlows: { adminUserPassword: true, custom: true },
      disableOAuth: true, // SPA direct auth
    });

    // Hosted Domain setup
    userPool.addDomain("HostedDomain", {
      cognitoDomain: {
        domainPrefix: `hrms-onboarding-${this.account}`,
      },
    });

    // 4. SNS TOPIC FOR HR NOTIFICATIONS
    const hrNotificationTopic = new sns.Topic(this, "HRNotificationTopic", {
      displayName: "HRMS Onboarding Admin Notifications",
    });
    hrNotificationTopic.addSubscription(new sns_subscriptions.EmailSubscription("hr@company.com")); // Default admin

    // 5. STAGE LAMBDA FUNCTIONS (STATE MACHINE TASKS)
    // Common Lambda Configurations
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      tracing: lambda.Tracing.ACTIVE,
      environment: {
        TABLE_NAME: employeeTable.tableName,
      },
    };

    const stage1Lambda = new lambda.Function(this, "Stage1Lambda", {
      ...lambdaConfig,
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambdas/stage1DocCollection")),
    });

    const stage2Lambda = new lambda.Function(this, "Stage2Lambda", {
      ...lambdaConfig,
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambdas/stage2ITProvisioning")),
    });

    const stage3Lambda = new lambda.Function(this, "Stage3Lambda", {
      ...lambdaConfig,
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambdas/stage3PolicySignoff")),
    });

    const stage4Lambda = new lambda.Function(this, "Stage4Lambda", {
      ...lambdaConfig,
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambdas/stage4ManagerIntro")),
    });

    const stage5Lambda = new lambda.Function(this, "Stage5Lambda", {
      ...lambdaConfig,
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambdas/stage5Day1Ready")),
    });

    // Grant DynamoDB Table permissions to Lambda stages
    employeeTable.grantWriteData(stage1Lambda);
    employeeTable.grantWriteData(stage2Lambda);
    employeeTable.grantWriteData(stage3Lambda);
    employeeTable.grantWriteData(stage4Lambda);
    employeeTable.grantWriteData(stage5Lambda);

    // 6. WORKFLOW STATE MACHINE
    const aslTemplate = fs.readFileSync(path.join(__dirname, "../src/step-functions/state-machine.json"), "utf8");
    const aslParsed = aslTemplate
      .replace(/\$\{Stage1LambdaArn\}/g, stage1Lambda.functionArn)
      .replace(/\$\{Stage2LambdaArn\}/g, stage2Lambda.functionArn)
      .replace(/\$\{Stage3LambdaArn\}/g, stage3Lambda.functionArn)
      .replace(/\$\{Stage4LambdaArn\}/g, stage4Lambda.functionArn)
      .replace(/\$\{Stage5LambdaArn\}/g, stage5Lambda.functionArn);

    const stateMachine = new sfn.StateMachine(this, "OnboardingStateMachine", {
      definitionBody: sfn.DefinitionBody.fromString(aslParsed),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant SFN execution permissions to invoke tasks
    stage1Lambda.grantInvoke(stateMachine);
    stage2Lambda.grantInvoke(stateMachine);
    stage3Lambda.grantInvoke(stateMachine);
    stage4Lambda.grantInvoke(stateMachine);
    stage5Lambda.grantInvoke(stateMachine);

    // 7. REST API ENDPOINT LAMBDAS
    const createEmployeeLambda = new lambda.Function(this, "CreateEmployeeLambda", {
      ...lambdaConfig,
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambdas/createEmployee")),
      environment: {
        TABLE_NAME: employeeTable.tableName,
        USER_POOL_ID: userPool.userPoolId,
        STATE_MACHINE_ARN: stateMachine.stateMachineArn,
        SES_FROM_EMAIL: "onboarding-noreply@company.com",
        PORTAL_URL: `https://onboarding-portal-${this.account}.company.com`,
      },
    });
    employeeTable.grantWriteData(createEmployeeLambda);
    stateMachine.grantStartExecution(createEmployeeLambda);
    // IAM Policies: Cognito user creation
    createEmployeeLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:AdminCreateUser"],
        resources: [userPool.userPoolArn],
      })
    );
    // IAM Policies: SES email sending
    createEmployeeLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"], // Scoped to verified domains in prod
      })
    );

    const getProgressLambda = new lambda.Function(this, "GetProgressLambda", {
      ...lambdaConfig,
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambdas/getProgress")),
    });
    employeeTable.grantReadData(getProgressLambda);

    const getUploadUrlLambda = new lambda.Function(this, "GetUploadUrlLambda", {
      ...lambdaConfig,
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambdas/getUploadUrl")),
      environment: {
        BUCKET_NAME: docsBucket.bucketName,
      },
    });
    docsBucket.grantPut(getUploadUrlLambda);

    const validateDocumentLambda = new lambda.Function(this, "ValidateDocumentLambda", {
      ...lambdaConfig,
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambdas/validateDocument")),
      environment: {
        TABLE_NAME: employeeTable.tableName,
        SNS_TOPIC_ARN: hrNotificationTopic.topicArn,
      },
    });
    docsBucket.grantRead(validateDocumentLambda);
    employeeTable.grantReadWriteData(validateDocumentLambda);
    hrNotificationTopic.grantPublish(validateDocumentLambda);
    stateMachine.grantTaskResponse(validateDocumentLambda);

    // Trigger document validation on S3 ObjectCreated
    docsBucket.addObjectCreatedNotification(
      new cdk.aws_s3_notifications.LambdaDestination(validateDocumentLambda)
    );

    const completeStageLambda = new lambda.Function(this, "CompleteStageLambda", {
      ...lambdaConfig,
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambdas/completeStage")),
    });
    employeeTable.grantReadWriteData(completeStageLambda);
    stateMachine.grantTaskResponse(completeStageLambda);

    const listEmployeesLambda = new lambda.Function(this, "ListEmployeesLambda", {
      ...lambdaConfig,
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambdas/listEmployees")),
    });
    employeeTable.grantReadData(listEmployeesLambda);

    const reminderLambda = new lambda.Function(this, "ReminderLambda", {
      ...lambdaConfig,
      code: lambda.Code.fromAsset(path.join(__dirname, "../src/lambdas/reminder")),
      environment: {
        TABLE_NAME: employeeTable.tableName,
        SES_FROM_EMAIL: "onboarding-noreply@company.com",
        PORTAL_URL: `https://onboarding-portal-${this.account}.company.com`,
      },
    });
    employeeTable.grantReadWriteData(reminderLambda);
    reminderLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail"],
        resources: ["*"],
      })
    );

    // 8. API GATEWAY REST API
    const api = new apigateway.RestApi(this, "OnboardingApi", {
      restApiName: "HRMS Onboarding API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, "OnboardingCognitoAuthorizer", {
      cognitoUserPools: [userPool],
    });

    const onboardingRes = api.root.addResource("onboarding");

    // POST /onboarding (Create employee)
    onboardingRes.addMethod("POST", new apigateway.LambdaIntegration(createEmployeeLambda));

    // GET /onboarding (List employees for HR dashboard) - protected
    onboardingRes.addMethod("GET", new apigateway.LambdaIntegration(listEmployeesLambda), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /onboarding/{employee_id}/progress
    const empProgressRes = onboardingRes.addResource("{employee_id}");
    const progressRes = empProgressRes.addResource("progress");
    progressRes.addMethod("GET", new apigateway.LambdaIntegration(getProgressLambda));

    // POST /onboarding/{employee_id}/complete-stage - protected
    const completeStageRes = empProgressRes.addResource("complete-stage");
    completeStageRes.addMethod("POST", new apigateway.LambdaIntegration(completeStageLambda), {
      authorizer: cognitoAuthorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // POST /documents/upload-url
    const documentsRes = api.root.addResource("documents");
    const uploadUrlRes = documentsRes.addResource("upload-url");
    uploadUrlRes.addMethod("POST", new apigateway.LambdaIntegration(getUploadUrlLambda));

    // 9. CLOUDFRONT & S3 BUCKETS FOR FRONTEND PORTALS
    const hirePortalBucket = new s3.Bucket(this, "HirePortalBucket", {
      websiteIndexDocument: "index.html",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const adminDashboardBucket = new s3.Bucket(this, "AdminDashboardBucket", {
      websiteIndexDocument: "index.html",
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const hireDistribution = new cloudfront.Distribution(this, "HireDistribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(hirePortalBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    const adminDistribution = new cloudfront.Distribution(this, "AdminDistribution", {
      defaultBehavior: {
        origin: new origins.S3Origin(adminDashboardBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    // 10. OUTPUTS
    new cdk.CfnOutput(this, "ApiUrl", { value: api.url });
    new cdk.CfnOutput(this, "HirePortalUrl", { value: hireDistribution.distributionDomainName });
    new cdk.CfnOutput(this, "AdminDashboardUrl", { value: adminDistribution.distributionDomainName });
    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: userPoolClient.userPoolClientId });
  }
}
