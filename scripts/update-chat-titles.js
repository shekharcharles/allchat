// Script to update existing "New Chat" titles with meaningful names
const { PrismaClient } = require('@prisma/client');

// Inline title generation functions (JavaScript version)
function generateSmartTitle(messages) {
  if (!messages || messages.length === 0) {
    return 'New Chat';
  }

  const userMessages = messages.filter(msg => msg.role === 'user');

  if (userMessages.length === 0) {
    return 'New Chat';
  }

  // Analyze the conversation to determine the main topic
  const allUserContent = userMessages.map(msg => msg.content).join(' ').toLowerCase();

  // Programming/Tech keywords
  const techKeywords = {
    'react': 'React Development',
    'javascript': 'JavaScript Help',
    'python': 'Python Programming',
    'typescript': 'TypeScript Development',
    'css': 'CSS Styling',
    'html': 'HTML Development',
    'node': 'Node.js Development',
    'api': 'API Development',
    'database': 'Database Help',
    'sql': 'SQL Queries',
    'mongodb': 'MongoDB Setup',
    'prisma': 'Prisma Database',
    'nextjs': 'Next.js Development',
    'git': 'Git Version Control',
    'docker': 'Docker Configuration',
    'aws': 'AWS Cloud Services',
    'deployment': 'Deployment Help',
    'debugging': 'Debugging Session',
    'error': 'Error Resolution',
    'bug': 'Bug Fixing',
  };

  // Check for tech keywords
  for (const [keyword, title] of Object.entries(techKeywords)) {
    if (allUserContent.includes(keyword)) {
      return title;
    }
  }

  // Fallback to extracting from first message
  return generateChatTitle(messages);
}

function generateChatTitle(messages) {
  if (!messages || messages.length === 0) {
    return 'New Chat';
  }

  // Get the first user message
  const firstUserMessage = messages.find(msg => msg.role === 'user');

  if (!firstUserMessage) {
    return 'New Chat';
  }

  const content = firstUserMessage.content.trim();

  // If the message is too short, use it as is
  if (content.length <= 50) {
    return content;
  }

  // Try to extract a meaningful title from the content
  const title = extractTitle(content);

  // Ensure the title is not too long
  return truncateTitle(title);
}

function extractTitle(content) {
  // Remove common prefixes
  const prefixesToRemove = [
    'can you help me',
    'i need help with',
    'how do i',
    'how to',
    'what is',
    'what are',
    'explain',
    'tell me about',
    'help me',
    'i want to',
    'i would like to',
    'please help',
    'could you',
    'can you',
  ];

  let cleanContent = content.toLowerCase();

  for (const prefix of prefixesToRemove) {
    if (cleanContent.startsWith(prefix)) {
      cleanContent = cleanContent.substring(prefix.length).trim();
      break;
    }
  }

  // Capitalize first letter
  cleanContent = cleanContent.charAt(0).toUpperCase() + cleanContent.slice(1);

  // Try to find the main topic by looking for key patterns
  const patterns = [
    // Code-related patterns
    /(?:create|build|make|develop|write|implement)\s+(?:a\s+)?(.+?)(?:\s+(?:in|using|with|for).*)?$/i,
    /(?:fix|debug|solve|resolve)\s+(.+?)(?:\s+(?:in|with|for).*)?$/i,
    /(?:learn|understand|explain)\s+(.+?)(?:\s+(?:in|with|for).*)?$/i,

    // General patterns
    /(.+?)\s+(?:problem|issue|error|bug)$/i,
    /(.+?)\s+(?:tutorial|guide|help)$/i,
    /(.+?)\s+(?:question|query)$/i,

    // Fallback: take first meaningful phrase
    /^(.{10,40})(?:\s|$)/,
  ];

  for (const pattern of patterns) {
    const match = cleanContent.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // If no pattern matches, take the first sentence or phrase
  const sentences = cleanContent.split(/[.!?]+/);
  if (sentences.length > 0 && sentences[0].trim()) {
    return sentences[0].trim();
  }

  // Fallback to first 40 characters
  return cleanContent.substring(0, 40).trim();
}

function truncateTitle(title) {
  const maxLength = 60;

  if (title.length <= maxLength) {
    return title;
  }

  // Try to truncate at word boundary
  const truncated = title.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

function isValidTitle(title) {
  if (!title || title.trim().length === 0) {
    return false;
  }

  const trimmed = title.trim();

  // Check length
  if (trimmed.length < 1 || trimmed.length > 100) {
    return false;
  }

  // Check for inappropriate content (basic check)
  const inappropriatePatterns = [
    /^\s*$/,  // Only whitespace
    /^[^a-zA-Z0-9\s]/,  // Starts with special character
    /(.)\1{10,}/,  // Repeated characters
  ];

  for (const pattern of inappropriatePatterns) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  return true;
}

async function updateChatTitles() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Finding chat sessions with generic titles...');
    
    // Find all chat sessions with "New Chat" titles
    const sessionsToUpdate = await prisma.chatSession.findMany({
      where: {
        OR: [
          { title: 'New Chat' },
          { title: { startsWith: 'New Chat' } },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 5, // Only get first 5 messages for title generation
          select: {
            content: true,
            role: true,
          },
        },
      },
    });

    console.log(`📊 Found ${sessionsToUpdate.length} chat sessions to update`);

    if (sessionsToUpdate.length === 0) {
      console.log('✅ No chat sessions need title updates');
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const session of sessionsToUpdate) {
      try {
        // Skip if no messages
        if (session.messages.length === 0) {
          console.log(`⏭️  Skipping session ${session.id} - no messages`);
          skippedCount++;
          continue;
        }

        // Convert messages to the format expected by title generator
        const messagesForTitle = session.messages.map(msg => ({
          content: msg.content,
          role: msg.role.toLowerCase(),
        }));

        // Generate new title
        const newTitle = generateSmartTitle(messagesForTitle);

        // Validate and update if the title is meaningful
        if (isValidTitle(newTitle) && newTitle !== 'New Chat' && newTitle !== session.title) {
          await prisma.chatSession.update({
            where: { id: session.id },
            data: { title: newTitle },
          });

          console.log(`✅ Updated "${session.title}" → "${newTitle}"`);
          updatedCount++;
        } else {
          console.log(`⏭️  Skipping session ${session.id} - could not generate meaningful title`);
          skippedCount++;
        }

        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Error updating session ${session.id}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📈 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} sessions`);
    console.log(`⏭️  Skipped: ${skippedCount} sessions`);
    console.log(`📊 Total processed: ${sessionsToUpdate.length} sessions`);

    if (updatedCount > 0) {
      console.log('\n🎉 Chat titles have been updated! Your conversations now have meaningful names.');
    }

  } catch (error) {
    console.error('❌ Error updating chat titles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Preview mode - show what titles would be generated without updating
async function previewTitleUpdates() {
  const prisma = new PrismaClient();
  
  try {
    console.log('👀 Preview mode: Showing what titles would be generated...\n');
    
    const sessionsToUpdate = await prisma.chatSession.findMany({
      where: {
        OR: [
          { title: 'New Chat' },
          { title: { startsWith: 'New Chat' } },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 5,
          select: {
            content: true,
            role: true,
          },
        },
      },
      take: 10, // Limit preview to first 10 sessions
    });

    for (const session of sessionsToUpdate) {
      if (session.messages.length === 0) {
        console.log(`📝 ${session.id}: "${session.title}" → [No messages to analyze]`);
        continue;
      }

      const messagesForTitle = session.messages.map(msg => ({
        content: msg.content,
        role: msg.role.toLowerCase(),
      }));

      const newTitle = generateSmartTitle(messagesForTitle);
      const firstMessage = session.messages.find(m => m.role === 'USER')?.content || '';
      const preview = firstMessage.length > 60 ? firstMessage.substring(0, 60) + '...' : firstMessage;

      console.log(`📝 ${session.id}:`);
      console.log(`   Current: "${session.title}"`);
      console.log(`   New: "${newTitle}"`);
      console.log(`   First message: "${preview}"`);
      console.log('');
    }

    console.log(`\n👀 Preview complete. Run without --preview to apply changes.`);

  } catch (error) {
    console.error('❌ Error in preview mode:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  const isPreview = process.argv.includes('--preview');
  
  const runFunction = isPreview ? previewTitleUpdates : updateChatTitles;
  
  runFunction()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateChatTitles, previewTitleUpdates };
