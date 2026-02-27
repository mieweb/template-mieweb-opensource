# Mieweb OpenSource CI/CD Pipeline Generator

An interactive, `npx`-executable CLI tool that generates highly customized, production-ready GitHub Actions pipelines for your projects. 

Instead of starting from a generic boilerplate template, this tool asks you about your project's framework (Node.js, Meteor, React Native, etc.), your hosting preference (Proxmox/Bare-metal, Docker), and your mobile build targets (iOS, Android, Both). It then generates the exact YAML file and deployment scripts you need.

## 🚀 Quick Start

To generate a CI/CD pipeline, go to the root of your existing repository and run:

```bash
npx @mieweb/opensource-ci-cd-template
```

*No installation is required. This will securely launch the interactive CLI within your terminal.*

## 🛠️ How It Works

The CLI wizard will guide you through:
1.  **Framework Selection:** E.g., Meteor (with Cordova), standard Node.js applications, Next.js, or React Native.
2.  **Deployment Target:**
    *   **Proxmox / Bare-Metal:** Generates advanced deployment scripts (using `systemd`) ensuring zero-downtime symlink-based deployments over SSH.
    *   **Docker:** Scaffold standard Dockerfile/Docker Compose GitHub Actions flows.
    *   **None (Mobile-only):** If you just want to build and deploy to the App Store or Google Play.
3.  **Mobile Builds:** Do you need iOS (App Store/TestFlight), Android (Play Store), both, or neither?
4.  **Triggers:** Configure whether the pipeline runs on Git pushes to specific branches, release tags, or manual workflow dispatches.

## 📁 What Does It Generate?

Depending on your choices, the CLI creates the following structure right inside your repository:

```text
.github/
  workflows/
    ci-cd.yml             # The customized GitHub Actions pipeline
scripts/                  # (If Proxmox/Bare-metal selected)
  setup-systemd.sh        # One-time server bootstrapping script
  start-app.sh            # Zero-downtime restart handler
  app.service             # systemd service template
PIPELINE_SETUP.md         # ⭐ Your personalized guide!
```

### ⭐ The `PIPELINE_SETUP.md` Guide
We don't just generate YAML files and leave you to figure it out. The generator writes a custom **Markdown Guide** tailored entirely to your specific answers. 

It contains **exact, step-by-step terminal commands** instructing you how to:
- Generate a new remote SSH keypair for bare-metal deployments without a passphrase.
- Create an Android release Keystore (`.keystore`) and encode it to Base64.
- Generate an Apple Distribution Certificate (`.p12`) and Provisioning Profile for iOS builds.
- Create a Google Play API Service Account JSON for automatic release track publishing.

## 💻 Development & Testing Locally

Want to contribute to the CLI or test changes?

```bash
# Clone the repository
git clone https://github.com/mieweb/template-mieweb-opensource.git
cd template-mieweb-opensource

# Install dependencies
npm install

# Link the CLI globally so you can run it anywhere on your machine locally
npm link

# In a dummy project directory somewhere else on your machine:
opensource-ci-cd-template
```

## 📦 Publishing

To publish any updates to the npm registry:

```bash
npm login
npm publish --access public
```

---
*Created and maintained by the Mieweb Team.*
