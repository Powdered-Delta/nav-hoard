## 1. Workflow Definition And Triggering

- [ ] 1.1 Verify the GitHub Pages deployment workflow is modeled as an independent capability with GitHub Actions as the execution path
- [ ] 1.2 Verify deployment supports both push-based execution on the configured branch and manual `workflow_dispatch` execution
- [ ] 1.3 Verify the workflow permissions and job split remain consistent with GitHub Pages deployment requirements

## 2. Build And Publish Behavior

- [ ] 2.1 Verify the build job checks out the repository, sets up pnpm and Node.js, installs dependencies, and runs `pnpm run build`
- [ ] 2.2 Verify the workflow computes `VITE_BASE_PATH` automatically for owner homepage repositories and project page repositories
- [ ] 2.3 Verify the built `dist/` output is uploaded and deployed through the official GitHub Pages artifact and deploy actions

## 3. Documentation And Prerequisites

- [ ] 3.1 Update documentation so the deployment workflow description matches the actual GitHub Actions build-and-publish sequence
- [ ] 3.2 Verify the README documents GitHub Pages `Source = GitHub Actions` as a first-use prerequisite
- [ ] 3.3 Record any future expansion such as multi-platform deployment or preview environments as follow-up changes rather than broadening this scope
