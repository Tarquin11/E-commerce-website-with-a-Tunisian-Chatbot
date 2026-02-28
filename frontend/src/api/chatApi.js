/**
 * @param {{ systemPrompt: string, contents: any[], tools: any[], config: any }} params
 */
export async function callLLM({ systemPrompt, contents, tools, config }) {
  const apiKey = import.meta.env['VITE_GEMINI_API_KEY'];
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY not configured");

  // Convert contents to Gemini format
  const geminiContents = [];
  
  // Add system prompt as first message if needed
  geminiContents.push({
    role: 'user',
    parts: [{ text: systemPrompt }]
  });
  geminiContents.push({
    role: 'model',
    parts: [{ text: 'Understood. I will follow those instructions.' }]
  });

  // Add conversation history
  for (const content of contents) {
    const parts = [];
    
    // Handle different part types
    for (const part of content.parts || []) {
      if (part.text) {
        parts.push({ text: part.text });
      } else if (part.functionCall) {
        parts.push({ functionCall: part.functionCall });
      } else if (part.functionResponse) {
        parts.push({ functionResponse: part.functionResponse });
      }
    }
    
    // Determine role
    let role = content.role === 'model' ? 'model' : 'user';
    if (content.role === 'function') {
      role = 'function';
    }
    
    if (parts.length > 0) {
      geminiContents.push({
        role: role,
        parts: parts
      });
    }
  }

  // Convert tools to Gemini format
  const geminiTools = tools?.[0]?.function_declarations?.map((/** @type {any} */ fd) => ({
    functionDeclarations: [{
      name: fd.name,
      description: fd.description,
      parameters: {
        type: 'OBJECT',
        properties: fd.parameters?.properties || {},
        required: fd.parameters?.required || []
      }
    }]
  })) || [];

  /** @type {any} */
  const requestBody = {
    contents: geminiContents,
    generationConfig: {
      temperature: config?.temperature || 0.7,
      topP: config?.topP || 1,
      maxOutputTokens: 1024
    }
  };

  // Add tools if provided
  if (geminiTools.length > 0) {
    requestBody.tools = geminiTools;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  const raw = await res.text();
  if (!raw) throw new Error("Empty response from Gemini API");

  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    if (!res.ok) throw new Error(`Gemini API HTTP ${res.status} - ${raw}`);
    throw new Error(`Invalid JSON from Gemini: ${raw}`);
  }

  if (!res.ok) {
    const msg = data?.error?.message || data?.error || `Gemini API ${res.status}`;
    throw new Error(msg + (raw ? ` -- raw: ${raw}` : ''));
  }

  // Return Gemini response (already in correct format)
  return data;
}

/**
 * @param {object} payload
 */
export async function searchJersey(payload) {
  const res = await fetch('/api/chat/search_jersey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const raw = await res.text();
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${raw}`);
    throw new Error(`Invalid JSON response from server: ${raw}`);
  }

  if (!res.ok) throw new Error(data.error || `Search failed (HTTP ${res.status})`);

  return data;
}

/**
 * @param {object} payload
 */
export async function localReco(payload) {
  const res = await fetch('/api/chat/local_reco', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const raw = await res.text();
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    if (!res.ok) throw new Error(`HTTP ${res.status} - ${raw}`);
    throw new Error(`Invalid JSON response from server: ${raw}`);
  }
  if (!res.ok) throw new Error(data.error || `LocalReco failed (HTTP ${res.status})`);
  return data;
}