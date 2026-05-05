#!/usr/bin/env node

/**
 * Firebase Configuration Checker
 * Verifies that Firebase is properly configured
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read .env file manually
const envPath = join(rootDir, '.env');
const envVars = {};

if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

console.log('\n🔥 Firebase Configuration Check\n');
console.log('='.repeat(50));

let allConfigured = true;

// Check .env file exists
if (!existsSync(envPath)) {
  console.log('\n❌ .env file not found!');
  console.log('   Create a .env file in the project root with your Firebase credentials.');
  allConfigured = false;
} else {
  console.log('\n✅ .env file found');
}

// Check each required variable
console.log('\n📋 Environment Variables:\n');

requiredVars.forEach(varName => {
  const value = envVars[varName];
  const isSet = value && value !== '' && !value.includes('YOUR_');
  
  if (isSet) {
    console.log(`✅ ${varName}`);
    console.log(`   ${value.substring(0, 30)}...`);
  } else {
    console.log(`❌ ${varName}`);
    console.log(`   Not set or using placeholder value`);
    allConfigured = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allConfigured) {
  console.log('\n✅ Firebase is properly configured!');
  console.log('\nNext steps:');
  console.log('1. Ensure Firestore is enabled in Firebase Console');
  console.log('2. Update Firestore security rules');
  console.log('3. Enable Authentication methods (Email/Password, Google, Facebook)');
  console.log('4. Run: npm run dev');
  console.log('\nSee FIREBASE_SETUP.md for detailed instructions.\n');
  process.exit(0);
} else {
  console.log('\n❌ Firebase configuration is incomplete!');
  console.log('\nTo fix this:');
  console.log('1. Go to https://console.firebase.google.com');
  console.log('2. Select your project or create a new one');
  console.log('3. Go to Project Settings → General');
  console.log('4. Scroll down to "Your apps" and copy the config');
  console.log('5. Add the values to your .env file');
  console.log('6. Run this script again to verify');
  console.log('\nSee FIREBASE_SETUP.md for detailed instructions.\n');
  process.exit(1);
}
