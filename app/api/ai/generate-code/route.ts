import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST - Generate code using AI
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { prompt, language } = body;

    if (!prompt || !language) {
      return NextResponse.json({ message: 'Prompt and language are required' }, { status: 400 });
    }

    // Create a specialized prompt for code generation
    const codePrompt = `You are an expert ${language} programmer. Generate clean, well-commented, and production-ready code based on the following request:

${prompt}

Please provide:
1. The complete code solution
2. A brief explanation of how the code works
3. Any important notes about usage or dependencies

Language: ${language}
Request: ${prompt}

Respond with a JSON object containing:
- "code": the generated code as a string
- "explanation": a detailed explanation of the code
- "dependencies": any required dependencies or imports
- "usage": example of how to use the code`;

    // In a real implementation, you would call your AI service here
    // For now, we'll return a mock response
    const mockResponse = generateMockCode(prompt, language);

    return NextResponse.json(mockResponse, { status: 200 });

  } catch (error) {
    console.error('Error generating code:', error);
    return NextResponse.json({ 
      message: 'Error generating code',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Mock code generation function
function generateMockCode(prompt: string, language: string) {
  const codeExamples: Record<string, any> = {
    javascript: {
      code: `// ${prompt}
function solution() {
  // Generated JavaScript code based on: ${prompt}
  console.log("Hello, World!");
  
  const data = {
    message: "This is generated code",
    timestamp: new Date().toISOString()
  };
  
  return data;
}

// Example usage
const result = solution();
console.log(result);`,
      explanation: `This JavaScript code provides a solution for: ${prompt}

The code includes:
- A main function that encapsulates the logic
- Proper error handling and logging
- Modern ES6+ syntax
- Clear variable naming and structure

The function returns an object with the result and timestamp for tracking purposes.`,
      dependencies: ['No external dependencies required'],
      usage: 'Call solution() to execute the code and get the result.'
    },
    python: {
      code: `# ${prompt}
def solution():
    """
    Generated Python code based on: ${prompt}
    """
    import datetime
    
    print("Hello, World!")
    
    data = {
        "message": "This is generated code",
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    return data

# Example usage
if __name__ == "__main__":
    result = solution()
    print(result)`,
      explanation: `This Python code provides a solution for: ${prompt}

The code includes:
- A main function with proper docstring
- Import statements for required modules
- Dictionary return type for structured data
- Main guard for script execution

The function follows Python best practices and PEP 8 style guidelines.`,
      dependencies: ['datetime (built-in module)'],
      usage: 'Run the script or call solution() to execute the code.'
    },
    typescript: {
      code: `// ${prompt}
interface ResultData {
  message: string;
  timestamp: string;
}

function solution(): ResultData {
  // Generated TypeScript code based on: ${prompt}
  console.log("Hello, World!");
  
  const data: ResultData = {
    message: "This is generated code",
    timestamp: new Date().toISOString()
  };
  
  return data;
}

// Example usage
const result: ResultData = solution();
console.log(result);

export { solution, ResultData };`,
      explanation: `This TypeScript code provides a solution for: ${prompt}

The code includes:
- Type-safe interface definitions
- Strongly typed function signatures
- Modern ES6+ syntax with TypeScript features
- Proper exports for module usage

The code leverages TypeScript's type system to ensure runtime safety and better developer experience.`,
      dependencies: ['TypeScript compiler'],
      usage: 'Import and call solution() to execute the code with type safety.'
    }
  };

  return codeExamples[language] || codeExamples.javascript;
}
