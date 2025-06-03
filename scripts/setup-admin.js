const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupAdmin() {
  console.log('Setting up admin user...');
  
  // Prompt for email and password
  const email = await new Promise(resolve => {
    rl.question('Enter admin email: ', resolve);
  });
  
  const password = await new Promise(resolve => {
    rl.question('Enter admin password: ', resolve);
  });

  // Create dist directory if it doesn't exist
  if (!fs.existsSync('./scripts/dist')) {
    fs.mkdirSync('./scripts/dist', { recursive: true });
  }

  // Compile and run the TypeScript setup script
  try {
    console.log('Compiling TypeScript...');
    execSync('npx tsc --project scripts/tsconfig.json');
    
    console.log('Running setup...');
    const adminSetup = require('./dist/setupAdmin.js');
    await adminSetup.setupAdmin(email, password);
    
    console.log('Admin setup completed successfully!');
    console.log('You can now log in to the admin panel at /admin with these credentials.');
  } catch (error) {
    console.error('Error during setup:', error);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    rl.close();
    // Clean up compiled files
    try {
      fs.rmSync('./scripts/dist', { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

setupAdmin(); 