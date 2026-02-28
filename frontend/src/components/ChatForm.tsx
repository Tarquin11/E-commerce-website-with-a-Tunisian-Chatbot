import React, { useRef, FormEvent } from "react";
interface ChatFormProps {
    chatHistory: any[];
    setChatHistory: React.Dispatch<React.SetStateAction<any[]>>;
    generateBotResponse: (history: any[]) => void;
    isThinking: boolean;
}

const ChatForm = ({ chatHistory, setChatHistory, generateBotResponse, isThinking }: ChatFormProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleFromSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (isThinking) return;
        const userMessage = inputRef.current?.value.trim();
        if (!userMessage) return;
        if (inputRef.current) inputRef.current.value = "";

        const userMessageObject = { 
            id: crypto.randomUUID(), 
            role: 'user', 
            text: userMessage 
        };
        const newHistory = [...chatHistory, userMessageObject];
        setChatHistory(newHistory);
        generateBotResponse(newHistory);
    };

    return (
        <form action="#" className="chat-form" onSubmit={handleFromSubmit}>
            <input 
                ref={inputRef} 
                type="text" 
                placeholder="Message..."
                className="message-input" 
                required 
                disabled={isThinking} 
            />
            <button 
                type="submit"
                className="material-symbols-outlined" 
                disabled={isThinking}
            >
                Arrow_upward
            </button>
        </form>
    );
};

export default ChatForm;