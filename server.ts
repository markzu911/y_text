import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware for JSON parsing with higher limit for base64 images
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route: Analyze Image
  app.post("/api/analyze", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ error: "Image is required" });

      const prompt = "分析这张饮料图片。识别饮品类型、主色调、可见配料（如冰块、水果、薄荷）以及氛围（如：清爽、温暖、优雅）。提供一段简短的描述，用于生成一张创意海报。";

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite", // Using a reliable model for analysis
        contents: {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: image.split(',')[1]
              }
            }
          ]
        }
      });

      res.json({ analysis: response.text || '一杯清爽的饮品' });
    } catch (error: any) {
      console.error("Analysis Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Generate Poster
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, image, ratio, modelType, quality } = req.body;
      
      const modelName = modelType === 'Gemini 3.1' ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image';

      const parts: any[] = [{ text: prompt }];
      if (image) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: image.split(',')[1]
          }
        });
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: ratio,
            ...(modelType === 'Gemini 3.1' ? { imageSize: quality } : {})
          }
        }
      });

      let imageData: string | null = null;
      
      // Correct extraction of image part
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageData = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!imageData) throw new Error("No image data returned from AI");
      res.json({ image: imageData });
    } catch (error: any) {
      console.error("Generation Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite integration
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
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
