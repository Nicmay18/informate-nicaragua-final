import fs from 'fs';
import { execSync } from 'child_process';

const jsonPath = 'G:/RESPALDO/informate-instant-nicaragua-firebase-adminsdk-fbsvc-2da99059f4.json';
const json = fs.readFileSync(jsonPath, 'utf8');
const sa = JSON.parse(json);

// Set individual env vars
const vars = {
  FIREBASE_PROJECT_ID: sa.project_id,
  FIREBASE_CLIENT_EMAIL: sa.client_email,
  FIREBASE_PRIVATE_KEY: sa.private_key,
};

for (const [key, value] of Object.entries(vars)) {
  try {
    console.log(`Setting ${key}...`);
    execSync(`npx vercel env add ${key} production`, {
      input: value + '\n',
      stdio: ['pipe', 'inherit', 'inherit'],
    });
  } catch (e) {
    console.error(`Failed to set ${key}:`, e.message);
  }
}

console.log('Done setting Firebase env vars');
