import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth-custom";

export type ModelTier = "vision" | "vision-pro" | "vision-elite";
export type PluginType = "notes" | "quiz" | "coder" | "study" | null;

const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.8-flash",
];

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get("vision_learn_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Parse request
    const {
      message,
      courseContext,
      materialContext,
      history,
      studyMode = "tutor",
      modelTier = "vision-pro",
      activePlugin = null,
      preferredLanguage = "hinglish",
      customInstructions,
      imageUrl,
      studentMemories = [],
    }: {
      message: string;
      courseContext?: any;
      materialContext?: any;
      history?: any[];
      studyMode?: string;
      modelTier?: ModelTier;
      activePlugin?: PluginType;
      preferredLanguage?: string;
      customInstructions?: string;
      imageUrl?: string;
      studentMemories?: string[];
    } = await request.json();

    if (!message?.trim() && !imageUrl) {
      return NextResponse.json({ error: "Message or image is required" }, { status: 400 });
    }

    const effectiveMessage = message?.trim() || "Please analyze this uploaded photo and explain the concepts/problem in detail.";
    const studentName = payload.name || "Student";

    const systemPrompt = buildSystemPrompt(
      studentName,
      courseContext,
      materialContext,
      studyMode,
      modelTier,
      activePlugin,
      preferredLanguage,
      customInstructions,
      studentMemories
    );

    // 3. Collect available API keys
    const openAiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    let aiReply: string | null = null;

    // Check if an OpenAI key is available
    if (openAiKey && openAiKey.startsWith("sk-") && !openAiKey.includes("abcdef1234567890")) {
      try {
        aiReply = await callOpenAI(openAiKey, systemPrompt, history || [], effectiveMessage, modelTier, imageUrl);
      } catch (err) {
        console.warn("[AI Tutor] OpenAI call failed:", err);
      }
    }

    // Check if Gemini key is available
    if (!aiReply && geminiKey && geminiKey !== "your_gemini_api_key_here") {
      if (geminiKey.startsWith("sk-")) {
        try {
          aiReply = await callOpenAI(geminiKey, systemPrompt, history || [], effectiveMessage, modelTier, imageUrl);
        } catch (err) {
          console.warn("[AI Tutor] Key in GEMINI_API_KEY called as OpenAI failed:", err);
        }
      } else {
        for (const model of GEMINI_MODELS) {
          try {
            aiReply = await callGemini(geminiKey, model, systemPrompt, history || [], effectiveMessage, modelTier, activePlugin, imageUrl);
            if (aiReply) break;
          } catch (err) {
            console.warn(`[AI Tutor] Gemini ${model} failed:`, err);
          }
        }
      }
    }

    // 4. Fallback intelligent response if keys are invalid, quota exceeded, or offline
    if (!aiReply) {
      aiReply = generateOfflineTutorReply(effectiveMessage, studentName, activePlugin || studyMode, courseContext, modelTier, imageUrl);
    }

    return NextResponse.json({
      reply: aiReply,
      modelUsed: modelTier,
      pluginUsed: activePlugin,
    });
  } catch (error: any) {
    console.error("[AI Tutor] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ─── OpenAI API Caller ────────────────────────────────────────────────────────
async function callOpenAI(
  apiKey: string,
  systemPrompt: string,
  history: any[],
  message: string,
  modelTier: ModelTier,
  imageUrl?: string
): Promise<string | null> {
  const messages: any[] = [{ role: "system", content: systemPrompt }];

  if (history && Array.isArray(history)) {
    for (const h of history.slice(-8)) {
      messages.push({
        role: h.role === "model" ? "assistant" : "user",
        content: h.content,
      });
    }
  }

  if (imageUrl) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: message },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    });
  } else {
    messages.push({ role: "user", content: message });
  }

  // Map tier to appropriate model & config
  const modelName = modelTier === "vision-elite" ? "gpt-4o" : "gpt-4o-mini";
  const temperature = modelTier === "vision-elite" ? 0.3 : modelTier === "vision" ? 0.8 : 0.6;
  const maxTokens = modelTier === "vision-elite" ? 3000 : modelTier === "vision" ? 1200 : 2000;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(3500),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[AI Tutor] OpenAI API Error:", res.status, errText);
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

// ─── Google Gemini API Caller ────────────────────────────────────────────────
async function callGemini(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  history: any[],
  message: string,
  modelTier: ModelTier,
  activePlugin: PluginType,
  imageUrl?: string
): Promise<string | null> {
  const contents = [];

  if (history && Array.isArray(history)) {
    for (const turn of history.slice(-8)) {
      contents.push({
        role: turn.role,
        parts: [{ text: turn.content }],
      });
    }
  }

  const userParts: any[] = [{ text: message }];
  if (imageUrl) {
    const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (match) {
      userParts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
  }

  contents.push({
    role: "user",
    parts: userParts,
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

  const temperature = activePlugin === "quiz" ? 0.3 : modelTier === "vision-elite" ? 0.3 : 0.7;
  const maxOutputTokens = modelTier === "vision-elite" ? 2800 : modelTier === "vision" ? 600 : 1500;

  const res = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(12000),
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.warn(`[AI Tutor] Gemini API (${modelName}) failed [${res.status}]:`, errBody);
    return null;
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

// ─── Intelligent Educational Fallback ─────────────────────────────────────────
function generateOfflineTutorReply(
  query: string,
  studentName: string,
  effectiveMode: string,
  courseContext?: { title: string } | null,
  modelTier: ModelTier = "vision-pro",
  imageUrl?: string
): string {
  const q = query.toLowerCase();
  const course = courseContext?.title || "Computer Science";
  const tierBadge = modelTier === "vision-elite" ? "👑 Vision Elite" : modelTier === "vision" ? "⚡ Vision" : "🚀 Vision Pro";

  if (imageUrl) {
    return `Namaste **${studentName}**! 👋 Aapki photo receive ho gayi hai.

Agar aap is photo ke kisi specific question, code ya topic ke baare mein poochna chahte hain, toh kripya message mein batayein, main turant explain karunga!`;
  }

  // ─── 1. Casual Greetings & Identity / Common Sense SMS ───────────────────────
  const cleanQ = q.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const greetingKeywords = [
    "hi", "hello", "hey", "hlo", "hii", "hiii", "namaste", "namaskar", 
    "yo", "sup", "wassup", "good morning", "good evening", "good afternoon"
  ];
  const isDirectGreeting = greetingKeywords.includes(cleanQ) || 
    greetingKeywords.some((w) => cleanQ === w || cleanQ.startsWith(`${w} `) || cleanQ.endsWith(` ${w}`));

  const isSmallTalk = 
    cleanQ.includes("kaise ho") || 
    cleanQ.includes("kya haal") || 
    cleanQ.includes("how are you") || 
    cleanQ.includes("kya chal raha") ||
    cleanQ.includes("kya kar rahe");

  // Name & Identity queries (e.g. "apka name kya hai", "who are you", "tum kaun ho")
  const isNameQuery = 
    cleanQ.includes("name kya") || 
    cleanQ.includes("naam kya") || 
    cleanQ.includes("kaun ho") || 
    cleanQ.includes("kon ho") || 
    cleanQ.includes("who are you") || 
    cleanQ.includes("what is your name");

  // Capabilities queries (e.g. "kya karte ho", "what can you do", "kya kar sakte ho")
  const isCapabilityQuery = 
    cleanQ.includes("kya kar sakte") || 
    cleanQ.includes("kya karte ho") || 
    cleanQ.includes("what can you do") || 
    cleanQ.includes("kya kaam hai");

  // Source & Image Origin query (e.g. "yah apko kaha mila", "kahan mila", "kahan se aayi")
  const isWhereDidYouGetThis = 
    cleanQ.includes("kaha mila") || 
    cleanQ.includes("kahan mila") || 
    cleanQ.includes("kahan se mila") || 
    cleanQ.includes("kahan se aayi") || 
    cleanQ.includes("kaha se mila") ||
    cleanQ.includes("where did you get");

  // Privacy query
  const isPrivacyQuery = 
    cleanQ.includes("privacy") || 
    cleanQ.includes("pravicy") || 
    cleanQ.includes("safe hai") || 
    cleanQ.includes("database me save") || 
    cleanQ.includes("database file") ||
    cleanQ.includes("database");

  // Website & Learn App queries (e.g. "website ke baare me", "learn app", "vision learn")
  const isPlatformQuery = 
    cleanQ.includes("website") || 
    cleanQ.includes("learn app") || 
    cleanQ.includes("app ke baare") || 
    cleanQ.includes("app me kya hai") || 
    cleanQ.includes("vision learn") ||
    cleanQ.includes("institute ke baare");

  // Location / Origin (e.g. "kahan se ho", "kahan rehte ho")
  const isLocationQuery = 
    cleanQ.includes("kahan se ho") || 
    cleanQ.includes("kahan rehte") || 
    cleanQ.includes("where are you from");

  // Help prompt
  const isHelpPrompt = 
    cleanQ === "help" || 
    cleanQ.includes("help me") || 
    cleanQ.includes("madad karo") || 
    cleanQ.includes("help chahiye");

  const isAcknowledgement = ["ok", "okay", "theek hai", "thik hai", "accha", "acha", "hmm", "haan", "yes", "sahi hai"].includes(cleanQ);

  // Link requests (e.g. "mujhe link chahiye", "link do", "website link", "app link", "portal link", "dca link")
  const isLinkRequest = 
    cleanQ.includes("link") || 
    cleanQ.includes("portal") || 
    cleanQ.includes("url");

  if (isWhereDidYouGetThis) {
    return `Yeh image aapne hi abhi chat mein attach karke bheji hai! 🙂 Aapka data aur photos bilkul private aur safe hain, yeh kisi database file me save nahi hote.`;
  }

  if (isPrivacyQuery) {
    return `Vision IT Computer Institute ka database aur student data 100% secure aur confidential hai. Aapki privacy policy ke tahat aapke chats aur photos kisi open database mein save nahi hote.`;
  }

  if (isLinkRequest) {
    return `Yeh lijiye official links:
- 📱 **Vision Learn Portal**: [learn.visionitinstitute.com](https://learn.visionitinstitute.com)
- 🌐 **Official Website**: [visionitinstitute.com](https://visionitinstitute.com)

Aap yahan se courses, syllabus, video lectures aur notes direct access kar sakte hain!`;
  }

  if (isPlatformQuery) {
    return `### 🎓 Vision IT Institute & Vision Learn App:
1. **Vision IT Computer Institute**: Yahan DCA, ADCA, BCA, Tally, Web Development, Python aur professional IT courses sikhaye jaate hain.
   - 🌐 Official Website: [visionitinstitute.com](https://visionitinstitute.com)
2. **Vision Learn Web App**: 
   - 📱 Portal: [learn.visionitinstitute.com](https://learn.visionitinstitute.com)
   - 📚 Courses, video lectures aur syllabus notes
   - 🤖 Vision AI Tutor (24/7 doubts clearing, @coder, @quiz, @notes)
   - 📸 Photo scanner (Questions aur errors scan karke solution)
   - 📊 Student attendance aur learning progress tracker!`;
  }

  if (isNameQuery) {
    return `Mera naam Vision AI hai! 😊 Main Vision IT Computer Institute ka aapka study assistant hoon.`;
  }

  if (isCapabilityQuery) {
    return `Main aapke institute courses, coding questions, syllabus, practical doubts, notes aur exam preparation mein help karta hoon!`;
  }

  if (isLocationQuery) {
    return `Main Vision IT Institute ke digital platform par 24/7 aapki study help ke liye available hoon!`;
  }

  if (isHelpPrompt) {
    return `Haan bilkul! Bataiye kis question, code ya topic par help chahiye?`;
  }

  if (isDirectGreeting) {
    return `Hi ${studentName}! Aaj kya kaam karna hai?`;
  }

  if (isSmallTalk) {
    return `Main badhiya hoon! Aaj kya padhna hai?`;
  }

  if (isAcknowledgement) {
    return `Ji bilkul! Aage kya karein?`;
  }

  // Casual gratitude
  const thanksKeywords = ["thank you", "thanks", "dhanyawad", "shukriya", "thx"];
  if (thanksKeywords.some((w) => cleanQ.includes(w))) {
    return `You're welcome! Koi aur doubt hai?`;
  }

  // Casual goodbye
  const byeKeywords = ["bye", "goodbye", "alvida", "good night", "see you"];
  if (byeKeywords.some((w) => cleanQ === w || cleanQ.startsWith(`${w} `))) {
    return `Bye ${studentName}! Take care! 👋`;
  }

  // @quiz plugin
  if (effectiveMode === "quiz" || q.includes("quiz") || q.includes("mcq")) {
    return `### 🎯 Practice Quiz — ${tierBadge} (${course})

Namaste **${studentName}**! Aapke concept evaluation ke liye 4 interactive practice questions:

**Q1. Web development mein DOM ka full form kya hota hai?**
- A) Document Object Model
- B) Data Oriented Method
- C) Digital Output Management
- D) Direct Operating Mode

**Q2. CSS mein Flexbox ka primary purpose kya hai?**
- A) Database query execute karna
- B) Responsive layout aur elements alignment easily manage karna
- C) Server authentication handle karna
- D) Browser history clear karna

**Q3. JavaScript mein \`const\` variable ki kya specialty hoti hai?**
- A) Isko program mein re-assign nahi kiya ja sakta
- B) Iska scope hamesha global hota hai
- C) Yeh value automatically integer mein convert karta hai
- D) Isko delete karna compulsory hota hai

**Q4. HTML5 mein semantic tags jaise \`<header>\`, \`<article>\`, \`<nav>\` kyu use kiye jaate hain?**
- A) Website loading speed ko 10x fast banane ke liye
- B) Code readability, accessibility aur SEO rank improve karne ke liye
- C) Sirf dark mode enable karne ke liye
- D) Security password protect karne ke liye

👉 **Neeche diye gaye option buttons (A, B, C, D) par click karein**, main turant check karke explain karunga!`;
  }

  // @coder plugin
  if (effectiveMode === "coder" || effectiveMode === "code" || q.includes("code") || q.includes("debug")) {
    return `Namaste **${studentName}**! (${tierBadge} Active) 💻

Yeh raha production-grade aur clean implementation:

\`\`\`javascript
/**
 * Student Grade & Performance Evaluator
 * Vision IT Institute Academic Module
 */
function evaluateStudentMarks(studentName, marks) {
  if (typeof marks !== "number" || marks < 0 || marks > 100) {
    throw new Error("Invalid marks: Marks 0 se 100 ke beech hone chahiye.");
  }

  let grade = "";
  let feedback = "";

  if (marks >= 90) {
    grade = "A+ (Outstanding)";
    feedback = "Exceptional performance! Ready for advanced projects.";
  } else if (marks >= 75) {
    grade = "A (Very Good)";
    feedback = "Great grasp of concepts! Focus on system optimization.";
  } else if (marks >= 50) {
    grade = "B (Good)";
    feedback = "Cleared successfully! Practice coding challenges daily.";
  } else {
    grade = "Needs Improvement";
    feedback = "Attend institute doubt sessions & revise fundamentals.";
  }

  return {
    student: studentName,
    percentage: \`\${marks}%\`,
    grade,
    remarks: feedback,
    passed: marks >= 50
  };
}

// Example Execution
const studentReport = evaluateStudentMarks("${studentName}", 92);
console.log(studentReport);
\`\`\`

### 🔍 Code & Logic Breakdown:
1. **Input Validation**: Negative marks ya invalid input par safety check karta hai.
2. **Deterministic Grading**: \`if-else\` ladder accurate thresholds verify karta hai.
3. **Clean Output**: Data structured JSON object ke format mein return hota hai jo dashboard me render karna aasan hai.`;
  }

  // @notes plugin
  if (effectiveMode === "notes" || effectiveMode === "cheatsheet" || q.includes("summary") || q.includes("formula")) {
    return `### 📑 High-Yield Revision Notes — ${tierBadge}
**Course Focus**: ${course} | **Student**: ${studentName}

---

#### 1. Fundamental Concepts
- **Data Structures**: Array (indexed fast access), Object/Map (key-value pair), Set (unique values).
- **Scope Chain**: Global Scope → Function Scope → Block Scope (\`let\`/\`const\`).
- **Hoisting**: Variable aur function declarations execution se pehle memory mein allocate hote hain.

#### 2. Key Methods & Syntaxes
| Method / Concept | Description | Time Complexity |
| :--- | :--- | :--- |
| \`.map()\` | Har element ko transform karke naya array banata hai | O(n) |
| \`.filter()\` | Condition match karne wale items ka subset return karta hai | O(n) |
| \`.reduce()\` | Pure array ko single value (sum, object) mein aggregate karta hai | O(n) |

#### 3. Viva & Exam Tips
> **💡 Expert Tip**: Viva interview mein jab question pucha jaye, pehle 1-line definition dein, fir practical example aur real-life analogy zaroor jod dein!`;
  }

  // English learning queries
  if (cleanQ.includes("english") || cleanQ.includes("eng") || cleanQ.includes("speaking") || cleanQ.includes("angreji")) {
    return `English seekhna bohot accha aur rewarding decision hai! 🎯\n\nAapko mainly kis cheez par focus karna hai?\n1. **Spoken English & Daily Conversation** (confident bolne ke liye)\n2. **Grammar & Sentence Formation** (Tenses aur basic rules)\n3. **Interview & Professional Communication**\n\nBatayein, aap kahan se shuru karna chahte hain? Hum basic conversation se simple practice shuru kar sakte hain!`;
  }

  // Demotivated / mood queries
  if (cleanQ.includes("mann nahi") || cleanQ.includes("man nahi") || cleanQ.includes("bore") || cleanQ.includes("thak gaya") || cleanQ.includes("mood nahi")) {
    return `Kabhi-kabhi thoda break lena bilkul zaroori aur normal hai! 🌟 Aaj padhai thodi der side rakh dete hain. Bataiye kya chal raha hai? Koi specific baat pareshan kar rahi hai ya bas thoda relax karne ka mann hai?`;
  }

  // Coding or beginner advice
  if (cleanQ.includes("coding") || cleanQ.includes("programming") || cleanQ.includes("kaha se shuru") || cleanQ.includes("kaise shuru")) {
    return `Nayi cheez shuru karna thoda confusing lag sakta hai, par bilkul tension mat lijiye! 🚀\n\nAgar aap bilkul beginner hain, toh **Python** ya **HTML & Web Development** se shuru karna sabse aasan aur interesting hota hai.\n\nAapka main goal kya hai — software/web developer banna hai, institute ke exams clear karne hain, ya koi specific language seekhni hai? Batayein!`;
  }

  // Academic / technical keywords check
  const academicKeywords = [
    "html", "css", "javascript", "js", "python", "java", "c++", "c language",
    "sql", "react", "nextjs", "node", "database", "data structure", "algorithm",
    "loop", "array", "function", "object", "class", "pointer", "syntax",
    "compiler", "operating system", "network", "api", "viva", "formula",
    "explain", "samjhao", "kaise banaye", "code", "error", "difference", "types",
    "programming", "computer", "memory", "stack", "queue", "tree", "graph"
  ];
  const isAcademic = academicKeywords.some((w) => q.includes(w));

  // If query is casual SMS or non-academic general chat
  if (!isAcademic && effectiveMode !== "study" && effectiveMode !== "coder" && effectiveMode !== "notes") {
    return `Namaste ${studentName}! Main aapki baat samajh gaya. Bataiye iske baare mein aap kya discuss karna chahte hain, ya kisi specific topic par help chahiye toh batayein, hum milkar start karte hain!`;
  }

  // @study plugin or detailed query
  return `Namaste **${studentName}**! 👋\n\nAapne poocha: *"${query}"*\n\nIs topic par aapka concept bilkul clear karne ke liye hum step-by-step shuru karte hain. Bataiye aapko iska basic simple explanation chahiye, real-life practical example dekhna hai, ya code ke sath samajhna hai?`;
}

// ─── System Prompt Builder ────────────────────────────────────────────────────
function buildSystemPrompt(
  studentName: string,
  courseContext?: { id: string; title: string; category: string } | null,
  materialContext?: { id: string; title: string; type: string; content?: string } | null,
  studyMode: string = "tutor",
  modelTier: ModelTier = "vision-pro",
  activePlugin: PluginType = null,
  preferredLanguage: string = "hinglish",
  customInstructions?: string,
  studentMemories: string[] = []
): string {
  let tierDesc = "Balanced accuracy aur clear explanations ke sath";
  if (modelTier === "vision") {
    tierDesc = "Ultra-fast, concise, aur point-to-point responses ke sath";
  } else if (modelTier === "vision-elite") {
    tierDesc = "Maximum intelligence, deep architectural reasoning, exhaustive edge cases, aur master-tier expertise ke sath";
  }

  let langInstruction = "Natural Hinglish (Hindi + English mix), warm, friendly, encouraging aur highly respectful.";
  if (preferredLanguage === "hi") {
    langInstruction = "Strictly shuddh aur saral Hindi (हिन्दी) mein response do, respectful aur friendly manners ke sath.";
  } else if (preferredLanguage === "en") {
    langInstruction = "Strictly professional, friendly, empathetic, and clear English.";
  }

  let memoriesSection = "";
  if (studentMemories && studentMemories.length > 0) {
    memoriesSection = `\n## 🧠 Student's Long-Term Memory (Facts You Remember About Them):
Aapko is student ke baare me yeh sab baatein pehle se yaad hain:
${studentMemories.map((m) => `- ${m}`).join("\n")}
*Rule: In baaton ko dhyan me rakhkar student se baat karo, jaise ek sachha purana dost unke goals, past struggles aur pasand ko naturally yaad rakhta hai.*`;
  }

  let prompt = `Tum Vision IT Computer Institute ke flagship AI Assistant aur har student ke ek sachhe dost (Study Buddy & Supportive Mentor) ho.
Tumhara model tier "${modelTier.toUpperCase()}" (${tierDesc}) hai.

## 🤝 Persona, Manners & Friendly Etiquette:
- **Respectful & Supportive Mentor**: Tum student ke ek caring, polite aur supportive mentor ho.
- **Top-Tier Manners & Respect**:
  - Hamesha respectful aur polite raho ("Aap").
  - Har achhi koshish par appreciate aur encourage karo.
  - Tone: Warm, relatable, polite, empathetic, motivating aur reliable.

- **🚫 "Dost" Bar-Bar Mat Bolo (STRICT PROHIBITION)**:
  - Har sentence ya har reply mein "dost" bolna BILKUL MANA HAI! Yeh artificial aur irritating lagta hai.
  - Hamesha simple aur natural Hindi/Hinglish mein baat karo. Student ko "Aap" kehkar respect do.

- **🔒 Photos, Image Origin & Privacy (CRITICAL RULE)**:
  - Jab student chat me koi photo upload kare aur pooche "yah aapko kahan mila", "kahan se aayi", "kahan se mila":
    Hamesha seedha aur sach batao: "Yeh image aapne hi abhi chat mein attach karke bheji hai! 🙂"
  - KABHI BHI yeh jhooth ya hallucination mat bolo ki "Yeh institute ki database file me save hai" ya "server par hai"!
  - Student ko confirm karo ki unki privacy 100% safe aur confidential hai, unka data kisi unauthorized database file mein save nahi hota.

- **🔐 Institute Database Strict Privacy (CONFIDENTIAL)**:
  - Institute ke internal database, backend architecture, ya database files ke baare mein KABHI BHI koi technical/raw details ya access mat claim karo.
  - Agar student database ya data safety ke baare me pooche, toh spasht kaho:
    "Vision IT Computer Institute ka database aur student records 100% secure aur confidential hain. Privacy policy ke anusaar internal database information private rehti hai."

- **🌐 Institute Website, Vision Learn App & Official Links (STRICT ACCURACY)**:
  - Jab bhi student website, portal, app, syllabus notes ya kisi link ke baare mein pooche, STRICTLY yahi do official links markdown format mein share karo:
    1. **Vision Learn App Portal**: [learn.visionitinstitute.com](https://learn.visionitinstitute.com)
    2. **Vision IT Institute Website**: [visionitinstitute.com](https://visionitinstitute.com)
  - **🚫 Fake / Dummy Domains Prohibited**: KABHI BHI koi banawati ya galat link mat likho (jaise visionlearn.in, visionit.com, etc. BILKUL MANA HAI). Hamesha strictly https://learn.visionitinstitute.com aur https://visionitinstitute.com hi share karo!
  - **Institute Courses**: DCA, ADCA, PGDCA, BCA, Tally Prime, Web Design, Full Stack Development, Python, C++, Data Entry.
  - **Vision Learn Features**: Online video lectures, syllabus PDF notes, 24/7 AI Tutor (@study, @coder, @quiz, @notes), photo question scanner, attendance & performance dashboard, certificates.

## 🧠 Common Sense, Natural Thinking & Human-like Conversations (CRITICAL):
- **🚫 KABHI BHI PRE-SCRIPTED YA TEMPLATE JAISE ANSWERS MAT DO**:
  - Kisi bhi sawal ka fixed format (jaise "1. Core Idea, 2. Real-Life Analogy, 3. Step-by-Step Approach") har baar zabardasti chipkana BILKUL MANA HAI.
  - Har message ko dhyan se padho, context samjho aur **COMMON SENSE** use karke bilkul ek real, samajhdaar aur friendly mentor/teacher ki tarah naturally reply do.
  - Har sawal ke hisaab se natural, intuitive aur engaging style me baat karo — robot ki tarah scripted dialogue mat phenko!
  
- **Common Sense in Casual & Conversational Chat**:
  - Agar student kehta hai *"english sikhna hai"*, toh coding doubt ka template mat phenko! Unhe warmly motivate karo aur naturally poocho: *"English seekhna bohot badhiya faisla hai! Aapko mainly daily speaking improve karni hai, basic grammar se shuru karna hai ya job interview ki preparation karni hai? Batayein, hum bilkul simple tarike se practice shuru karte hain!"*
  - Agar student kehta hai *"aaj padhne ka mann nahi hai"*, toh ek caring dost ki tarah baat karo, motivation aur empathy do.
  - Agar student kehta hai *"kaise ho"*, toh naturally respond karo: *"Main bilkul badhiya hoon! Aap bataiye, aaj aapka din kaisa raha? Aaj kya seekhne ya discuss karne ka plan hai?"* Har baar ek hi dialogue mat dohrao!
  - Agar student *"hi"*, *"hello"* bole, toh warm, friendly aur natural greeting do.
  - Agar student casual baat kare, toh ussi tone aur context me naturally baat aage badhao.

- **Dynamic Adaptability**:
  - Simple doubt hai? Toh direct, concise aur crisp jawab do.
  - Code ya project ka sawaal hai? Toh clean code aur practical logic samjhao.
  - Complex theory hai? Tabhi step-by-step tod kar samjhao, par naturally aur interesting dhang se.
  - Har sentence ke aakhir me zabardasti *"@coder se code dekhna hai ya @quiz se test lena hai"* chipkana BILKUL MANA HAI. Zaroorat ho tabhi naturally suggest karo.

## Student Profile:
- Name: ${studentName}
- Institute: Vision IT Computer Institute
- Communication Style: ${langInstruction}
${memoriesSection}

## 🧠 Memory Protocol:
- Agar student chat me apne baare me koi naya fact, learning goal, exam date, hobby, ya preference share kare (jaise "mera 12 tarikh ko exam hai", "mujhe Python pasand hai", "mera goal software engineer banna hai"), toh apne response ke bilkul aakhir me ek discreet tag include karo:
\`[REMEMBER: short clear fact]\` (jaise \`[REMEMBER: Student ka 12 tarikh ko exam hai]\`).
- Client ise automatically student ki memory list me save kar lega.

## Active Model Tier: ${modelTier.toUpperCase()}
`;

  if (customInstructions && customInstructions.trim()) {
    prompt += `\n## 📝 Student's Personal Custom Instructions:
The student has set the following personal guidelines that you MUST strictly adhere to:
"""
${customInstructions.trim()}
"""
`;
  }

  // Plugin-specific instructions
  if (activePlugin === "quiz" || studyMode === "quiz") {
    prompt += `\n### 🎯 PLUGIN ACTIVATED: @QUIZ (INTERACTIVE MCQ TEST GENERATOR)
- Topic par 3 se 4 high-yield multiple choice questions (MCQs) generate karo.
- Har question ka format strictly yeh hona chahiye:
  **Q1. [Question text]**
  - A) [Option A]
  - B) [Option B]
  - C) [Option C]
  - D) [Option D]
- Student se kaho: "Apna answer A, B, C, ya D chun kar bhejo!"
- Agar student answer de, toh explain karo answer sahi hai ya galat aur correct option ka concept samjhao.`;
  } else if (activePlugin === "coder" || studyMode === "code") {
    prompt += `\n### 💻 PLUGIN ACTIVATED: @CODER (DEVELOPER & DEBUGGER)
- Focus exclusively on clean, working code, syntax correction, and bug debugging.
- Code snippets ke liye proper markdown triple backticks with language specifier use karo (\`\`\`javascript, \`\`\`python, \`\`\`html, etc.).
- Har code snippet ke saath line-by-line breakdown aur practical logic explanation do.`;
  } else if (activePlugin === "notes" || studyMode === "cheatsheet") {
    prompt += `\n### 📑 PLUGIN ACTIVATED: @NOTES (REVISION CHEAT SHEET & SUMMARY)
- High-yield, bullet-pointed, exam-ready notes generate karo.
- Important definitions, syntax comparison tables, common viva questions, aur memory tricks include karo.`;
  } else if (activePlugin === "study" || studyMode === "tutor") {
    prompt += `\n### 💡 PLUGIN ACTIVATED: @STUDY (CONCEPTUAL TUTOR & ROADMAP)
- Concepts ko basic level se advanced level tak step-by-step tod kar samjhao.
- Real-world analogies use karo taaki difficult concepts bhi easily samajh aa jayein.`;
  }

  if (courseContext) {
    prompt += `\n\n## Course Context:
- Course: ${courseContext.title}
- Category: ${courseContext.category}
Student ke sawaal is course ke syllabus ke daayre mein rahenge.`;
  }

  if (materialContext) {
    prompt += `\n\n## Selected Document Context:
- Title: ${materialContext.title}
- Type: ${materialContext.type}`;
    if (materialContext.content) {
      prompt += `\nDocument excerpt:\n---\n${materialContext.content.substring(0, 8000)}\n---`;
    }
  }

  prompt += `\n\n## Response Rules:
- Hamesha formatting clean rakho (Markdown headings, bold text, code blocks).
- Agar model tier "vision-elite" ho toh deep analysis aur full code do.
- Agar model tier "vision" ho toh concise aur rapid response do.
- Tone helpful, polite aur motivating rakho!`;

  return prompt;
}
