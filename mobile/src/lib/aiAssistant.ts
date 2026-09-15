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

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.summary ?? "تعذّر توليد ملخص.";
}
