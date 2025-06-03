const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupServiceAccount() {
  console.log('\nFirebase Service Account Setup');
  console.log('=============================');
  console.log('1. Go to Firebase Console (https://console.firebase.google.com)');
  console.log('2. Select project "sarmolessons"');
  console.log('3. Click the gear icon (⚙️) next to "Project Overview"');
  console.log('4. Go to "Service accounts" tab');
  console.log('5. Click "Generate New Private Key"');
  console.log('6. Save the downloaded JSON file\n');

  const jsonContent = await new Promise(resolve => {
    rl.question('Paste the contents of the downloaded JSON file here:\n', resolve);
  });

  try {
    // Validate JSON
    const serviceAccount = JSON.parse(jsonContent);
    const required = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
    const missing = required.filter(key => !serviceAccount[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Save to file
    const filePath = path.join(__dirname, '..', 'service-account.json');
    fs.writeFileSync(filePath, JSON.stringify(serviceAccount, null, 2));
    
    console.log('\n✅ Service account file created successfully!');
    console.log(`📁 Saved to: ${filePath}`);
    console.log('\nNow you can run the admin setup script:');
    console.log('node scripts/setup-admin.js');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('Please make sure you copied the entire JSON content correctly.');
  } finally {
    rl.close();
  }
}

setupServiceAccount(); 