// Supabase Edge Function: summarize-pending
//
// Builds a project context from the database (same idea as
// buildProjectContext() in docs/rasd-platform.jsx) and asks Claude to
// summarize what's currently pending. Runs server-side so the Anthropic
// API key never ships inside the mobile app bundle.
//
// Deploy: supabase functions deploy summarize-pending
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `أنت مساعد ذكاء اصطناعي مدمج في منصة "رصد" لمتابعة المشاريع الإنشائية، تخاطب المالك مباشرة.
مهمتك: تحليل البيانات المزوّدة (تحديثات المقاول، زيارات وملاحظات الاستشاري، الملاحظات المفتوحة، الاستشارات) وتلخيص المهام والملاحظات المعلّقة حالياً بدقة ووضوح واختصار.
التزم بالتالي:
- أجب بالعربية الفصحى المبسطة، بأسلوب تنفيذي مباشر (Executive tone)، بدون حشو.
- استند فقط إلى البيانات المزوّدة، ولا تخترع أرقاماً أو تفاصيل غير موجودة.
- رتّب الملخص في نقاط: أولاً الأمور العاجلة، ثم العادية، ثم اذكر مين الطرف المسؤول عن كل بند.
- إن لم توجد أي مهام معلّقة، قل ذلك بوضوح باختصار بدل اختلاق محتوى.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Scoped to the calling user's own JWT, so Row Level Security still
    // applies — this function can only ever see what that user could
    // already see themselves (project members only, per the RLS policies
    // in docs/rasd-supabase-migration.sql).
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const [
      { data: project, error: projectError },
      { data: updates },
      { data: visits },
      { data: notes },
      { data: consultations },
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", project_id).single(),
      supabase
        .from("contractor_updates")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("consultant_visits")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("notes")
        .select("*")
        .eq("project_id", project_id)
        .in("status", ["open", "pending_review", "rejected"])
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("consultations")
        .select("*")
        .eq("project_id", project_id)
        .eq("status", "submitted")
        .order("created_at", { ascending: false }),
    ]);

    if (projectError || !project) {
      // Most likely: this user isn't a member of the project (RLS blocked
      // the row) or the id is wrong.
      return new Response(
        JSON.stringify({ error: "Project not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assigneeLabel = (userId: string) => {
      if (userId === project.contractor_id) return "المقاول";
      if (userId === project.owner_id) return "المالك";
      if (userId === project.consultant_id) return "الاستشاري";
      return "غير معروف";
    };
    const priorityLabel = (p: string) => (p === "urgent" ? "عاجل" : "عادي");
    const statusLabel = (s: string) =>
      s === "open" ? "مفتوحة" : s === "pending_review" ? "بانتظار الاعتماد" : "مرفوضة";

    const context = `
بيانات المشروع:
- الاسم: ${project.name} — ${project.location ?? "—"}
- الحالة: ${project.status}

آخر تحديث من المقاول:
${
  updates?.[0]
    ? `[${updates[0].created_at?.slice(0, 10)}] المرحلة: ${updates[0].phase ?? "—"} | نسبة الإنجاز: ${
        updates[0].completion_pct ?? "—"
      }% | عقبات: ${updates[0].obstacles ?? "لا يوجد"}`
    : "لا يوجد تحديثات بعد."
}

آخر زيارة استشاري:
${
  visits?.[0]
    ? `[${visits[0].visit_date}] نسبة موثّقة: ${visits[0].verified_pct ?? "—"}% | ملاحظات: ${
        visits[0].technical_notes ?? "—"
      }`
    : "لا توجد زيارات بعد."
}

الملاحظات المعلّقة (${notes?.length ?? 0}):
${
  notes && notes.length > 0
    ? notes
        .map(
          (n) =>
            `- [${priorityLabel(n.priority)}] [${statusLabel(n.status)}] موجّهة لـ ${assigneeLabel(
              n.assigned_to
            )}: ${n.note_text}`
        )
        .join("\n")
    : "لا توجد ملاحظات معلّقة."
}

الاستشارات المعلّقة (${consultations?.length ?? 0}):
${
  consultations && consultations.length > 0
    ? consultations
        .map((c) => `- [${priorityLabel(c.priority)}] من ${assigneeLabel(c.raised_by)}: ${c.question_text}`)
        .join("\n")
    : "لا توجد استشارات معلّقة."
}
`.trim();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured: ANTHROPIC_API_KEY not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `${context}\n\nلخّص لي المهام والملاحظات المعلّقة حالياً على هذا المشروع.`,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      return new Response(
        JSON.stringify({ error: `AI provider error (${aiRes.status})`, detail }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const summary = (aiData.content ?? [])
      .map((block: { type: string; text?: string }) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim();

    return new Response(JSON.stringify({ summary: summary || "تعذّر توليد ملخص." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
