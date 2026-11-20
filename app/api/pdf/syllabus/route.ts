import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    const supabase = createAdminSupabaseClient();

    // 1. Fetch Course details
    let courseQuery = supabase.from("courses").select("*");
    if (courseId) {
      courseQuery = courseQuery.eq("id", courseId);
    } else {
      courseQuery = courseQuery.order("created_at", { ascending: false }).limit(1);
    }

    const { data: courses, error: courseError } = await courseQuery;
    const course = courses && courses.length > 0 ? courses[0] : null;

    if (!course || courseError) {
      return new Response(
        `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>Course Not Found</h2>
          <p>The requested course syllabus could not be located.</p>
        </body></html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 404 }
      );
    }

    // 2. Fetch Modules, Chapters, and Lessons
    const [modulesRes, chaptersRes] = await Promise.all([
      supabase
        .from("lms_modules")
        .select(`id, title, subtitle, order_index, lessons (*)`)
        .eq("course_id", course.id)
        .order("order_index"),
      supabase
        .from("lms_chapters")
        .select("*")
        .order("order_index")
    ]);

    const rawModules = modulesRes.data || [];
    const allChapters = chaptersRes.data || [];

    // Group chapters by module
    const chaptersByModule: Record<string, any[]> = {};
    for (const chap of allChapters) {
      if (chap.module_id) {
        if (!chaptersByModule[chap.module_id]) {
          chaptersByModule[chap.module_id] = [];
        }
        chaptersByModule[chap.module_id].push(chap);
      }
    }

    // Structure modules with chapters and lessons
    let totalLessonsCount = 0;
    const structuredModules = rawModules.map((mod: any, mIdx: number) => {
      const modChapters = (chaptersByModule[mod.id] || []).sort(
        (a, b) => (a.order_index || 0) - (b.order_index || 0)
      );

      const allModLessons = (mod.lessons || []).sort(
        (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
      );

      totalLessonsCount += allModLessons.length;

      const chaptersWithLessons = modChapters.map((chap: any, cIdx: number) => {
        const chapLessons = allModLessons.filter((l: any) => l.chapter_id === chap.id);
        return {
          ...chap,
          indexStr: `${mIdx + 1}.${cIdx + 1}`,
          lessons: chapLessons
        };
      });

      const uncategorizedLessons = allModLessons.filter((l: any) => !l.chapter_id);

      return {
        ...mod,
        indexStr: `Module ${mIdx + 1}`,
        chapters: chaptersWithLessons,
        uncategorizedLessons,
        totalLessons: allModLessons.length
      };
    });

    const currentDateStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    // 3. Render HTML Printable Page
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Syllabus - ${course.title} | Vision IT Institute</title>
  <style>
    :root {
      --primary: #1e40af;
      --primary-dark: #1e3a8a;
      --primary-light: #eff6ff;
      --accent: #0284c7;
      --slate-900: #0f172a;
      --slate-800: #1e293b;
      --slate-700: #334155;
      --slate-600: #475569;
      --slate-500: #64748b;
      --slate-400: #94a3b8;
      --slate-200: #e2e8f0;
      --slate-100: #f1f5f9;
      --slate-50: #f8fafc;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: var(--slate-800);
      background-color: #f1f5f9;
      line-height: 1.5;
      padding-bottom: 60px;
      -webkit-font-smoothing: antialiased;
    }

    /* Top Action Bar (Screen Only) */
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--slate-200);
      padding: 10px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }

    .action-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--slate-800);
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .btn-group {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      border: none;
      white-space: nowrap;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
      box-shadow: 0 1px 3px rgba(37,99,235,0.25);
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: var(--slate-100);
      color: var(--slate-700);
      border: 1px solid var(--slate-200);
    }
    .btn-secondary:hover {
      background: var(--slate-200);
    }

    /* Main Container */
    .document {
      max-width: 860px;
      margin: 18px auto;
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: 14px;
      padding: 36px 40px;
      box-shadow: 0 4px 18px rgba(0,0,0,0.04);
    }

    /* Institute Letterhead */
    .header {
      border-bottom: 2px solid var(--primary);
      padding-bottom: 18px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }

    .brand-section {
      flex: 1;
      min-width: 0;
    }

    .brand-title {
      font-size: 22px;
      font-weight: 900;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      line-height: 1.2;
    }

    .brand-subtitle {
      font-size: 11px;
      color: var(--slate-600);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 4px;
      line-height: 1.3;
    }

    .brand-cert-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      margin-top: 8px;
      font-size: 10px;
      font-weight: 800;
      background: #dbeafe;
      color: #1e40af;
      padding: 3px 8px;
      border-radius: 5px;
      letter-spacing: 0.3px;
    }

    .header-contact {
      text-align: right;
      font-size: 11px;
      color: var(--slate-600);
      line-height: 1.6;
      flex-shrink: 0;
    }

    .header-contact strong {
      color: var(--slate-800);
      font-weight: 700;
    }

    .header-contact a {
      color: var(--primary);
      text-decoration: none;
    }

    /* Course Banner */
    .course-banner {
      background: linear-gradient(180deg, #f0f7ff 0%, #f8faff 100%);
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 22px;
      margin-bottom: 28px;
    }

    .course-label {
      font-size: 10px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }

    .course-name {
      font-size: 23px;
      font-weight: 900;
      color: var(--slate-900);
      line-height: 1.25;
      margin-bottom: 8px;
    }

    .course-desc {
      font-size: 12.5px;
      color: var(--slate-700);
      line-height: 1.6;
      margin-bottom: 14px;
    }

    .course-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px 16px;
      padding-top: 14px;
      border-top: 1px solid #dbeafe;
      font-size: 11.5px;
      color: var(--slate-600);
    }

    .meta-box {
      background: rgba(255, 255, 255, 0.7);
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid rgba(191, 219, 254, 0.6);
    }

    .meta-box-label {
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--slate-500);
      display: block;
      font-weight: 700;
    }

    .meta-box-val {
      font-size: 12px;
      font-weight: 700;
      color: var(--slate-800);
      margin-top: 1px;
    }

    /* Syllabus Content */
    .section-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--slate-900);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border-left: 4px solid var(--primary);
      padding-left: 10px;
      margin: 28px 0 16px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-sub {
      font-size: 11px;
      font-weight: 600;
      color: var(--slate-500);
      text-transform: none;
      letter-spacing: 0;
    }

    .module-card {
      border: 1px solid var(--slate-200);
      border-radius: 10px;
      margin-bottom: 18px;
      overflow: hidden;
      page-break-inside: avoid;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }

    .module-header {
      background: var(--slate-50);
      border-bottom: 1px solid var(--slate-200);
      padding: 11px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .module-idx {
      font-size: 10.5px;
      font-weight: 800;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .module-title {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--slate-900);
      margin-top: 1px;
    }

    .module-badge {
      font-size: 11px;
      font-weight: 700;
      color: #1e40af;
      background: #eff6ff;
      padding: 3px 9px;
      border-radius: 6px;
      border: 1px solid #bfdbfe;
      white-space: nowrap;
    }

    .chapter-block {
      padding: 12px 16px;
      border-bottom: 1px dashed var(--slate-200);
    }
    .chapter-block:last-child {
      border-bottom: none;
    }

    .chapter-title {
      font-size: 12.5px;
      font-weight: 700;
      color: #1e3a8a;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .lesson-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 6px 14px;
      list-style-type: none;
    }

    .lesson-item {
      font-size: 11.5px;
      color: var(--slate-700);
      display: flex;
      align-items: flex-start;
      gap: 6px;
      line-height: 1.4;
    }

    .bullet {
      color: #3b82f6;
      font-weight: 900;
      font-size: 13px;
      line-height: 1.1;
      shrink: 0;
    }

    /* Footer: Official Seal & Academic Director Signature */
    .footer {
      margin-top: 36px;
      padding-top: 22px;
      border-top: 2px solid var(--slate-200);
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 20px;
      page-break-inside: avoid;
    }

    .footer-left {
      max-width: 440px;
      font-size: 11px;
      color: var(--slate-500);
      line-height: 1.6;
    }

    .footer-inst-name {
      font-size: 13px;
      font-weight: 800;
      color: var(--slate-800);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .footer-notice {
      font-size: 10px;
      color: var(--slate-400);
      margin-top: 4px;
    }

    /* Academic Director Verification & Seal Box */
    .authority-box {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-shrink: 0;
    }

    .official-seal {
      width: 72px;
      height: 72px;
      border: 2px dashed #2563eb;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4px;
      background: #eff6ff;
      color: #1e40af;
      box-shadow: inset 0 0 0 1px #bfdbfe;
    }

    .seal-text-top {
      font-size: 7px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .seal-star {
      font-size: 10px;
      line-height: 1;
      margin: 2px 0;
      color: #2563eb;
    }

    .seal-text-bot {
      font-size: 6.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .signatory {
      text-align: right;
    }

    .sign-line {
      width: 140px;
      height: 1.5px;
      background: var(--slate-700);
      margin-bottom: 6px;
      margin-left: auto;
    }

    .sign-name {
      font-size: 13.5px;
      font-weight: 800;
      color: var(--slate-900);
      letter-spacing: 0.3px;
    }

    .sign-designation {
      font-size: 11.5px;
      font-weight: 700;
      color: var(--primary);
      margin-top: 1px;
    }

    .sign-authority {
      font-size: 9.5px;
      font-weight: 700;
      color: var(--slate-600);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }

    .sign-dept {
      font-size: 9.5px;
      color: var(--slate-500);
    }

    /* ═════════════════════════════════════════════════
       Mobile UX Enhancements (Max-Width: 640px)
       ═════════════════════════════════════════════════ */
    @media (max-width: 640px) {
      body {
        background-color: #f8fafc;
      }

      .action-bar {
        padding: 8px 12px;
      }
      .action-title {
        font-size: 12px;
      }
      .action-title span {
        display: none;
      }
      .action-title::after {
        content: "Syllabus Document";
      }
      .btn {
        padding: 6px 11px;
        font-size: 11.5px;
      }

      .document {
        margin: 8px auto;
        padding: 16px 14px;
        border-radius: 10px;
        border: 1px solid var(--slate-200);
      }

      /* Stack letterhead on mobile so text never squishes */
      .header {
        flex-direction: column;
        gap: 12px;
        padding-bottom: 14px;
        margin-bottom: 18px;
      }

      .brand-title {
        font-size: 18px;
        line-height: 1.25;
      }
      .brand-subtitle {
        font-size: 10px;
      }

      .header-contact {
        text-align: left;
        width: 100%;
        background: var(--slate-50);
        border: 1px solid var(--slate-200);
        padding: 10px 12px;
        border-radius: 8px;
        font-size: 11px;
        line-height: 1.5;
        display: grid;
        grid-template-columns: 1fr;
        gap: 3px;
      }

      .course-banner {
        padding: 14px 12px;
        margin-bottom: 20px;
        border-radius: 10px;
      }

      .course-name {
        font-size: 18px;
      }

      .course-meta-grid {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .lesson-grid {
        grid-template-columns: 1fr;
        gap: 6px;
      }

      .footer {
        flex-direction: column-reverse;
        align-items: stretch;
        gap: 18px;
        margin-top: 26px;
        padding-top: 18px;
      }

      .authority-box {
        justify-content: space-between;
        width: 100%;
        background: var(--slate-50);
        padding: 12px;
        border-radius: 10px;
        border: 1px solid var(--slate-200);
      }
      .sign-line {
        margin-left: 0;
        width: 100%;
      }
      .signatory {
        text-align: left;
      }
    }

    /* Print Stylesheet */
    @media print {
      body {
        background: white !important;
        padding: 0 !important;
      }
      .action-bar {
        display: none !important;
      }
      .document {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
      }
      .header {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
      }
      .header-contact {
        text-align: right !important;
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
        display: block !important;
      }
      .module-card {
        page-break-inside: avoid !important;
      }
      .footer {
        display: flex !important;
        flex-direction: row !important;
        justify-content: space-between !important;
      }
      .authority-box {
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Action Bar -->
  <div class="action-bar">
    <div class="action-title">
      📄 <span>Course Syllabus Document</span>
    </div>
    <div class="btn-group">
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ Print or Save as PDF
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        Close
      </button>
    </div>
  </div>

  <div class="document">
    
    <!-- Header Letterhead -->
    <div class="header">
      <div class="brand-section">
        <h1 class="brand-title">Vision IT & Computer Institute</h1>
        <div class="brand-subtitle">Skill Development & Certified Computer Education</div>
        <div class="brand-cert-badge">
          <span>★</span> ISO 9001:2015 Certified Institution
        </div>
      </div>
      <div class="header-contact">
        <strong>Head Campus & Academic Office</strong><br>
        Helpline: +91 81031 70595<br>
        Email: <a href="mailto:support@visionitinstitute.com">support@visionitinstitute.com</a><br>
        Web: www.visionitinstitute.com<br>
        Published Date: ${currentDateStr}
      </div>
    </div>

    <!-- Course Banner -->
    <div class="course-banner">
      <div class="course-label">Official Curriculum Specification</div>
      <h2 class="course-name">${course.title}</h2>
      <p class="course-desc">${course.description || "Comprehensive practical training curriculum designed for industry proficiency, software mastery, and certified computer applications."}</p>
      
      <div class="course-meta-grid">
        <div class="meta-box">
          <span class="meta-box-label">Category</span>
          <div class="meta-box-val">${course.category || "Information Technology"}</div>
        </div>
        <div class="meta-box">
          <span class="meta-box-label">Total Modules</span>
          <div class="meta-box-val">${structuredModules.length} Modules</div>
        </div>
        <div class="meta-box">
          <span class="meta-box-label">Total Lessons</span>
          <div class="meta-box-val">${totalLessonsCount} Topics</div>
        </div>
        <div class="meta-box">
          <span class="meta-box-label">Training Mode</span>
          <div class="meta-box-val">Classroom & Hybrid Lab</div>
        </div>
        <div class="meta-box">
          <span class="meta-box-label">Certification</span>
          <div class="meta-box-val">Certified On Completion</div>
        </div>
      </div>
    </div>

    <!-- Syllabus Sections -->
    <div class="section-title">
      <span>Course Modules & Detailed Topics</span>
      <span class="section-sub">${totalLessonsCount} Topics across ${structuredModules.length} Modules</span>
    </div>

    ${structuredModules.length === 0 ? `
      <p style="padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">
        Curriculum topics are currently being updated for this course. Please contact faculty for the latest syllabus copy.
      </p>
    ` : structuredModules.map((mod: any) => `
      <div class="module-card">
        <div class="module-header">
          <div>
            <div class="module-idx">${mod.indexStr}</div>
            <div class="module-title">${mod.title}</div>
          </div>
          <span class="module-badge">${mod.totalLessons} Lessons</span>
        </div>

        ${mod.chapters.map((chap: any) => `
          <div class="chapter-block">
            <div class="chapter-title">
              <span style="color: #3b82f6;">›</span>
              <span>Chapter ${chap.indexStr}: ${chap.title}</span>
            </div>
            <ul class="lesson-grid">
              ${chap.lessons.map((lesson: any) => `
                <li class="lesson-item">
                  <span class="bullet">•</span>
                  <span>${lesson.title}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        `).join("")}

        ${mod.uncategorizedLessons.length > 0 ? `
          <div class="chapter-block">
            <div class="chapter-title" style="color: #64748b;">
              <span style="color: #64748b;">›</span>
              <span>Module Topics</span>
            </div>
            <ul class="lesson-grid">
              ${mod.uncategorizedLessons.map((lesson: any) => `
                <li class="lesson-item">
                  <span class="bullet">•</span>
                  <span>${lesson.title}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        ` : ""}
      </div>
    `).join("")}

    <!-- Official Seal & Academic Director Signature Footer -->
    <div class="footer">
      <div class="footer-left">
        <div class="footer-inst-name">Vision IT & Computer Institute</div>
        <div>Official Academic Curriculum Document • Reg. & ISO Certified</div>
        <div>Helpline: +91 81031 70595 • Email: support@visionitinstitute.com</div>
        <div class="footer-notice">
          This syllabus is approved by the Academic Directorate for student training and certification.
        </div>
      </div>

      <div class="authority-box">
        <!-- Verification Seal Stamp -->
        <div class="official-seal">
          <div class="seal-text-top">VISION IT</div>
          <div class="seal-star">★</div>
          <div class="seal-text-bot">VERIFIED</div>
        </div>

        <!-- Academic Director Signature -->
        <div class="signatory">
          <div class="sign-line"></div>
          <div class="sign-name">Ishwar Singh</div>
          <div class="sign-designation">Academic Director</div>
          <div class="sign-authority">Authorized Signatory</div>
          <div class="sign-dept">Vision Academic Directorate</div>
        </div>
      </div>
    </div>

  </div>

</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600"
      }
    });
  } catch (err: any) {
    console.error("Syllabus PDF route error:", err);
    return new Response(
      `<!DOCTYPE html><html><body><h2>Error generating syllabus</h2><p>${err.message}</p></body></html>`,
      { headers: { "Content-Type": "text/html" }, status: 500 }
    );
  }
}
