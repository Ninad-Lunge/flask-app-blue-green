# 🚀 Amazon ECS Blue/Green Deployment with CodePipeline

This project demonstrates a **Blue/Green deployment** CI/CD pipeline using **GitHub**, **AWS CodePipeline**, **ECS Fargate**, and **CodeDeploy**, based on the [AWS Blue/Green Deployment Guide](https://docs.aws.amazon.com/codepipeline/latest/userguide/ecs-cd-blue-green.html).

## 🛠️ Project Overview

We deploy a containerized Flask application using Docker, push it to Amazon ECR, and automate Blue/Green deployments with AWS CodePipeline and CodeDeploy. This method allows zero-downtime updates and easier rollback support.

---

## 🔨 Build Docker Image

```bash
docker build -t flask-app:latest .
```

---

## 🐋 Push Docker Image to Amazon ECR

1. **Authenticate Docker with ECR:**

```bash
aws ecr get-login-password --region <your-region> | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.<your-region>.amazonaws.com
```

2. **Create an ECR Repository:**

```bash
aws ecr create-repository --repository-name flask-app
```

3. **Tag your image:**

```bash
docker tag flask-app:latest <your-account-id>.dkr.ecr.<your-region>.amazonaws.com/flask-app:latest
```

4. **Push the image:**

```bash
docker push <your-account-id>.dkr.ecr.<your-region>.amazonaws.com/flask-app:latest
```

---

## ⚙️ Set Up Blue/Green Deployment in AWS

### 1. **Create a Task Definition**

* Use the pushed ECR image.
* Launch type: **Fargate**
* Container port: `5000`

### 2. **Set Up Application Load Balancer (ALB)**

* Create a new **Internet-Facing ALB**.
* Configure listeners on **Port 80 (HTTP)**.
* Create two target groups:

  * One for the **blue** (active) environment.
  * One for the **green** (test/new) environment.
![image](https://github.com/user-attachments/assets/456694dc-7fde-4f1b-8aaf-a95c890a5e52)

* Set health check path (e.g., `/health`).
* Security group should allow inbound HTTP (port 80) and custom port 5000 if used.

![ALB Config](https://github.com/user-attachments/assets/b6949088-8979-4aab-b3ca-100f25bbf9ab)

### 3. **Create an ECS Cluster**

* Type: **Fargate**
* Choose appropriate VPC and subnets.

### 4. **Create an ECS Service with CodeDeploy Deployment Controller**

* Launch Type: Fargate
* Deployment type: **Blue/Green (powered by CodeDeploy)**
* Attach ALB, listener, and two target groups (blue and green).
* Set the production listener to forward traffic to blue, test listener to green.

### 5. **Set Up CodeDeploy**

* Create a CodeDeploy application with:

  * Compute platform: **ECS**
* Create a deployment group:

  * Choose the ECS service.
  * Specify target groups, listener, and ALB.
  * Deployment settings: Choose how traffic shifts from green to blue.

---

![image](https://github.com/user-attachments/assets/c6b1014b-4aa7-44a9-a5db-ed852e4eb89e)
![image](https://github.com/user-attachments/assets/880cd0d6-a34d-42ad-9e4a-9797a28f9c78)

## 🚀 Set Up CodePipeline for Blue/Green Deployment

### 1. **Create Pipeline**

* **Source**: GitHub or CodeCommit
* **Build**: CodeBuild (uses `buildspec.yml`)
* **Deploy**: ECS via CodeDeploy using `appspec.yaml` and `imagedefinitions.json`

![CodePipeline](https://github.com/user-attachments/assets/2ad4537b-819e-4edb-acbb-0196e7ecb000)

### 2. **CodeBuild Configuration**

* Environment: Managed Image (Amazon Linux)
* Privileged mode: **Enabled** (for Docker)
* Service Role: Attach `AmazonEC2ContainerRegistryPowerUser`

---

## 📁 Required Files in Repo

### `imagedefinitions.json`

```json
[
  {
    "name": "flask-app",
    "imageUri": "<your-account-id>.dkr.ecr.<your-region>.amazonaws.com/flask-app:latest"
  }
]
```

### `appspec.yaml`

```yaml
version: 1
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: "<TASK_DEFINITION_ARN>"
        LoadBalancerInfo:
          ContainerName: "flask-app"
          ContainerPort: 5000
```

---

## ✅ Testing the Blue/Green Deployment

1. Push a change to your repo.
2. Pipeline triggers build and deploy steps.
3. New version (green) is launched in ECS and verified via ALB health checks.
4. CodeDeploy shifts traffic from blue to green after test phase.
5. Blue environment is automatically deregistered.

![Blue Green Deployment](https://github.com/user-attachments/assets/a402e9a5-99da-4fac-ba0c-29aff4e6ab9f)

---

## 🌐 Access the Application

Navigate to the DNS name of your **Application Load Balancer**:

```txt
http://<DNS_NAME_OF_ALB>
```
![Output](https://github.com/user-attachments/assets/c1330783-f2f2-4f08-a752-7b57888ee272)
![image](https://github.com/user-attachments/assets/12893669-7fda-4a18-ba7a-1191a1072bd9)

During deployment, ALB will shift traffic from the **blue** target group to **green**, offering seamless deployment and rollback.

---
