import { ConversationType } from "./conversation.model.js";

export interface CreateConversationPayload {
  type: ConversationType;
  participantIds: string[];     // for direct: exactly 1 (the other person); for group: 2+
  name?: string;                 // group only
}

export interface SendMessagePayload {
  content?: string;
  mediaId?: string;
  replyTo?: string;
}
