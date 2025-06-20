# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2025-06-18 21:33:47 - Log of updates made will be appended as footnotes to the end of this file.

*

## Project Goal

*   Build a cool AI chat app.
*   Make it look and feel however I like (flexible design).
*   Easy to Try: Provide an easy way to try out what's built.

## Key Features

### Core Requirements (Minimum for Prize)
*   **Chat with Various LLMs:** Implement support for multiple language models and providers.
*   **Authentication & Sync:** User authentication with chat history synchronization.
*   **Browser Friendly:** Ensure the application is accessible and functional via a web browser.
*   **Attachment Support:** Allows users to upload and download files (images, PDFs, text, markdown).

### Bonus Features (Ideas to go above and beyond)
*   **Image Generation Support:** AI-powered image generation capabilities.
*   **Syntax Highlighting:** Beautiful code formatting and highlighting.
*   **Resumable Streams:** Continue generation after page refresh.
*   **Chat Branching:** Create alternative conversation paths.
*   **Chat Sharing:** Share conversations with others.
*   **Web Search:** Integrate real-time web search.
*   **Bring Your Own Key:** Allow users to use their own API keys for LLMs.
*   **Mobile App:** Potentially ship mobile and web versions.
*   **Anything Else:** Encourage creative and unique ideas.

## Overall Architecture

*   **Frontend:** Next.js with React, Tailwind CSS, Shadcn/ui, Framer Motion for UI.
*   **Backend:** Next.js API Routes for server-side logic and API endpoints.
*   **Authentication:** NextAuth.js for user authentication and session management.
*   **Database:** MongoDB via Prisma ORM for persistent storage of user data, chat sessions, and messages. Configured as a replica set for Prisma transactions.
*   **LLM Integration:** Abstracted `BaseLLMProvider` and `LLMService` for flexible integration with various Language Models (e.g., OpenAI, Anthropic, Google, OpenAI-compatible).
*   **Current State:**
    *   Basic chat UI, user authentication, and chat history synchronization are implemented.
    *   Database interactions for chat are refactored to use Prisma for efficiency.
    *   CSS rendering issues (Tailwind/PostCSS) have been addressed.
    *   Dynamic LLM provider and model selection is integrated.
    *   **Attachment Support** has been fully implemented, including secure file uploads to MongoDB GridFS, file metadata storage via Prisma, client-side validation, and interactive download links within the chat UI.
*   **Future Architectural Considerations (for bonus features):**
    *   **Image Generation:** Integration with specific image generation APIs (e.g., DALL-E, Midjourney APIs).
    *   **Web Search:** Integration with search APIs (e.g., Google Search API, Brave Search API) for real-time information retrieval.
    *   **Resumable Streams/Chat Branching:** May require more sophisticated state management and server-side processing for long-running chat sessions.
[2025-06-19 15:30:17] - Implemented Chat Management (Delete and Rename) functionality.