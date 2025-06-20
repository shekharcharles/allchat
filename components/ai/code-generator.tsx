"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Code, 
  Play, 
  Copy, 
  Download, 
  Save, 
  FileText, 
  Terminal, 
  Bug, 
  Zap,
  Check,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Settings,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PrismAsyncLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia, materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';

interface CodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface GeneratedCode {
  id: string;
  language: string;
  code: string;
  explanation: string;
  prompt: string;
  createdAt: string;
}

interface ExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
  status: 'success' | 'error';
}

const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', extension: 'js' },
  { value: 'typescript', label: 'TypeScript', extension: 'ts' },
  { value: 'python', label: 'Python', extension: 'py' },
  { value: 'java', label: 'Java', extension: 'java' },
  { value: 'cpp', label: 'C++', extension: 'cpp' },
  { value: 'csharp', label: 'C#', extension: 'cs' },
  { value: 'go', label: 'Go', extension: 'go' },
  { value: 'rust', label: 'Rust', extension: 'rs' },
  { value: 'php', label: 'PHP', extension: 'php' },
  { value: 'ruby', label: 'Ruby', extension: 'rb' },
  { value: 'swift', label: 'Swift', extension: 'swift' },
  { value: 'kotlin', label: 'Kotlin', extension: 'kt' },
];

const CODE_TEMPLATES = [
  {
    category: 'Web Development',
    templates: [
      'Create a React component with hooks',
      'Build a REST API endpoint',
      'Implement user authentication',
      'Create a responsive CSS layout',
    ]
  },
  {
    category: 'Data Science',
    templates: [
      'Analyze CSV data with pandas',
      'Create data visualizations',
      'Implement machine learning model',
      'Process text with NLP',
    ]
  },
  {
    category: 'Algorithms',
    templates: [
      'Implement sorting algorithm',
      'Create binary search tree',
      'Solve dynamic programming problem',
      'Implement graph traversal',
    ]
  },
];

export function CodeGenerator({ isOpen, onClose, initialPrompt = "" }: CodeGeneratorProps) {
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleGenerateCode = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a code generation prompt",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          language: selectedLanguage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedCode({
          id: Date.now().toString(),
          language: selectedLanguage,
          code: data.code,
          explanation: data.explanation,
          prompt,
          createdAt: new Date().toISOString(),
        });
        
        toast({
          title: "Code Generated",
          description: "Your code has been generated successfully",
        });
      } else {
        throw new Error('Failed to generate code');
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCode = async () => {
    if (!generatedCode) return;

    setExecuting(true);
    setExecutionResult(null);
    
    try {
      const response = await fetch('/api/ai/execute-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: generatedCode.code,
          language: generatedCode.language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExecutionResult(data);
      } else {
        const error = await response.json();
        setExecutionResult({
          output: '',
          error: error.message || 'Execution failed',
          executionTime: 0,
          status: 'error',
        });
      }
    } catch (error) {
      setExecutionResult({
        output: '',
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime: 0,
        status: 'error',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;

    try {
      await navigator.clipboard.writeText(generatedCode.code);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCode = () => {
    if (!generatedCode) return;

    const language = PROGRAMMING_LANGUAGES.find(lang => lang.value === generatedCode.language);
    const extension = language?.extension || 'txt';
    const filename = `generated_code.${extension}`;
    
    const blob = new Blob([generatedCode.code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({
      title: "Downloaded",
      description: `Code saved as ${filename}`,
    });
  };

  const handleTemplateSelect = (template: string) => {
    setPrompt(template);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-purple/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Code className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">AI Code Generator</h2>
                <p className="text-sm text-muted-foreground">Generate, review, and execute code with AI</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Input */}
          <div className="w-1/3 p-6 border-r border-border space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Programming Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROGRAMMING_LANGUAGES.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Code Generation Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe what code you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <Button 
                onClick={handleGenerateCode}
                disabled={loading || !prompt.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Code
                  </>
                )}
              </Button>
            </div>

            <Separator />

            {/* Templates */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Templates</Label>
              <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                {CODE_TEMPLATES.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {category.category}
                    </h4>
                    <div className="space-y-1">
                      {category.templates.map((template) => (
                        <Button
                          key={template}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTemplateSelect(template)}
                          className="w-full justify-start text-left h-auto py-2 px-3"
                        >
                          <span className="text-xs">{template}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Output */}
          <div className="flex-1 flex flex-col">
            <Tabs defaultValue="code" className="flex-1 flex flex-col">
              <div className="p-4 border-b border-border">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="code">Generated Code</TabsTrigger>
                  <TabsTrigger value="explanation">Explanation</TabsTrigger>
                  <TabsTrigger value="execution">Execution</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="code" className="flex-1 p-0 m-0">
                <div className="h-full flex flex-col">
                  {generatedCode ? (
                    <>
                      <div className="p-4 border-b border-border flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {PROGRAMMING_LANGUAGES.find(lang => lang.value === generatedCode.language)?.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {generatedCode.code.split('\n').length} lines
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={handleCopyCode}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleDownloadCode}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleExecuteCode} disabled={executing}>
                            {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto">
                        <SyntaxHighlighter
                          language={generatedCode.language}
                          style={resolvedTheme === 'dark' ? okaidia : materialLight}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: 'transparent',
                            fontSize: '14px',
                            lineHeight: '1.5',
                          }}
                          showLineNumbers
                        >
                          {generatedCode.code}
                        </SyntaxHighlighter>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-center">
                      <div>
                        <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No Code Generated</h3>
                        <p className="text-sm text-muted-foreground">
                          Enter a prompt and click "Generate Code" to get started
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="explanation" className="flex-1 p-4 m-0">
                {generatedCode?.explanation ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap">{generatedCode.explanation}</div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Explanation Available</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate code to see the explanation
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="execution" className="flex-1 p-4 m-0">
                {executionResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {executionResult.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium">
                          {executionResult.status === 'success' ? 'Execution Successful' : 'Execution Failed'}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {executionResult.executionTime}ms
                      </Badge>
                    </div>

                    {executionResult.output && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Output</Label>
                        <Card>
                          <CardContent className="p-4">
                            <pre className="text-sm whitespace-pre-wrap font-mono">
                              {executionResult.output}
                            </pre>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {executionResult.error && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block text-red-600">Error</Label>
                        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                          <CardContent className="p-4">
                            <pre className="text-sm whitespace-pre-wrap font-mono text-red-700 dark:text-red-300">
                              {executionResult.error}
                            </pre>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <Terminal className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Execution Results</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate code and click "Execute" to see results
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
