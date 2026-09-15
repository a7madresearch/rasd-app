import { supabase } from "./supabase";

/**
 * Calls the `summarize-pending` Supabase Edge Function, which builds a
 * project context server-side and asks Claude to summarize what's
 * currently pending. The Anthropic API key lives only in the Edge
 * Function's environment — never in the app bundle.
 */
export async function summarizePendingTasks(projectId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("summarize-pending", {
    body: { project_id: projectId },
  });

  if (error) {
    // supabase-js's default error.message for a non-2xx response is just
    // "Edge Function returned a non-2xx status code" — the actual reason
    // is in the response body, reachable via error.context (the raw
    // Response object) for FunctionsHttpError.
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const body = await ctx.json();
        throw new Error(body?.error || body?.detail || error.message);
      } catch {
        // body wasn't JSON (or already consumed) — fall through to the
        // generic message below.
      }
    }
    throw error;
  }
  if (data?.error) throw new Error(data.error);
  return data?.summary ?? "تعذّر توليد ملخص.";
}
