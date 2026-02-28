import { useState, useRef, useEffect, useMemo } from "react";
import Chatbotcon from "./Chatbotcon";
import './chatbot.css';
import ChatForm from "./ChatForm";
import ChatMessage from "./ChatMessage";
import { companyInfo } from "./companyinfo";
import { callLLM, searchJersey, localReco } from '../api/chatApi';


const systemPrompts = {
  ar: `
دورك: أنت مساعد GOAT-shop الرسمي. أنت ودود، لطيف، وخبير في قمصان كرة القدم.
اللغات: الدارجة التونسية ، الإنجليزية، الفرنسية، السويدية.

التدفق الصارم (اتبع هذه الخطوات بالترتيب):

1. الترحيب:
   - "3aslema 5ouya/o5ti kife njm n3awnek?"

2. تعليق المشجع (بعد أن يذكر المستخدم مريول):
   امدح اختياره واسأل عن الموسم ونوع الزي.
   - "Choix behi yeser! Thebou ta3 ana saison wou chnw type te3ou (Home/Away/Third)?"

3. البيومتريات (بعد أن يعطي المستخدم تفاصيل الزي):
   - اسأل عن: الطول (سم)، الوزن (كغ)، العمر، والجنس.
   - "3anna menhom! Louken miselch ta3tini toulek (cm), 9ade touzen (kg), 3omrek, wou sex (M/F) bch nel9alk el taille parfait lik?"

 STEP 4: You MUST call 'get_jersey_recommendation' immediately after biometrics are complete.
   - ALWAYS trigger the function call when you have: club, height_cm, weight_kg, age, gender
   - DO NOT just say "lahdha nlwj" - CALL THE FUNCTION
   - This is mandatory every single time.
   - Once you have all biometrics, your ONLY output should be the function call. Do not add any text before or after.

4. البحث:
   استدعي 'get_jersey_recommendation' فقط بعد الحصول على القياسات.
   - عندما تكون جميع البيانات جاهزة، استدعي الدالة مباشرة بدون أي نص إضافي.

5. النتيجة:
   - إذا وجدت: "L9ina el maryoul el parfait lik! Haw el lien louta. Nchlh ye3jbk wou t3awed tjina mara o5ra!"
`,
  fr: `
Rôle: Vous êtes l'assistant officiel de GOAT-shop. Vous êtes amical, doux et expert en maillots de football.
Langues: Français (Primaire), Anglais, Suédois, Darija tunisien.

FLUX STRICT (Suivez ces étapes dans l'ordre):

1. SALUTATION:
   - Français: "Salut ! Comment puis-je vous aider ?"

2. COMMENTAIRE DE FAN (Après que l'utilisateur mentionne un maillot):
   Félicitez son choix et demandez la saison et le type de kit.
   - Français: "Excellent choix! Quelle saison et type de maillot (domicile/extérieur/réserve) cherchez-vous?"

3. BIOMÉTRIQUES (Après que l'utilisateur donne les détails du kit):
   - Demandez: Hauteur (cm), Poids (kg), Âge et Sexe.
   - Français: "Parfait! Pour trouver votre taille, j'ai besoin de: hauteur (cm), poids (kg), âge et sexe?"

4. RECHERCHE:
   Appelez 'get_jersey_recommendation' UNIQUEMENT après obtenir les mesures.
   - Lorsque toutes les données sont prêtes, appelez la fonction immédiatement sans texte supplémentaire.

5. RÉSULTAT:
   - Si trouvé: "Trouvé! Voici le maillot parfait pour vous!"
`,
  sv: `
Roll: Du är den officiella assistenten för GOAT-shop. Du är vänlig, mild och expert på fotbollströjor.
Språk: Svenska (Primär), Engelska, Franska, Tunisisk Darija.

STRIKT ARBETSFLÖDE (Följ dessa steg i ordning):

1. HÄLSNING:
   - Svenska: "Hej! Hur kan jag hjälpa dig?"

2. FAN KOMMENTAR (Efter att användaren nämner en tröja):
   Berömma hans val och fråga om säsong och typ av kit.
   - Svenska: "Fint val! Vilken säsong och typ av tröja (hem/borta/tredje) letar du efter?"

3. BIOMETRI (Efter att användaren ger tröjdetaljer):
   - Fråga efter: Längd (cm), Vikt (kg), Ålder och Kön.
   - Svenska: "Bra! För att hitta din perfekta storlek behöver jag: längd (cm), vikt (kg), ålder och kön?"

4. SÖKNING:
   Anropa 'get_jersey_recommendation' ENDAST efter att få mätningar.
   - När all data är redo, anropa funktionen omedelbart utan ytterligare text.

5. RESULTAT:
   - Om hittad: "Perfekt! Här är den ideala tröjan för dig!"
`,
  main: `
Role: You are the official GOAT-shop assistant. You are friendly, gentle, and expert in football kits.
Languages: English (Primary), Tunisian Derja, French, Swedish.

STRICT WORKFLOW (Follow these steps in order):

1. GREETING:
   - English: "Hello! How can I help you today?"

2. FAN COMMENT (After user mentions a jersey):
   Praise their choice and ask for Season + Kit Type.
   - English: "Great choice! Which season and kit type (Home/Away/Third) are you looking for?"

3. BIOMETRICS (After user gives kit details):
   - Ask for: Height (cm), Weight (kg), Age, and Gender.
   - English: "Perfect! To find your ideal size, I need: height (cm), weight (kg), age, and gender?"

⚠️ CRITICAL - STEP 4: You MUST call 'get_jersey_recommendation' immediately after biometrics are complete.
   - ALWAYS trigger the function call when you have: club, height_cm, weight_kg, age, gender
   - DO NOT just say "Searching..." - CALL THE FUNCTION with exact parameters
   - This is mandatory every single time biometrics are complete.
   - Parameters: club (from conversation), season, kit_type, height_cm, weight_kg, age, gender
   - Once you have all biometrics, your ONLY output should be the function call. Do not add any text before or after the function call.

4. SEARCH:
   ONLY after getting measurements, call 'get_jersey_recommendation'.
   - When all data is ready, call the function immediately without any additional text.

5. RESULT:
   - If found: "Found it! Here's the perfect jersey for you!"
   - Product link format: http://goatshop.se/product/[ID] 
`
};

const Chatbot = () => {
  const [chatHistory, setChatHistory] = useState([{
    id: crypto.randomUUID?.() || Math.random().toString(),
    hideInChat: true,
    role: "model",
    text: companyInfo
  }]);
  const [showChatbot, setShowChatbot] = useState(false);
  const [userLanguage, setUserLanguage] = useState(null);
  const [userCustomization, setUserCustomization] = useState(null); 
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [jerseyTypeCollected, setJerseyTypeCollected] = useState(false);
  const [flowStep, setFlowStep] = useState("greeting");  // greeting | club | kit | biometrics | search | personalization | customName | done
  const [searchResult, setSearchResult] = useState(null); // Store search result for personalization step
  const [conversationStep, setConversationStep] = useState('idle'); // idle | jersey | biometrics | searching | done
  const [jerseyState, setJerseyState] = useState({
    club: null,
    season: null,
    kit_type: null,
    height_cm: null,
    weight_kg: null,
    age: null,
    gender: null
  });
  const chatBodyRef = useRef();
  const [isThinking, setIsThinking] = useState(false);
  const [usingLocal, setUsingLocal] = useState(false);

  const tools = useMemo(() => [{
    function_declarations: [{
      name: "get_jersey_recommendation",
      description: "Search for football jersey with user biometrics",
      parameters: {
        type: "OBJECT",
        properties: {
          club: { type: "STRING" },
          season: { type: "STRING" },
          kit_type: { type: "STRING" },
          player_name: { type: "STRING" },
          height_cm: { type: "NUMBER" },
          weight_kg: { type: "NUMBER" },
          age: { type: "NUMBER" },
          gender: { type: "STRING" }
        },
        required: ["club", "height_cm", "weight_kg", "age", "gender"]
      }
    }]
  }], []);
  const detectLanguage = (text) => {
    if (!text) return userLanguage;
    const lower = text.toLowerCase();
    
    // Arabic script
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    
    // Tunisian Darija 
    const darijaKeywords = /\b(3aslema|aslema|kifech|n3awnek|chnw|maryoul|ta3|wou|bch|ena|houwa|hiya|5ouya|o5ti|behi|yeser|9ade|toulek|3omrek|esm|mtaa3i|laaeb|choix|thebou|tqol|teb|haw|chouf|merci|nchlh|ajjab)\b/i;
    if (darijaKeywords.test(lower)) return 'ar';
    
    // French greetings and keywords
    const frenchKeywords = /\b(bonjour|salut|hello|hi|merci|oui|non|maillot|équipe|coucou|ça va|comment|s'il vous plaît|s'il te plaît|dommage|super|ok|d'accord|taille|poids|âge|année|saison|domicile|loin|extérieur|réserve)\b/i;
    if (frenchKeywords.test(lower)) return 'fr';
    
    // Swedish greetings and keywords
    const swedishKeywords = /\b(hej|hallo|tack|ja|nej|tröja|lag|hur|mår|bra|dåligt|storlek|vikt|ålder|säsong|hem|borta|tredje|vänligen|tyvärr|perfekt|hallå)\b/i;
    if (swedishKeywords.test(lower)) return 'sv';
    
    // English greetings and keywords (fallback)
    return 'en';
  };
  const updateHistoryMessage = (text, isError = false) => {
    setChatHistory(prev => [...prev.filter(m => m.text !== "Lahdha N5ammem..."), { 
      id: crypto.randomUUID(), 
      role: 'model', 
      text, 
      isError,
      hideInChat: false
    }]);
  };

  // Helper function to add realistic delay before showing response
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Update message with a minimum thinking delay for realism
  const updateMessageWithDelay = async (text, isError = false, minDelayMs = 800) => {
    // Wait for minimum delay to show thinking bubble
    await delay(minDelayMs);
    // Update the message
    updateHistoryMessage(text, isError);
    // Small additional delay to ensure message is rendered before hiding thinking bubble
    await delay(100);
    setIsThinking(false);
  };
  const extractText = (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  const extractFunctionCall = (candidate) => {
    if (!candidate) return null;
    const parts = candidate.content?.parts || [];
    return parts.find(p => p.functionCall)?.functionCall || null;
  };

  // NORMALIZATION 
  const normalizeText = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') 
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const clubAliases = {
    barcelona: ['barca', 'barcelone', 'barcelna', 'barclona', 'barcalona'],
    'real madrid': ['real', 'realmadrid', 'real-madrid', 'real madrid'],
    psg: ['paris', 'paris sg', 'paris saint germain', 'psg'],
    'manchester city': ['man city', 'manchester city'],
    'manchester united': ['man u', 'man utd', 'manchester united'],
    juventus: ['juve', 'juventus'],
    bayern: ['bayern munich', 'bayern munchen', 'bayern'],
    chelsea: ['chelsea'],
    liverpool: ['liverpool'],
    'inter milan': ['inter', 'inter milan'],
    esperance: ['esperance', 'taraji', 'esperance de tunis']
  };

  const getMissingFields = (parsed) => {
    const missing = [];
    if (!parsed.club) missing.push('club');
    if (!parsed.height_cm) missing.push('height');
    if (!parsed.weight_kg) missing.push('weight');
    if (!parsed.age) missing.push('age');
    if (!parsed.gender) missing.push('gender');
    return missing;
  };

  const expectedNext = () => {
    if (!userCustomization) return 'customization';
    if (!customName && userCustomization === 'custom') return 'custom_name';
    return 'search';
  };

  const detectPartialMatch = (text, field) => {
    // Detect when user corrects a typo or provides clarification
    const lower = normalizeText(text);
    const trimmed = lower.replace(/[^a-z0-9\s]/g, '').trim();
    
    if (field === 'club') {
      // Check if they mention "i meant", "no", "wrong", "the other" followed by club name
      if (/^(?:i\s*meant|no|wrong|other|not|the)/.test(trimmed)) {
        return true;
      }
      // Or if they're providing additional context after failed parse
      return trimmed.length > 0 && trimmed.split(/\s+/).length <= 3;
    }
    
    return false;
  };

  const parseJerseyInfo = (text) => {
    if (!text || typeof text !== 'string') return {};
    const lower = normalizeText(text);
    const result = {};
    
    // Season matching
    const seasonMatch = text.match(/\b(19|20)\d{2}(?:[\/-]\d{2})?\b/) || text.match(/\b\d{2}[\/-]\d{2}\b/);
    if (seasonMatch) result.season = seasonMatch[0];
    
    // Kit type matching 
    if (lower.includes('hom')) result.kit_type = 'home';
    else if (lower.includes('away')) result.kit_type = 'away';
    else if (lower.includes('third') || lower.includes('3rd')) result.kit_type = 'third';
    else if (lower.includes('domicil') || lower.includes('principal')) result.kit_type = 'home';
    else if (lower.includes('exterior') || lower.includes('reserve')) result.kit_type = 'away';
    
    // Height matching 
    const heightMatch = text.match(/(\d{2,3})\s*cm\b/i) || text.match(/(\d{2,3})\s*cm?\s*[,;]/) || text.match(/^(\d{2,3})\s*cm?\b/i);
    if (heightMatch) result.height_cm = parseInt(heightMatch[1]);
    
    // Weight matching 
    const weightMatch = text.match(/(\d{2,3})\s*kg\b/i) || text.match(/(\d{2,3})\s*kg?\s*[,;]/) || text.match(/(\d{2,3})\s*kg?\b/i);
    if (weightMatch) result.weight_kg = parseInt(weightMatch[1]);
    
    // Age matching 
    let ageMatch = text.match(/(?:age|ans|years?|old|yo)\s*:?\s*(\d{1,3})/i) || 
                   text.match(/(\d{1,3})\s*(?:ans|years?|old|yo)\b/i) ||
                   text.match(/\b(\d{1,3})\b(?=\s*(age|ans|years?|old))/i);
    
    // If no age found with keywords, try extracting the last standalone number after height/weight
    if (!ageMatch && (result.height_cm || result.weight_kg)) {
      const numbers = text.match(/\d{1,3}/g) || [];
      if (numbers.length >= 3) {
        const lastNum = parseInt(numbers[numbers.length - 1]);
        if (lastNum > 0 && lastNum < 80) result.age = lastNum; 
      }
    }
    if (ageMatch && !result.age) result.age = parseInt(ageMatch[1]);
    
    // Gender matching 
    const genderMatch = lower.match(/\b(male|man|homme|m|mâle|female|woman|femme|f|femelle)\b/);
    if (genderMatch) {
      const g = genderMatch[1];
      result.gender = ['male', 'man', 'homme', 'm', 'mâle'].includes(g) ? 'male' : 'female';
    }
    
    // Club fuzzy matching
    for (const [club, aliases] of Object.entries(clubAliases)) {
      if (lower.includes(club.replace(' ', ''))) {
        result.club = club;
        break;
      }
      if (aliases.some(a => lower.includes(a.replace(/\s+/g, '')))) {
        result.club = club;
        break;
      }
    }
    
    return result;
  };

  const parseCustomization = (text) => {
    if (!text || typeof text !== 'string') return null;
    
    // Check if user wants player name or custom
    const lower = text.toLowerCase();
    if (/\b(player|joueur|spieler|laaeb|yes|yup|oui|ja|player name|nom du joueur|spelarens namn)\b/i.test(lower)) {
      return 'player';
    }
    if (/\b(own|myself|me|custom|moi|myself|jo|ik|personal|ma own|esm mtaa3i|name and number|mon nom)\b/i.test(lower)) {
      return 'custom';
    }
    
    // Try to extract name and number from patterns 
    const match = text.match(/^([a-zA-Z\s]+)\s*(\d{1,2})$/) || text.match(/^(\d{1,2})\s+([a-zA-Z\s]+)$/);
    if (match) {
      const name = match[1].trim();
      const number = match[2].trim();
      return { name: isNaN(name) ? name : '', number: isNaN(number) ? number : '' };
    }
    
    return null;
  };

  const isQuotaError = (err) => {
    if (!err) return false;
    const msg = String(err.message || err).toLowerCase();
    return msg.includes('429') || msg.includes('quota') || msg.includes('rate limit') || msg.includes('too many') || msg.includes('busy');
  };

  const isSearchRequest = (text) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    const searchKeywords = ['jersey', 'kit', 'shirt', 'maillot', 'tröja', 'recommend', 'find', 'search', 'size', 'taille', 'storlek', 'club', 'team', 'manchester', 'barcelona', 'real', 'psg', 'juventus', 'bayern', 'liverpool', 'chelsea', 'inter', 'esperance'];
    return searchKeywords.some(keyword => lower.includes(keyword));
  };

  const getGreetingResponse = (lang = userLanguage) => {
    const greetings = {
      ar: "3aslema , ena tempest , chatbot li bch y3awnk te5tar el maryoul parfait lik ,kifech njm n3awnek?",
      fr: "Bonjour! Je suis Tempest, l'assistant GOAT-shop. Je suis ici pour vous aider à trouver le maillot parfait. Comment puis-je vous aider?",
      sv: "Hej! Jag är Tempest, assistenten för GOAT-shop. Jag är här för att hjälpa dig hitta den perfekta tröjan. Hur kan jag hjälpa dig?",
      en: "Hello! I'm Tempest, your GOAT-shop assistant. I'm here to help you find the perfect jersey. How can I help you today?"
    };
    return greetings[lang] || greetings.en;
  };

  // step handlers
  
  const handleGreetingStep = async (history, detectedLang) => {
    updateHistoryMessage(getGreetingResponse(detectedLang));
    setFlowStep("club");
    setIsThinking(false);
  };

  const handleClubStep = async (history, userMessage, detectedLang) => {
    const parsed = parseJerseyInfo(userMessage);
    
    if (!parsed.club) {
      // User hasn't mentioned a club yet
      updateHistoryMessage("Please mention a club (Barcelona, Real Madrid, PSG, etc.)");
      setIsThinking(false);
      return;
    }
    
    // Club detected, merge into state and move to kit step
    setJerseyState(prev => ({ ...prev, club: parsed.club }));
    setFlowStep("kit");
    updateHistoryMessage(getLocalMessage('jerseytype', detectedLang));
    setIsThinking(false);
  };

  const handleKitStep = async (history, userMessage, detectedLang) => {
    const parsed = parseJerseyInfo(userMessage);
    
    if (!parsed.season || !parsed.kit_type) {
      // Missing season or kit type
      updateHistoryMessage(getLocalMessage('jerseytype', detectedLang));
      setIsThinking(false);
      return;
    }
    
    // Both season and kit_type detected, move to biometrics
    setJerseyState(prev => ({ ...prev, season: parsed.season, kit_type: parsed.kit_type }));
    setFlowStep("biometrics");
    updateHistoryMessage(getLocalMessage('needBiometrics', detectedLang));
    setIsThinking(false);
  };

  const handleBiometricsStep = async (history, userMessage, detectedLang) => {
    const parsed = parseJerseyInfo(userMessage);
    
    // Merge all biometric fields
    const updatedState = { ...jerseyState, ...parsed };
    setJerseyState(updatedState);
    
    // Check if ALL biometrics are now present
    const hasAllBiometrics = 
      updatedState.height_cm && 
      updatedState.weight_kg && 
      updatedState.age && 
      updatedState.gender;
    
    if (!hasAllBiometrics) {
      updateHistoryMessage(getLocalMessage('needBiometrics', detectedLang));
      setIsThinking(false);
      return;
    }
    // All biometrics collected, move to customization
    const confirmedHeight = updatedState.height_cm;
    const confirmedWeight = updatedState.weight_kg;
    const confirmedAge = updatedState.age;
    const confirmedGender = updatedState.gender === 'male' ? 
      (detectedLang === 'ar' ? 'Homme' : detectedLang === 'fr' ? 'Homme' : detectedLang === 'sv' ? 'Man' : 'Male') :
      (detectedLang === 'ar' ? 'Femme' : detectedLang === 'fr' ? 'Femme' : detectedLang === 'sv' ? 'Kvinna' : 'Female');
    
    const confirmMsg = getLocalMessage('biometricsConfirmed', detectedLang)
      .replace('{height}', confirmedHeight)
      .replace('{weight}', confirmedWeight)
      .replace('{age}', confirmedAge)
      .replace('{gender}', confirmedGender);
    
    updateHistoryMessage(confirmMsg);
    setFlowStep("search");
    setIsThinking(false);
  };

  const getLocalMessage = (key, lang = userLanguage) => {
    const messages = {
      jerseytype: {
        ar: "oki doki ,9oli chnw saison li theb 3liha wou type te3ou (Home/Away/Third)? 😊",
        fr: "D'accord, quelle saison et type de maillot (domicile/basique/réserve)? 😊",
        sv: "Okej, vilken säsong och typ av tröja (hem/borta/tredje)? 😊",
        en: "Okay, which season and kit type (Home/Away/Third)? 😊"
      },
      needBiometrics: {
        ar: "Choix behi! Lbch njm nel9a el taille parfait lik tnjm ta3tini toulek (cm), 9ade touzen (kg), 3omrek, wou sex (Homme/femme) 😊",
        fr: "Excellent choix! Pour trouver la taille parfaite, j'ai besoin de quelques infos : hauteur (cm), poids (kg), âge et sexe. C'est rapide! 😊",
        sv: "Snyggt val! Berätta för mig din längd (cm), vikt (kg), ålder och kön - då hittar jag den perfekta storleken för dig! 😊",
        en: "Nice choice! To find your perfect fit, just tell me: height (cm), weight (kg), age, and gender. Let's get you the right size! 😊"
      },
      askPersonalization: {
        ar: "L9ina el maryoul parfait lik! Theb t7eb t7ot esmek wou numero 3lih? (oui/non) 😊",
        fr: "J'ai trouvé le maillot parfait pour toi! Veux-tu y ajouter ton nom et numéro? (oui/non) 😊",
        sv: "Jag hittade den perfekta tröjan! Vill du lägga till ditt namn och nummer? (ja/nej) 😊",
        en: "I found the perfect jersey for you! Would you like to add your name and number? (yes/no) 😊"
      },
      customization: {
        ar: "Hayel yeser ,theb maktoub wrah esm joueur wela esmk enti wou numerouk 😊?",
        fr: "Super! Voulez-vous le nom d'un joueur sur le maillot, ou votre propre nom et numéro? 😊",
        sv: "Bra! Vill du ha en spelares namn på tröjan, eller ditt eget namn och nummer? 😊",
        en: "Awesome! Do you want a player's name on the jersey, or your own name and number? 😊"
      },
      customNameRequest: {
        ar: "A3tini esmek wou numero te3k li theb ykoun fil maryoul 😊",
        fr: "Parfait! Dites-moi votre nom et votre numéro 😊",
        sv: "Perfekt! Berätta ditt namn och ditt nummer 😊",
        en: "Perfect! Tell me your name and number 😊"
      },
      customized: {
        ar: "Perfect! Haw jersey ta3k besmk: ",
        fr: "Parfait! Voici votre maillot personnalisé avec: ",
        sv: "Perfekt! Här är din anpassade tröja med: ",
        en: "Perfect! Here's your personalized jersey with: "
      },
      noJersey: {
        ar: "5sara , ma3andnech el maryoul li theb 3lih , ama taw nchouflk nafs el taille m3a mrewel o5rin 😊",
        fr: "Dommage, on n'a pas cette taille pour ce maillot. Essayez une autre saison et on reessaie! 😊",
        sv: "Tyvärr ingen i den storleken just nu. Prova en annan säsong - jag hjälper dig att hitta något bra! 😊",
        en: "Hmm, we don't have that in stock right now. Try another season or club - I'm sure we'll find something awesome! 😊"
      },
      found: {
        ar: "Yesss! L9ina el maryoul parfait lik! ",
        fr: "Yes! J'ai trouvé la pépite pour toi! ",
        sv: "Perfekt! Här är ditt ideala val! ",
        en: "Perfect! Here's your ideal jersey! "
      },
      size: {
        ar: "El taille li y3awtek: ",
        fr: "Ta taille: ",
        sv: "Din storlek: ",
        en: "Your perfect size: "
      },
      link: {
        ar: "Chouf el produit hedha ",
        fr: "Regarde le produit ici: ",
        sv: "Se produkten här: ",
        en: "Check it out here: "
      },
      error: {
        ar: "Desolé , saret 8alta 5fifa , ARJA3 8ODWA HHHHH 😊",
        fr: "Oups! Une petite erreur. Réessayez dans un moment! 😊",
        sv: "Oops! Något gick snett. Försök igen om en stund! 😊",
        en: "Oops! Something went wrong. Try again in a moment! 😊"
      },
      thanks: {
        ar: "Merci 5atr 5tart Boutique Te3na , nchlh te3jbk el experience fi GOAT-Shop 🙌",
        fr: "Merci d'avoir choisi GOAT-Shop! J'espère que tu vas l'adorer! 🙌",
        sv: "Tack för att du valde GOAT-Shop! Hoppas du älskar det!, hej då 🙌",
        en: "Thanks for choosing GOAT-Shop! Hope you love your new jersey! 🙌"
      },
      biometricsConfirmed: {
        ar: "OK! C'est Noté ! : {height}cm, {weight}kg, {age} ans, {gender} ✅ lahdha nlwj wou n3tik el resultat...",
        fr: "Parfait! J'ai noté: {height}cm, {weight}kg, {age} ans, {gender} ✅ Je cherche...",
        sv: "Bra! Jag tog upp: {height}cm, {weight}kg, {age} år, {gender} ✅ Söker. snälla vänta...",
        en: "Got it! {height}cm, {weight}kg, {age} years old, {gender} ✅ Searching..."
      },
    };
    const msg = messages[key] || messages[key]?.en || messages.error;
    return msg[lang] || msg.en;
  };
  // Step-aware response handler with local-first logic to save API credits
  const generateBotResponse = async (history) => {
    setIsThinking(true);
    try {
      const lastUser = history.filter(h => h.role === 'user').pop();
      
      // Detect language ONLY on first message, then lock it
      let detectedLang = userLanguage;
      if (lastUser && !userLanguage) {
        detectedLang = detectLanguage(lastUser.text);
        setUserLanguage(detectedLang);
      } else if (!detectedLang) {
        detectedLang = 'en';
      }

      // ============================================
      // LOCAL-FIRST STEP HANDLING (NO API CALL)
      // ============================================
      switch (flowStep) {
        case "greeting":
          // GREETING IS FREE - Handle locally, don't call API
          await updateMessageWithDelay(getGreetingResponse(detectedLang), false, 1000);
          setFlowStep("club");
          return;

        case "club":
          if (!lastUser) {
            setIsThinking(false);
            return;
          }
          // Try local parsing first
          const parsedClub = parseJerseyInfo(lastUser.text);
          if (parsedClub.club) {
            setJerseyState(prev => ({ ...prev, club: parsedClub.club }));
            setFlowStep("kit");
            await updateMessageWithDelay(getLocalMessage('jerseytype', detectedLang), false, 800);
            return;
          }
          // If no club found locally, ask again (don't call API)
          await updateMessageWithDelay("Please mention a club (Barcelona, Real Madrid, PSG, etc.)", false, 600);
          return;

        case "kit":
          if (!lastUser) {
            setIsThinking(false);
            return;
          }
          // Try local parsing
          const parsedKit = parseJerseyInfo(lastUser.text);
          if (parsedKit.season && parsedKit.kit_type) {
            setJerseyState(prev => ({ ...prev, season: parsedKit.season, kit_type: parsedKit.kit_type }));
            setFlowStep("biometrics");
            await updateMessageWithDelay(getLocalMessage('needBiometrics', detectedLang), false, 800);
            return;
          }
          // Missing info, ask again locally
          await updateMessageWithDelay(getLocalMessage('jerseytype', detectedLang), false, 600);
          return;

        case "biometrics":
          if (!lastUser) {
            setIsThinking(false);
            return;
          }
          // Try local parsing
          const parsedBio = parseJerseyInfo(lastUser.text);
          const updatedState = { ...jerseyState, ...parsedBio };
          setJerseyState(updatedState);
          
          // Check if all biometrics present
          const hasAll = updatedState.height_cm && updatedState.weight_kg && updatedState.age && updatedState.gender;
          if (!hasAll) {
            await updateMessageWithDelay(getLocalMessage('needBiometrics', detectedLang), false, 600);
            return;
          }
          
          // All collected, confirm and IMMEDIATELY trigger search
          const confirmedHeight = updatedState.height_cm;
          const confirmedWeight = updatedState.weight_kg;
          const confirmedAge = updatedState.age;
          const confirmedGender = updatedState.gender === 'male' ? 
            (detectedLang === 'ar' ? 'Homme' : detectedLang === 'fr' ? 'Homme' : detectedLang === 'sv' ? 'Man' : 'Male') :
            (detectedLang === 'ar' ? 'Femme' : detectedLang === 'fr' ? 'Femme' : detectedLang === 'sv' ? 'Kvinna' : 'Female');
          
          const confirmMsg = getLocalMessage('biometricsConfirmed', detectedLang)
            .replace('{height}', confirmedHeight)
            .replace('{weight}', confirmedWeight)
            .replace('{age}', confirmedAge)
            .replace('{gender}', confirmedGender);
          
          // Show confirmation message with delay, then trigger search
          await updateMessageWithDelay(confirmMsg, false, 1000);
          setFlowStep("search");
          // IMMEDIATELY call search - don't wait for next generateBotResponse call
          // Pass updatedState directly since React state updates are async
          // Keep thinking state true for search
          setIsThinking(true);
          await handleSearchViaLLM(history, lastUser, detectedLang, updatedState);
          return;

        case "search":
          await handleSearchViaLLM(history, lastUser, detectedLang, jerseyState);
          return;

        case "personalization":
          if (!lastUser) {
            setIsThinking(false);
            return;
          }
          await handlePersonalizationStep(history, lastUser, detectedLang);
          return;

        case "customName":
          if (!lastUser) {
            setIsThinking(false);
            return;
          }
          await handleCustomNameStep(history, lastUser, detectedLang);
          return;

        case "done":
          setIsThinking(false);
          return;

        default:
          setIsThinking(false);
          return;
      }
    } catch (error) {
      console.error("Bot Error:", error);
      setChatHistory(prev => [...prev, { role: "model", text: "Semahni, thama mochkla. Tnejem t3awed?", isError: true }]);
      setIsThinking(false);
    }
  };

  const handleSearchViaLLM = async (history, lastUser, detectedLang, stateOverride = null) => {
    try {
      // Use stateOverride if provided (for immediate calls), otherwise use jerseyState
      const currentState = stateOverride || jerseyState;
      console.log('🔍 Starting LLM search with state:', currentState);
      
      // Validate we have all required fields
      const missing = getMissingFields(currentState);
      if (missing.length > 0) {
        console.error('❌ Missing required fields:', missing);
        updateHistoryMessage(getLocalMessage('error', detectedLang), true);
        setIsThinking(false);
        return;
      }

      // Get the appropriate system prompt
      const systemPrompt = systemPrompts[detectedLang] || systemPrompts.main;
      
      // Prepare conversation history for LLM
      const contents = history
        .filter(h => !h.hideInChat && h.role !== 'system')
        .map(h => ({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        }));

      // Add a prompt to trigger the function call
      // This is an internal prompt to ensure the LLM calls the function
      const triggerPrompt = detectedLang === 'ar' 
        ? `3andi kol el ma3loumet: club=${currentState.club}, season=${currentState.season || ''}, kit_type=${currentState.kit_type || 'home'}, height_cm=${currentState.height_cm}, weight_kg=${currentState.weight_kg}, age=${currentState.age}, gender=${currentState.gender}. Call get_jersey_recommendation function now.`
        : `I have all the information: club=${currentState.club}, season=${currentState.season || ''}, kit_type=${currentState.kit_type || 'home'}, height_cm=${currentState.height_cm}, weight_kg=${currentState.weight_kg}, age=${currentState.age}, gender=${currentState.gender}. Call get_jersey_recommendation function now.`;
      
      contents.push({
        role: 'user',
        parts: [{ text: triggerPrompt }]
      });

      console.log('📞 Calling LLM with tools to trigger function call...');
      
      // STEP 1: Call LLM with tools - it should return a function call
      const firstResponse = await callLLM({
        systemPrompt,
        contents,
        tools,
        config: { temperature: 0.2, topP: 0.8 }
      });

      console.log('📥 First LLM response:', firstResponse);

      // Extract function call from response
      const candidate = firstResponse?.candidates?.[0];
      const functionCall = extractFunctionCall(candidate);
      
      if (!functionCall || functionCall.name !== 'get_jersey_recommendation') {
        console.error('❌ No function call detected in response.');
        console.error('Full response:', JSON.stringify(firstResponse, null, 2));
        console.error('Candidate:', JSON.stringify(candidate, null, 2));
        console.log('⚠️ Falling back to direct search without LLM function call...');
        // Fallback to direct search - this ensures the search happens even if LLM doesn't call function
        await executeDirectSearch(detectedLang, currentState);
        return;
      }

      console.log('✅ Function call detected:', functionCall.name, functionCall.args);

      // STEP 2: Execute the function
      // Gemini API uses 'args' property for function arguments
      // Merge function args with current state to ensure all required fields are present
      const functionArgs = {
        ...currentState,
        ...(functionCall.args || functionCall.arguments || {})
      };
      const searchResult = await searchJersey(functionArgs);
      console.log('🔍 Search result:', searchResult);

      // STEP 3: Send function result back to LLM for final response
      const augmentedContents = [...contents];
      
      // Add the function call to history (model's response with function call)
      augmentedContents.push({
        role: 'model',
        parts: [{
          functionCall: {
            name: functionCall.name,
            args: functionArgs
          }
        }]
      });

      // Add the function response (function's response)
      augmentedContents.push({
        role: 'function',
        parts: [{
          functionResponse: {
            name: functionCall.name,
            response: searchResult
          }
        }]
      });

      console.log('📞 Calling LLM again with function result...');

      // STEP 4: Get final response from LLM
      const finalResponse = await callLLM({
        systemPrompt,
        contents: augmentedContents,
        tools: [], // No tools needed for final response
        config: { temperature: 0.7, topP: 0.9 }
      });

      console.log('📥 Final LLM response:', finalResponse);

      // Extract final text but don't show it yet - we'll ask about personalization first
      const finalText = extractText(finalResponse);
      
      // Store search result and move to personalization step
      // We'll show the final result (with or without personalization) after user decides
      setSearchResult(searchResult);
      setFlowStep("personalization");
      
      // Ask about personalization BEFORE showing any link
      await updateMessageWithDelay(getLocalMessage('askPersonalization', detectedLang), false, 1000);
      return;
      
    } catch (error) {
      console.error("LLM Search Error:", error);
      
      // Fallback to direct search
      try {
        const currentState = stateOverride || jerseyState;
        await executeDirectSearch(detectedLang, currentState);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        await updateMessageWithDelay(getLocalMessage('error', detectedLang), true, 600);
        setFlowStep("done");
      }
    } finally {
      // Only set thinking to false if updateMessageWithDelay hasn't already done it
      // (updateMessageWithDelay sets it to false after displaying the message)
      // This is a safety net in case of errors
      setTimeout(() => {
        if (isThinking) {
          setIsThinking(false);
        }
      }, 100);
      setUsingLocal(false);
    }
  };

  const executeDirectSearch = async (detectedLang, stateOverride = null) => {
    console.log('🔄 Executing direct search (fallback)...');
    const currentState = stateOverride || jerseyState;
    
    const searchArgs = {
      club: currentState.club,
      season: currentState.season || '',
      kit_type: currentState.kit_type || 'home',
      height_cm: currentState.height_cm,
      weight_kg: currentState.weight_kg,
      age: currentState.age,
      gender: currentState.gender
    };

    const searchResult = await searchJersey(searchArgs);
    // Store result and move to personalization step instead of showing link immediately
    setSearchResult(searchResult);
    setFlowStep("personalization");
    await updateMessageWithDelay(getLocalMessage('askPersonalization', detectedLang), false, 1000);
  };

  const handlePersonalizationStep = async (history, lastUser, detectedLang) => {
    const userText = lastUser.text.toLowerCase().trim();
    
    // Parse yes/no responses in multiple languages
    const yesPatterns = /\b(oui|yes|yep|yeah|yup|ja|si|sí|na3am|eh|behi|yeser|ok|okay|d'accord|ok|okay)\b/i;
    const noPatterns = /\b(non|no|nah|nope|nej|nein|la|laa|ma|mch|no|non)\b/i;
    
    const wantsPersonalization = yesPatterns.test(userText);
    const doesntWantPersonalization = noPatterns.test(userText);
    
    if (wantsPersonalization) {
      setUserCustomization('custom');
      setFlowStep("customName");
      await updateMessageWithDelay(getLocalMessage('customNameRequest', detectedLang), false, 800);
      return;
    } else if (doesntWantPersonalization) {
      setUserCustomization('none');
      // Show link immediately without personalization
      await showFinalResult(detectedLang, null);
      return;
    } else {
      // Unclear response, ask again
      await updateMessageWithDelay(getLocalMessage('askPersonalization', detectedLang), false, 600);
      return;
    }
  };

  const handleCustomNameStep = async (history, lastUser, detectedLang) => {
    const userText = lastUser.text.trim();
    
    // Check if we already have name or number from previous step
    const hasName = customName.trim() !== '';
    const hasNumber = customNumber.trim() !== '';
    
    // Try to extract name and number from the text
    // Pattern: "Name 10" or "10 Name" or "Name, 10" or just "Name" or just "10"
    const nameNumberMatch = userText.match(/([a-zA-Z\s]+)\s*[,]?\s*(\d{1,2})|(\d{1,2})\s*[,]?\s*([a-zA-Z\s]+)|([a-zA-Z\s]+)|(\d{1,2})/);
    
    let extractedName = '';
    let extractedNumber = '';
    
    if (nameNumberMatch) {
      // Try different match groups
      extractedName = (nameNumberMatch[1] || nameNumberMatch[4] || nameNumberMatch[5] || '').trim();
      extractedNumber = (nameNumberMatch[2] || nameNumberMatch[3] || nameNumberMatch[6] || '').trim();
    }
    
    // Use existing values if we have them, otherwise use extracted
    const finalName = hasName ? customName : extractedName;
    const finalNumber = hasNumber ? customNumber : extractedNumber;
    
    // If we have both (either from state or newly extracted), show result
    if (finalName && finalNumber) {
      setCustomName(finalName);
      setCustomNumber(finalNumber);
      await showFinalResult(detectedLang, { name: finalName, number: finalNumber });
      return;
    } else if (finalName && !finalNumber) {
      // Got name (from state or new), need number
      setCustomName(finalName);
      await updateMessageWithDelay(detectedLang === 'ar' 
        ? `Esmeek: ${finalName}. A3tini numero te3k 😊`
        : detectedLang === 'fr'
        ? `Votre nom: ${finalName}. Quel numéro voulez-vous? 😊`
        : detectedLang === 'sv'
        ? `Ditt namn: ${finalName}. Vilket nummer vill du ha? 😊`
        : `Your name: ${finalName}. What number do you want? 😊`, false, 700);
      return;
    } else if (!finalName && finalNumber) {
      // Got number (from state or new), need name
      setCustomNumber(finalNumber);
      await updateMessageWithDelay(detectedLang === 'ar'
        ? `Numero: ${finalNumber}. A3tini esmek 😊`
        : detectedLang === 'fr'
        ? `Numéro: ${finalNumber}. Quel est votre nom? 😊`
        : detectedLang === 'sv'
        ? `Nummer: ${finalNumber}. Vad heter du? 😊`
        : `Number: ${finalNumber}. What's your name? 😊`, false, 700);
      return;
    } else {
      // Didn't get clear info, ask again
      await updateMessageWithDelay(getLocalMessage('customNameRequest', detectedLang), false, 600);
      return;
    }
  };

  const showFinalResult = async (detectedLang, personalization = null) => {
    if (!searchResult || !searchResult.matches || searchResult.matches.length === 0) {
      await updateMessageWithDelay(getLocalMessage('noJersey', detectedLang), false, 800);
      setFlowStep("done");
      return;
    }

    const first = searchResult.matches[0];
    const link = `${window.location.origin}/product/${first.id}`;
    const size = searchResult.recommended_size || 'M';
    
    const currentState = jerseyState;
    const heightM = currentState.height_cm / 100;
    const bmi = currentState.weight_kg / (heightM * heightM);
    const bmiRounded = Math.round(bmi * 10) / 10;
    
    let message;
    if (personalization && personalization.name && personalization.number) {
      // Personalized jersey
      message = `${getLocalMessage('found', detectedLang)}${first.name}\n${getLocalMessage('customized', detectedLang)}${personalization.name} #${personalization.number}\n${getLocalMessage('size', detectedLang)}${size}\nBMI: ${bmiRounded}\n${getLocalMessage('link', detectedLang)}${link}\n\n${getLocalMessage('thanks', detectedLang)}`;
    } else {
      // Regular jersey
      message = `${getLocalMessage('found', detectedLang)}${first.name}\n${getLocalMessage('size', detectedLang)}${size}\nBMI: ${bmiRounded}\n${getLocalMessage('link', detectedLang)}${link}\n\n${getLocalMessage('thanks', detectedLang)}`;
    }
    
    // Add a bit more delay for final result since it's important
    await updateMessageWithDelay(message, false, 1200);
    setFlowStep("done");
  };

  const formatAndDisplayResult = async (searchResult, detectedLang, stateOverride = null) => {
    // This function is now deprecated - we use showFinalResult instead
    // But keeping it for backward compatibility
    if (!searchResult.matches || searchResult.matches.length === 0) {
      updateHistoryMessage(getLocalMessage('noJersey', detectedLang));
      return;
    }

    const currentState = stateOverride || jerseyState;
    const first = searchResult.matches[0];
    const link = `${window.location.origin}/product/${first.id}`;
    const size = searchResult.recommended_size || 'M';
    
    const heightM = currentState.height_cm / 100;
    const bmi = currentState.weight_kg / (heightM * heightM);
    const bmiRounded = Math.round(bmi * 10) / 10;
    
    let message;
    if (userCustomization === 'custom' && customName && customNumber) {
      message = `${getLocalMessage('found', detectedLang)}\n${getLocalMessage('size', detectedLang)}${size}\nBMI: ${bmiRounded}\n${getLocalMessage('link', detectedLang)}${link}\n\n${getLocalMessage('thanks', detectedLang)}`;
    } else {
      message = `${getLocalMessage('found', detectedLang)}${first.name}\n${getLocalMessage('size', detectedLang)}${size}\nBMI: ${bmiRounded}\n${getLocalMessage('link', detectedLang)}${link}\n\n${getLocalMessage('thanks', detectedLang)}`;
    }
    
    updateHistoryMessage(message);
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
          <div className="header-left">
            {usingLocal && <div className="local-fallback-pill">Local assistant</div>}
            <div className="Header-info">
              <Chatbotcon />
              <h2 className="logo-text">Tempest</h2>
            </div>
          </div>
          <button onClick={() => setShowChatbot(prev => !prev)} className="material-symbols-outlined">keyboard_arrow_down</button>
        </div>

        <div ref={chatBodyRef} className="chat-body">
          <div className="message bot-message">
            <Chatbotcon />
            <p className="message-text">Ya hnin Ya bnin ya kollek Vitamine, kifech n3awnek Ya behi</p>
          </div>
          {chatHistory.map((chat) => (
  <ChatMessage key={chat.id || Math.random()} chat={chat} />
))}
          {isThinking && (
            <div className="message bot-message">
              <Chatbotcon />
              <div className="thinking-bubble">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-footer">
          <div style={{display: 'flex', gap: 8}}>
            <ChatForm chatHistory={chatHistory} setChatHistory={setChatHistory} generateBotResponse={generateBotResponse} isThinking={isThinking} />
            <button title="Size Guide" className="btn" onClick={() => alert('Provide height (cm), weight (kg), age for size.')} style={{alignSelf: 'center'}}>Size</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
