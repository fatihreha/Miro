
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';
export type Language = 'en' | 'tr' | 'es' | 'fr' | 'de';

export const LANGUAGES: Record<Language, { label: string, flag: string }> = {
  en: { label: 'English', flag: '🇺🇸' },
  tr: { label: 'Türkçe', flag: '🇹🇷' },
  es: { label: 'Español', flag: '🇪🇸' },
  fr: { label: 'Français', flag: '🇫🇷' },
  de: { label: 'Deutsch', flag: '🇩🇪' }
};

const translations = {
  en: {
    // General
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    back: "Back",
    done: "Done",
    search: "Search",
    
    // Welcome
    welcome_subtitle: "Find your perfect match through sweat, sports, and shared passion.",
    start_journey: "Start Your Journey",
    premium_experience: "Premium Sports Dating Experience",
    
    // Home
    good_morning: "Good morning",
    good_afternoon: "Good afternoon",
    good_evening: "Good evening",
    daily_picks: "Daily Picks",
    refine: "Refine",
    apply_filters: "Apply Filters",
    likes_you: "Likes You",
    people: "People",
    people_like_you: "like you",
    match_title: "GAME ON!",
    you_and: "You and",
    like_each_other: "are ready to train!",
    super_like: "Super Like!",
    suggest_icebreaker: "Suggest Icebreaker",
    say_hi_later: "Say \"Hi\" Later",
    send_message: "Send Message",
    pass_confirm_title: "Pass?",
    pass_confirm_desc: "Are you sure you want to pass on",
    pass_action: "Pass",
    no_likes: "No new likes yet.",
    
    // Settings
    settings_title: "Settings",
    preferences: "Preferences",
    app_theme: "App Theme",
    language: "Language",
    discovery: "Discovery",
    max_distance: "Maximum Distance",
    max_age: "Max Age",
    notifications_title: "Notifications",
    push_notifications: "Push Notifications",
    match_updates: "Match Updates",
    legal_account: "Legal & Account",
    privacy_policy: "Privacy Policy",
    sign_out: "Sign Out",
    version: "Version 1.0.3",
    subscription: "Subscription",
    restore_purchases: "Restore Purchases",
    support: "Support",
    faq: "FAQ",
    contact_us: "Contact Us",
    
    // Profile
    my_profile: "My Profile",
    about_me: "About Me",
    interests: "Interests",
    manage: "Manage",
    get_gold: "Get SportPulse Gold",
    upgrade: "Upgrade",
    badges: "Badges",
    achievements: "Achievements",
    
    // Filters
    workout_time: "Workout Time",
    morning: "Morning",
    evening: "Evening",
    anytime: "Anytime",
    height: "Height",
    lifestyle: "Lifestyle",
    no_smoking: "No Smoking",
    social_drinker: "Social Drinker",
    vegetarian: "Vegetarian",
    unlock_filters: "Unlock More Filters",
    get_premium: "Get Premium"
  },
  tr: {
    cancel: "İptal",
    save: "Kaydet",
    edit: "Düzenle",
    back: "Geri",
    done: "Tamam",
    search: "Ara",
    welcome_subtitle: "Ter, spor ve ortak tutkularla mükemmel eşini bul.",
    start_journey: "Yolculuğa Başla",
    premium_experience: "Premium Spor Arkadaşlığı Deneyimi",
    good_morning: "Günaydın",
    good_afternoon: "Tünaydın",
    good_evening: "İyi Akşamlar",
    daily_picks: "Günün Seçimleri",
    refine: "Filtrele",
    apply_filters: "Filtreleri Uygula",
    likes_you: "Seni Beğenenler",
    people: "Kişi",
    people_like_you: "seni beğendi",
    match_title: "OYUN BAŞLASIN!",
    you_and: "Sen ve",
    like_each_other: "birlikte antrenman yapmak istiyorsunuz!",
    super_like: "Süper Beğeni!",
    suggest_icebreaker: "Buz Kırıcı Öner",
    say_hi_later: "Sonra \"Selam\" De",
    send_message: "Mesaj Gönder",
    pass_confirm_title: "Pas Geç?",
    pass_confirm_desc: "Pas geçmek istediğine emin misin:",
    pass_action: "Pas Geç",
    no_likes: "Henüz yeni beğeni yok.",
    settings_title: "Ayarlar",
    preferences: "Tercihler",
    app_theme: "Uygulama Teması",
    language: "Dil",
    discovery: "Keşif",
    max_distance: "Maksimum Mesafe",
    max_age: "Maksimum Yaş",
    notifications_title: "Bildirimler",
    push_notifications: "Anlık Bildirimler",
    match_updates: "Eşleşme Güncellemeleri",
    legal_account: "Yasal & Hesap",
    privacy_policy: "Gizlilik Politikası",
    sign_out: "Çıkış Yap",
    version: "Sürüm 1.0.3",
    subscription: "Abonelik",
    restore_purchases: "Satın Alımları Geri Yükle",
    support: "Destek",
    faq: "SSS",
    contact_us: "Bize Ulaşın",
    my_profile: "Profilim",
    about_me: "Hakkımda",
    interests: "İlgi Alanları",
    manage: "Yönet",
    get_gold: "SportPulse Gold Al",
    upgrade: "Yükselt",
    badges: "Rozetler",
    achievements: "Başarılar",
    workout_time: "Antrenman Zamanı",
    morning: "Sabah",
    evening: "Akşam",
    anytime: "Farketmez",
    height: "Boy",
    lifestyle: "Yaşam Tarzı",
    no_smoking: "Sigara Yok",
    social_drinker: "Sosyal İçici",
    vegetarian: "Vejetaryen",
    unlock_filters: "Filtreleri Aç",
    get_premium: "Premium Al"
  },
  es: {
    cancel: "Cancelar",
    save: "Guardar",
    edit: "Editar",
    back: "Atrás",
    done: "Hecho",
    search: "Buscar",
    welcome_subtitle: "Encuentra tu pareja perfecta a través del sudor, el deporte y la pasión compartida.",
    start_journey: "Comienza tu viaje",
    premium_experience: "Experiencia Premium de Citas Deportivas",
    good_morning: "Buenos días",
    good_afternoon: "Buenas tardes",
    good_evening: "Buenas noches",
    daily_picks: "Selecciones Diarias",
    refine: "Refinar",
    apply_filters: "Aplicar Filtros",
    likes_you: "Le Gustas",
    people: "Personas",
    people_like_you: "te dieron like",
    match_title: "¡A JUGAR!",
    you_and: "Tú y",
    like_each_other: "quieren entrenar juntos.",
    super_like: "¡Súper Like!",
    suggest_icebreaker: "Sugerir Rompehielos",
    say_hi_later: "Di \"Hola\" Después",
    send_message: "Enviar Mensaje",
    pass_confirm_title: "¿Pasar?",
    pass_confirm_desc: "¿Seguro que quieres pasar de",
    pass_action: "Pasar",
    no_likes: "Aún no hay likes.",
    settings_title: "Ajustes",
    preferences: "Preferencias",
    app_theme: "Tema de la App",
    language: "Idioma",
    discovery: "Descubrimiento",
    max_distance: "Distancia Máxima",
    max_age: "Edad Máxima",
    notifications_title: "Notificaciones",
    push_notifications: "Notificaciones Push",
    match_updates: "Actualizaciones de Match",
    legal_account: "Legal y Cuenta",
    privacy_policy: "Política de Privacidad",
    sign_out: "Cerrar Sesión",
    version: "Versión 1.0.3",
    subscription: "Suscripción",
    restore_purchases: "Restaurar Compras",
    support: "Soporte",
    faq: "Preguntas Frecuentes",
    contact_us: "Contáctanos",
    my_profile: "Mi Perfil",
    about_me: "Sobre Mí",
    interests: "Intereses",
    manage: "Gestionar",
    get_gold: "Obtener SportPulse Gold",
    upgrade: "Mejorar",
    badges: "Insignias",
    achievements: "Logros",
    workout_time: "Hora de Entreno",
    morning: "Mañana",
    evening: "Noche",
    anytime: "Cualquiera",
    height: "Altura",
    lifestyle: "Estilo de Vida",
    no_smoking: "No Fumar",
    social_drinker: "Bebedor Social",
    vegetarian: "Vegetariano",
    unlock_filters: "Desbloquear Filtros",
    get_premium: "Obtener Premium"
  },
  fr: {
    cancel: "Annuler",
    save: "Enregistrer",
    edit: "Modifier",
    back: "Retour",
    done: "Terminé",
    search: "Rechercher",
    welcome_subtitle: "Trouvez votre partenaire idéal grâce au sport et à la passion commune.",
    start_journey: "Commencer",
    premium_experience: "Rencontres Sportives Premium",
    good_morning: "Bonjour",
    good_afternoon: "Bon après-midi",
    good_evening: "Bonsoir",
    daily_picks: "Choix du Jour",
    refine: "Filtrer",
    apply_filters: "Appliquer",
    likes_you: "Vous Aime",
    people: "Personnes",
    people_like_you: "vous aiment",
    match_title: "C'EST PARTI !",
    you_and: "Vous et",
    like_each_other: "voulez vous entraîner ensemble.",
    super_like: "Super Like !",
    suggest_icebreaker: "Suggérer une phrase",
    say_hi_later: "Dire \"Salut\" plus tard",
    send_message: "Envoyer Message",
    pass_confirm_title: "Passer ?",
    pass_confirm_desc: "Voulez-vous vraiment passer",
    pass_action: "Passer",
    no_likes: "Pas encore de likes.",
    settings_title: "Paramètres",
    preferences: "Préférences",
    app_theme: "Thème de l'app",
    language: "Langue",
    discovery: "Découverte",
    max_distance: "Distance Max",
    max_age: "Âge Max",
    notifications_title: "Notifications",
    push_notifications: "Notifications Push",
    match_updates: "Mises à jour Match",
    legal_account: "Légal & Compte",
    privacy_policy: "Politique de Conf.",
    sign_out: "Se Déconnecter",
    version: "Version 1.0.3",
    subscription: "Abonnement",
    restore_purchases: "Restaurer les achats",
    support: "Support",
    faq: "FAQ",
    contact_us: "Nous contacter",
    my_profile: "Mon Profil",
    about_me: "À Propos",
    interests: "Intérêts",
    manage: "Gérer",
    get_gold: "Obtenir SportPulse Gold",
    upgrade: "Améliorer",
    badges: "Badges",
    achievements: "Succès",
    workout_time: "Heure d'Entraînement",
    morning: "Matin",
    evening: "Soir",
    anytime: "Peu importe",
    height: "Taille",
    lifestyle: "Style de Vie",
    no_smoking: "Non-fumeur",
    social_drinker: "Buveur social",
    vegetarian: "Végétarien",
    unlock_filters: "Débloquer Filtres",
    get_premium: "Obtenir Premium"
  },
  de: {
    cancel: "Abbrechen",
    save: "Speichern",
    edit: "Bearbeiten",
    back: "Zurück",
    done: "Fertig",
    search: "Suchen",
    welcome_subtitle: "Finde deinen perfekten Partner durch Sport und gemeinsame Leidenschaft.",
    start_journey: "Reise Beginnen",
    premium_experience: "Premium Sport Dating",
    good_morning: "Guten Morgen",
    good_afternoon: "Guten Tag",
    good_evening: "Guten Abend",
    daily_picks: "Tagesauswahl",
    refine: "Filtern",
    apply_filters: "Filter Anwenden",
    likes_you: "Mag Dich",
    people: "Personen",
    people_like_you: "mögen dich",
    match_title: "SPIEL ON!",
    you_and: "Du und",
    like_each_other: "wollt zusammen trainieren.",
    super_like: "Super Like!",
    suggest_icebreaker: "Eisbrecher Vorschlagen",
    say_hi_later: "Später \"Hallo\" sagen",
    send_message: "Nachricht Senden",
    pass_confirm_title: "Passen?",
    pass_confirm_desc: "Willst du wirklich passen bei",
    pass_action: "Passen",
    no_likes: "Noch keine Likes.",
    settings_title: "Einstellungen",
    preferences: "Präferenzen",
    app_theme: "App Design",
    language: "Sprache",
    discovery: "Entdeckung",
    max_distance: "Max. Entfernung",
    max_age: "Max. Alter",
    notifications_title: "Benachrichtigungen",
    push_notifications: "Push-Nachrichten",
    match_updates: "Match Updates",
    legal_account: "Rechtliches & Konto",
    privacy_policy: "Datenschutz",
    sign_out: "Abmelden",
    version: "Version 1.0.3",
    subscription: "Abonnement",
    restore_purchases: "Käufe wiederherstellen",
    support: "Support",
    faq: "FAQ",
    contact_us: "Kontakt",
    my_profile: "Mein Profil",
    about_me: "Über Mich",
    interests: "Interessen",
    manage: "Verwalten",
    get_gold: "SportPulse Gold Holen",
    upgrade: "Upgrade",
    badges: "Abzeichen",
    achievements: "Erfolge",
    workout_time: "Trainingszeit",
    morning: "Morgen",
    evening: "Abend",
    anytime: "Jederzeit",
    height: "Größe",
    lifestyle: "Lebensstil",
    no_smoking: "Nichtraucher",
    social_drinker: "Gesellschaftstrinker",
    vegetarian: "Vegetarier",
    unlock_filters: "Mehr Filter",
    get_premium: "Premium Holen"
  }
};

interface ThemeContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en']) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const storedTheme = localStorage.getItem('sportpulse_theme') as Theme;
    const storedLang = localStorage.getItem('sportpulse_lang') as Language;
    
    if (storedTheme) setTheme(storedTheme);
    if (storedLang) setLanguageState(storedLang);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('sportpulse_theme', newTheme);
      return newTheme;
    });
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sportpulse_lang', lang);
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <ThemeContext.Provider value={{ theme, language, toggleTheme, setLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
