import { useState, useRef, useEffect } from "react";
import Chatbotcon from "./Chatbotcon";
import ChatForm from "./ChatForm";
import ChatMessage from "./ChatMessage";
import { companyInfo } from "./companyinfo";
import './chatbot.css';

interface ChatMessageItem {
  hideInChat?: boolean;
  role: "model" | "user";
  text: string;
  isError?: boolean;
}
const Chatbot = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessageItem[]>([{
    hideInChat: true,
    role: "model",
    text: companyInfo
  }]);
  const [showChatbot, setShowChatbot] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [usingLocal, setUsingLocal] = useState(false);
  const tools = [{
    function_declarations: [{
      name: "get_jersey_recommendation",
      description: "Search for a jersey based on club, season, kit type, and user biometrics",
      parameters: {
        type: "OBJECT",
        properties: {
          club: { type: "STRING", description: "Club name (e.g., Real Madrid, Manchester United)" },
          season: { type: "STRING", description: "Season (e.g., 2023/24, 24/25)" },
          kit_type: { type: "STRING", description: "Home, Away, or Third" },
          player_name: { type: "STRING", description: "Player name if custom embroidery requested" },
          height_cm: { type: "NUMBER", description: "User height in centimeters" },
          weight_kg: { type: "NUMBER", description: "User weight in kilograms" },
          age: { type: "NUMBER", description: "User age" },
          gender: { type: "STRING", description: "male or female" }
        },
        required: ["club", "height_cm", "weight_kg", "age", "gender"]
      }
    }]
  }];
  const updateHistoryMessage = (text: string, isError = false) => {
    setChatHistory(prev => [
      ...prev.filter(msg => msg.text !== "chnw bch n9ollou hedha taw.."),
      { role: 'model', text, isError, hideInChat: false }
    ]);
  }
  const systemPrompt = `You are Tempest, a virtual shopping assistant for an e-commerce store specializing in football jerseys. Your task is to help users find the perfect jersey based on their preferences and physical attributes. Use the provided tools to search the product database when necessary.
Be polite, concise, and professional in your responses. Always aim to assist the user in finding the best jersey that fits their needs. If you need to gather more information from the user, ask clear and relevant questions.`;

  const generateBotResponse = async (history: ChatMessageItem[]) => {
    const detectFunctionCall = (data: any, raw: string) => {
      if (data?.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
        return data.candidates[0].content.parts[0].functionCall;
      }
      try {
        const trimmed = raw.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
          const maybe = JSON.parse(trimmed);
          if (maybe && maybe.name && maybe.arguments) return maybe;
        }
      } catch (e) {
        return null; 
      }
      return null;
    };

    if (!(import.meta.env as any).VITE_API_URL) {
      updateHistoryMessage('Chat API not configured.', true);
      return;
    }
    if (isThinking) return;
    setIsThinking(true);
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        tools: tools,
        system_instruction: { parts: [{ text: systemPrompt }] }
      })
    };
        try {
      const controller = new AbortController();
      const timeoutMs = 8000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      let response: Response | null = null;
      try {
        response = await fetch((import.meta.env as any).VITE_API_URL, { 
            ...requestOptions, 
            signal: controller.signal 
        });
      } catch (fetchErr) {
        console.warn('LLM fetch failed or timed out, falling back to localReco', fetchErr);
        clearTimeout(timeoutId);
        setUsingLocal(true);
        try {
          const allUserText = history
            .filter(h => h.role === 'user')
            .map(h => h.text)
            .join(' ');
          const parsed = ((): any => {
            const text = allUserText || '';
            const lowerText = text.toLowerCase();
            const seasonMatch = text.match(/(\d{4})[\s\/\-]+(\d{2,4})/) || text.match(/(\d{2})[\s\/\-]+(\d{2})/);
            const kitMatch = lowerText.match(/\b(home|away|third)\b/);
            const heightMatch = text.match(/(\d{3})\s*([a-zöäå]+)?/i);
            const weightMatch = text.match(/(\d{2})\s*(kg|kilo|k)?/i);
            let clubCandidate = '';
            const commonClubs = ['real madrid', 'barcelona', 'manchester city', 'manchester united', 'liverpool', 'chelsea', 'juventus', 'inter', 'bayern', 'psg', 'esperance'];
            for (const club of commonClubs) {
              if (lowerText.includes(club)) {
                clubCandidate = club;
                break;
              }
            }
            const res: any = {};
            if (clubCandidate) res.club = clubCandidate;
            if (seasonMatch?.[0]) res.season = seasonMatch[0].replace(/\s+/g, '/');
            if (kitMatch?.[1]) res.kit_type = kitMatch[1];
            if (heightMatch?.[1]) res.height_cm = parseInt(heightMatch[1], 10);
            if (weightMatch?.[1]) res.weight_kg = parseInt(weightMatch[1], 10);
            return res;
          })();

          const recoResp = await fetch('/api/chat/local_reco', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed || {})
          });
          const recoData = await recoResp.json();
          if (recoData && recoData.zero_results) {
            const suggestions = (recoData.suggestions || []).slice(0, 3).join(', ');
            updateHistoryMessage(`Local assistant: no matches. Suggestions: ${suggestions}`);
          } else if (recoData && Array.isArray(recoData.matches) && recoData.matches.length > 0) {
            const first = recoData.matches[0];
            const sizeText = recoData.recommended_size ? `Recommended size: ${recoData.recommended_size}. ` : '';
            updateHistoryMessage(`Local assistant: ${sizeText}${first.name} — /product/${first.id}`);
          } else {
            updateHistoryMessage('Local assistant: no results.');
          }
        } catch (e) {
          console.error('Local fallback failed', e);
          updateHistoryMessage('Upstream LLM unreachable and local fallback failed.', true);
        } finally {
          setUsingLocal(false);
        }
        return;
      } finally {
        clearTimeout(timeoutId);
      }
      if (response && response.status === 429) {
        setUsingLocal(true);
        try {
           updateHistoryMessage('Upstream rate-limited', true);
        } catch (e) {
           console.error('Local fallback failed', e);
           updateHistoryMessage('Upstream rate-limited and local fallback failed.', true);
        } finally {
          setUsingLocal(false);
        }
        return;
      }
      const raw = await response.text();
      if (!raw) throw new Error('Empty response from Chat API');
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.error("Failed to parse JSON", e);
        throw new Error("Invalid JSON response");
      }
      let apiResponseText = "";
      const candidate = data?.candidates?.[0];
      const part = candidate?.content?.parts?.[0];
      if (part?.text) {
        apiResponseText = part.text.replace(/\n/g, ' ').trim();
      }
      const functionCall = detectFunctionCall(data, raw);
      if (functionCall) {
        console.log("Triggering DB Search...");
        let funcName = functionCall.name || functionCall.function_name || functionCall.function;
        let funcArgs = functionCall.arguments || functionCall.args || functionCall.payload || null;
        if (typeof funcArgs === 'string') {
          try { funcArgs = JSON.parse(funcArgs); } catch (e) { /* ignore */ }
        }
        console.debug('[chat] detected function call', funcName, funcArgs);
        if (['search_jersey', 'searchJersey', 'get_jersey_recommendation', 'getJerseyRecommendation'].includes(funcName)) {
          try {
            const fnResp = await fetch('/api/chat/search_jersey', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(funcArgs || {})
            });
            const fnData = await fnResp.json();
            const augmented = [...contents]; 
            augmented.push({ 
                role: 'model', 
                parts: [{ text: JSON.stringify({ name: funcName, result: fnData }) }] 
            });
            const followResp = await fetch((import.meta.env as any).VITE_API_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  system_instruction: { parts: [{ text: systemPrompt }] }, 
                  tools, 
                  generationConfig: { temperature: 0.2, topP: 0.8, topK: 40 }, 
                  contents: augmented 
               })
            });
            
            const followRaw = await followResp.text();
            let followData = null;
            try { followData = JSON.parse(followRaw); } catch (e) { followData = null; }

            const safe = (s: any) => (typeof s === 'string' ? s : (s == null ? '' : String(s)));
            let finalText = null;
            
            if (followData?.candidates?.[0]?.content) {
              finalText = safe(followData.candidates[0].content.parts[0].text).replace(/\n/g, ' ').trim();
            } else {
              finalText = safe(followRaw).replace(/\n/g, ' ').trim();
            }
            updateHistoryMessage(finalText);
            return;
          } catch (e: unknown) {
            console.error('[chat] function execution failed', e);
            updateHistoryMessage('Failed to execute function ' + funcName, true);
            return;
          }
        }
      }

      if (apiResponseText) {
        updateHistoryMessage(apiResponseText);
      }
    } catch (error: unknown) {
      console.error('[chat] request failed', error);
      updateHistoryMessage(error instanceof Error ? error.message : String(error), true);
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  return (
    <div className={`container ${showChatbot ? 'show-chatbot' : ""}`}>
      <button onClick={() => setShowChatbot(prev => !prev)} id="chatbot-toggler">
        <span className="material-symbols-outlined">mode_comment</span>
        <span className="material-symbols-outlined">close</span>
      </button>

      <div className="chatbot-popup">
        <div className="chat-header">
          <div className="Header-info">
            <Chatbotcon />
            <h2 className="logo-text">Tempest</h2>
          </div>
          {usingLocal && (
            <div className="local-fallback-pill">Using local assistant</div>
          )}
          <button onClick={() => setShowChatbot(prev => !prev)}
            className="material-symbols-outlined">keyboard_arrow_down</button>
        </div>
       
        <div ref={chatBodyRef} className="chat-body">
          <div className="message bot-message">
            <Chatbotcon />
            <p className="message-text">Aslemaaaa , kife n3awnk lyom?</p>
          </div>
          {chatHistory.map((chat, index) => (
             <ChatMessage key={index} chat={chat} onKitTypeSelected={() => {}} />
          ))}
        </div>
        <div className="chat-footer">
            <div style={{display: 'flex', gap: 8}}>
            <ChatForm chatHistory={chatHistory} setChatHistory={setChatHistory} generateBotResponse={generateBotResponse} isThinking={isThinking} />
          </div>
        </div>
    </div>
    </div>
  );
};

export default Chatbot;
