# Contributing to Hiero-Cron-Kit

First off, thank you for considering contributing to `hiero-cron-kit`! It's people like you that make the Hedera ecosystem such a great place to build natively decentralized applications.

This document serves as a comprehensive guide on how to contribute to the project. We strictly enforce a clear process to maintain enterprise-grade standards for this library.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Clear Process: How to Contribute](#clear-process-how-to-contribute)
3. [Developer Certificate of Origin (DCO)](#developer-certificate-of-origin-dco)
4. [GPG Signed Commits](#gpg-signed-commits)
5. [Development Setup](#development-setup)
6. [Pull Request Process](#pull-request-process)

---

## Code of Conduct

By participating in this project, you are expected to uphold a welcoming and inclusive environment. Be respectful, constructive, and patient in all interactions.

## Clear Process: How to Contribute

Whether it's a bug fix, new feature, or documentation improvement, we follow a strict pipeline to ensure quality and traceability:

1. **Discuss your idea**: Before committing your time, open an Issue to discuss the bug or feature request.
2. **Fork the repo**: Create a fork of the repository and clone it to your local machine.
3. **Branch**: Create a clearly named branch from `main` (e.g., `feat/add-new-dashboard-widget` or `fix/schedule-pagination`).
4. **Develop**: Write your code. Ensure it is covered by unit tests.
5. **Commit**: Make sure your commits are **DCO signed-off** and **GPG signed** (see below formatting).
6. **Push**: Push your branch to your fork.
7. **Submit a PR**: Open a Pull Request filling out the provided PR template.

## Developer Certificate of Origin (DCO)

We require a DCO for all contributions. This is a legally binding statement that asserts that you are the creator of your contribution, and that you have the right to submit it to the project.

By adding a `Signed-off-by` line to your commit messages, you are certifying that you agree to the [DCO 1.1](https://developercertificate.org/).

### How to Sign-off Your Commits

Use the `-s` or `--signoff` flag when committing:
```bash
git commit -s -m "feat: your feature"
```

This will automatically append the sign-off to your commit message:
```text
feat: your feature

Signed-off-by: Jane Doe <jane.doe@example.com>
```

> **Note:** The email address in the `Signed-off-by` line must match the email address associated with your GitHub account and your Git `user.email` configuration. Our CI tests will automatically fail if the DCO is missing.

## GPG Signed Commits

To verify the authenticity of every commit, we require all contributions to be cryptographically signed using a GPG key.

### How to GPG Sign Your Commits

1. [Generate a GPG key](https://docs.github.com/en/authentication/managing-commit-signature-verification/generating-a-new-gpg-key) if you don't have one.
2. [Add the GPG key to your GitHub account](https://docs.github.com/en/authentication/managing-commit-signature-verification/adding-a-gpg-key-to-your-github-account).
3. Tell Git about your signing key: `git config --global user.signingkey <YOUR-KEY-ID>`
4. Use the `-S` flag when committing:

```bash
git commit -S -s -m "fix: resolve mirror node polling issue"
```

*Tip: You can configure Git to sign all commits by default:*
```bash
git config --global commit.gpgsign true
```
This means you can simply run `git commit -s -m "..."` and it will automatically attach both your DCO and GPG signature.

## Development Setup

We highly recommend you test your changes locally before submitting a PR. Our CI pipeline is rigorous.

```bash
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Run the test suite
npm run test
```

Make sure that `npm run test` executes successfully and you haven't introduced any regression.

## Pull Request Process

1. **Title**: Use conventional commits for your PR titles (e.g., `feat(tracker): add pagination state`, `fix(cli): correct timestamp display`).
2. **Template**: Fill out the provided Pull Request template in its entirety. It includes a checklist for things like tests, DCO, and GPG.
3. **CI Pipeline**: Ensure our GitHub Actions workflows (`build-and-test`, `dco-check`) pass green on your PR.
4. **Reviewers**: Core maintainers will review your PR. They may ask for changes or further testing.
5. **Merge**: Once approved, your code will be squash-merged into the `main` branch.

Thank you for contributing to `hiero-cron-kit`!
