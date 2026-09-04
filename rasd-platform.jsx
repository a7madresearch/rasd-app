import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Building2,
  HardHat,
  Eye,
  AlertTriangle,
  TrendingUp,
  Camera,
  Send,
  Loader2,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  ChevronDown,
  Plus,
  X,
  FileText,
  Ruler,
  Image as ImageIcon,
  UserCheck,
  Lock,
  Unlock,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */
function useFonts() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);
}

/* ------------------------------------------------------------------ */
/* Design tokens                                                       */
/* ------------------------------------------------------------------ */
const T = {
  paper: "#ECE8DD",
  paperDeep: "#E2DDCF",
  ink: "#211F1B",
  inkSoft: "#5A564C",
  navy: "#16324F",
  navySoft: "#2C4B6E",
  line: "#C8C1AE",
  orange: "#D6540A",
  amber: "#B9840F",
  green: "#2E6B52",
  white: "#FBFAF6",
};

/* ------------------------------------------------------------------ */
/* Sample seed data — يمثل حالة مشروع حقيقية                          */
/* ------------------------------------------------------------------ */
const seedProject = {
  name: "برج الواحة السكني",
  location: "أبوظبي — جزيرة الريم",
  owner: "شركة الواحة العقارية",
  contractor: "شركة البنّاء المتقدم للمقاولات",
  consultant: "مكتب الهندسة الاستشارية الحديثة",
  start: "2026-01-15",
  end: "2026-12-20",
  contractValue: "48,500,000 د.إ",
};

const seedCurve = [
  { week: "أسبوع 4", planned: 8, actual: 7 },
  { week: "أسبوع 8", planned: 18, actual: 15 },
  { week: "أسبوع 12", planned: 30, actual: 24 },
  { week: "أسبوع 16", planned: 42, actual: 33 },
  { week: "أسبوع 20", planned: 55, actual: 41 },
  { week: "أسبوع 24", planned: 66, actual: 47 },
];

const seedContractorUpdates = [
  {
    id: 1,
    date: "2026-08-10",
    completed: "صب سقف الطابق السادس، تركيب أعمدة الطابق السابع، إنهاء أعمال العزل المائي للبدروم.",
    inProgress: "أعمال التمديدات الكهربائية للطوابق 3-5، تركيب واجهات الزجاج الستائري للواجهة الشمالية.",
    challenges: "تأخر توريد ألواح الواجهة الزجاجية من المورد بسبب إجراءات الجمارك — تأخير متوقع 12 يوم.",
    photos: ["site_north_facade.jpg", "level6_pour.jpg"],
  },
  {
    id: 2,
    date: "2026-08-03",
    completed: "صب سقف الطابق الخامس، تركيب الدرج الرئيسي حتى الطابق الرابع.",
    inProgress: "أعمال التسليح لسقف الطابق السادس.",
    challenges: "نقص مؤقت في عمالة اللحام أثّر على جدول أعمال الحديد.",
    photos: ["rebar_level6.jpg"],
  },
];

const seedVisits = [
  {
    id: 1,
    date: "2026-08-12",
    verifiedPct: 44,
    notes:
      "تم التحقق ميدانياً من نسبة الإنجاز المعلنة من المقاول. لوحظ فارق 3% عن التقرير بسبب عدم احتساب أعمال العزل المكتملة جزئياً.",
    actions: [
      { id: 1, text: "تزويد الاستشاري بتقرير مخبري لجودة الخرسانة — سقف الطابق 6", status: "open" },
      { id: 2, text: "تعديل جدول توريد الواجهات الزجاجية وتقديم خطة تعويض", status: "open" },
      { id: 3, text: "اعتماد عينة التشطيب الخارجي المعدّلة", status: "closed" },
    ],
  },
  {
    id: 2,
    date: "2026-08-05",
    verifiedPct: 40,
    notes: "الأعمال الإنشائية للهيكل ضمن المعدل المقبول. جودة التنفيذ جيدة بشكل عام.",
    actions: [
      { id: 4, text: "توفير عمالة لحام إضافية خلال أسبوعين", status: "closed" },
    ],
  },
];

const seedRisks = [
  {
    id: 1,
    severity: "critical",
    title: "تأخر توريد الواجهات الزجاجية",
    detail: "تأثير متوقع 12+ يوم على المسار الحرج لأعمال الواجهات، قد يمتد لتأخير التسليم النهائي.",
    date: "2026-08-10",
  },
  {
    id: 2,
    severity: "warning",
    title: "فجوة 6% بين الإنجاز المخطط والفعلي",
    detail: "الفجوة تتسع تدريجياً منذ الأسبوع 12، السبب الرئيسي نقص العمالة المتخصصة.",
    date: "2026-08-12",
  },
  {
    id: 3,
    severity: "warning",
    title: "ملاحظة جودة غير مغلقة",
    detail: "تقرير مخبري لجودة خرسانة سقف الطابق 6 لم يُسلّم بعد رغم مرور 3 أيام على الطلب.",
    date: "2026-08-12",
  },
];

const RESPONSIBLE_PARTIES = ["المقاول", "الاستشاري", "المالك"];

const seedSiteNotes = [
  {
    id: 1,
    date: "2026-08-11",
    photo: "crack_column_L5_B12.jpg",
    note: "شرخ سطحي في عمود الطابق الخامس (محور B-12) — يحتاج فحص هندسي قبل صب السقف التالي.",
    responsible: "الاستشاري",
    status: "open",
  },
  {
    id: 2,
    date: "2026-08-09",
    photo: "waterproofing_basement.jpg",
    note: "اكتمال أعمال العزل المائي للبدروم — بانتظار اعتماد الاستشاري قبل الردم.",
    responsible: "الاستشاري",
    status: "closed",
  },
  {
    id: 3,
    date: "2026-08-08",
    photo: "scaffolding_north.jpg",
    note: "السقالات على الواجهة الشمالية غير مثبتة بالمعيار المطلوب — إجراء تصحيحي فوري.",
    responsible: "المقاول",
    status: "closed",
  },
];

/* ------------------------------------------------------------------ */
/* Claude API helper                                                   */
/* ------------------------------------------------------------------ */
async function askClaude(systemPrompt, userPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) throw new Error("API error " + res.status);
  const data = await res.json();
  const text = (data.content || [])
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n")
    .trim();
  return text || "تعذّر توليد رد.";
}

function buildProjectContext(state) {
  return `
بيانات المشروع:
- الاسم: ${state.project.name} — ${state.project.location}
- المالك: ${state.project.owner} | المقاول: ${state.project.contractor} | الاستشاري: ${state.project.consultant}
- تاريخ البدء: ${state.project.start} | التسليم المخطط: ${state.project.end}
- قيمة العقد: ${state.project.contractValue}

منحنى الإنجاز (مخطط مقابل فعلي، آخر الأسابيع):
${state.curve.map((c) => `${c.week}: مخطط ${c.planned}% — فعلي ${c.actual}%`).join("\n")}

آخر تحديثات المقاول:
${state.contractorUpdates
  .map(
    (u) =>
      `[${u.date}] منفّذ: ${u.completed} | جارٍ: ${u.inProgress} | تحديات: ${u.challenges}`
  )
  .join("\n")}

آخر زيارات الاستشاري:
${state.visits
  .map(
    (v) =>
      `[${v.date}] نسبة إنجاز موثّقة: ${v.verifiedPct}% | ملاحظات: ${v.notes} | إجراءات مطلوبة: ${v.actions
        .filter((a) => a.status === "open")
        .map((a) => a.text)
        .join("، ") || "لا يوجد"}`
  )
  .join("\n")}

المخاطر والمشاكل الحرجة الحالية:
${state.risks.map((r) => `[${r.severity === "critical" ? "حرج" : "تحذير"}] ${r.title}: ${r.detail}`).join("\n")}

ملاحظات الموقع المصوّرة (من المقاول):
${state.siteNotes
  .map(
    (n) =>
      `[${n.date}] ${n.status === "open" ? "مفتوحة" : "مغلقة"} — المسؤول عن الإغلاق: ${n.responsible} — ${n.note} (صورة: ${n.photo})`
  )
  .join("\n")}
`.trim();
}

const SYSTEM_PROMPT = `أنت مساعد ذكاء اصطناعي مدمج في منصة "رصد" لمتابعة المشاريع الإنشائية، تخاطب المالك مباشرة.
مهمتك: تحليل بيانات المشروع (تحديثات المقاول، زيارات وملاحظات الاستشاري، منحنى الإنجاز، المخاطر) والإجابة بدقة ووضوح واختصار.
التزم بالتالي:
- أجب بالعربية الفصحى المبسطة، بأسلوب تنفيذي مباشر (Executive tone)، بدون حشو.
- استند فقط إلى البيانات المزوّدة، ولا تخترع أرقاماً أو تفاصيل غير موجودة.
- عند الحديث عن التأخير أو المخاطر، اذكر السبب الجذري إن وجد في البيانات، ثم الأثر المتوقع.
- استخدم نقاط مختصرة عند الحاجة بدل الفقرات الطويلة.
- إن طُلب منك "ملخص تنفيذي"، رتّبه في: الحالة العامة، الإنجاز، أهم المخاطر، القرارات المطلوبة من المالك.`;

/* ------------------------------------------------------------------ */
/* Small UI atoms                                                      */
/* ------------------------------------------------------------------ */

function BlueprintGrid() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        backgroundImage: `linear-gradient(${T.navy}14 1px, transparent 1px), linear-gradient(90deg, ${T.navy}14 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
        opacity: 0.5,
        zIndex: 0,
      }}
    />
  );
}

function CornerTicks() {
  const tick = (style) => (
    <div
      style={{
        position: "fixed",
        width: 18,
        height: 18,
        borderColor: T.navy,
        opacity: 0.35,
        zIndex: 1,
        ...style,
      }}
    />
  );
  return (
    <>
      {tick({ top: 14, left: 14, borderTop: "2px solid", borderLeft: "2px solid" })}
      {tick({ top: 14, right: 14, borderTop: "2px solid", borderRight: "2px solid" })}
      {tick({ bottom: 14, left: 14, borderBottom: "2px solid", borderLeft: "2px solid" })}
      {tick({ bottom: 14, right: 14, borderBottom: "2px solid", borderRight: "2px solid" })}
    </>
  );
}

function RulerBar({ planned, actual, height = 34 }) {
  // measuring-tape style progress: ticks every 10%, planned marker + actual fill
  const ticks = Array.from({ length: 11 }, (_, i) => i * 10);
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          position: "relative",
          height,
          background: T.white,
          border: `1.5px solid ${T.navy}`,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${actual}%`,
            background: `repeating-linear-gradient(135deg, ${T.navy}, ${T.navy} 6px, ${T.navySoft} 6px, ${T.navySoft} 12px)`,
            transition: "width 0.6s ease",
          }}
        />
        {ticks.map((t) => (
          <div
            key={t}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              right: `${t}%`,
              width: 1,
              background: t % 20 === 0 ? T.ink + "55" : T.ink + "25",
            }}
          />
        ))}
        <div
          title={`مخطط: ${planned}%`}
          style={{
            position: "absolute",
            top: -2,
            bottom: -2,
            right: `${planned}%`,
            width: 2,
            background: T.orange,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingInline: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 700,
            fontSize: 13,
            color: actual > 15 ? T.white : T.ink,
            mixBlendMode: actual > 15 ? "normal" : "normal",
          }}
        >
          {actual}%
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10.5,
          color: T.inkSoft,
          marginTop: 4,
        }}
      >
        <span>0%</span>
        <span style={{ color: T.orange, fontWeight: 700 }}>▲ مخطط {planned}%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function SeverityTag({ severity }) {
  const map = {
    critical: { color: T.white, bg: T.orange, label: "حرج" },
    warning: { color: T.ink, bg: "#E8C767", label: "تحذير" },
  };
  const s = map[severity] || map.warning;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 3,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: 0.3,
      }}
    >
      {s.label}
    </span>
  );
}

function SheetTab({ active, onClick, icon: Icon, label, code }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 18px",
        background: active ? T.navy : "transparent",
        color: active ? T.white : T.ink,
        border: `1.5px solid ${T.navy}`,
        borderBottom: active ? `1.5px solid ${T.navy}` : "none",
        borderRadius: "6px 6px 0 0",
        cursor: "pointer",
        fontFamily: "'Tajawal', sans-serif",
        fontWeight: 700,
        fontSize: 14.5,
        position: "relative",
        top: active ? 1 : 0,
        transition: "all 0.15s ease",
      }}
    >
      <Icon size={16} />
      {label}
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          opacity: 0.65,
          fontWeight: 500,
        }}
      >
        {code}
      </span>
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: T.white,
        border: `1.5px solid ${T.line}`,
        borderRadius: 8,
        padding: 20,
        boxShadow: "3px 3px 0 " + T.navy + "0d",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children, icon: Icon }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: 0.5,
        color: T.navySoft,
        textTransform: "uppercase",
        marginBottom: 12,
        borderBottom: `1px dashed ${T.line}`,
        paddingBottom: 8,
      }}
    >
      {Icon && <Icon size={14} />}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Title block — signature element, fixed bottom-left like real DWG    */
/* ------------------------------------------------------------------ */
function TitleBlock({ project, role }) {
  const roleAr = { owner: "المالك", contractor: "المقاول", consultant: "الاستشاري" };
  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        insetInlineStart: 16,
        zIndex: 5,
        background: T.white,
        border: `1.5px solid ${T.navy}`,
        borderRadius: 4,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: T.ink,
        width: 220,
        boxShadow: "3px 3px 0 " + T.navy + "22",
        display: "none",
      }}
      className="title-block-desktop"
    >
      <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.line}`, fontWeight: 700, fontSize: 11 }}>
        {project.name}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div style={{ padding: "6px 10px", borderInlineEnd: `1px solid ${T.line}`, borderTop: `1px solid ${T.line}` }}>
          <div style={{ opacity: 0.6 }}>عارض كـ</div>
          <div style={{ fontWeight: 700 }}>{roleAr[role]}</div>
        </div>
        <div style={{ padding: "6px 10px", borderTop: `1px solid ${T.line}` }}>
          <div style={{ opacity: 0.6 }}>التاريخ</div>
          <div style={{ fontWeight: 700 }}>2026-08-17</div>
        </div>
      </div>
      <div style={{ padding: "6px 10px", borderTop: `1px solid ${T.line}`, opacity: 0.6 }}>
        منصة رصد — نسخة تجريبية
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Contractor view                                                     */
/* ------------------------------------------------------------------ */
function ContractorView({ state, setState }) {
  const [form, setForm] = useState({ completed: "", inProgress: "", challenges: "" });
  const [photos, setPhotos] = useState([]);

  const submit = () => {
    if (!form.completed.trim()) return;
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      completed: form.completed,
      inProgress: form.inProgress,
      challenges: form.challenges,
      photos,
    };
    setState((s) => ({ ...s, contractorUpdates: [entry, ...s.contractorUpdates] }));
    setForm({ completed: "", inProgress: "", challenges: "" });
    setPhotos([]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20 }} className="responsive-grid">
      <Card>
        <SectionLabel icon={Plus}>تحديث حالة المشروع</SectionLabel>
        <label style={labelStyle}>الأعمال المنفّذة</label>
        <textarea
          style={inputStyle}
          rows={2}
          placeholder="مثال: صب سقف الطابق السابع، إنهاء العزل المائي..."
          value={form.completed}
          onChange={(e) => setForm({ ...form, completed: e.target.value })}
        />
        <label style={labelStyle}>الأعمال الجارية</label>
        <textarea
          style={inputStyle}
          rows={2}
          placeholder="مثال: التمديدات الكهربائية للطوابق 3-5..."
          value={form.inProgress}
          onChange={(e) => setForm({ ...form, inProgress: e.target.value })}
        />
        <label style={labelStyle}>التحديات والتأخيرات</label>
        <textarea
          style={inputStyle}
          rows={2}
          placeholder="مثال: تأخر توريد مواد، نقص عمالة..."
          value={form.challenges}
          onChange={(e) => setForm({ ...form, challenges: e.target.value })}
        />
        <label style={labelStyle}>صور الموقع</label>
        <div
          onClick={() =>
            setPhotos((p) => [...p, `site_photo_${p.length + 1}.jpg`])
          }
          style={{
            border: `1.5px dashed ${T.line}`,
            borderRadius: 6,
            padding: "14px 10px",
            textAlign: "center",
            cursor: "pointer",
            color: T.inkSoft,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Camera size={16} /> إضافة صورة (تجريبي)
        </div>
        {photos.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {photos.map((p, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10.5,
                  background: T.paperDeep,
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                📷 {p}
              </span>
            ))}
          </div>
        )}
        <button onClick={submit} style={primaryBtn}>
          نشر التحديث
        </button>
      </Card>

      <Card>
        <SectionLabel icon={HardHat}>سجل التحديثات</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 480, overflowY: "auto" }}>
          {state.contractorUpdates.map((u) => (
            <div key={u.id} style={{ borderInlineStart: `3px solid ${T.navy}`, paddingInlineStart: 12 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.navySoft, fontWeight: 700 }}>
                {u.date}
              </div>
              <div style={{ fontSize: 13.5, marginTop: 4 }}>
                <b>منفّذ:</b> {u.completed}
              </div>
              {u.inProgress && (
                <div style={{ fontSize: 13.5, marginTop: 2 }}>
                  <b>جارٍ:</b> {u.inProgress}
                </div>
              )}
              {u.challenges && (
                <div style={{ fontSize: 13.5, marginTop: 2, color: T.orange }}>
                  <b>تحدٍ:</b> {u.challenges}
                </div>
              )}
              {u.photos.length > 0 && (
                <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 4 }}>
                  📎 {u.photos.join("، ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>

    <SiteNotesSection state={state} setState={setState} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Site notes — التقاط صور + ملاحظات + مسؤول الإغلاق + حالة الإغلاق    */
/* ------------------------------------------------------------------ */
function SiteNotesSection({ state, setState }) {
  const [note, setNote] = useState("");
  const [responsible, setResponsible] = useState(RESPONSIBLE_PARTIES[0]);
  const [photo, setPhoto] = useState(null);

  const capturePhoto = () => {
    // في بيئة إنتاجية: يفتح كاميرا الجهاز أو رافع ملفات فعلي
    setPhoto(`site_note_${Date.now()}.jpg`);
  };

  const submit = () => {
    if (!note.trim() || !photo) return;
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      photo,
      note,
      responsible,
      status: "open",
    };
    setState((s) => ({ ...s, siteNotes: [entry, ...s.siteNotes] }));
    setNote("");
    setPhoto(null);
    setResponsible(RESPONSIBLE_PARTIES[0]);
  };

  const toggleStatus = (id) => {
    setState((s) => ({
      ...s,
      siteNotes: s.siteNotes.map((n) =>
        n.id === id ? { ...n, status: n.status === "open" ? "closed" : "open" } : n
      ),
    }));
  };

  const openCount = state.siteNotes.filter((n) => n.status === "open").length;

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <SectionLabel icon={ImageIcon}>ملاحظات الموقع المصوّرة</SectionLabel>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            color: openCount > 0 ? T.orange : T.green,
            marginBottom: 12,
          }}
        >
          {openCount} ملاحظة مفتوحة
        </span>
      </div>

      {/* form to add a new note */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto",
          gap: 10,
          alignItems: "start",
          marginBottom: 18,
        }}
        className="site-note-form"
      >
        <div
          onClick={capturePhoto}
          title="التقاط صورة"
          style={{
            width: 74,
            height: 62,
            border: `1.5px dashed ${photo ? T.green : T.line}`,
            borderRadius: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: photo ? T.green : T.inkSoft,
            fontSize: 10,
            gap: 3,
            background: T.paper,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <Camera size={17} />
          {photo ? "تم الالتقاط" : "التقاط صورة"}
        </div>

        <textarea
          style={{ ...inputStyle, marginTop: 0 }}
          rows={2}
          placeholder="اكتب ملاحظة مرتبطة بالصورة (مثال: شرخ في العمود، عيب تشطيب...)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div>
          <label style={{ ...labelStyle, marginTop: 0 }}>المسؤول عن الإغلاق</label>
          <select
            value={responsible}
            onChange={(e) => setResponsible(e.target.value)}
            style={{ ...inputStyle, marginTop: 0, cursor: "pointer" }}
          >
            {RESPONSIBLE_PARTIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={submit}
          disabled={!note.trim() || !photo}
          style={{
            ...primaryBtn,
            width: "auto",
            marginTop: 20,
            padding: "0 16px",
            height: 40,
            opacity: !note.trim() || !photo ? 0.5 : 1,
            cursor: !note.trim() || !photo ? "not-allowed" : "pointer",
          }}
        >
          حفظ
        </button>
      </div>

      {photo && (
        <div style={{ fontSize: 11, color: T.inkSoft, marginTop: -10, marginBottom: 14, fontFamily: "'JetBrains Mono', monospace" }}>
          📷 {photo}
        </div>
      )}

      {/* list of notes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {state.siteNotes.map((n) => (
          <div
            key={n.id}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: 12,
              background: T.paper,
              borderRadius: 8,
              border: `1px solid ${T.line}`,
            }}
          >
            <div
              style={{
                width: 52,
                height: 44,
                background: T.paperDeep,
                borderRadius: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: T.inkSoft,
                flexShrink: 0,
              }}
            >
              <ImageIcon size={18} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5 }}>{n.note}</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 5,
                  fontSize: 11,
                  color: T.inkSoft,
                  fontFamily: "'JetBrains Mono', monospace",
                  flexWrap: "wrap",
                }}
              >
                <span>{n.date}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <UserCheck size={12} /> مسؤول الإغلاق: {n.responsible}
                </span>
                <span title={n.photo} style={{ opacity: 0.75 }}>
                  📎 {n.photo}
                </span>
              </div>
            </div>

            <button
              onClick={() => toggleStatus(n.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "none",
                borderRadius: 20,
                padding: "6px 12px",
                fontSize: 11.5,
                fontWeight: 700,
                fontFamily: "'Tajawal', sans-serif",
                cursor: "pointer",
                flexShrink: 0,
                color: n.status === "open" ? T.white : T.white,
                background: n.status === "open" ? T.orange : T.green,
              }}
            >
              {n.status === "open" ? <Unlock size={13} /> : <Lock size={13} />}
              {n.status === "open" ? "مفتوحة" : "مغلقة"}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Consultant view                                                     */
/* ------------------------------------------------------------------ */
function ConsultantView({ state, setState }) {
  const [form, setForm] = useState({ verifiedPct: "", notes: "", action: "" });

  const submit = () => {
    if (!form.notes.trim()) return;
    const entry = {
      id: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      verifiedPct: Number(form.verifiedPct) || 0,
      notes: form.notes,
      actions: form.action ? [{ id: Date.now() + 1, text: form.action, status: "open" }] : [],
    };
    setState((s) => ({ ...s, visits: [entry, ...s.visits] }));
    setForm({ verifiedPct: "", notes: "", action: "" });
  };

  const toggleAction = (visitId, actionId) => {
    setState((s) => ({
      ...s,
      visits: s.visits.map((v) =>
        v.id !== visitId
          ? v
          : {
              ...v,
              actions: v.actions.map((a) =>
                a.id === actionId ? { ...a, status: a.status === "open" ? "closed" : "open" } : a
              ),
            }
      ),
    }));
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20 }} className="responsive-grid">
      <Card>
        <SectionLabel icon={Plus}>توثيق زيارة ميدانية</SectionLabel>
        <label style={labelStyle}>نسبة الإنجاز الموثّقة (%)</label>
        <input
          type="number"
          style={inputStyle}
          placeholder="44"
          value={form.verifiedPct}
          onChange={(e) => setForm({ ...form, verifiedPct: e.target.value })}
        />
        <label style={labelStyle}>الملاحظات الفنية</label>
        <textarea
          style={inputStyle}
          rows={3}
          placeholder="مثال: تم التحقق من نسبة الإنجاز، لوحظ..."
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <label style={labelStyle}>إجراء مطلوب (اختياري)</label>
        <input
          style={inputStyle}
          placeholder="مثال: تزويد تقرير جودة الخرسانة"
          value={form.action}
          onChange={(e) => setForm({ ...form, action: e.target.value })}
        />
        <button onClick={submit} style={primaryBtn}>
          حفظ الزيارة
        </button>
      </Card>

      <Card>
        <SectionLabel icon={Eye}>سجل الزيارات والإجراءات</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: 480, overflowY: "auto" }}>
          {state.visits.map((v) => (
            <div key={v.id} style={{ borderInlineStart: `3px solid ${T.green}`, paddingInlineStart: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: T.navySoft, fontWeight: 700 }}>
                  {v.date}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700 }}>
                  {v.verifiedPct}% موثّق
                </span>
              </div>
              <div style={{ fontSize: 13.5, marginTop: 4 }}>{v.notes}</div>
              {v.actions.map((a) => (
                <div
                  key={a.id}
                  onClick={() => toggleAction(v.id, a.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 12.5,
                    marginTop: 6,
                    cursor: "pointer",
                    color: a.status === "closed" ? T.inkSoft : T.ink,
                    textDecoration: a.status === "closed" ? "line-through" : "none",
                  }}
                >
                  {a.status === "closed" ? (
                    <CheckCircle2 size={14} color={T.green} />
                  ) : (
                    <Circle size={14} color={T.orange} />
                  )}
                  {a.text}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Owner dashboard + AI                                                */
/* ------------------------------------------------------------------ */
function OwnerDashboard({ state }) {
  const latestActual = state.curve[state.curve.length - 1].actual;
  const latestPlanned = state.curve[state.curve.length - 1].planned;
  const gap = latestPlanned - latestActual;
  const openNotes = state.siteNotes.filter((n) => n.status === "open").length;

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "مرحباً، أنا مساعد رصد الذكي. اسألني عن حالة المشروع، أسباب التأخير، أو اطلب مني ملخصاً تنفيذياً.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text) => {
      const q = (text ?? input).trim();
      if (!q || loading) return;
      setMessages((m) => [...m, { role: "user", text: q }]);
      setInput("");
      setLoading(true);
      try {
        const context = buildProjectContext(state);
        const reply = await askClaude(SYSTEM_PROMPT, `${context}\n\nسؤال المالك: ${q}`);
        setMessages((m) => [...m, { role: "assistant", text: reply }]);
      } catch (e) {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: "تعذّر الاتصال بالمساعد الذكي حالياً. حاول مرة أخرى." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, state]
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }} className="responsive-grid">
      {/* left column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          <StatCard label="الإنجاز الفعلي" value={`${latestActual}%`} color={T.navy} />
          <StatCard label="الإنجاز المخطط" value={`${latestPlanned}%`} color={T.orange} />
          <StatCard label="الفجوة" value={`${gap}%`} color={gap >= 5 ? T.orange : T.green} />
        </div>

        <Card>
          <SectionLabel icon={Ruler}>مقياس الإنجاز الحالي</SectionLabel>
          <RulerBar planned={latestPlanned} actual={latestActual} />
        </Card>

        <Card>
          <SectionLabel icon={TrendingUp}>منحنى الإنجاز — مخطط مقابل فعلي</SectionLabel>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={state.curve} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke={T.line} strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fontFamily: "Tajawal" }} stroke={T.inkSoft} />
                <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono" }} stroke={T.inkSoft} unit="%" />
                <Tooltip
                  contentStyle={{ fontFamily: "Tajawal", borderRadius: 6, border: `1px solid ${T.line}` }}
                />
                <Legend wrapperStyle={{ fontFamily: "Tajawal", fontSize: 12.5 }} />
                <Line type="monotone" dataKey="planned" name="مخطط" stroke={T.orange} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="actual" name="فعلي" stroke={T.navy} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionLabel icon={AlertTriangle}>المخاطر والمشاكل الحرجة</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {state.risks.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: 10,
                  background: T.paper,
                  borderRadius: 6,
                }}
              >
                <SeverityTag severity={r.severity} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.title}</div>
                  <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{r.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <SectionLabel icon={ImageIcon}>ملاحظات الموقع المصوّرة</SectionLabel>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                color: openNotes > 0 ? T.orange : T.green,
                marginBottom: 12,
              }}
            >
              {openNotes} مفتوحة من {state.siteNotes.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {state.siteNotes.map((n) => (
              <div
                key={n.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 12.5,
                  padding: "6px 0",
                  borderBottom: `1px dashed ${T.line}`,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: n.status === "open" ? T.orange : T.green,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1 }}>{n.note}</span>
                <span style={{ color: T.inkSoft, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, whiteSpace: "nowrap" }}>
                  {n.responsible}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* right column: AI panel */}
      <Card style={{ display: "flex", flexDirection: "column", height: "fit-content", position: "sticky", top: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
            paddingBottom: 10,
            borderBottom: `1px dashed ${T.line}`,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: T.navy,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={14} color={T.white} />
          </div>
          <div style={{ fontFamily: "'Tajawal', sans-serif", fontWeight: 700, fontSize: 14.5 }}>
            مساعد رصد الذكي
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {["لخّص لي حالة المشروع", "ليش المشروع متأخر؟", "ما أهم المخاطر الحالية؟"].map((q) => (
            <button key={q} onClick={() => send(q)} style={chipBtn}>
              {q}
            </button>
          ))}
        </div>

        <div
          ref={scrollRef}
          style={{
            flex: 1,
            minHeight: 260,
            maxHeight: 340,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 4,
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "88%",
                background: m.role === "user" ? T.navy : T.paper,
                color: m.role === "user" ? T.white : T.ink,
                padding: "9px 12px",
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", color: T.inkSoft, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
              <Loader2 size={14} className="spin" /> يحلّل البيانات...
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
            placeholder="اسأل عن حالة المشروع..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={() => send()} disabled={loading} style={{ ...primaryBtn, width: "auto", marginTop: 0, padding: "0 14px" }}>
            <Send size={16} />
          </button>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <Card style={{ padding: 14, textAlign: "center" }}>
      <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'Tajawal', sans-serif" }}>{label}</div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          fontSize: 26,
          color,
          marginTop: 4,
        }}
      >
        {value}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Shared styles                                                       */
/* ------------------------------------------------------------------ */
const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: T.navySoft,
  marginBottom: 5,
  marginTop: 10,
  fontFamily: "'Tajawal', sans-serif",
};

const inputStyle = {
  width: "100%",
  border: `1.5px solid ${T.line}`,
  borderRadius: 6,
  padding: "9px 11px",
  fontFamily: "'Tajawal', sans-serif",
  fontSize: 13.5,
  color: T.ink,
  background: T.white,
  outline: "none",
  boxSizing: "border-box",
  resize: "vertical",
};

const primaryBtn = {
  width: "100%",
  marginTop: 14,
  background: T.navy,
  color: T.white,
  border: "none",
  borderRadius: 6,
  padding: "11px 0",
  fontFamily: "'Tajawal', sans-serif",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const chipBtn = {
  border: `1.3px solid ${T.line}`,
  background: T.white,
  borderRadius: 20,
  padding: "5px 11px",
  fontSize: 11.5,
  fontFamily: "'Tajawal', sans-serif",
  cursor: "pointer",
  color: T.navySoft,
  fontWeight: 500,
};

/* ------------------------------------------------------------------ */
/* App                                                                  */
/* ------------------------------------------------------------------ */
export default function RasdPlatform() {
  useFonts();
  const [role, setRole] = useState("owner");
  const [state, setState] = useState({
    project: seedProject,
    curve: seedCurve,
    contractorUpdates: seedContractorUpdates,
    visits: seedVisits,
    risks: seedRisks,
    siteNotes: seedSiteNotes,
  });

  return (
    <div
      dir="rtl"
      lang="ar"
      style={{
        minHeight: "100vh",
        background: T.paper,
        fontFamily: "'Tajawal', sans-serif",
        color: T.ink,
        position: "relative",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${T.line}; border-radius: 4px; }
        input:focus, textarea:focus { border-color: ${T.navy} !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 900px) { .title-block-desktop { display: block !important; } }
        @media (max-width: 800px) { .responsive-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 700px) { .site-note-form { grid-template-columns: 1fr !important; } .site-note-form > div:first-child { width: 100%; height: 54px; flex-direction: row; } }
        button { font-family: inherit; }
      `}</style>

      <BlueprintGrid />
      <CornerTicks />
      <TitleBlock project={state.project} role={role} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1180, margin: "0 auto", padding: "28px 24px 80px" }}>
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: T.navy,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Building2 size={22} color={T.white} />
            </div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: 0.5 }}>
                رصد
              </div>
              <div style={{ fontSize: 11.5, color: T.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
                منصة متابعة المشاريع الإنشائية
              </div>
            </div>
          </div>
          <div style={{ textAlign: "start", fontSize: 12.5, color: T.inkSoft, fontFamily: "'JetBrains Mono', monospace" }}>
            <div>{state.project.name} · {state.project.location}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
              <Calendar size={12} /> {state.project.start} → {state.project.end}
            </div>
          </div>
        </div>

        {/* role tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: `1.5px solid ${T.navy}` }}>
          <SheetTab active={role === "owner"} onClick={() => setRole("owner")} icon={Eye} label="المالك" code="O-01" />
          <SheetTab active={role === "contractor"} onClick={() => setRole("contractor")} icon={HardHat} label="المقاول" code="C-01" />
          <SheetTab active={role === "consultant"} onClick={() => setRole("consultant")} icon={FileText} label="الاستشاري" code="S-01" />
        </div>

        <div style={{ paddingTop: 24 }}>
          {role === "owner" && <OwnerDashboard state={state} />}
          {role === "contractor" && <ContractorView state={state} setState={setState} />}
          {role === "consultant" && <ConsultantView state={state} setState={setState} />}
        </div>
      </div>
    </div>
  );
}
