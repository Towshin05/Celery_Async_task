"use strict";
// const pulumi = require("@pulumi/pulumi");
// const aws = require("@pulumi/aws");
// const awsx = require("@pulumi/awsx");

// // Create an AWS resource (S3 Bucket)
// const bucket = new aws.s3.BucketV2("my-bucket");

// // Export the name of the bucket
// exports.bucketName = bucket.id;
const aws = require("@pulumi/aws");

// 🔧 Replace with your actual EC2 key pair name (.pem file)
const keyName = "key-pair-multi"; // <-- Replace this

function createInstance(name, profile, ports) {
    const sg = new aws.ec2.SecurityGroup(`${name}-sg`, {
        description: `Security Group for ${name}`,
        ingress: ports.map(p => ({
            protocol: "tcp",
            fromPort: p,
            toPort: p,
            cidrBlocks: ["0.0.0.0/0"],
        })),
        egress: [{
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
        }],
    });

    return aws.ec2.getAmi({
        filters: [
            { name: "name", values: ["amzn2-ami-hvm-*-x86_64-gp2"] },
            { name: "virtualization-type", values: ["hvm"] },
        ],
        owners: ["137112412989"],
        mostRecent: true,
    }).then(ami => new aws.ec2.Instance(`${name}-ec2`, {
        ami: ami.id,
        instanceType: "t2.micro",
        keyName: keyName,
        vpcSecurityGroupIds: [sg.id],
        userData: `#!/bin/bash
yum update -y
yum install -y docker git
systemctl start docker
usermod -aG docker ec2-user
cd /home/ec2-user
git clone https://github.com/Towshin05/Celery_Async_task.git
cd Celery_Async_task
docker-compose --profile ${profile} up -d
`,
        tags: { Name: `${name}-ec2` },
    }));
}

// Create all 6 EC2 instances
exports.flask = createInstance("flask", "flask", [5000]);
exports.rabbitmq = createInstance("rabbitmq", "rabbitmq", [5672, 15672]);
exports.redis = createInstance("redis", "redis", [6379]);
exports.worker1 = createInstance("worker1", "worker", []);
exports.worker2 = createInstance("worker2", "worker", []);
exports.flower = createInstance("flower", "flower", [5555]);
