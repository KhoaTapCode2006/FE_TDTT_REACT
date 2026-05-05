#!/usr/bin/env node

/**
 * Setup New Firebase Project
 * This script helps you set up a new Firebase project for this React app
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const envPath = join(rootDir, '.env');
const envBackupPath = join(rootDir, '.env.backup');

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n🔥 Firebase Project Setup for Booking4LU\n');
  console.log('='.repeat(60));
  
  // Check if .env exists
  if (existsSync(envPath)) {
    console.log('\n⚠️  Found existing .env file');
    const backup = await question('Do you want to backup the current .env? (y/n): ');
    
    if (backup.toLowerCase() === 'y') {
      copyFileSync(envPath, envBackupPath);
      console.log(`✅ Backed up to .env.backup`);
    }
  }
  
  console.log('\n📋 Please provide your new Firebase project credentials:');
  console.log('   (Get these from Firebase Console → Project Settings → Your apps)\n');
  
  const apiKey = await question('VITE_FIREBASE_API_KEY: ');
  const authDomain = await question('VITE_FIREBASE_AUTH_DOMAIN: ');
  const projectId = await question('VITE_FIREBASE_PROJECT_ID: ');
  const storageBucket = await question('VITE_FIREBASE_STORAGE_BUCKET: ');
  const messagingSenderId = await question('VITE_FIREBASE_MESSAGING_SENDER_ID: ');
  const appId = await question('VITE_FIREBASE_APP_ID: ');
  
  // Create .env content
  const envContent = `# Firebase Configuration for Booking4LU
# Project: ${projectId}
# Created: ${new Date().toISOString()}

VITE_FIREBASE_API_KEY=${apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${authDomain}
VITE_FIREBASE_PROJECT_ID=${projectId}
VITE_FIREBASE_STORAGE_BUCKET=${storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${messagingSenderId}
VITE_FIREBASE_APP_ID=${appId}

# Development Environment
NODE_ENV=development
`;
  
  // Write .env file
  writeFileSync(envPath, envContent);
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Successfully created .env file!');
  console.log('\n📋 Next steps:');
  console.log('   1. Enable Firestore Database in Firebase Console');
  console.log('   2. Enable Authentication (Email/Password)');
  console.log('   3. Run: npm run check:firebase');
  console.log('   4. Run: npm run dev');
  console.log('\n   See FIREBASE_SETUP.md for detailed instructions.\n');
  
  rl.close();
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
