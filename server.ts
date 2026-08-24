import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Gemini AI 클라이언트 인스턴스 (Lazy init & User-Agent 헤더 설정)
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 룰 기반 스마트 기본 분류 (API 미설정 또는 네트워크 오류 시 폴백)
function fallbackCategorize(merchant: string): { category: string; categoryKey: string; emoji: string; reason: string } {
  const text = merchant.toLowerCase().trim();

  if (/배달|요기요|배민|쿠팡이츠|포장/.test(text)) {
    return { category: "배달음식", categoryKey: "delivery", emoji: "🛵", reason: "배달 및 외식 키워드 감지" };
  }
  if (/식당|밥|식사|찌개|고기|갈비|삼겹|국밥|치킨|피자|버거|맥도날드|롯데리아|서브웨이|김밥|우동|라멘|초밥|스시|카페|스타벅스|메가커피|투썸|이디야|컴포즈|빽다방|커피|베이커리|빵집|파리바게뜨|뚜레쥬르/.test(text)) {
    return { category: "식비/외식", categoryKey: "food", emoji: "🍔", reason: "식당 및 카페 키워드 감지" };
  }
  if (/마트|이마트|홈플러스|롯데마트|코스트코|하나로|농협|식자재|슈퍼|정육|청과|야채|gs25|cu|세븐일레븐|이마트24|편의점|쿠팡프레시|컬리|마켓컬리/.test(text)) {
    return { category: "식료품/장보기", categoryKey: "grocery", emoji: "🛒", reason: "마트 및 식료품 키워드 감지" };
  }
  if (/교통|지하철|버스|택시|카카오t|티머니|주유|주유소|gs칼텍스|sk에너지|s-oil|오일|톨게이트|하이패스|주차|코레일|ktx|srt|항공|비행기/.test(text)) {
    return { category: "교통/차량", categoryKey: "transport", emoji: "🚗", reason: "교통 및 주유 키워드 감지" };
  }
  if (/쇼핑|무신사|지그재그|에이블리|자라|zara|유니클로|나이키|아디다스|백화점|아울렛|다이소|올리브영|쿠팡|네이버페이|11번가|g마켓|옥션/.test(text)) {
    return { category: "쇼핑/패션", categoryKey: "shopping", emoji: "🛍️", reason: "쇼핑몰 및 구매 키워드 감지" };
  }
  if (/영화|cgv|메가박스|롯데시네마|공연|전시|도서|교보문고|알라딘|예스24|서점|음악|게임|스팀|playstation|닌텐도|취미|운동|헬스|필라테스|골프/.test(text)) {
    return { category: "문화/여가", categoryKey: "culture", emoji: "🎬", reason: "문화 및 여가 활동 키워드 감지" };
  }
  if (/넷플릭스|유튜브|디즈니|티빙|웨이브|왓챠|스포티파이|멜론|지니|밀리의서재|리디|쿠팡와우|네이버플러스|구독|chatgpt|클라우드|icloud/.test(text)) {
    return { category: "구독서비스", categoryKey: "subscription", emoji: "💳", reason: "구독 및 정기결제 키워드 감지" };
  }
  if (/병원|의원|내과|이비인후과|치과|안과|피부과|한의원|정형외과|약국|영양제|검진|의료/.test(text)) {
    return { category: "의료/건강", categoryKey: "medical", emoji: "💊", reason: "의료 및 약국 키워드 감지" };
  }
  if (/관리비|전기세|가스비|수도세|통신비|skt|kt|lgu\+|알뜰폰|인터넷|청소|세탁|생활용품|인테리어|이케아|가구|주거/.test(text)) {
    return { category: "주거/통신", categoryKey: "living", emoji: "🏠", reason: "주거 및 통신비 키워드 감지" };
  }
  if (/축의금|부의금|경조사|선물|모임|회비|선물하기|기부|용돈/.test(text)) {
    return { category: "경조사/선물", categoryKey: "social", emoji: "🎁", reason: "경조사 및 선물 키워드 감지" };
  }

  return { category: "기타/잡비", categoryKey: "other", emoji: "📦", reason: "기본 분류 항목" };
}

// API: 지출 사용처 AI 자동 분류
app.post("/api/categorize-expense", async (req, res) => {
  try {
    const { merchant, amount } = req.body;
    if (!merchant || typeof merchant !== "string" || merchant.trim() === "") {
      return res.status(400).json({ error: "사용처(가맹점명)를 입력해주세요." });
    }

    const ai = getAIClient();

    // AI API 미연결 시 즉시 스마트 룰 기반 분류 반환
    if (!ai || !process.env.GEMINI_API_KEY) {
      const fallback = fallbackCategorize(merchant);
      return res.json({
        ...fallback,
        source: "rule-based",
      });
    }

    try {
      const prompt = `사용자가 가계부에 기록한 지출 항목 '${merchant}' (금액: ${amount ? amount + '원' : '미정'})을 아래 11개 카테고리 중 가장 적합한 하나로 분류해주세요.
카테고리 후보:
1. "식비/외식" (key: "food", emoji: "🍔")
2. "배달음식" (key: "delivery", emoji: "🛵")
3. "식료품/장보기" (key: "grocery", emoji: "🛒")
4. "교통/차량" (key: "transport", emoji: "🚗")
5. "쇼핑/패션" (key: "shopping", emoji: "🛍️")
6. "문화/여가" (key: "culture", emoji: "🎬")
7. "주거/통신" (key: "living", emoji: "🏠")
8. "구독서비스" (key: "subscription", emoji: "💳")
9. "의료/건강" (key: "medical", emoji: "💊")
10. "경조사/선물" (key: "social", emoji: "🎁")
11. "기타/잡비" (key: "other", emoji: "📦")`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a smart Korean personal finance and household ledger categorization assistant. Output structured JSON categorizing the merchant with a short Korean reason.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "카테고리 표시 이름 (예: 식비/외식, 교통/차량 등)",
              },
              categoryKey: {
                type: Type.STRING,
                description: "food, delivery, grocery, transport, shopping, culture, living, subscription, medical, social, other 중 하나",
              },
              emoji: {
                type: Type.STRING,
                description: "해당 카테고리를 대표하는 이모지 1개",
              },
              reason: {
                type: Type.STRING,
                description: "이 카테고리로 분류한 간단한 한국어 이유 (10자 이내)",
              },
            },
            required: ["category", "categoryKey", "emoji", "reason"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({
        category: parsed.category || "식비/외식",
        categoryKey: parsed.categoryKey || "other",
        emoji: parsed.emoji || "🧾",
        reason: parsed.reason || "AI 자동 분류",
        source: "gemini-3.7-flash",
      });
    } catch (aiError) {
      console.warn("Gemini categorization error, using fallback:", aiError);
      const fallback = fallbackCategorize(merchant);
      return res.json({
        ...fallback,
        source: "rule-based-fallback",
      });
    }
  } catch (error) {
    console.error("Endpoint error:", error);
    res.status(500).json({ error: "지출 분류 중 오류가 발생했습니다." });
  }
});

// Vite middleware and static file serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
