"use strict";
const pulumi = require("@pulumi/pulumi");
const aws = require("@pulumi/aws");

// Create a VPC
const vpc = new aws.ec2.Vpc("vpc", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
});

// Create a subnet
const subnet = new aws.ec2.Subnet("subnet", {
    vpcId: vpc.id,
    cidrBlock: "10.0.0.0/24",
    mapPublicIpOnLaunch: true,
    availabilityZone: "ap-southeast-1a",
});

// Internet Gateway
const igw = new aws.ec2.InternetGateway("igw", {
    vpcId: vpc.id,
});

// Route Table and Association
const routeTable = new aws.ec2.RouteTable("routeTable", {
    vpcId: vpc.id,
    routes: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
    }],
});

new aws.ec2.RouteTableAssociation("routeTableAssoc", {
    subnetId: subnet.id,
    routeTableId: routeTable.id,
});

// Security Group
const securityGroup = new aws.ec2.SecurityGroup("instance-sg", {
    vpcId: vpc.id,
    description: "Allow SSH, API, Flower, RabbitMQ UI",
    ingress: [
        { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },     // SSH
        { protocol: "tcp", fromPort: 3000, toPort: 3000, cidrBlocks: ["0.0.0.0/0"] }, // Node.js API
        { protocol: "tcp", fromPort: 5555, toPort: 5555, cidrBlocks: ["0.0.0.0/0"] }, // Flower
        { protocol: "tcp", fromPort: 15672, toPort: 15672, cidrBlocks: ["0.0.0.0/0"] } // RabbitMQ UI
    ],
    egress: [
        { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }, // All outbound
    ],
});

// Get latest Ubuntu 20.04 AMI
const ami = aws.ec2.getAmi({
    filters: [{ name: "name", values: ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"] }],
    owners: ["099720109477"],
    mostRecent: true,
});

// Launch EC2 Instance
const instance = new aws.ec2.Instance("flask-async-ec2", {
    instanceType: "t2.micro",
    ami: ami.then(ami => ami.id),
    subnetId: subnet.id,
    vpcSecurityGroupIds: [securityGroup.id],
    associatePublicIpAddress: true,
    userData: `#!/bin/bash
sudo apt update -y
sudo apt install docker.io git -y
sudo systemctl start docker
sudo systemctl enable docker
cd /home/ubuntu
git clone https://github.com/Towshin05/Celery_Async_task.git
cd Celery_Async_task
docker compose up -d
`,
    tags: {
        Name: "FlaskAsyncServer"
    },
});

// Export public IP and DNS name
exports.publicIp = instance.publicIp;
exports.publicDns = instance.publicDns;


