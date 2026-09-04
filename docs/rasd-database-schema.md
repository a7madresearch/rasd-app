# منصة رصد — نموذج البيانات (Database Schema)

مبني مباشرة على `rasd-scope-requirements.md`. جاهز للتنفيذ على PostgreSQL (أي قاعدة علائقية تشتغل بنفس المنطق).

---

## 1. `users`
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | uuid PK | |
| name | varchar(120) | |
| email | varchar(160) UNIQUE | |
| password_hash | varchar(255) | |
| role | enum(`owner`, `contractor`, `consultant`) | دور المستخدم على مستوى المنصة |
| phone | varchar(20) | اختياري — لإشعارات مستقبلية |
| created_at | timestamptz | |

## 2. `projects`
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | uuid PK | |
| name | varchar(200) | |
| location | varchar(200) | |
| owner_id | uuid FK → users.id | |
| contractor_id | uuid FK → users.id | |
| consultant_id | uuid FK → users.id | |
| start_date | date | |
| end_date | date | |
| contract_value | numeric(14,2) | |
| status | enum(`active`, `completed`, `on_hold`) | |
| created_at | timestamptz | |

> **ملاحظة توسّع:** لو احتجت لاحقاً أكثر من مستخدم بنفس الدور بمشروع واحد (مثلاً فريق مقاول كامل)، تضيف جدول `project_members (project_id, user_id, role)` بدل هالأعمدة الثلاثة. حالياً خليناها بسيطة حسب النطاق المتفق عليه.

> **تعدّد المشاريع (مهم):** العلاقة بين `users` و`projects` هي "واحد لمتعدد" أصلاً — يعني نفس المستخدم (بأي دور) يقدر يكون طرفاً بعدة صفوف مختلفة بجدول `projects`، كل صف بأطراف مختلفة تماماً. مثال: استشاري واحد بجدول `users` يظهر كـ `consultant_id` في 5 مشاريع، كل مشروع له `owner_id` و`contractor_id` مختلفين. ما يحتاج تعديل بالجدول نفسه — بس يحتاج طبقة تطبيق (Frontend) فيها "قائمة مشاريعي" يختار منها المستخدم قبل ما يدخل لوحة مشروع معيّن، وطبقة صلاحيات (خطوة لاحقة) تتأكد إن المستخدم ما يشوف إلا مشاريعه فقط.

## 3. `contractor_updates`
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK → projects.id | |
| contractor_id | uuid FK → users.id | |
| phase | varchar(150) | المرحلة الحالية للمشروع |
| completion_pct | numeric(5,2) | نسبة الإنجاز المُعلنة من المقاول |
| obstacles | text | العقبات/التأخيرات |
| requirements | text NULL | متطلبات إن وجدت |
| created_at | timestamptz | |

## 4. `consultant_visits`
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK → projects.id | |
| consultant_id | uuid FK → users.id | |
| visit_date | date | |
| verified_pct | numeric(5,2) | نسبة الإنجاز الموثّقة ميدانياً |
| technical_notes | text | ملاحظات الزيارة العامة |
| created_at | timestamptz | |

## 5. `notes` (الملاحظات)
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK → projects.id | |
| visit_id | uuid FK → consultant_visits.id NULL | إن كانت ناتجة من زيارة |
| source_consultation_id | uuid FK → consultations.id NULL | إن كانت ناتجة من استشارة محوّلة |
| created_by | uuid FK → users.id | الاستشاري دائماً |
| assigned_to | uuid FK → users.id | مقاول أو مالك |
| priority | enum(`urgent`, `normal`) | |
| status | enum(`open`, `pending_review`, `closed`, `rejected`) | |
| note_text | text | |
| photo_url | varchar(500) NULL | |
| closed_by | uuid FK → users.id NULL | من نفّذ الإغلاق الأولي (المكلَّف) |
| closed_at | timestamptz NULL | |
| approved_by | uuid FK → users.id NULL | الاستشاري المعتمِد |
| approved_at | timestamptz NULL | |
| rejection_reason | text NULL | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## 6. `consultations` (الاستشارات / RFI)
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK → projects.id | |
| raised_by | uuid FK → users.id | مقاول أو مالك |
| priority | enum(`urgent`, `normal`) | |
| status | enum(`submitted`, `answered`, `converted`) | |
| question_text | text | |
| answer_text | text NULL | |
| answered_by | uuid FK → users.id NULL | |
| converted_note_id | uuid FK → notes.id NULL | لو تحوّلت لملاحظة مُكلَّفة |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## 7. `status_history` (سجل الحالات — جدول تدقيق عام)
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | uuid PK | |
| entity_type | enum(`note`, `consultation`) | |
| entity_id | uuid | مرجع متعدد الأشكال (Polymorphic) لـ notes.id أو consultations.id |
| old_status | varchar(30) | |
| new_status | varchar(30) | |
| changed_by | uuid FK → users.id | |
| comment | text NULL | مثلاً سبب الرفض |
| created_at | timestamptz | |

## 8. `notifications`
| الحقل | النوع | ملاحظات |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users.id | المستقبِل |
| project_id | uuid FK → projects.id | |
| type | enum(`note_assigned`, `note_pending_review`, `note_closed`, `note_rejected`, `consultation_submitted`, `consultation_answered`, `consultation_converted`) | |
| related_entity_type | varchar(30) | `note` أو `consultation` |
| related_entity_id | uuid | |
| message | varchar(300) | |
| is_read | boolean DEFAULT false | |
| created_at | timestamptz | |

---

## فهارس (Indexes) موصى بها
- `projects(owner_id)`, `projects(contractor_id)`, `projects(consultant_id)` — لتحميل "مشاريعي" بسرعة لأي مستخدم (المالك أو الاستشاري أو المقاول قد يكون طرفاً بعدة مشاريع مختلفة، مع أطراف مختلفة بكل مرة)
- `notes(project_id, status)` — لتحميل لوحة المالك بسرعة
- `notes(assigned_to, status)` — لتحميل "مهامي" لكل مستخدم
- `consultations(project_id, status)`
- `notifications(user_id, is_read)`
- `contractor_updates(project_id, created_at DESC)` — لآخر تحديث
- `consultant_visits(project_id, created_at DESC)`

## علاقات مهمة لطبقة الذكاء الاصطناعي (تمهيد للخطوة الأخيرة)
كل الجداول أعلاه مصمّمة بحيث يقدر الذكاء الاصطناعي يبني منها "سياق" كامل بجملة استعلام واحدة لكل مشروع: آخر تحديث مقاول + آخر زيارة استشاري + الملاحظات المفتوحة (بأولويتها) + الاستشارات المعلّقة. هذا هو نفس النمط اللي جربناه بالنموذج الأولي (buildProjectContext) بس الآن مبني على بيانات حقيقية من قاعدة البيانات بدل بيانات وهمية.
