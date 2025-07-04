// 
const aws = require("@pulumi/aws");

const keyName = "single-key"; // Your EC2 key pair name (NOT .pem file)

const sg = new aws.ec2.SecurityGroup("flask-sg", {
    description: "Allow SSH and Flask port",
    ingress: [
        { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },    // SSH
        { protocol: "tcp", fromPort: 5000, toPort: 5000, cidrBlocks: ["0.0.0.0/0"] } // Flask
    ],
    egress: [
        { protocol: "-1", fromPort: 0, toPort: 0, cidrBlocks: ["0.0.0.0/0"] }
    ]
});

const ami = aws.ec2.getAmi({
    filters: [
        { name: "name", values: ["amzn2-ami-hvm-*-x86_64-gp2"] },
        { name: "virtualization-type", values: ["hvm"] }
    ],
    owners: ["137112412989"],
    mostRecent: true
});

const server = ami.then(image => new aws.ec2.Instance("flask-ec2", {
    instanceType: "t2.micro",
    ami: image.id,
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
docker-compose --profile flask up -d
`,
    tags: { Name: "flask-ec2" }
}));

exports.publicIp = server.then(instance => instance.publicIp);
exports.publicDns = server.then(instance => instance.publicDns);



