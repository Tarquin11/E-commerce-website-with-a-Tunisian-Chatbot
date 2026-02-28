import Chatbotcon from "./Chatbotcon";
import { addToCart } from '../api/api';

/**
 * Converts URLs in text to clickable links
 * @param {string} text - The text that may contain URLs
 * @returns {Array} Array of React elements (text and links)
 */
const parseLinks = (text) => {
  if (!text) return [text];
  
  // URL regex pattern - matches http/https URLs and relative URLs like /product/123
  const urlRegex = /(https?:\/\/[^\s]+|\/[^\s]+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;
  
  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      // Handle newlines in text
      if (textBefore.includes('\n')) {
        const lines = textBefore.split('\n');
        lines.forEach((line, idx) => {
          if (line) parts.push(line);
          if (idx < lines.length - 1) parts.push(<br key={`br-${keyCounter++}`} />);
        });
      } else {
        parts.push(textBefore);
      }
    }
    
    // Add the URL as a clickable link
    const url = match[0];
    const isAbsoluteUrl = url.startsWith('http://') || url.startsWith('https://');
    parts.push(
      <a 
        key={`link-${keyCounter++}`}
        href={url} 
        target={isAbsoluteUrl ? "_blank" : "_self"}
        rel={isAbsoluteUrl ? "noopener noreferrer" : undefined}
        style={{
          color: '#007bff',
          textDecoration: 'underline',
          cursor: 'pointer',
          wordBreak: 'break-all'
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {url}
      </a>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    // Handle newlines in remaining text
    if (remainingText.includes('\n')) {
      const lines = remainingText.split('\n');
      lines.forEach((line, idx) => {
        if (line) parts.push(line);
        if (idx < lines.length - 1) parts.push(<br key={`br-${keyCounter++}`} />);
      });
    } else {
      parts.push(remainingText);
    }
  }
  
  // If no URLs found, handle newlines in the original text
  if (parts.length === 0 || (parts.length === 1 && typeof parts[0] === 'string' && parts[0] === text)) {
    if (text.includes('\n')) {
      const lines = text.split('\n');
      return lines.map((line, idx) => (
        <span key={`line-${idx}`}>
          {line}
          {idx < lines.length - 1 && <br />}
        </span>
      ));
    }
    return [text];
  }
  
  return parts;
};

/**
 * @param {{ 
 * chat: { role: string, text: string, id?: string, isError?: boolean, meta?: any, reco?: any, hideInChat?: boolean }, 
 * onKitTypeSelected: (type: string) => void,
 * flowStep?: string
 * }} props
 */
const ChatMessage = ({ chat, onKitTypeSelected, flowStep }) => {
  
  /** @param {number|string} productId */
  const handleAddToCart = async (productId) => {
    try {
      const idAsNumber = typeof productId === 'string' ? Number(productId) : productId;
      await addToCart(idAsNumber, 1);
      alert('Added to cart');
    } catch (err) {
      console.error(err);
      alert('Failed to add to cart. Please login.');
    }
  };

  const reco = chat?.meta?.reco || chat?.reco || (chat?.meta && chat.meta.reco);
  const needsKit = flowStep === "kit";
  const availableTypes = (chat?.meta?.available_types) || (chat?.meta?.reco && chat.meta.reco.available_types) || [];

  return (
    !chat.hideInChat && (
      <div className={`message ${chat.role === "model" ? 'bot' : 'user'}-message ${chat.isError ? 'error' : ''}`}>
        {chat.role === "model" && <Chatbotcon />}
        <p className="message-text">
          {parseLinks(chat.text)}
        </p>
        
        {reco && Array.isArray(reco.matches) && reco.matches.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {reco.matches.map((/** @type {any} */ match) => (
              <div key={match.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9em', fontWeight: 600 }}>{match.name}</div>
                  <div style={{ fontSize: '0.85em', color: '#666' }}>${match.price}</div>
                </div>
                <button className="btn btn-primary" onClick={() => handleAddToCart(match.id)}>Add</button>
                <a className="btn" href={`/product/${match.id}`}>View</a>
              </div>
            ))}
          </div>
        )}

        {needsKit && availableTypes.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div style={{ alignSelf: 'center', fontWeight: 600, marginRight: 8 }}>Which kit type?</div>
            {availableTypes.map((/** @type {string} */ t) => (
              <button key={t} className="btn" onClick={() => onKitTypeSelected(t)}>
                {t}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  );
};

export default ChatMessage;