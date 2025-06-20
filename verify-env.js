const fs = require('fs');
const crypto = require('crypto');

// Check if .env.local exists
if (!fs.existsSync('.env.local')) {
    console.log('Creating .env.local file...');
    
    // Generate NextAuth secret
    const nextAuthSecret = crypto.randomBytes(32).toString('hex');
    
    // Default environment variables
    const envContent = `# Database
DATABASE_URL="mongodb://localhost:27017/t3chatdb"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${nextAuthSecret}"

# Add your OpenAI API key here
OPENAI_API_KEY=""
`;
    
    fs.writeFileSync('.env.local', envContent);
    console.log('.env.local created successfully!');
    console.log('Please add your OpenAI API key to .env.local');
} else {
    console.log('.env.local file exists');
}

// Read and validate environment variables
const envFile = fs.readFileSync('.env.local', 'utf8');
const requiredVars = ['DATABASE_URL', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET', 'OPENAI_API_KEY'];
const missingVars = [];

requiredVars.forEach(varName => {
    if (!envFile.includes(varName + '=')) {
        missingVars.push(varName);
    }
});

if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
}

console.log('All required environment variables are present'); 