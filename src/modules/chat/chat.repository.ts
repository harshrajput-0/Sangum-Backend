import Conversation, {
  IConversation,
  ConversationType,
} from "./conversation.model.js";
import Participant, { IParticipant, ParticipantRole } from "./participant.model.js";
import Message, { IMessage } from "./message.model.js";
import { PaginationParams } from "../../utils/pagination.js";

// ==============================================================
// ------------------| CONVERSATONS |----------------------------
// ==============================================================

// ===| FIND CONVERSATION BY USER |------------------------------
export const findConversationByUser = async (
  userId: string,
  { skip, limit }: PaginationParams,
) => {
  // Find conversation where user is active participant
  const participantRows = await Participant.find({ userId, isActive: true })
    .select("conversationId")
    .skip(skip)
    .limit(limit);

  const conversationIds = participantRows.map((p) => p.conversationId);

  // Fetch actual conversation and include latest message
  return Conversation.find({ _id: { $in: conversationIds }, isActive: true })
    .populate("lastMessage")
    .sort({ lastMessageAt: -1 });
};

// ===| FIND CONVERSATION BY USER |-------------------------------
export const findConversationById = (conversationId: string) => {
  return Conversation.findById(conversationId);
};

// ===| FIND CONVERSATION BY USER |--------------------------------
export const findDirectConversation = async (
  userIdA: string,
  userIdB: string,
) => {
  // Get conversations with user A
  const userAConvos = await Participant.find({
    userId: userIdA,
    isActive: true,
  }).select("conversationId");

  const candidateIds = userAConvos.map((p) => p.conversationId);

  // Check if user B is an active participant in conversation
  const match = await Participant.findOne({
    conversationId: { $in: candidateIds },
    userId: userIdB,
    isActive: true,
  });

  if (!match) return null;

  // Make sure matching conversation is actually a direct chat
  const conversation = await Conversation.findById(match.conversationId);
  return conversation?.type === ConversationType.DIRECT ? conversation : null;
};

// ===| FIND CONVERSATION BY USER |--------------------------------
export const createConversation = (data: Partial<IConversation>) => {
  return Conversation.create(data);
}

// ===| FIND CONVERSATION BY USER |---------------------------------
export const updateConversation = (
  conversationId: string,
  data: Partial<IConversation>,
) => {
  return Conversation.findByIdAndUpdate(conversationId, data, { new: true });
};

// ===| FIND CONVERSATION BY USER |---------------------------------
export const updateLastMessage = (
  conversationId: string,
  messageId: string,
) => {
  return Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: messageId,
    lastMessageAt: new Date(),
  });
};

// ===| FIND CONVERSATION BY USER |-----------------------------------
export const deactivateConversation = (conversationId: string) => {
  return Conversation.findByIdAndUpdate(conversationId, { isActive: false });
};

// ==============================================================
// ------------------| MESSAGES |--------------------------------
// ==============================================================

// ===| FIND MESSAGES |--------------------------------
export const findMessages = (
  conversationId: string,
  cursor: string | undefined,
  limit: number,
) => {
  const query: Record<string, unknown> = { conversationId, isDeleted: false };

  // Only return messages older than the cursor (specific message)
  if (cursor) {                                                                   
    query._id = { $lt: cursor };
  };
  return Message.find(query)
    .populate("senderId", "username displayName avatar")
    .populate("media")
    .sort({ _id: -1 })
    .limit(limit);
};

// ===| CREATE MESSAGE |--------------------------------
export const createMessage = (data: Partial<IMessage>) => {
  return Message.create(data);
};

// ===| FIND MESSAGE BY ID |--------------------------------
export const findMessageById = (messageId: string) => {
  return Message.findById(messageId);
};

// ===| UPDATE MESSAGE AND MARK AS EDITED |--------------------------------
export const updateMessage = (messageId: string, content: string) => {
  return Message.findByIdAndUpdate(
    messageId,
    { content, isEdited: true, editedAt: new Date() },
    { new: true },
  );
};

// ===| SOFT DELETE MESSAGE |--------------------------------
export const softDeleteMessage = (messageId: string) => {
  return Message.findByIdAndUpdate(messageId, {
    isDeleted: true,
    deletedAt: new Date(),
  });
};

// ==============================================================
// ------------------| PARTICIPANTS |----------------------------
// ==============================================================

// ===| SOFT DELETE MESSAGE |--------------------------------
export const findParticipant = (conversationId: string, userId: string) => {
  return Participant.findOne({ conversationId, userId });
};

// ===| SOFT DELETE MESSAGE |--------------------------------
export const createParticipant = (data: Partial<IParticipant>) => {
  return Participant.create(data);
};

// ===| SOFT DELETE MESSAGE |--------------------------------
export const findParticipants = (conversationId: string) => {
  return Participant.find({ conversationId, isActive: true }).populate(
    "userId",
    "username displayName avatar isOnline",
  );
};

// ===| SOFT DELETE MESSAGE |--------------------------------
export const markParticipantRead = (
  conversationId: string,
  userId: string,
  messageId: string,
) => {
  return Participant.findOneAndUpdate(
    { conversationId, userId },
    { lastRead: messageId, lastReadAt: new Date() },
  );
};

// ===| SOFT DELETE MESSAGE |--------------------------------
export const deactivateParticipant = (
  conversationId: string,
  userId: string,
) => {
  return Participant.findOneAndUpdate(
    { conversationId, userId },
    { isActive: false, leftAt: new Date() },
  );
};

// ===| SOFT DELETE MESSAGE |--------------------------------
export const updateParticipantRole = (
  conversationId: string,
  userId: string,
  role: ParticipantRole,
) => {
  return Participant.findOneAndUpdate({ conversationId, userId }, { role });
};
