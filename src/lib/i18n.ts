export type Locale = "uk-UA" | "en-US";

export const translations = {
  "uk-UA": {
    // Feed
    "feed.empty": "Ще нічого не збережено",
    "feed.empty_sub": "Введи текст або посилання нижче",
    "feed.today": "Сьогодні",
    "feed.yesterday": "Вчора",
    "feed.jump_to_date": "перейти до дати",
    // Composer
    "composer.placeholder.text": "Що збережемо?",
    "composer.placeholder.link": "Вставте посилання…",
    "composer.placeholder.file": "Натисніть щоб вибрати файл…",
    "composer.placeholder.image": "Натисніть щоб вибрати зображення…",
    "composer.uploading": "Завантаження…",
    // Actions
    "action.reply": "Відповісти",
    "action.copy": "Копіювати",
    "action.export_md": "Експорт .md",
    "action.export_json": "Експорт .json",
    "action.pin": "Закріпити",
    "action.unpin": "Відкріпити",
    "action.favorite": "Обране",
    "action.unfavorite": "Прибрати",
    "action.remind": "Нагадати",
    "action.delete": "Видалити",
    // Saved header
    "saved.title": "Saved",
    "saved.count": (n: number) => `${n} елементів`,
    "saved.storage": "Сховище",
    // Settings
    "settings.title": "Налаштування",
    "settings.subtitle": "Тема, мова, погода та формат часу",
    "settings.theme": "Тема",
    "settings.locale": "Мова / Locale",
    "settings.weather": "Погода",
    "settings.weather.auto": "Авто (геолокація)",
    "settings.weather.manual": "Вручну (місто)",
    "settings.city": "Місто",
    "settings.city.placeholder": "Наприклад: Lviv",
    "settings.time_format": "Формат часу",
    "settings.time_24h": "24-годинний",
    "settings.time_12h": "12-годинний",
    "settings.save": "Зберегти",
    "settings.reset": "Скинути",
    "settings.saved": "Збережено ✓",
    // Profile
    "profile.title": "Профіль і акаунт",
    "profile.subtitle": "Профіль, безпека та активні сесії",
    "profile.section.profile": "Профіль",
    "profile.section.security": "Безпека акаунту",
    "profile.email": "Email",
    "profile.name": "Ім'я",
    "profile.name.placeholder": "Твоє ім'я",
    "profile.avatar": "Avatar URL",
    "profile.timezone": "Timezone",
    "profile.save": "Зберегти профіль",
    "profile.saving": "Зберігаємо...",
    "profile.new_password": "Новий пароль",
    "profile.confirm_password": "Підтверди пароль",
    "profile.change_password": "Змінити пароль",
    "profile.changing_password": "Оновлюємо...",
    "profile.logout": "Logout з усіх сесій",
    // Dashboard
    "dashboard.greeting.morning": "Доброго ранку",
    "dashboard.greeting.day": "Добрий день",
    "dashboard.greeting.evening": "Добрий вечір",
    "dashboard.greeting.night": "Доброї ночі",
    // Filters
    "filter.all": "Всі",
    "filter.pinned": "Закріплені",
    "filter.favorites": "Обрані",
    "filter.reminders": "Нагадування",
    // Bulk actions
    "bulk.selected": (n: number) => `${n} вибрано`,
    "bulk.tags": "Теги",
    "bulk.delete": "Видалити",
    "bulk.cancel": "Скасувати",
    "bulk.apply": "Застосувати",
    "bulk.tags_placeholder": "#тег або кілька через пробіл",
    // Lightbox
    "lightbox.zoom_in": "Збільшити",
    "lightbox.zoom_out": "Зменшити",
    "lightbox.download": "Завантажити",
    "lightbox.close": "Закрити (Esc)"
  },
  "en-US": {
    // Feed
    "feed.empty": "Nothing saved yet",
    "feed.empty_sub": "Type text or paste a link below",
    "feed.today": "Today",
    "feed.yesterday": "Yesterday",
    "feed.jump_to_date": "jump to date",
    // Composer
    "composer.placeholder.text": "What are we saving?",
    "composer.placeholder.link": "Paste a link…",
    "composer.placeholder.file": "Click to choose a file…",
    "composer.placeholder.image": "Click to choose an image…",
    "composer.uploading": "Uploading…",
    // Actions
    "action.reply": "Reply",
    "action.copy": "Copy",
    "action.export_md": "Export .md",
    "action.export_json": "Export .json",
    "action.pin": "Pin",
    "action.unpin": "Unpin",
    "action.favorite": "Favorite",
    "action.unfavorite": "Unfavorite",
    "action.remind": "Remind",
    "action.delete": "Delete",
    // Saved header
    "saved.title": "Saved",
    "saved.count": (n: number) => `${n} items`,
    "saved.storage": "Storage",
    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Theme, language, weather & time format",
    "settings.theme": "Theme",
    "settings.locale": "Language / Locale",
    "settings.weather": "Weather",
    "settings.weather.auto": "Auto (geolocation)",
    "settings.weather.manual": "Manual (city)",
    "settings.city": "City",
    "settings.city.placeholder": "E.g.: Lviv",
    "settings.time_format": "Time format",
    "settings.time_24h": "24-hour",
    "settings.time_12h": "12-hour",
    "settings.save": "Save",
    "settings.reset": "Reset",
    "settings.saved": "Saved ✓",
    // Profile
    "profile.title": "Profile & Account",
    "profile.subtitle": "Profile, security & active sessions",
    "profile.section.profile": "Profile",
    "profile.section.security": "Account Security",
    "profile.email": "Email",
    "profile.name": "Name",
    "profile.name.placeholder": "Your name",
    "profile.avatar": "Avatar URL",
    "profile.timezone": "Timezone",
    "profile.save": "Save profile",
    "profile.saving": "Saving...",
    "profile.new_password": "New password",
    "profile.confirm_password": "Confirm password",
    "profile.change_password": "Change password",
    "profile.changing_password": "Updating...",
    "profile.logout": "Logout from all sessions",
    // Dashboard
    "dashboard.greeting.morning": "Good morning",
    "dashboard.greeting.day": "Good afternoon",
    "dashboard.greeting.evening": "Good evening",
    "dashboard.greeting.night": "Good night",
    // Filters
    "filter.all": "All",
    "filter.pinned": "Pinned",
    "filter.favorites": "Favorites",
    "filter.reminders": "Reminders",
    // Bulk actions
    "bulk.selected": (n: number) => `${n} selected`,
    "bulk.tags": "Tags",
    "bulk.delete": "Delete",
    "bulk.cancel": "Cancel",
    "bulk.apply": "Apply",
    "bulk.tags_placeholder": "#tag or multiple separated by space",
    // Lightbox
    "lightbox.zoom_in": "Zoom in",
    "lightbox.zoom_out": "Zoom out",
    "lightbox.download": "Download",
    "lightbox.close": "Close (Esc)"
  }
} as const;

type TranslationMap = (typeof translations)["uk-UA"];
type TranslationKey = keyof TranslationMap;

export function t(locale: Locale, key: TranslationKey, ...args: number[]): string {
  const val = translations[locale]?.[key] ?? translations["uk-UA"][key];
  if (typeof val === "function") {
    return (val as (n: number) => string)(args[0] ?? 0);
  }
  return val as string;
}

export function formatDate(locale: Locale, iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return t(locale, "feed.today");
  if (date.toDateString() === yesterday.toDateString()) return t(locale, "feed.yesterday");

  return date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}
