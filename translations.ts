export interface AppTranslations {
  appName: string;
  tagline: string;
  selectLanguageTitle: string;
  selectLanguageSubtitle: string;
  searchLanguagePlaceholder: string;
  continueButton: string;
  changeLanguage: string;
  displayLang: string;
  inputLang: string;
  responseLang: string;

  // Nav
  navAssistant: string;
  navKitchen: string;
  navRecipes: string;
  navTimers: string;
  navShopping: string;
  navMealPlanner: string;
  navSettings: string;

  // Assistant
  greeting: string;
  voicePromptPlaceholder: string;
  tapToSpeak: string;
  listening: string;
  thinking: string;
  speaking: string;
  stopSpeaking: string;
  repeatSpeech: string;
  askAnything: string;
  quickPrompts: string[];
  clearConversation: string;
  newConversation: string;

  // Summary Card
  summaryPantryItems: string;
  summaryExpiringSoon: string;
  summaryLowStock: string;
  summaryActiveTimers: string;
  summaryShoppingItems: string;

  // Pantry
  pantryTitle: string;
  pantrySubtitle: string;
  addItem: string;
  batchVoiceAdd: string;
  searchPantryPlaceholder: string;
  allCategories: string;
  storageLocation: string;
  expiresIn: string;
  expiredAlert: string;
  lowStockBadge: string;
  freshBadge: string;
  consumeItem: string;
  editItem: string;
  deleteItem: string;
  noPantryItems: string;

  // Shopping List
  shoppingTitle: string;
  shoppingSubtitle: string;
  addShoppingItem: string;
  markPurchased: string;
  transferToPantry: string;
  transferSuccess: string;
  noShoppingItems: string;

  // Recipes
  recipesTitle: string;
  recipesSubtitle: string;
  searchRecipePlaceholder: string;
  cookWithPantryBtn: string;
  allRecipesBtn: string;
  originalRecipeHeading: string;
  adaptedRecipeHeading: string;
  originalRecipeDesc: string;
  adaptedRecipeDesc: string;
  availableIngredients: string;
  missingIngredients: string;
  addMissingToShopping: string;
  addedMissingSuccess: string;
  startGuidedCooking: string;
  watchAndLearn: string;
  substitutions: string[];
  cookingTips: string;
  commonMistakes: string;
  safetyAdvice: string;
  servings: string;
  prepTime: string;
  cookTime: string;

  // Guided Cooking
  cookingModeTitle: string;
  step: string;
  of: string;
  nextStep: string;
  prevStep: string;
  repeatStep: string;
  speakStep: string;
  pauseSpeech: string;
  startStepTimer: string;
  exitCooking: string;

  // Timers
  timersTitle: string;
  timersSubtitle: string;
  startNewTimer: string;
  timerNamePlaceholder: string;
  durationMinutes: string;
  cancelTimer: string;
  pauseTimer: string;
  resumeTimer: string;
  timerFinished: string;
  noActiveTimers: string;

  // Meal Planner
  mealPlanTitle: string;
  mealPlanSubtitle: string;
  generateShoppingFromPlan: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;

  // Settings & Profile
  settingsTitle: string;
  profileTitle: string;
  dietaryPreferences: string;
  allergiesSafety: string;
  allergiesWarning: string;
  cuisines: string;
  units: string;
  currency: string;
  householdSize: string;
  saveSettings: string;
}

export const TRANSLATIONS: Record<string, Partial<AppTranslations>> = {
  en: {
    appName: 'Zestiquee',
    tagline: 'Your kitchen. Your voice. Everything organized.',
    selectLanguageTitle: 'Choose Your Preferred Language',
    selectLanguageSubtitle: 'Select how you want Zestiquee to speak, listen, and organize your kitchen.',
    searchLanguagePlaceholder: 'Search languages (e.g., Telugu, Hindi, Spanish)...',
    continueButton: 'Continue to My Kitchen',
    changeLanguage: 'Change Language',
    displayLang: 'Display Language',
    inputLang: 'Speech / Input Language',
    responseLang: 'Assistant Voice & Response Language',
    navAssistant: 'Assistant',
    navKitchen: 'My Pantry',
    navRecipes: 'Recipes',
    navTimers: 'Timers',
    navShopping: 'Shopping List',
    navMealPlanner: 'Meal Plans',
    navSettings: 'Settings',
    greeting: 'Welcome back to your kitchen!',
    voicePromptPlaceholder: 'Ask a question or say "I bought 1kg carrots and 500g rice"...',
    tapToSpeak: 'Tap to Speak',
    listening: 'Listening to your voice...',
    thinking: 'Checking your pantry and cooking insights...',
    speaking: 'Speaking response...',
    stopSpeaking: 'Stop Audio',
    repeatSpeech: 'Repeat Spoken Answer',
    askAnything: 'Ask anything about cooking, your pantry, or setting timers.',
    quickPrompts: [
      'What can I cook with what I have?',
      'How do I make soft chapatis?',
      'I bought 1kg carrots, 500g rice and 1L milk',
      'Start a 10-minute timer for pasta',
      'Which ingredients are expiring soon?',
    ],
    clearConversation: 'Clear Chat',
    newConversation: 'New Conversation',
    summaryPantryItems: 'Pantry Ingredients',
    summaryExpiringSoon: 'Expiring Soon',
    summaryLowStock: 'Low Stock Items',
    summaryActiveTimers: 'Active Timers',
    summaryShoppingItems: 'Shopping List',
    pantryTitle: 'My Kitchen Pantry',
    pantrySubtitle: 'The ingredients and groceries you currently have at home.',
    addItem: 'Add Ingredient',
    batchVoiceAdd: 'Voice Quick Add',
    searchPantryPlaceholder: 'Search pantry items...',
    allCategories: 'All Categories',
    storageLocation: 'Storage Location',
    expiresIn: 'Expires',
    expiredAlert: 'Expired',
    lowStockBadge: 'Low Stock',
    freshBadge: 'Fresh',
    consumeItem: 'Use / Consume',
    editItem: 'Edit Item',
    deleteItem: 'Remove Item',
    noPantryItems: 'Your pantry is currently empty. Add your ingredients or tell Zestiquee what you bought!',
    shoppingTitle: 'Smart Shopping List',
    shoppingSubtitle: 'Separate from your pantry. Keep track of what you need to buy.',
    addShoppingItem: 'Add Item to Buy',
    markPurchased: 'Mark as Bought',
    transferToPantry: 'Transfer Bought Items to Pantry',
    transferSuccess: 'Transferred purchased items into your pantry inventory!',
    noShoppingItems: 'Your shopping list is clear. Add missing ingredients from recipes or meal plans.',
    recipesTitle: 'Intelligent Recipe Studio',
    recipesSubtitle: 'Authentic traditional dishes and adaptive recipes crafted for your actual pantry.',
    searchRecipePlaceholder: 'What would you like to cook? (e.g. Biryani, White sauce pasta, Sambar)...',
    cookWithPantryBtn: 'Cook With What I Have',
    allRecipesBtn: 'Explore Any Recipe',
    originalRecipeHeading: 'Option 1: Traditional Recipe',
    adaptedRecipeHeading: 'Option 2: Pantry Adaptation',
    originalRecipeDesc: 'Authentic recipe with complete ingredients. Pantry comparison shows what you have vs. need.',
    adaptedRecipeDesc: 'Practical alternative using what is currently available in your kitchen, with substitution notes.',
    availableIngredients: 'Available in Pantry',
    missingIngredients: 'Missing Ingredients',
    addMissingToShopping: 'Add Missing Ingredients to Shopping List',
    addedMissingSuccess: 'Added missing ingredients to your shopping list!',
    startGuidedCooking: 'Start Step-by-Step Cooking Mode',
    watchAndLearn: 'Watch & Learn (Verified Cooking Videos)',
    cookingTips: 'Chef Tips',
    commonMistakes: 'Common Mistakes to Avoid',
    safetyAdvice: 'Food Safety & Handling',
    servings: 'Servings',
    prepTime: 'Prep Time',
    cookTime: 'Cook Time',
    cookingModeTitle: 'Guided Cooking Mode',
    step: 'Step',
    of: 'of',
    nextStep: 'Next Step',
    prevStep: 'Previous Step',
    repeatStep: 'Repeat Instructions',
    speakStep: 'Read Aloud',
    pauseSpeech: 'Pause Voice',
    startStepTimer: 'Start Timer for Step',
    exitCooking: 'Exit Guided Mode',
    timersTitle: 'Kitchen Timers & Alarms',
    timersSubtitle: 'Accurate multi-timers with persistent countdowns even if you refresh or switch tabs.',
    startNewTimer: 'Set Custom Timer',
    timerNamePlaceholder: 'Timer name (e.g., Boiling Eggs, Simmering Dal)...',
    durationMinutes: 'Duration (Minutes)',
    cancelTimer: 'Cancel Timer',
    pauseTimer: 'Pause',
    resumeTimer: 'Resume',
    timerFinished: 'Timer finished!',
    noActiveTimers: 'No active timers right now. Tap a preset or tell Zestiquee to start one.',
    mealPlanTitle: 'Household Meal Planner',
    mealPlanSubtitle: 'Plan your weekly meals and automatically sync missing ingredients with your shopping list.',
    generateShoppingFromPlan: 'Generate Shopping List from Meal Plan',
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snacks & Tea',
    settingsTitle: 'Settings & Household Preferences',
    profileTitle: 'Personal Kitchen Profile',
    dietaryPreferences: 'Dietary Preferences',
    allergiesSafety: 'Allergies & Food Intolerances (Strict Safety Filter)',
    allergiesWarning: 'Safety constraint: Zestiquee will strictly avoid suggesting recipes or substitutions with these allergens.',
    cuisines: 'Preferred Cuisines',
    units: 'Measurement Units',
    currency: 'Currency Symbol',
    householdSize: 'Household Size',
    saveSettings: 'Save Preferences',
  },
  te: {
    appName: 'Zestiquee (జెస్టికి)',
    tagline: 'మీ వంటగది. మీ స్వరం. అన్నీ సవ్యంగా.',
    selectLanguageTitle: 'మీకు అనుకూలమైన భాషను ఎంచుకోండి',
    selectLanguageSubtitle: 'మీ వంటగదిని నిర్వహించడానికి Zestiquee మీతో ఏ భాషలో మాట్లాడాలి?',
    searchLanguagePlaceholder: 'భాషను శోధించండి (ఉదాహరణ: తెలుగు, हिन्दी, English)...',
    continueButton: 'నా వంటగదిలోకి వెళ్లండి',
    changeLanguage: 'భాష మార్చండి',
    displayLang: 'డిస్ప్లే భాష',
    inputLang: 'మాట్లాడే భాష',
    responseLang: 'సహాయకుని భాష',
    navAssistant: 'వాయిస్ సహాయకుడు',
    navKitchen: 'నా వంటగది (ప్యాంట్రీ)',
    navRecipes: 'వంటకాలు',
    navTimers: 'టైమర్లు',
    navShopping: 'షాపింగ్ లిస్ట్',
    navMealPlanner: 'భోజన ప్రణాళిక',
    navSettings: 'సెట్టింగ్స్',
    greeting: 'మీ వంటగదికి తిరిగి స్వాగతం!',
    voicePromptPlaceholder: 'ప్రశ్న అడగండి లేదా "నేను 1 కిలో క్యారెట్లు, 500 గ్రాముల బియ్యం కొన్నాను" అని చెప్పండి...',
    tapToSpeak: 'మాట్లాడటానికి నొక్కండి',
    listening: 'మీ స్వరాన్ని వింటున్నాను...',
    thinking: 'మీ ప్యాంట్రీ మరియు వంటకాలను పరిశీలిస్తున్నాను...',
    speaking: 'సమాధానం చెబుతున్నాను...',
    stopSpeaking: 'ఆపు',
    repeatSpeech: 'మళ్ళీ చెప్పండి',
    askAnything: 'వంటలు, ప్యాంట్రీ వస్తువులు లేదా టైమర్ల గురించి అడగండి.',
    quickPrompts: [
      'ఉన్న వస్తువులతో ఏమి వండగలను?',
      'మృదువైన చపాతీలు ఎలా చేయాలి?',
      'నేను 1 కిలో క్యారెట్లు, అరకిలో బియ్యం కొన్నాను',
      'పప్పు ఉడకడానికి 15 నిమిషాల టైమర్ పెట్టండి',
      'త్వరలో గడువు ముగిసే వస్తువులు ఏవి?',
    ],
    clearConversation: 'చాట్ తొలగించు',
    newConversation: 'కొత్త సంభాషణ',
    summaryPantryItems: 'ప్యాంట్రీ సరుకులు',
    summaryExpiringSoon: 'త్వరలో గడువు ముగిసేవి',
    summaryLowStock: 'తక్కువగా ఉన్నవి',
    summaryActiveTimers: 'ప్రస్తుత టైమర్లు',
    summaryShoppingItems: 'కొనవలసిన వస్తువులు',
    pantryTitle: 'నా వంటగది సరుకులు (ప్యాంట్రీ)',
    pantrySubtitle: 'ప్రస్తుతం మీ ఇంట్లో ఉన్న వస్తువులు మరియు పరిమాణాలు.',
    addItem: 'సరుకు జోడించు',
    batchVoiceAdd: 'వాయిస్ ద్వారా జోడించండి',
    searchPantryPlaceholder: 'సరుకుల కోసం వెతకండి...',
    allCategories: 'అన్ని విభాగాలు',
    storageLocation: 'నిల్వ స్థలం',
    expiresIn: 'గడువు తేదీ',
    expiredAlert: 'గడువు ముగిసింది',
    lowStockBadge: 'తక్కువగా ఉంది',
    freshBadge: 'తాజాది',
    consumeItem: 'వాడేసాను',
    editItem: 'సవరించు',
    deleteItem: 'తొలగించు',
    noPantryItems: 'మీ ప్యాంట్రీ ఖాళీగా ఉంది. మీరు కొన్న వస్తువులను జోడించండి!',
    shoppingTitle: 'షాపింగ్ జాబితా',
    shoppingSubtitle: 'ప్యాంట్రీకి వేరుగా కొనవలసిన వస్తువుల జాబితా.',
    addShoppingItem: 'కొత్త వస్తువు జోడించు',
    markPurchased: 'కొనేసాను',
    transferToPantry: 'కొన్న వస్తువులను ప్యాంట్రీకి బదిలీ చేయండి',
    transferSuccess: 'కొన్న వస్తువులు విజయవంతంగా ప్యాంట్రీకి చేర్చబడ్డాయి!',
    noShoppingItems: 'షాపింగ్ జాబితా ఖాళీగా ఉంది.',
    recipesTitle: 'స్మార్ట్ వంటకాల గ్యాలరీ',
    recipesSubtitle: 'మీ ప్యాంట్రీకి సరిపోయే సాంప్రదాయక మరియు అనుకూల వంటకాలు.',
    searchRecipePlaceholder: 'మీరు ఏమి వండాలనుకుంటున్నారు? (ఉదా: బిర్యానీ, సాంబార్, పాస్తా)...',
    cookWithPantryBtn: 'ఉన్నవాటితో వండండి',
    allRecipesBtn: 'ఏదైనా వంటకం వెతకండి',
    originalRecipeHeading: 'ఎంపిక 1: అసలైన సాంప్రదాయ వంటకం',
    adaptedRecipeHeading: 'ఎంపిక 2: మీ ప్యాంట్రీకి అనుకూలమైన వంటకం',
    originalRecipeDesc: 'అన్ని అసలు పదార్థాలతో వంటకం. మీ ప్యాంట్రీలో ఉన్నవి మరియు లేనివి చూపిస్తుంది.',
    adaptedRecipeDesc: 'మీ దగ్గర ప్రస్తుతం ఉన్న పదార్థాలతో సులభంగా తయారుచేసే ప్రత్యామ్నాయ వంటకం.',
    availableIngredients: 'ప్యాంట్రీలో ఉన్నవి',
    missingIngredients: 'లేని పదార్థాలు',
    addMissingToShopping: 'లేని పదార్థాలను షాపింగ్ లిస్ట్ కి జోడించండి',
    addedMissingSuccess: 'లేని పదార్థాలు షాపింగ్ జాబితాకు జోడించబడ్డాయి!',
    startGuidedCooking: 'దశలవారీగా వంట ప్రారంభించండి',
    watchAndLearn: 'చూసి నేర్చుకోండి (వీడియోలు)',
    cookingTips: 'ముఖ్యమైన చిట్కాలు',
    commonMistakes: 'చేయకూడని తప్పులు',
    safetyAdvice: 'ఆహార భద్రత',
    servings: 'సర్వింగ్స్',
    prepTime: 'సిద్ధం సమయం',
    cookTime: 'వంట సమయం',
    cookingModeTitle: 'దశలవారీ వంట మార్గదర్శి',
    step: 'దశ',
    of: 'లో',
    nextStep: 'తర్వాతి దశ',
    prevStep: 'మునుపటి దశ',
    repeatStep: 'మళ్ళీ చదవండి',
    speakStep: 'వినండి',
    pauseSpeech: 'వాయిస్ ఆపు',
    startStepTimer: 'ఈ దశకు టైమర్ పెట్టండి',
    exitCooking: 'బయటకు రండి',
    timersTitle: 'వంటగది టైమర్లు',
    timersSubtitle: 'పేజీ రీఫ్రెష్ చేసినా ఆగని ఖచ్చితమైన టైమర్లు.',
    startNewTimer: 'టైమర్ సెట్ చేయండి',
    timerNamePlaceholder: 'టైమర్ పేరు...',
    durationMinutes: 'సమయం (నిమిషాలు)',
    cancelTimer: 'రద్దు చేయండి',
    pauseTimer: 'ఆపండి',
    resumeTimer: 'కొనసాగించండి',
    timerFinished: 'సమయం ముగిసింది!',
    noActiveTimers: 'ప్రస్తుతం టైమర్లు ఏవీ లేవు.',
    mealPlanTitle: 'భోజన ప్రణాళిక',
    mealPlanSubtitle: 'వారపు భోజనాన్ని ప్లాన్ చేసి అవసరమైన సరుకులను షాపింగ్ లిస్ట్ కి జోడించండి.',
    generateShoppingFromPlan: 'ప్రణాళిక నుండి షాపింగ్ లిస్ట్ రూపొందించండి',
    breakfast: 'అల్పాహారం (టిఫిన్)',
    lunch: 'మధ్యాహ్న భోజనం',
    dinner: 'రాత్రి భోజనం',
    snack: 'స్నాక్స్ & టీ',
    settingsTitle: 'సెట్టింగ్స్ & ప్రాధాన్యతలు',
    profileTitle: 'నా కిచెన్ ప్రొఫైల్',
    dietaryPreferences: 'ఆహార ప్రాధాన్యతలు (శాకాహారం / మాంసాహారం)',
    allergiesSafety: 'అలెర్జీలు (ఖచ్చితమైన రక్షణ నియమం)',
    allergiesWarning: 'గమనిక: అలెర్జీలు ఉన్న పదార్థాలను Zestiquee ఎప్పటికీ సిఫార్సు చేయదు.',
    cuisines: 'ఇష్టమైన రుచులు / వంటకాలు',
    units: 'కొలతలు (గ్రాములు / కిలోలు)',
    currency: 'కరెన్సీ (₹)',
    householdSize: 'ఇంటి సభ్యుల సంఖ్య',
    saveSettings: 'భద్రపరచండి',
  },
  hi: {
    appName: 'Zestiquee (ज़ेस्टिकी)',
    tagline: 'आपकी रसोई। आपकी आवाज़। सब कुछ व्यवस्थित।',
    selectLanguageTitle: 'अपनी पसंदीदा भाषा चुनें',
    selectLanguageSubtitle: 'चुनें कि Zestiquee आपकी रसोई का प्रबंधन करने के लिए किस भाषा में बात करे।',
    searchLanguagePlaceholder: 'भाषा खोजें (जैसे हिन्दी, Telugu, English, Español)...',
    continueButton: 'मेरी रसोई में आगे बढ़ें',
    changeLanguage: 'भाषा बदलें',
    displayLang: 'प्रदर्शन भाषा',
    inputLang: 'बोलने की भाषा',
    responseLang: 'सहायक की आवाज़ भाषा',
    navAssistant: 'असिस्टेंट',
    navKitchen: 'रसोई भंडार (पैंट्री)',
    navRecipes: 'रेसिपी',
    navTimers: 'टाइमर',
    navShopping: 'खरीदारी सूची',
    navMealPlanner: 'भोजन योजना',
    navSettings: 'सेटिंग्स',
    greeting: 'आपकी रसोई में पुनः स्वागत है!',
    voicePromptPlaceholder: 'कोई प्रश्न पूछें या कहें "मैंने 1 किलो गाजर और 500 ग्राम चावल खरीदे"...',
    tapToSpeak: 'बोलने के लिए टैप करें',
    listening: 'आपकी आवाज़ सुन रहा हूँ...',
    thinking: 'आपकी पैंट्री और रेसिपी की जाँच कर रहा हूँ...',
    speaking: 'उत्तर बोल रहा हूँ...',
    stopSpeaking: 'आवाज़ रोकें',
    repeatSpeech: 'दोबारा सुनें',
    askAnything: 'खाना पकाने, सामग्री या टाइमर के बारे में कुछ भी पूछें।',
    quickPrompts: [
      'मौजूदा सामग्री से क्या बना सकते हैं?',
      'नरम रोटियाँ कैसे बनाएँ?',
      'मैंने 1 किलो गाजर, 500 ग्राम चावल और 1 लीटर दूध खरीदा',
      'पास्ता के लिए 10 मिनट का टाइमर लगाएँ',
      'कौन सी सामग्री जल्द खराब होने वाली है?',
    ],
    clearConversation: 'बातचीत साफ़ करें',
    newConversation: 'नई बातचीत',
    summaryPantryItems: 'रसोई सामग्री',
    summaryExpiringSoon: 'जल्द समाप्त होने वाली',
    summaryLowStock: 'कम स्टॉक वाले सामान',
    summaryActiveTimers: 'सक्रिय टाइमर',
    summaryShoppingItems: 'खरीदारी सूची',
    pantryTitle: 'मेरी रसोई सामग्री (पैंट्री)',
    pantrySubtitle: 'वर्तमान में आपके घर में उपलब्ध सभी खाद्य सामग्री।',
    addItem: 'सामग्री जोड़ें',
    batchVoiceAdd: 'आवाज़ से जोड़ें',
    searchPantryPlaceholder: 'सामग्री खोजें...',
    allCategories: 'सभी श्रेणियाँ',
    storageLocation: 'भंडारण स्थान',
    expiresIn: 'समाप्ति तिथि',
    expiredAlert: 'समाप्त हो चुकी',
    lowStockBadge: 'स्टॉक कम है',
    freshBadge: 'ताज़ा',
    consumeItem: 'उपयोग किया',
    editItem: 'संपादित करें',
    deleteItem: 'हटाएँ',
    noPantryItems: 'आपकी रसोई अभी खाली है। खरीदी गई सामग्री जोड़ें या बोलकर बताएँ!',
    shoppingTitle: 'खरीदारी सूची',
    shoppingSubtitle: 'पैंट्री से अलग, जो सामान आपको बाजार से खरीदना है।',
    addShoppingItem: 'सामान जोड़ें',
    markPurchased: 'खरीद लिया गया',
    transferToPantry: 'खरीदा गया सामान पैंट्री में डालें',
    transferSuccess: 'खरीदा गया सामान पैंट्री में सफलतापूर्वक जोड़ा गया!',
    noShoppingItems: 'आपकी खरीदारी सूची खाली है।',
    recipesTitle: 'स्मार्ट रेसिपी स्टूडियो',
    recipesSubtitle: 'पारंपरिक और आपकी पैंट्री के अनुसार अनुकूलित दो विकल्प।',
    searchRecipePlaceholder: 'आप क्या बनाना चाहते हैं? (जैसे पनीर बटर मसाला, बिरयानी, पास्ता)...',
    cookWithPantryBtn: 'घर के सामान से पकाएँ',
    allRecipesBtn: 'कोई भी रेसिपी खोजें',
    originalRecipeHeading: 'विकल्प 1: पारंपरिक प्रामाणिक रेसिपी',
    adaptedRecipeHeading: 'विकल्प 2: घर के सामान से अनुकूलित रेसिपी',
    originalRecipeDesc: 'मूल रेसिपी पूरी सामग्री के साथ। पैंट्री से तुलना करके बताता है कि क्या उपलब्ध है और क्या नहीं।',
    adaptedRecipeDesc: 'आपके पास मौजूद सामग्री से तैयार विकल्प, प्रतिस्थापन और स्वाद अंतर के साथ।',
    availableIngredients: 'पैंट्री में उपलब्ध',
    missingIngredients: 'जो सामान नहीं है',
    addMissingToShopping: 'कम सामान को खरीदारी सूची में जोड़ें',
    addedMissingSuccess: 'कम सामान खरीदारी सूची में जोड़ दिया गया!',
    startGuidedCooking: 'कदम-दर-कदम कुकिंग शुरू करें',
    watchAndLearn: 'देखें और सीखें (यूट्यूब वीडियो)',
    cookingTips: 'शेफ के सुझाव',
    commonMistakes: 'सामान्य गलतियाँ जिनसे बचें',
    safetyAdvice: 'खाद्य सुरक्षा सुझाव',
    servings: 'कितने लोगों के लिए',
    prepTime: 'तैयारी का समय',
    cookTime: 'पकाने का समय',
    cookingModeTitle: 'गाइडेड कुकिंग मोड',
    step: 'कदम',
    of: 'का',
    nextStep: 'अगला कदम',
    prevStep: 'पिछला कदम',
    repeatStep: 'निर्देश दोहराएँ',
    speakStep: 'सुनें',
    pauseSpeech: 'रोकें',
    startStepTimer: 'इस कदम का टाइमर शुरू करें',
    exitCooking: 'बाहर निकलें',
    timersTitle: 'रसोई टाइमर',
    timersSubtitle: 'सटीक टाइमर जो पेज रीफ्रेश करने पर भी सही समय दिखाते हैं।',
    startNewTimer: 'नया टाइमर लगाएँ',
    timerNamePlaceholder: 'टाइमर का नाम...',
    durationMinutes: 'अवधि (मिनट)',
    cancelTimer: 'रद्द करें',
    pauseTimer: 'रोकें',
    resumeTimer: 'जारी रखें',
    timerFinished: 'टाइमर पूरा हुआ!',
    noActiveTimers: 'कोई सक्रिय टाइमर नहीं है।',
    mealPlanTitle: 'भोजन योजना (मील प्लानर)',
    mealPlanSubtitle: 'सप्ताह का भोजन तय करें और आवश्यक सामग्री खरीदारी सूची में जोड़ें।',
    generateShoppingFromPlan: 'योजना से खरीदारी सूची तैयार करें',
    breakfast: 'नाश्ता',
    lunch: 'दोपहर का भोजन',
    dinner: 'रात का भोजन',
    snack: 'शाम का नाश्ता व चाय',
    settingsTitle: 'सेटिंग्स और प्राथमिकताएँ',
    profileTitle: 'रसोई प्रोफ़ाइल',
    dietaryPreferences: 'आहार प्राथमिकताएँ (शाकाहारी / मांसाहारी / वीगन)',
    allergiesSafety: 'एलर्जी और खाद्य संवेदनशीलता (कड़ा सुरक्षा नियम)',
    allergiesWarning: 'सुरक्षा नियम: Zestiquee इन एलर्जी युक्त सामग्रियों को किसी भी रेसिपी में शामिल नहीं करेगा।',
    cuisines: 'पसंदीदा व्यंजन',
    units: 'माप की इकाइयाँ (ग्राम, किलोग्राम)',
    currency: 'मुद्रा प्रतीक (₹)',
    householdSize: 'परिवार के सदस्यों की संख्या',
    saveSettings: 'सेटिंग्स सहेजें',
  },
  es: {
    appName: 'Zestiquee',
    tagline: 'Tu cocina. Tu voz. Todo organizado.',
    selectLanguageTitle: 'Elige Tu Idioma Preferido',
    selectLanguageSubtitle: 'Selecciona cómo deseas que Zestiquee escuche, hable y organice tu cocina.',
    searchLanguagePlaceholder: 'Buscar idiomas (ej. Español, English, Hindi)...',
    continueButton: 'Continuar a Mi Cocina',
    changeLanguage: 'Cambiar Idioma',
    displayLang: 'Idioma de Pantalla',
    inputLang: 'Idioma de Voz',
    responseLang: 'Idioma del Asistente',
    navAssistant: 'Asistente',
    navKitchen: 'Mi Despensa',
    navRecipes: 'Recetas',
    navTimers: 'Temporizadores',
    navShopping: 'Lista de Compras',
    navMealPlanner: 'Menú Semanal',
    navSettings: 'Ajustes',
    greeting: '¡Bienvenido de nuevo a tu cocina!',
    voicePromptPlaceholder: 'Haz una pregunta o di "Compré 1 kilo de zanahorias y 500g de arroz"...',
    tapToSpeak: 'Toca para Hablar',
    listening: 'Escuchando tu voz...',
    thinking: 'Revisando tu despensa y recetas...',
    speaking: 'Hablando...',
    stopSpeaking: 'Detener',
    repeatSpeech: 'Repetir Respuesta',
    askAnything: 'Pregunta lo que quieras sobre recetas, despensa o temporizadores.',
    quickPrompts: [
      '¿Qué puedo cocinar con lo que tengo?',
      '¿Cómo hacer pasta con salsa blanca?',
      'Compré 1kg de zanahorias y 500g de arroz',
      'Pon un temporizador de 10 minutos',
      '¿Qué ingredientes están por caducar?',
    ],
    clearConversation: 'Limpiar Chat',
    newConversation: 'Nueva Conversación',
    summaryPantryItems: 'Ingredientes en Despensa',
    summaryExpiringSoon: 'Por Caducar',
    summaryLowStock: 'Bajo en Stock',
    summaryActiveTimers: 'Temporizadores Activos',
    summaryShoppingItems: 'Lista de Compras',
    pantryTitle: 'Mi Despensa de Cocina',
    pantrySubtitle: 'Los alimentos e ingredientes que tienes actualmente en casa.',
    addItem: 'Añadir Ingrediente',
    batchVoiceAdd: 'Añadir por Voz',
    searchPantryPlaceholder: 'Buscar en la despensa...',
    allCategories: 'Todas las Categorías',
    storageLocation: 'Ubicación',
    expiresIn: 'Caducidad',
    expiredAlert: 'Caducado',
    lowStockBadge: 'Bajo Stock',
    freshBadge: 'Fresco',
    consumeItem: 'Consumir',
    editItem: 'Editar',
    deleteItem: 'Eliminar',
    noPantryItems: 'Tu despensa está vacía. ¡Añade lo que compraste!',
    shoppingTitle: 'Lista de Compras Inteligente',
    shoppingSubtitle: 'Separada de tu despensa. Todo lo que necesitas comprar.',
    addShoppingItem: 'Añadir a la Lista',
    markPurchased: 'Marcar Comprado',
    transferToPantry: 'Transferir Comprados a la Despensa',
    transferSuccess: '¡Artículos transferidos a tu despensa exitosamente!',
    noShoppingItems: 'Tu lista de compras está vacía.',
    recipesTitle: 'Estudio de Recetas Inteligente',
    recipesSubtitle: 'Recetas auténticas tradicionales y opciones adaptadas a tu despensa.',
    searchRecipePlaceholder: '¿Qué deseas cocinar hoy?...',
    cookWithPantryBtn: 'Cocinar con lo que tengo',
    allRecipesBtn: 'Explorar Cualquier Receta',
    originalRecipeHeading: 'Opción 1: Receta Tradicional',
    adaptedRecipeHeading: 'Opción 2: Adaptación con tu Despensa',
    originalRecipeDesc: 'Receta auténtica completa. Compara qué ingredientes tienes y cuáles te faltan.',
    adaptedRecipeDesc: 'Alternativa práctica con lo que tienes en casa, explicando sustituciones y diferencias.',
    availableIngredients: 'Disponible en Despensa',
    missingIngredients: 'Ingredientes Faltantes',
    addMissingToShopping: 'Añadir Faltantes a la Lista de Compras',
    addedMissingSuccess: '¡Ingredientes faltantes añadidos a la lista de compras!',
    startGuidedCooking: 'Iniciar Modo Cocina Paso a Paso',
    watchAndLearn: 'Ver y Aprender (Videos de Cocina)',
    cookingTips: 'Consejos del Chef',
    commonMistakes: 'Errores Comunes a Evitar',
    safetyAdvice: 'Seguridad Alimentaria',
    servings: 'Porciones',
    prepTime: 'Preparación',
    cookTime: 'Cocción',
    cookingModeTitle: 'Modo de Cocina Guiada',
    step: 'Paso',
    of: 'de',
    nextStep: 'Siguiente Paso',
    prevStep: 'Paso Anterior',
    repeatStep: 'Repetir',
    speakStep: 'Leer en Voz Alta',
    pauseSpeech: 'Pausar',
    startStepTimer: 'Iniciar Temporizador del Paso',
    exitCooking: 'Salir',
    timersTitle: 'Temporizadores de Cocina',
    timersSubtitle: 'Temporizadores precisos y persistentes incluso si recargas la página.',
    startNewTimer: 'Nuevo Temporizador',
    timerNamePlaceholder: 'Nombre del temporizador...',
    durationMinutes: 'Duración (Minutos)',
    cancelTimer: 'Cancelar',
    pauseTimer: 'Pausar',
    resumeTimer: 'Continuar',
    timerFinished: '¡Temporizador terminado!',
    noActiveTimers: 'No hay temporizadores activos.',
    mealPlanTitle: 'Planificador de Menús',
    mealPlanSubtitle: 'Planifica tus comidas y sincroniza los ingredientes faltantes.',
    generateShoppingFromPlan: 'Generar Lista de Compras desde el Menú',
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snack: 'Merienda / Snacks',
    settingsTitle: 'Ajustes y Preferencias',
    profileTitle: 'Perfil de Cocina',
    dietaryPreferences: 'Preferencias Dietéticas',
    allergiesSafety: 'Alergias e Intolerancias (Filtro Estricto de Seguridad)',
    allergiesWarning: 'Restricción de seguridad: Zestiquee nunca recomendará ingredientes que contengan estos alérgenos.',
    cuisines: 'Cocinas Preferidas',
    units: 'Unidades de Medida',
    currency: 'Moneda (€, $, etc.)',
    householdSize: 'Tamaño del Hogar',
    saveSettings: 'Guardar Ajustes',
  },
};

export function getTranslation(langCode: string): AppTranslations {
  const fallback = TRANSLATIONS.en as AppTranslations;
  const specific = TRANSLATIONS[langCode];
  if (!specific) return fallback;
  return { ...fallback, ...specific };
}
