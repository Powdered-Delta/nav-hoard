## Purpose

Define the automated static-site deployment requirements for building NavHoard in GitHub Actions and publishing the generated site to GitHub Pages.

## Requirements

### Requirement: Deployment workflow SHALL build and publish the site through GitHub Actions and GitHub Pages
The system SHALL support a GitHub-hosted deployment workflow that builds the NavHoard static site in GitHub Actions and publishes the generated `dist/` artifact to GitHub Pages.

#### Scenario: Push to the deployment branch triggers the workflow
- **WHEN** code is pushed to the configured deployment branch
- **THEN** the GitHub Actions workflow starts the site build-and-deploy pipeline

#### Scenario: Manual deployment is requested
- **WHEN** the user triggers the workflow manually through GitHub Actions
- **THEN** the system runs the same deployment pipeline without requiring a code push

### Requirement: Deployment workflow SHALL build the site in a reproducible CI environment
The system SHALL perform deployment builds in a GitHub-hosted CI environment that checks out the repository, installs the pinned package manager/runtime stack, installs dependencies, and runs the standard site build command.

#### Scenario: CI environment prepares the build
- **WHEN** the deployment workflow starts its build job
- **THEN** the system checks out the repository, sets up pnpm and Node.js, and installs dependencies with the repository lockfile

#### Scenario: Site build runs in CI
- **WHEN** the CI environment is prepared successfully
- **THEN** the system runs `pnpm run build` and generates the static site output in `dist/`

### Requirement: Deployment workflow SHALL compute the Pages base path automatically
The system SHALL compute `VITE_BASE_PATH` during the deployment workflow so the built site resolves assets correctly for both user-or-organization Pages roots and repository project pages.

#### Scenario: Repository is an owner homepage repository
- **WHEN** the repository name matches `<owner>.github.io`
- **THEN** the workflow sets `VITE_BASE_PATH=/` before building the site

#### Scenario: Repository is a project page repository
- **WHEN** the repository name does not match `<owner>.github.io`
- **THEN** the workflow sets `VITE_BASE_PATH=/<repo-name>/` before building the site

### Requirement: Deployment workflow SHALL publish the built artifact through official Pages actions
The system SHALL upload the built `dist/` output as a Pages artifact and deploy it through GitHub's Pages deployment actions instead of requiring a manual artifact upload flow.

#### Scenario: Build job completes successfully
- **WHEN** the site build succeeds and `dist/` is available
- **THEN** the workflow uploads `dist/` as the Pages artifact for deployment

#### Scenario: Deploy job runs after build
- **WHEN** the build job finishes successfully
- **THEN** the deploy job publishes the uploaded artifact to GitHub Pages

### Requirement: Deployment workflow SHALL declare the repository-side prerequisites for first use
The system SHALL document that GitHub Pages must be configured to use GitHub Actions as its source before the automated deployment workflow can publish the site successfully.

#### Scenario: Repository has not enabled GitHub Actions as Pages source
- **WHEN** the user has not configured GitHub Pages to use GitHub Actions
- **THEN** the deployment setup instructions MUST identify that repository setting as a prerequisite for successful Pages publishing
