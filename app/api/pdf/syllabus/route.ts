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
  <title>Syllabus - ${course.title} | Vision Computer Institute</title>
  <style>
    :root {
      --primary: #1e40af;
      --primary-light: #eff6ff;
      --slate-800: #1e293b;
      --slate-600: #475569;
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: var(--slate-800);
      background-color: #f8fafc;
      line-height: 1.5;
      padding-bottom: 60px;
    }

    /* Top Action Bar (Screen Only) */
    .action-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--slate-200);
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    .action-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--slate-800);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: var(--slate-100);
      color: var(--slate-600);
      border: 1px solid var(--slate-200);
    }
    .btn-secondary:hover {
      background: var(--slate-200);
    }

    /* Main Container */
    .document {
      max-width: 850px;
      margin: 25px auto;
      background: white;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
    }

    /* Institute Letterhead */
    .header {
      border-bottom: 2px solid var(--primary);
      padding-bottom: 20px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .brand-subtitle {
      font-size: 12px;
      color: var(--slate-600);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 2px;
    }

    .brand-cert {
      display: inline-block;
      margin-top: 6px;
      font-size: 10px;
      font-weight: 700;
      background: #dbeafe;
      color: #1e40af;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .header-contact {
      text-align: right;
      font-size: 11px;
      color: var(--slate-600);
      line-height: 1.6;
    }

    /* Course Banner */
    .course-banner {
      background: #f0f7ff;
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 30px;
    }

    .course-label {
      font-size: 11px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }

    .course-name {
      font-size: 22px;
      font-weight: 800;
      color: var(--slate-800);
      margin-bottom: 8px;
    }

    .course-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #dbeafe;
      font-size: 12px;
      color: var(--slate-600);
    }

    .meta-item strong {
      color: var(--slate-800);
    }

    /* Syllabus Content */
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--slate-800);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-left: 4px solid var(--primary);
      padding-left: 10px;
      margin: 30px 0 15px 0;
    }

    .module-card {
      border: 1px solid var(--slate-200);
      border-radius: 8px;
      margin-bottom: 20px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .module-header {
      background: var(--slate-50);
      border-bottom: 1px solid var(--slate-200);
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .module-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--slate-800);
    }

    .module-badge {
      font-size: 11px;
      font-weight: 600;
      color: var(--slate-600);
      background: white;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid var(--slate-200);
    }

    .chapter-block {
      padding: 12px 16px;
      border-bottom: 1px dashed var(--slate-200);
    }
    .chapter-block:last-child {
      border-bottom: none;
    }

    .chapter-title {
      font-size: 13px;
      font-weight: 600;
      color: #1e3a8a;
      margin-bottom: 8px;
    }

    .lesson-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 6px 16px;
      list-style-type: none;
    }

    .lesson-item {
      font-size: 12px;
      color: var(--slate-600);
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .bullet {
      color: #3b82f6;
      font-size: 14px;
      line-height: 1;
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid var(--slate-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: var(--slate-400);
    }

    .seal {
      text-align: right;
    }
    .seal-sign {
      font-weight: 700;
      color: var(--slate-800);
      margin-top: 4px;
    }

    /* Print Stylesheet */
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .action-bar {
        display: none !important;
      }
      .document {
        border: none;
        box-shadow: none;
        padding: 0;
        margin: 0;
        max-width: 100%;
      }
      .module-card {
        page-break-inside: avoid;
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
      <div>
        <div class="brand-title">Vision Computer Institute</div>
        <div class="brand-subtitle">Skill Development & Computer Education</div>
        <span class="brand-cert">ISO 9001:2015 Certified Center</span>
      </div>
      <div class="header-contact">
        <strong>Head Office & Campus</strong><br>
        Helpline: +91 81031 70595<br>
        Email: support@visioninstitute.org<br>
        Published on: ${currentDateStr}
      </div>
    </div>

    <!-- Course Banner -->
    <div class="course-banner">
      <div class="course-label">Curriculum Specification & Syllabus</div>
      <h1 class="course-name">${course.title}</h1>
      <p style="font-size: 13px; color: #334155; line-height: 1.5;">${course.description || "Comprehensive practical training curriculum designed for industry proficiency, software mastery, and certified computer applications."}</p>
      
      <div class="course-meta">
        <div class="meta-item">Category: <strong>${course.category || "Information Technology"}</strong></div>
        <div class="meta-item">Total Modules: <strong>${structuredModules.length} Modules</strong></div>
        <div class="meta-item">Total Lessons: <strong>${totalLessonsCount} Topics</strong></div>
        <div class="meta-item">Training Mode: <strong>Practical Classroom & Hybrid</strong></div>
        <div class="meta-item">Certification: <strong>On Completion</strong></div>
      </div>
    </div>

    <!-- Syllabus Sections -->
    <h2 class="section-title">Course Modules & Detailed Topics</h2>

    ${structuredModules.length === 0 ? `
      <p style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">
        Curriculum topics are being updated for this course. Please contact faculty for the latest syllabus copy.
      </p>
    ` : structuredModules.map((mod: any) => `
      <div class="module-card">
        <div class="module-header">
          <div>
            <span style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase;">${mod.indexStr}</span>
            <div class="module-title">${mod.title}</div>
          </div>
          <span class="module-badge">${mod.totalLessons} Lessons</span>
        </div>

        ${mod.chapters.map((chap: any) => `
          <div class="chapter-block">
            <div class="chapter-title">Chapter ${chap.indexStr}: ${chap.title}</div>
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
            <div class="chapter-title" style="color: #64748b;">Module Topics</div>
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

    <!-- Official Seal & Signature -->
    <div class="footer">
      <div>
        <strong>Vision Computer Institute</strong><br>
        Official Academic Syllabus Document • Verified & Approved
      </div>
      <div class="seal">
        <div style="font-size: 10px; color: #64748b;">Academic Director</div>
        <div class="seal-sign">Vision Academic Council</div>
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
