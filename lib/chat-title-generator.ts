// Chat title generation utilities
export interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
}

export function generateChatTitle(messages: ChatMessage[]): string {
  if (!messages || messages.length === 0) {
    return 'New Chat';
  }

  // Get the first user message (skip system messages)
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

function extractTitle(content: string): string {
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

function truncateTitle(title: string): string {
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

// Smart title generation based on conversation context
export function generateSmartTitle(messages: ChatMessage[]): string {
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

  // General topic keywords
  const generalKeywords = {
    'design': 'Design Discussion',
    'business': 'Business Strategy',
    'marketing': 'Marketing Help',
    'writing': 'Writing Assistance',
    'research': 'Research Help',
    'analysis': 'Data Analysis',
    'planning': 'Project Planning',
    'strategy': 'Strategy Session',
    'optimization': 'Optimization Help',
    'tutorial': 'Learning Session',
    'explanation': 'Concept Explanation',
    'comparison': 'Comparison Analysis',
  };

  for (const [keyword, title] of Object.entries(generalKeywords)) {
    if (allUserContent.includes(keyword)) {
      return title;
    }
  }

  // Fallback to extracting from first message
  return generateChatTitle(messages);
}

// Generate title suggestions for manual selection
export function generateTitleSuggestions(messages: ChatMessage[]): string[] {
  if (!messages || messages.length === 0) {
    return ['New Chat'];
  }

  const suggestions = new Set<string>();
  
  // Add the smart generated title
  suggestions.add(generateSmartTitle(messages));
  
  // Add title from first message
  suggestions.add(generateChatTitle(messages));
  
  // Add topic-based suggestions
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (firstUserMessage) {
    const content = firstUserMessage.content.toLowerCase();
    
    // Question-based titles
    if (content.includes('how to') || content.includes('how do')) {
      suggestions.add('How-to Guide');
    }
    if (content.includes('what is') || content.includes('what are')) {
      suggestions.add('Concept Explanation');
    }
    if (content.includes('help me') || content.includes('can you help')) {
      suggestions.add('Help Request');
    }
    if (content.includes('create') || content.includes('build') || content.includes('make')) {
      suggestions.add('Development Task');
    }
    if (content.includes('fix') || content.includes('debug') || content.includes('error')) {
      suggestions.add('Troubleshooting');
    }
  }
  
  // Add time-based fallback
  const now = new Date();
  suggestions.add(`Chat ${now.toLocaleDateString()}`);
  
  return Array.from(suggestions).slice(0, 5);
}

// Validate if a title is appropriate
export function isValidTitle(title: string): boolean {
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
