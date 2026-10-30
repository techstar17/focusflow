# Jenkins and EC2 deployment

## Jenkins prerequisites

The agent executing the pipeline needs Git, Node.js/npm, the Docker CLI, and access to a Docker daemon.

Build the supplied Jenkins image if using a containerised Jenkins installation:

```sh
docker build -f Dockerfile.jenkins -t focusflow-jenkins:local .
```

This installs the CLI, not a running Docker daemon. Check `docker info` as the Jenkins agent user. Configure a dedicated trusted build agent with appropriate daemon access; Docker access grants powerful control over its host.

In Jenkins:

1. Create a **Username with password** credential with ID `dockerhub-credentials`. Use your Docker Hub username and an access token with permission to push to your repository.
2. Create a Pipeline job using **Pipeline script from SCM**.
3. Set the Git repository to `https://github.com/techstar17/focusflow.git`, branch to `main`, and script path to `Jenkinsfile`.
4. Run **Build Now**. The repository does not define webhook or polling triggers.

The pipeline runs `npm ci`, `npm run build`, `docker build`, then publishes `YOUR_DOCKERHUB_USERNAME/focusflow:latest`. Credentials are supplied by Jenkins and sent to Docker through standard input.

## Manual EC2 deployment

These commands assume an existing Ubuntu EC2 instance, Docker installed, and an image successfully published by Jenkins. Creating an EC2 instance can incur charges.

On the EC2 host:

```sh
docker pull YOUR_DOCKERHUB_USERNAME/focusflow:latest
docker run --detach --name focusflow --restart unless-stopped --publish 3000:80 YOUR_DOCKERHUB_USERNAME/focusflow:latest
docker ps --filter name=focusflow
curl --fail http://localhost:3000
```

Replace `YOUR_DOCKERHUB_USERNAME` before running. For a remote demonstration, permit inbound TCP 3000 in the instance security group from the intended viewer's IP, and visit `http://EC2_PUBLIC_IP:3000`. Restrict SSH to your own IP. Public HTTP is a demo configuration; production use needs HTTPS and a reviewed deployment setup.

The maintainer previously deployed the Docker Hub image on Ubuntu EC2 and checked it in a browser. No currently live address or uptime claim is provided here.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `npm: not found` in Jenkins | Verify `node --version` and `npm --version` on the actual executing agent; use the custom Jenkins image if needed. |
| Docker permission or daemon error | Run `docker info` as the Jenkins agent user and inspect daemon connectivity/permissions. |
| Docker Hub login/push denied | Verify the credential ID, username, token permissions and target repository. |
| EC2 page unreachable | Check `docker ps`, `docker logs focusflow`, local `curl`, port mapping and inbound security-group rules. |
| Port or container name already used | Inspect existing containers before changing or removing them; use an unused host port/name for a separate demo. |
| Image still shows an older build | Confirm the pipeline pushed successfully, pull the new image and deliberately recreate the demo container. |

## Improvements still to implement

Immutable image tags, application tests in the pipeline, deployment health checks, rollback, and production monitoring. These are planned improvements, not existing capabilities.
