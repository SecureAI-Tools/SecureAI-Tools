import type { NextApiRequest, NextApiResponse } from "next";

import { ErrorResponse } from "lib/types/api/error.response";
import { API } from "lib/api/core/api.utils";
import { isAuthenticated } from "lib/api/core/auth";
import {
  sendUnsupportedMethodError,
  sendBadRequestError,
  sendNotFoundError,
} from "lib/api/core/utils";
import { withLogging } from "lib/api/core/with-logging";
import { ChatResponse } from "lib/types/api/chat.response";
import { ChatService } from "lib/api/services/chat-service";
import { ChatCreateRequest } from "lib/types/api/chat-create.request";
import { OrgMembershipService } from "lib/api/services/org-membership-service";

const chatService = new ChatService();
const orgMembershipService = new OrgMembershipService();

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | ErrorResponse>,
) {
  // TODO: Figure out a better way of routing based on method!
  if (req.method === "POST") {
    return handlePostChat(req, res);
  }

  return sendUnsupportedMethodError(res);
}

async function handlePostChat(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse | ErrorResponse>,
) {
  const [authenticated, userId] = await isAuthenticated(req, res);
  if (!authenticated) {
    return;
  }

  const orgIdOrSlug = API.getFirstQueryParam(req, "orgIdOrSlug");
  if (!userId || !orgIdOrSlug) {
    return sendBadRequestError(res);
  }

  const hasPermissions = await orgMembershipService.isActiveMember(
    userId,
    orgIdOrSlug,
  );
  if (!hasPermissions) {
    return sendNotFoundError(res);
  }

  const chatCreateRequest = API.get(ChatCreateRequest, req, res);
  if (!chatCreateRequest) {
    return;
  }

  const chatCreated = await chatService.create({
    title: chatCreateRequest.title,
    orgIdOrSlug: orgIdOrSlug,
    creatorId: userId,
  });

  return res.json(ChatResponse.fromEntity(chatCreated));
}

export default withLogging(handler);
