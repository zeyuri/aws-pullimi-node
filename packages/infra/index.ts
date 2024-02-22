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

// const vpc = new awsx.ec2.Vpc("main-vpc", {
//   cidrBlock: "10.0.0.0/16",
//   subnetSpecs: [
//     {
//       type: "Public",
//     },
//   ],
// });
