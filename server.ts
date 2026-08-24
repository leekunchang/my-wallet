import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Gemini AI 클라이언트 초기화 (User-Agent 헤더 필수)
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

// 룰 기반 스마트 폴백 카테고리 분류기 (오프라인/API 키 없을 때도 즉시 작동)
function fallbackCategorize(merchant: string): { category: string; categoryKey: string; emoji: string; reason: string } {
  const text = merchant.toLowerCase().trim();

  if (/스타벅스|메가커피|컴포즈|투썸|이디야|빽다방|커피|카페|베이커리|파리바게뜨|뚜레쥬르|디저트|케이크|도넛|식당|밥|국밥|김밥|삼겹살|고기|갈비|짜장|짬뽕|마라탕|스시|초밥|라멘|파스타|치킨|피자|버거|맥도날드|롯데리아|버거킹|써브웨이|한식|중식|일식|양식|분식/.test(text)) {
    if (/배달의민족|배민|요기요|쿠팡이츠|땡겨요/.test(text)) {
      return { category: "배달/외식", categoryKey: "delivery", emoji: "🛵", reason: "배달 주문 플랫폼 지출" };
    }
    return { category: "식비/카페", categoryKey: "food", emoji: "🍚", reason: "음식점 및 카페/베이커리 지출" };
  }

  if (/배달의민족|배민|요기요|쿠팡이츠|땡겨요/.test(text)) {
    return { category: "배달/외식", categoryKey: "delivery", emoji: "🛵", reason: "배달 주문 플랫폼 지출" };
  }

  if (/마트|이마트|홈플러스|롯데마트|하나로|노브랜드|쿠팡|다이소|편의점|gs25|cu|세븐일레븐|이마트24|마켓컬리|생필품|장보기/.test(text)) {
    return { category: "마트/생필품", categoryKey: "grocery", emoji: "🛒", reason: "장보기 및 생필품 지출" };
  }

  if (/교통|지하철|버스|티머니|카카오t|카카오택시|택시|우버|주유|gs칼텍스|sk에너지|s-oil|오일|주차|하이패스|코레일|ktx|srt|항공|비행기/.test(text)) {
    return { category: "교통/차량", categoryKey: "transport", emoji: "🚇", reason: "대중교통 및 차량 관련 지출" };
  }

  if (/올리브영|무신사|지그재그|에이블리|백화점|아울렛|자라|zara|유니클로|나이키|아디다스|의류|옷|신발|가방|화장품|쇼핑/.test(text)) {
    return { category: "쇼핑/패션", categoryKey: "shopping", emoji: "🛍️", reason: "패션, 뷰티 및 쇼핑 지출" };
  }

  if (/영화|cgv|메가박스|롯데시네마|헬스|피트니스|필라테스|요가|운동|수영|골프|게임|스팀|닌텐도|도서|교보문고|알라딘|예스24|공연|전시|취미/.test(text)) {
    return { category: "문화/여가", categoryKey: "culture", emoji: "🎬", reason: "문화 여가 및 운동/취미 지출" };
  }

  if (/넷플릭스|유튜브|youtube|스포티파이|멜론|디즈니|왓챠|티빙|웨이브|와우회원|네이버플러스|정기결제|구독/.test(text)) {
    return { category: "구독/정기결제", categoryKey: "subscription", emoji: "📺", reason: "콘텐츠 및 멤버십 정기 구독료" };
  }

  if (/병원|의원|약국|내과|이비인후과|치과|안과|피부과|한의원|정형외과|영양제|비타민|치료/.test(text)) {
    return { category: "의료/건강", categoryKey: "medical", emoji: "💊", reason: "병원 진료 및 약국/건강 지출" };
  }

  if (/관리비|전기세|가스비|수도세|통신비|skt|kt|lgu\+|알뜰폰|인터넷|월세|공과금/.test(text)) {
    return { category: "주거/통신/공과금", categoryKey: "living", emoji: "💡", reason: "주거 관리비 및 공과금/통신비" };
  }

  if (/축의금|조의금|부의금|선물|카카오선물|회비|모임/.test(text)) {
    return { category: "경조사/선물", categoryKey: "social", emoji: "🎁", reason: "경조사 및 선물/회비 지출" };
  }

  return { category: "기타", categoryKey: "other", emoji: "📦", reason: "일반 지출" };
}

// API: 지출처 AI 카테고리 자동 분류
app.post("/api/categorize-expense", async (req, res) => {
  try {
    const { merchant, amount } = req.body;
    if (!merchant || typeof merchant !== "string" || merchant.trim() === "") {
      return res.status(400).json({ error: "지출처를 입력해주세요." });
    }

    const ai = getAIClient();

    // AI API 키가 없는 경우 fallback 즉시 반환
    if (!ai || !process.env.GEMINI_API_KEY) {
      const fallback = fallbackCategorize(merchant);
      return res.json({
        ...fallback,
        source: "rule-based",
      });
    }

    try {
      const prompt = `사용자가 가계부에 입력한 지출처 '${merchant}' (금액: ${amount ? amount + '원' : '미입력'})에 대해 가장 적절한 소비 카테고리를 분류해주세요.
반드시 아래 10가지 카테고리 중 하나를 선택해야 합니다:
1. "식비/카페" (key: "food", emoji: "🍚")
2. "배달/외식" (key: "delivery", emoji: "🛵")
3. "마트/생필품" (key: "grocery", emoji: "🛒")
4. "교통/차량" (key: "transport", emoji: "🚇")
5. "쇼핑/패션" (key: "shopping", emoji: "🛍️")
6. "문화/여가" (key: "culture", emoji: "🎬")
7. "주거/통신/공과금" (key: "living", emoji: "💡")
8. "구독/정기결제" (key: "subscription", emoji: "📺")
9. "의료/건강" (key: "medical", emoji: "💊")
10. "경조사/선물" (key: "social", emoji: "🎁")
11. "기타" (key: "other", emoji: "📦")`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are a smart Korean personal finance and household ledger categorization assistant. Output structured JSON categorizing the merchant.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "한국어 카테고리명 (예: 식비/카페, 마트/생필품, 배달/외식, 교통/차량, 쇼핑/패션, 문화/여가, 주거/통신/공과금, 구독/정기결제, 의료/건강, 경조사/선물, 기타)",
              },
              categoryKey: {
                type: Type.STRING,
                description: "food, delivery, grocery, transport, shopping, culture, living, subscription, medical, social, other 중 하나",
              },
              emoji: {
                type: Type.STRING,
                description: "해당 카테고리를 대표하는 단일 이모지 (예: 🍚, 🛵, 🛒, 🚇, 🛍️, 🎬, 💡, 📺, 💊, 🎁, 📦)",
              },
              reason: {
                type: Type.STRING,
                description: "해당 지출처를 이 카테고리로 분류한 한 줄 간결한 이유 (한국어)",
              },
            },
            required: ["category", "categoryKey", "emoji", "reason"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return res.json({
        category: parsed.category || "기타",
        categoryKey: parsed.categoryKey || "other",
        emoji: parsed.emoji || "📦",
        reason: parsed.reason || "AI 자동 분류 완료",
        source: "gemini-3.7-flash",
      });
    } catch (aiError) {
      console.warn("Gemini categorization error, using smart fallback:", aiError);
      const fallback = fallbackCategorize(merchant);
      return res.json({
        ...fallback,
        source: "rule-based-fallback",
      });
    }
  } catch (error) {
    console.error("Endpoint error:", error);
    res.status(500).json({ error: "서버 처리 중 오류가 발생했습니다." });
  }
});

// Vite middleware and static serving
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
