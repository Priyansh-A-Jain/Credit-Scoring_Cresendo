import { processCopilotQuery } from "../services/chatHandlerService.js";

/**
 * POST /api/chat
 * Body: { query: string, applicationId?: string }
 */
export async function handleChatRequest(req, res) {
  const { query, applicationId } = req.body;

  // ── Validate ────────────────────────────────────────────────────────────
  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({
      success: false,
      error: "query is required and must be a non-empty string",
    });
  }

  const trimmedQuery = query.trim();

  console.log(`[chat] incoming query="${trimmedQuery.slice(0, 80)}" appId=${applicationId ?? "none"}`);

  // ── Dispatch ─────────────────────────────────────────────────────────────
  try {
    const response = await processCopilotQuery({
      query: trimmedQuery,
      applicationId: applicationId || null,
    });

    console.log(`[chat] intent=${response.intent}  contextType=${response.contextType}`);

    // Strip internal routing debug field from public response
    const { routedQuery: _routedQuery, ...publicResponse } = response;

    return res.status(200).json({
      success: true,
      data: publicResponse,
    });
  } catch (err) {
    console.error("[chat] handler error:", err);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred while processing your query.",
    });
  }
}
