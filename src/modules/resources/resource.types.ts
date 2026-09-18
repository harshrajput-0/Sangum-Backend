import { ResourceType } from "./resource.model.js";

export interface SubmitResourcePayload {
  title: string;
  description: string;
  url: string;
  type: ResourceType;
  communityId?: string;
  tags?: string[];
  isPaywalled?: boolean;
}

export interface ResourceFilters {
  type?: ResourceType;
  tag?: string;
  communityId?: string;
}
