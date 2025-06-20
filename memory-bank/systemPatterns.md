# System Patterns *Optional*

This file documents recurring patterns and standards used in the project.
It is optional, but recommended to be updated as the project evolves.
2025-06-18 21:34:14 - Log of updates made.

*

## Coding Patterns

*   

## Architectural Patterns

*   **File Attachment Pattern:** Implemented a pattern for handling file attachments, involving:
    *   **Backend:** Dedicated Next.js API routes (`/api/files/upload`, `/api/files/download/[fileId]`) for secure file upload (POST) and download (GET). Utilizes MongoDB GridFS for binary storage and Prisma ORM for managing file metadata (FileMetadata model) in a relational manner.
    *   **Frontend:** Integration in `app/chat/page.tsx` with a hidden file input, client-side validation (type, size), visual feedback (loading spinner, file preview), and embedding of file references (including `gridFSId`) into chat messages. `ChatMessageContent` component parses these references to display file icons and provide clickable download links.


## Testing Patterns

*