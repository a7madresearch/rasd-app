# مساعد رصد الذكي — دليل التفعيل

الكود جاهز ومدفوع لـ GitHub. الخطوات التالية تفعّله على مشروع Supabase الحقيقي.
نفّذها من نفس الكمبيوتر اللي تشغّل منه التطبيق (عنده إنترنت طبيعي).

---

## 1. ثبّت Supabase CLI

```
npm install -g supabase
```

تأكد من التثبيت:
```
supabase --version
```

## 2. اربط المشروع محلياً

من داخل مجلد المشروع الرئيسي (`rasd-app`, وليس `rasd-app/mobile`):

```
cd C:\Users\ahmad\rasd-app-2
supabase init
```

سيسألك بعض الأسئلة — اضغط Enter لقبول الافتراضي بكل شي (لن يمسح مجلد
`supabase/functions/summarize-pending` الموجود مسبقاً).

سجّل دخولك:
```
supabase login
```
(يفتح متصفح لتأكيد الدخول، نفس طريقة Expo)

اربط المشروع بمشروع Supabase الحقيقي (المرجع `okhficrbcqvamuomazxg` هو الجزء
من رابط مشروعك: `https://okhficrbcqvamuomazxg.supabase.co`):

```
supabase link --project-ref okhficrbcqvamuomazxg
```
سيطلب كلمة مرور قاعدة البيانات (Database Password) — تجدها أو تعيد تعيينها من
Supabase Dashboard → Project Settings → Database.

## 3. خزّن مفتاح Anthropic كسرّ (Secret)

**لا تضعه بملف `.env` ولا بأي كود** — فقط هنا، حتى يبقى على الخادم فقط:

```
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```
(استبدل بمفتاحك الحقيقي من console.anthropic.com)

## 4. انشر الدالة (Deploy)

```
supabase functions deploy summarize-pending
```

لو نجح، راح يطبع رابط الدالة المنشورة.

## 5. جرّبها بالتطبيق

- سجّل دخولك كمالك (owner) بأي مشروع فيه بيانات (ملاحظات مفتوحة، استشارات، إلخ)
- بأعلى لوحة المالك راح تلقى بطاقة "مساعد رصد الذكي"
- اضغط "لخّص المهام المعلقة"

إذا ظهر خطأ، انسخه لي وبساعدك تحلّه — الأخطاء الشائعة:
- **"Server misconfigured: ANTHROPIC_API_KEY not set"** → الخطوة 3 ما اكتملت، أعد المحاولة.
- **"AI provider error (401)"** → المفتاح غير صحيح أو منتهي — تأكد من نسخه كامل من console.anthropic.com.
- **"Project not found or access denied"** → المستخدم المسجّل دخوله مو طرف بهذا المشروع.

## كيف تشتغل تقنياً (باختصار)

الدالة (`supabase/functions/summarize-pending/index.ts`) تشتغل على خادم
Supabase، تقرأ بيانات المشروع (آخر تحديث مقاول، آخر زيارة استشاري، الملاحظات
والاستشارات المعلّقة) باستخدام نفس صلاحيات المستخدم المسجّل دخوله (فتُطبَّق
قواعد RLS تلقائياً)، تبني منها سياق نصي، وترسله لـ Claude مع طلب التلخيص.
مفتاح Anthropic يبقى على الخادم فقط — التطبيق على الجوال لا يشوفه أبداً.
