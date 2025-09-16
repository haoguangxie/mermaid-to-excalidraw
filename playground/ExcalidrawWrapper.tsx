import { useEffect, useState } from "react";
import {
  Excalidraw,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types.js";
import { graphToExcalidraw } from "../src/graphToExcalidraw";
import { DEFAULT_FONT_SIZE } from "../src/constants";
import type { MermaidData } from "./";

interface ExcalidrawWrapperProps {
  mermaidDefinition: MermaidData["definition"];
  mermaidOutput: MermaidData["output"];
}

const ExcalidrawWrapper = ({
  mermaidDefinition,
  mermaidOutput,
}: ExcalidrawWrapperProps) => {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  // 强制应用中文字体
  useEffect(() => {
    // 创建字体加载器
    const loadFont = async () => {
      try {
        const font = new FontFace('ShouShuTi', 'url("/fonts/ShouShuTi-fixed.ttf")');
        await font.load();
        document.fonts.add(font);
        console.log('Chinese font loaded successfully');
        
        // 全局覆盖Canvas的原型方法
        const CanvasRenderingContext2D = window.CanvasRenderingContext2D;
        const originalFillText = CanvasRenderingContext2D.prototype.fillText;
        const originalStrokeText = CanvasRenderingContext2D.prototype.strokeText;
        
        CanvasRenderingContext2D.prototype.fillText = function(text, x, y, maxWidth) {
          const chineseRegex = /[\u4e00-\u9fff]/;
          if (chineseRegex.test(text)) {
            // 中文使用ShouShuTi字体
            const currentFont = this.font;
            this.font = currentFont.replace(/^([^0-9]*[0-9]+px\s*)(.*)/, '$1ShouShuTi, $2');
          }
          return originalFillText.call(this, text, x, y, maxWidth);
        };
        
        CanvasRenderingContext2D.prototype.strokeText = function(text, x, y, maxWidth) {
          const chineseRegex = /[\u4e00-\u9fff]/;
          if (chineseRegex.test(text)) {
            // 中文使用ShouShuTi字体
            const currentFont = this.font;
            this.font = currentFont.replace(/^([^0-9]*[0-9]+px\s*)(.*)/, '$1ShouShuTi, $2');
          }
          return originalStrokeText.call(this, text, x, y, maxWidth);
        };
        
        console.log('Canvas prototype methods overridden globally');
        
      } catch (error) {
        console.error('Failed to load Chinese font:', error);
      }
    };
    
    loadFont();

    const style = document.createElement('style');
    style.textContent = `
      /* 编辑时支持中文字体 */
      .excalidraw .excalidraw-textEditorContainer textarea {
        font-family: "ShouShuTi", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }

    if (mermaidDefinition === "" || mermaidOutput === null) {
      excalidrawAPI.resetScene();
      return;
    }

    const { elements, files } = graphToExcalidraw(mermaidOutput, {
      fontSize: DEFAULT_FONT_SIZE,
    });

    excalidrawAPI.updateScene({
      elements: convertToExcalidrawElements(elements),
    });
    excalidrawAPI.scrollToContent(excalidrawAPI.getSceneElements(), {
      fitToContent: true,
    });

    if (files) {
      excalidrawAPI.addFiles(Object.values(files));
    }
  }, [mermaidDefinition, mermaidOutput]);

  return (
    <div className="excalidraw-wrapper">
      <Excalidraw
        initialData={{
          appState: {
            viewBackgroundColor: "#fafafa",
            currentItemFontFamily: 1,
          },
        }}
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
      />
    </div>
  );
};

export default ExcalidrawWrapper;
