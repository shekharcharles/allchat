import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// POST - Execute code (with safety limitations)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, language } = body;

    if (!code || !language) {
      return NextResponse.json({ message: 'Code and language are required' }, { status: 400 });
    }

    // Security check - only allow safe languages and operations
    const allowedLanguages = ['javascript', 'python', 'typescript'];
    if (!allowedLanguages.includes(language)) {
      return NextResponse.json({ 
        message: 'Code execution is only supported for JavaScript, TypeScript, and Python' 
      }, { status: 400 });
    }

    // Check for potentially dangerous operations
    const dangerousPatterns = [
      /require\s*\(\s*['"]fs['"]/, // File system access
      /require\s*\(\s*['"]child_process['"]/, // Process execution
      /require\s*\(\s*['"]net['"]/, // Network access
      /require\s*\(\s*['"]http['"]/, // HTTP requests
      /import\s+.*\s+from\s+['"]fs['"]/, // ES6 file system
      /eval\s*\(/, // Code evaluation
      /Function\s*\(/, // Dynamic function creation
      /process\./, // Process access
      /global\./, // Global object access
      /window\./, // Window object access (if in browser context)
      /document\./, // Document access
      /fetch\s*\(/, // Network requests
      /XMLHttpRequest/, // AJAX requests
      /while\s*\(\s*true\s*\)/, // Infinite loops
      /for\s*\(\s*;\s*;\s*\)/, // Infinite loops
    ];

    const hasDangerousCode = dangerousPatterns.some(pattern => pattern.test(code));
    if (hasDangerousCode) {
      return NextResponse.json({
        output: '',
        error: 'Code contains potentially dangerous operations and cannot be executed',
        executionTime: 0,
        status: 'error',
      }, { status: 400 });
    }

    // Mock execution for demonstration
    // In a real implementation, you would use a sandboxed environment
    const executionResult = await mockExecuteCode(code, language);

    return NextResponse.json(executionResult, { status: 200 });

  } catch (error) {
    console.error('Error executing code:', error);
    return NextResponse.json({ 
      message: 'Error executing code',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Mock code execution function
async function mockExecuteCode(code: string, language: string) {
  const startTime = Date.now();
  
  try {
    // Simulate execution time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    let output = '';
    let error = '';
    let status: 'success' | 'error' = 'success';

    // Mock different execution scenarios based on code content
    if (code.includes('console.log') || code.includes('print')) {
      // Extract console.log or print statements for mock output
      const logMatches = code.match(/console\.log\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g) ||
                        code.match(/print\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g);
      
      if (logMatches) {
        output = logMatches.map(match => {
          const content = match.match(/['"`]([^'"`]+)['"`]/);
          return content ? content[1] : 'Output';
        }).join('\n');
      } else {
        output = 'Hello, World!\nCode executed successfully';
      }
    } else if (code.includes('error') || code.includes('throw')) {
      // Simulate error scenario
      status = 'error';
      error = 'ReferenceError: Simulated error for demonstration';
    } else if (code.includes('return')) {
      // Simulate function return
      output = 'Function executed successfully\nReturn value: [object Object]';
    } else {
      // Default success output
      output = 'Code executed successfully';
    }

    // Add some realistic execution details
    if (language === 'python') {
      output = output || 'Python script executed successfully';
    } else if (language === 'javascript' || language === 'typescript') {
      output = output || 'JavaScript code executed successfully';
    }

    const executionTime = Date.now() - startTime;

    return {
      output,
      error: error || undefined,
      executionTime,
      status,
    };

  } catch (err) {
    const executionTime = Date.now() - startTime;
    return {
      output: '',
      error: err instanceof Error ? err.message : 'Execution failed',
      executionTime,
      status: 'error' as const,
    };
  }
}

// Note: In a production environment, you would want to:
// 1. Use a proper sandboxed execution environment (like Docker containers)
// 2. Implement proper timeout mechanisms
// 3. Limit resource usage (CPU, memory)
// 4. Use specialized code execution services
// 5. Implement proper logging and monitoring
// 6. Add rate limiting per user
// 7. Validate and sanitize all inputs thoroughly
