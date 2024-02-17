import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

const config = new pulumi.Config();
const containerPort = config.getNumber("containerPort") || 80;
const cpu = config.getNumber("cpu") || 512;
const memory = config.getNumber("memory") || 128;
// Create a security group for the load balancer

const loadBalancerSecurityGroup = new aws.ec2.SecurityGroup("loadBalancerSecurityGroup", {
    ingress: [
        {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
        },
        {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
        },
    ],
});

// // Associate the security group with the load balancer


// // An ECS cluster to deploy into
// const cluster = new aws.ecs.Cluster("cluster", {});

// // An ALB to serve the container endpoint to the internet
// const loadbalancer = new awsx.lb.ApplicationLoadBalancer("loadbalancer", {
//   securityGroups: [loadBalancerSecurityGroup.id],
// });


// // An ECR repository to store our application's container image
// const repo = new awsx.ecr.Repository("repo", {
//     forceDelete: true,
// });

// // Build and publish our application's container image from ./app to the ECR repository
// const image = new awsx.ecr.Image("image", {
//     repositoryUrl: repo.url,
//     context: "./app",
//     platform: "linux/amd64",
// });

// // Deploy an ECS Service on Fargate to host the application container
// const service = new awsx.ecs.FargateService("service", {
//     cluster: cluster.arn,
//     assignPublicIp: true,
//     taskDefinitionArgs: {
//         container: {
//             name: "app",
//             image: image.imageUri,
//             cpu: cpu,
//             memory: memory,
//             essential: true,
//             portMappings: [{
//                 containerPort: containerPort,
//                 targetGroup: loadbalancer.defaultTargetGroup,
//             }],
//         },
//     },
// });

// // The URL at which the container's HTTP endpoint will be available
// export const url = pulumi.interpolate`http://${loadbalancer.loadBalancer.dnsName}`;