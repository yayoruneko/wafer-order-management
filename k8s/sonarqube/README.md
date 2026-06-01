# SonarQube — quick start

Run SonarQube locally in Docker, scan both backend and frontend, and view
the dashboard. ~5 minutes from cold.

> The matching CI job (`sonar`) in [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
> runs the same scan on PRs, but only when the `SONAR_TOKEN` secret is set.

---

## 1. Start SonarQube locally

```bash
docker run -d --name sonarqube \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_logs:/opt/sonarqube/logs \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  sonarqube:lts-community
```

Wait ~30 s, then open <http://localhost:9000>.
First-time login: `admin` / `admin` → it forces a password change.

> If your machine is Apple Silicon and the container exits with an Elasticsearch
> error, add `-e "SONAR_SEARCH_JAVAADDITIONALOPTS=-Dnode.store.allow_mmap=false"`.

## 2. Create a token

In the SonarQube UI:

1. Click your avatar → **My Account** → **Security**.
2. **Generate Tokens** → name it `local-dev` → **Generate**.
3. Copy the token. Export it:

   ```bash
   export SONAR_TOKEN=<paste>
   export SONAR_HOST_URL=http://localhost:9000
   ```

## 3. Scan the backend

```bash
cd backend
mvn verify sonar:sonar \
  -Dsonar.host.url=$SONAR_HOST_URL \
  -Dsonar.token=$SONAR_TOKEN
```

- `verify` runs tests + JaCoCo coverage (`target/site/jacoco/jacoco.xml`).
- `sonar:sonar` uploads code + coverage. Project key defaults to `woms-backend`
  (set in [`pom.xml`](../../backend/pom.xml)).

After it finishes, the dashboard shows up at:
<http://localhost:9000/dashboard?id=woms-backend>

## 4. Scan the frontend

```bash
cd frontend
npm run test:coverage          # writes coverage/lcov.info
npm run sonar -- \
  -Dsonar.host.url=$SONAR_HOST_URL \
  -Dsonar.token=$SONAR_TOKEN
```

Defaults (project key `woms-frontend`, source paths, exclusions, lcov path)
live in [`sonar-project.properties`](../../frontend/sonar-project.properties).

Dashboard: <http://localhost:9000/dashboard?id=woms-frontend>

## 5. Stop / restart

```bash
docker stop sonarqube     # stop
docker start sonarqube    # resume — keeps your token + data via the volumes
docker rm -fv sonarqube   # nuke (drops all results; volumes survive)
```

---

## CI wiring

The `sonar` job in [`ci.yml`](../../.github/workflows/ci.yml) runs after the
test jobs pass and only when `SONAR_TOKEN` is set in repo secrets.

To enable on PRs:

1. Decide where the CI-side SonarQube lives (SonarCloud, a SonarQube you host
   on K8s, or a hosted instance). The local Docker container above is not
   reachable from GitHub-hosted runners.
2. In **Settings → Secrets and variables → Actions**, add:
   - `SONAR_HOST_URL` — e.g. `https://sonarcloud.io` or `https://sonar.your-team.com`
   - `SONAR_TOKEN` — token generated on that server
3. Push to a branch — the job will run automatically.

Without those secrets the job is skipped, so PRs from forks won't break.

---

## Future: deploy SonarQube to this cluster

This folder is reserved for the K8s manifests (Deployment + Service + PVC +
Ingress) when SonarQube graduates from "local Docker" to "shared instance our
team scans against". The CI wiring above already supports that — only the
`SONAR_HOST_URL` secret changes.
