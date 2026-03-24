#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log(chalk.blue.bold('\n🚀 Welcome to the Mieweb Advanced CI/CD Pipeline Generator!\n'));
  console.log(chalk.gray('This tool will generate production-ready, cache-optimized GitHub Actions workflows.'));
  console.log(chalk.gray('It includes actual build scripts, deployment configurations, and mobile publishing steps.\n'));

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'framework',
      message: 'What framework is your project using?',
      choices: [
        { name: 'Meteor.js (Full-stack + Cordova Mobile)', value: 'meteor' },
        { name: 'Node.js / Next.js (Server/Web only)', value: 'node' },
        { name: 'React Native / Expo (Mobile only)', value: 'react-native' }
      ]
    },
    {
      type: 'list',
      name: 'trigger',
      message: 'When should the production deployment run?',
      choices: [
        { name: 'On release creation (e.g., v1.0.0)', value: 'release' },
        { name: 'On push to main/master branch', value: 'push' }
      ]
    },
    {
      type: 'confirm',
      name: 'deployServer',
      message: 'Do you need to deploy a server/backend?',
      default: true,
      when: (answers) => answers.framework !== 'react-native'
    },
    {
      type: 'list',
      name: 'serverMethod',
      message: 'How do you want to deploy the server?',
      choices: [
        { name: 'Proxmox / Bare-metal VM (SSH + systemd + Zero-downtime symlinks)', value: 'proxmox' },
        { name: 'Docker (Build image, push to GHCR, deploy via docker-compose)', value: 'docker' }
      ],
      when: (answers) => answers.deployServer
    },
    {
      type: 'list',
      name: 'mobileBuilds',
      message: 'Do you need to build and publish mobile apps?',
      choices: [
        { name: 'Both Android (Play Store) and iOS (TestFlight)', value: 'both' },
        { name: 'Android only (Play Store)', value: 'android' },
        { name: 'iOS only (TestFlight)', value: 'ios' },
        { name: 'None', value: 'none' }
      ],
      when: (answers) => answers.framework === 'meteor' || answers.framework === 'react-native'
    },
    {
      type: 'confirm',
      name: 'useFastlane',
      message: 'Use Fastlane for mobile build & signing? (Recommended — handles code signing, match, and publishing)',
      default: true,
      when: (answers) => answers.mobileBuilds && answers.mobileBuilds !== 'none'
    }
  ]);

  // Normalize answers for templates
  if (answers.framework === 'node') answers.mobileBuilds = 'none';
  if (answers.framework === 'react-native') answers.deployServer = false;
  if (!answers.useFastlane) answers.useFastlane = false;

  console.log(chalk.yellow('\nGenerating your advanced CI/CD pipeline...\n'));

  const templateDir = path.join(__dirname, '../templates');
  const targetDir = process.cwd();
  const githubWorkflowsDir = path.join(targetDir, '.github/workflows');
  const scriptsDir = path.join(targetDir, 'scripts');

  await fs.ensureDir(githubWorkflowsDir);
  
  if (answers.serverMethod === 'proxmox') {
    await fs.ensureDir(scriptsDir);
  }

  const renderTemplate = async (templatePath, targetPath) => {
    const fullTemplatePath = path.join(templateDir, templatePath);
    if (await fs.pathExists(fullTemplatePath)) {
      const templateContent = await fs.readFile(fullTemplatePath, 'utf-8');
      const rendered = ejs.render(templateContent, answers);
      await fs.writeFile(targetPath, rendered);
      console.log(chalk.green(`✅ Created ${path.relative(targetDir, targetPath)}`));
    } else {
      console.log(chalk.red(`❌ Template not found: ${templatePath}`));
    }
  };

  // 1. Generate Main Workflow based on Framework
  await renderTemplate(`frameworks/${answers.framework}/ci-cd.yml.ejs`, path.join(githubWorkflowsDir, 'deploy-production.yml'));

  // 2. Generate Deployment Scripts (if Proxmox)
  if (answers.serverMethod === 'proxmox') {
    await renderTemplate('deployment/proxmox/setup-systemd.sh.ejs', path.join(scriptsDir, 'setup-systemd.sh'));
    await renderTemplate('deployment/proxmox/app.service.ejs', path.join(scriptsDir, 'app.service'));
    await renderTemplate('deployment/proxmox/start-app.sh.ejs', path.join(scriptsDir, 'start-app.sh'));
    
    // Make scripts executable
    await fs.chmod(path.join(scriptsDir, 'setup-systemd.sh'), 0o755);
    await fs.chmod(path.join(scriptsDir, 'start-app.sh'), 0o755);
  }

  // 3. Generate Dockerfile (if Docker)
  if (answers.serverMethod === 'docker') {
    await renderTemplate(`deployment/docker/Dockerfile.${answers.framework}.ejs`, path.join(targetDir, 'Dockerfile'));
    await renderTemplate('deployment/docker/docker-compose.yml.ejs', path.join(targetDir, 'docker-compose.yml'));
  }

  // 4. Generate Fastlane files (if Fastlane)
  if (answers.useFastlane) {
    const fastlaneDir = path.join(targetDir, 'fastlane');
    await fs.ensureDir(fastlaneDir);

    await renderTemplate('fastlane/Gemfile.ejs', path.join(targetDir, 'Gemfile'));
    await renderTemplate('fastlane/Appfile.ejs', path.join(fastlaneDir, 'Appfile'));
    await renderTemplate('fastlane/Matchfile.ejs', path.join(fastlaneDir, 'Matchfile'));
    await renderTemplate('fastlane/Fastfile.ejs', path.join(fastlaneDir, 'Fastfile'));

    // Append .gitignore additions
    const gitignorePath = path.join(targetDir, '.gitignore');
    const additionsPath = path.join(templateDir, 'fastlane/gitignore-additions.txt');
    if (await fs.pathExists(additionsPath)) {
      const additions = await fs.readFile(additionsPath, 'utf-8');
      const existing = (await fs.pathExists(gitignorePath)) ? await fs.readFile(gitignorePath, 'utf-8') : '';
      if (!existing.includes('# Fastlane')) {
        await fs.appendFile(gitignorePath, '\n' + additions);
        console.log(chalk.green('✅ Appended Fastlane entries to .gitignore'));
      }
    }
  }

  // 5. Generate Setup Guide
  await renderTemplate('PIPELINE_SETUP.md.ejs', path.join(targetDir, 'PIPELINE_SETUP.md'));

  console.log(chalk.blue.bold('\n🎉 Advanced Pipeline generated successfully!'));
  console.log(chalk.white(`Please read ${chalk.bold('PIPELINE_SETUP.md')} for the next steps.\n`));
}

run().catch(err => {
  console.error(chalk.red('Error generating pipeline:'), err);
  process.exit(1);
});
