import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const pwrDnsZone = new aws.route53.Zone("pwrDnsZone", {
  name: "thepwr.store",
});

const appCertificate = new aws.acm.Certificate("appCertificate", {
  domainName: "app.thepwr.store",
  validationMethod: "DNS",
});

const appCertificateValidationRecord = new aws.route53.Record(
  "appCertificateValidationRecord",
  {
    name: appCertificate.domainValidationOptions[0].resourceRecordName,
    type: appCertificate.domainValidationOptions[0].resourceRecordType,
    zoneId: pwrDnsZone.zoneId,
    records: [appCertificate.domainValidationOptions[0].resourceRecordValue],
    ttl: 300,
  },
);

const certificateValidation = new aws.acm.CertificateValidation(
  "certificateValidation",
  {
    certificateArn: appCertificate.arn,
    validationRecordFqdns: [appCertificateValidationRecord.fqdn],
  },
);

// const vpc = new awsx.ec2.Vpc("vpc", {});

// const targetGroup = new aws.lb.TargetGroup("targetGroup", {
//   port: 80,
//   ipAddressType: "ipv4",
//   healthCheck: {
//     path: "/health",
//     protocol: "HTTP",
//   },
//   protocol: "HTTP",
//   targetType: "ip",
//   vpcId: vpc.vpcId,
// });

// const loadBalancerSecurityGroup = new aws.ec2.SecurityGroup(
//   "loadBalancerSecurityGroup",
//   {
//     ingress: [
//       {
//         protocol: "tcp",
//         fromPort: 80,
//         toPort: 80,
//         cidrBlocks: ["0.0.0.0/0"],
//       },
//       {
//         protocol: "tcp",
//         fromPort: 443,
//         toPort: 443,
//         cidrBlocks: ["0.0.0.0/0"],
//       },
//     ],
//   },
// );

// const loadbalancer = new awsx.lb.ApplicationLoadBalancer("loadbalancer", {
//   securityGroups: [loadBalancerSecurityGroup.id],
//   listeners: [
//     {
//       alpnPolicy: "HTTP2Preferred",
//       certificateArn: appCertificate.arn,
//       port: 443,
//       protocol: "HTTPS",
//       sslPolicy: "ELBSecurityPolicy-TLS13-1-2-2021-06",
//       defaultActions: [
//         {
//           type: "forward",
//           targetGroupArn: targetGroupt.arn,
//         },
//       ]
//     },
//     {
//       port: 80,
//       protocol: "HTTP",
//       defaultActions: [
//         {
//           type: "forward",
//           targetGroupArn: targetGroupt.arn,
//         },
//       ],
//     },
//   ],
// });

const repo = new awsx.ecr.Repository("repo", {
  forceDelete: true,
});

// Build and publish our application's container image from ./app to the ECR repository.
const image = new awsx.ecr.Image("image", {
  repositoryUrl: repo.url,
  dockerfile: "./Dockerfile.nitro",
  args: {
    NODE_ENV: "production",
    PROJECT: "nitro",
  },
  builderVersion: "BuilderBuildKit",
});

const cluster = new awsx.classic.ecs.Cluster("cluster");

const alb = new awsx.classic.lb.ApplicationLoadBalancer("net-lb", {
  external: true,
  securityGroups: cluster.securityGroups,
});

const targetGroup = alb.createTargetGroup("targetGroup", {
  port: 80,
  protocol: "HTTP",
  healthCheck: {
    path: "/health",
    port: "3000",
    protocol: "HTTP",
  },
});
const httpListener = alb.createListener("http", {
  port: 80,
  external: true,
  targetGroup: targetGroup,
});
const httpsListener = alb.createListener("https", {
  port: 443,
  external: true,
  certificateArn: appCertificate.arn,
  protocol: "HTTPS",
  sslPolicy: "ELBSecurityPolicy-TLS13-1-2-2021-06",
  targetGroup: targetGroup,
});

const appService = new awsx.classic.ecs.FargateService("app-svc", {
  cluster,
  taskDefinitionArgs: {
    container: {
      portMappings: [targetGroup],
      image: image.imageUri,
      cpu: 128 /*10% of 1024*/,
      memory: 256 /*MB*/,
    },
  },
  desiredCount: 1,
});
