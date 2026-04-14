# Init Chat Migration

## Description

Initial migration for the Chat microservice database. Creates all necessary tables, enums, indexes, and foreign key constraints.

## Changes

- Created enums: `MessageType`, `MessageStatus`, `AttachmentType`
- Created table: `Chat` - stores chat information
- Created table: `ChatParticipant` - stores chat participants with join/leave timestamps
- Created table: `Message` - stores chat messages with delivery status
- Created table: `MessageAttachment` - stores message attachments (images, voice messages)

## Indexes

- `Chat(deletedAt)` - for soft delete queries
- `Chat(lastMessageAt)` - for sorting chats by last activity
- `ChatParticipant(userId)` - for finding user's chats
- `ChatParticipant(chatId, userId)` - unique constraint
- `Message(chatId, createdAt)` - for message history pagination
- `Message(senderId)` - for finding user's sent messages
- `Message(deletedAt)` - for soft delete queries
- `MessageAttachment(messageId)` - for finding message attachments

## Foreign Keys

- `ChatParticipant.chatId` → `Chat.id` (CASCADE)
- `Message.chatId` → `Chat.id` (CASCADE)
- `MessageAttachment.messageId` → `Message.id` (CASCADE)

## Notes

This is a baseline migration created to sync with an existing database schema.
