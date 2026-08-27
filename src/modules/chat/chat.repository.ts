import Conversation, {
  IConversation,
  ConversationType,
} from "./conversation.model.js";
import Participant, { IParticipant } from "./participant.model.js";
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
  const participantRows = await Participant.find({ userId, isActive: true })
    .select("conversationId")
    .skip(skip)
    .limit(limit);

  const conversationIds = participantRows.map((p) => p.conversationId);

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
  const userAConvos = await Participant.find({
    userId: userIdA,
    isActive: true,
  }).select("conversationId");

  const candidateIds = userAConvos.map((p) => p.conversationId);

  const match = await Participant.findOne({
    conversationId: { $in: candidateIds },
    userId: userIdB,
    isActive: true,
  });

  if (!match) return null;

  const conversation = await Conversation.findById(match.conversationId);
  return conversation?.type === ConversationType.DIRECT ? conversation : null;
};

// ===| FIND CONVERSATION BY USER |--------------------------------
export const createConversation = (data: Partial<IConversation>) =>
  Conversation.create(data);

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


// ==============================================================
// ------------------| PARTICIPANTS |----------------------------
// ==============================================================

