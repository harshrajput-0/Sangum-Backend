import * as chatRepository from "./chat.repository.js";
import { ConversationType } from "./conversation.model.js";
import { ParticipantRole as PRole } from "./participant.model.js";
import { MessageType } from "./message.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { CreateConversationPayload, SendMessagePayload } from "./chat.types.js";

// ====================================================================
// ----------------------| CONVERSATIONS |-----------------------------
// ====================================================================

// Get all conversation for user
export const getUserConversations = (userId: string, pagination: any) => {
  return chatRepository.findConversationByUser(userId, pagination);
};

// ===| CREATE A DIRECT CONVERSATION BETWEEN 2 USERS |--------------------------------------
export const createDirectConversation = async (
  userId: string,
  targetUserId: string,
) => {
  // User cannot create conversation with themselves
  if (userId === targetUserId) {
    throw ApiError.badRequest("You can't message yourself");
  }
  // Check if DM already exists
  const existingDM = await chatRepository.findDirectConversation(
    userId,
    targetUserId,
  );

  if (existingDM) return existingDM;

  // Create conversation
  const conversation = await chatRepository.createConversation({
    type: ConversationType.DIRECT,
    createdBy: userId,
    participantsCount: 2,
  } as any);

  // Add creator as participant
  await chatRepository.createParticipant({
    conversationId: conversation._id,
    userId,
    role: PRole.MEMBER,
  } as any);

  // Add other user as paritcipant
  await chatRepository.createParticipant({
    conversationId: conversation._id,
    userId: targetUserId,
    role: PRole.MEMBER,
  } as any);

  return conversation;
};

// ===| CREATE A DIRECT CONVERSATION BETWEEN 2 USERS |--------------------------------------
export const createGroupConversation = async (
  userId: string,
  participantIds: string[],
  name: string,
) => {
  const conversation = await chatRepository.createConversation({
    type: ConversationType.GROUP,
    name,
    createdBy: userId,
    participantsCount: participantIds.length + 1,
  } as any);

  // The creator is admin
  await chatRepository.createParticipant({
    conversationId: conversation._id,
    userId,
    role: PRole.ADMIN,
  } as any);

  // Add all invited users
  for (const participantId of participantIds) {
    await chatRepository.createParticipant({
      conversationId: conversation._id,
      userId: participantId,
      role: PRole.MEMBER,
    } as any);
  }

  return conversation;
};

// ===| DECIDE WHICH CREATE CONVERSATION FUNCTION TO USE |--------------------------------------
export const createConversation = (
  payload: CreateConversationPayload,
  userId: string,
) => {
  if (payload.type === ConversationType.DIRECT) {
    const targetUserId = payload.participantIds[0];

    if (!targetUserId) {
      throw ApiError.badRequest(
        "A direct conversation requires another participant",
      );
    }

    return createDirectConversation(userId, targetUserId);
  }

  return createGroupConversation(
    userId,
    payload.participantIds,
    payload.name || "New Group",
  );
};

// ====================================================================
// --------------------| GET CONVERSATIONS |---------------------------
// ====================================================================
// Get conversation only if user is participant to prevent access to
// other priveate conversaiton
export const getConversationById = async (
  conversationId: string,
  userId: string,
) => {
  const conversation =
    await chatRepository.findConversationById(conversationId);

  if (!conversation) {
    throw ApiError.notFound("Conversation not found");
  }

  // Check whether the user actually belongs to this conversation.
  const participant = await chatRepository.findParticipant(
    conversationId,
    userId,
  );

  if (!participant || !participant.isActive) {
    throw ApiError.forbidden("You're not part of this conversation");
  }

  return conversation;
};

// ====================================================================
// ------------------| MESSAGES SERVICES |-----------------------------
// ====================================================================

// ====| GET MESSAGES: after checking user is participant |================================
export const getMessages = async (
  conversationId: string,
  userId: string,
  cursor: string | undefined,
  limit: number,
) => {
  // This also acts as an authorization check.
  await getConversationById(conversationId, userId);

  // Fetch the actual messages after authorization succeeds.
  return chatRepository.findMessages(conversationId, cursor, limit);
};

// ====| SEND MESSAGES |======================================================================
export const sendMessage = async (
  conversationId: string,
  userId: string,
  payload: SendMessagePayload,
) => {
  // Make sure the sender belongs to the conversation.
  await getConversationById(conversationId, userId);

  // Create the message in the database.
  const message = await chatRepository.createMessage({
    conversationId,
    senderId: userId,

    // If a media ID exists, treat it as an image message.
    // Otherwise, treat it as a normal text message.
    type: payload.mediaId ? MessageType.IMAGE : MessageType.TEXT,

    content: payload.content,
    media: payload.mediaId,
    replyTo: payload.replyTo,
  } as any);

  // Keep the conversation's latest-message information up to date.
  await chatRepository.updateLastMessage(
    conversationId,
    message._id.toString(),
  );

  return message;
};

// ====| EDITING MESSAGE |=======================================================================
export const editMessage = async (
  messageId: string,
  userId: string,
  content: string,
) => {
  const message = await chatRepository.findMessageById(messageId);

  if (!message) {
    throw ApiError.notFound("Message not found");
  }

  // Users can only edit messages they originally sent.
  if (message.senderId.toString() !== userId) {
    throw ApiError.forbidden("You can only edit your own messages");
  }

  // Messages can only be edited for 15 minutes after creation.
  const EDIT_WINDOW_MS = 15 * 60 * 1000;

  if (Date.now() - message.createdAt.getTime() > EDIT_WINDOW_MS) {
    throw ApiError.badRequest("This message is too old to edit");
  }

  return chatRepository.updateMessage(messageId, content);
};

// ====| DELETE MESSAGE |=======================================================================
export const deleteMessage = async (messageId: string, userId: string) => {
  const message = await chatRepository.findMessageById(messageId);

  if (!message) {
    throw ApiError.notFound("Message not found");
  }

  // Users can only delete their own messages.
  if (message.senderId.toString() !== userId) {
    throw ApiError.forbidden("You can only delete your own messages");
  }

  // Keep the message in the database but mark it as deleted.
  await chatRepository.softDeleteMessage(messageId);
};

// ====| MARK SPECIFIC MESSAGE AS LAST USER HAS READ |===============================================
export const markConversationRead = async (
  conversationId: string,
  userId: string,
  messageId: string,
) => {
  // Make sure the user belongs to the conversation.
  await getConversationById(conversationId, userId);

  // Store the user's read position.
  await chatRepository.markParticipantRead(conversationId, userId, messageId);
};

// ====================================================================
// ------------------| GROUP CONVERSATION |----------------------------
// ====================================================================

// ====| ADD USER TO GROUP CONVERSATION [ADMIN] |===================================================
export const addParticipant = async (
  conversationId: string,
  requesterId: string,
  targetUserId: string,
) => {
  const conversation =
    await chatRepository.findConversationById(conversationId);

  if (!conversation) {
    throw ApiError.notFound("Conversation not found");
  }

  // Direct conversations cannot have additional participants.
  if (conversation.type !== ConversationType.GROUP) {
    throw ApiError.badRequest(
      "Can't add participants to a direct conversation",
    );
  }

  // Check the role of the person making the request.
  const requester = await chatRepository.findParticipant(
    conversationId,
    requesterId,
  );

  if (!requester || requester.role !== PRole.ADMIN) {
    throw ApiError.forbidden("Only a group admin can add participants");
  }

  // Add the new user as a regular member.
  await chatRepository.createParticipant({
    conversationId,
    userId: targetUserId,
    role: PRole.MEMBER,
  } as any);

  // Increase the participant count on the conversation.
  await chatRepository.updateConversation(conversationId, {
    participantsCount: conversation.participantsCount + 1,
  });
};

// ====| REMOVE USER FROM GROUP CNOVERSATION |=======================================================
export const removeParticipant = async (
  conversationId: string,
  requesterId: string,
  targetUserId: string,
) => {
  // Check whether the requester is an admin.
  const requester = await chatRepository.findParticipant(
    conversationId,
    requesterId,
  );

  if (!requester || requester.role !== PRole.ADMIN) {
    throw ApiError.forbidden("Only a group admin can remove participants");
  }

  // Soft-remove the participant instead of deleting the record.
  await chatRepository.deactivateParticipant(conversationId, targetUserId);
};

// ====| ALLOW CURRENT USER TO LEAVE CONVERSATION |==========================================================
export const leaveConversation = async (
  conversationId: string,
  userId: string,
) => {
  // Check whether the user is actually a participant.
  const participant = await chatRepository.findParticipant(
    conversationId,
    userId,
  );

  if (!participant) {
    throw ApiError.notFound("You're not part of this conversation");
  }

  // Mark the participant as inactive instead of deleting the record.
  await chatRepository.deactivateParticipant(conversationId, userId);
};
