export type Language = 'en' | 'ta';

export const mobileTranslations = {
  en: {
    app: {
      name: 'POSTMATE Mobile',
      tagline: 'Smart Postal Operations in Your Pocket'
    },
    tabs: {
      dashboard: 'Home',
      scan: 'Scan Mail',
      tasks: 'Deliveries',
      sorting: 'Sorting',
      sync: 'Offline Sync',
      profile: 'Profile'
    },
    status: {
      online: 'Online (Connected to Server)',
      offline: 'Offline Mode (Local Storage Active)',
      pendingSync: 'pending operational updates in queue'
    },
    actions: {
      syncNow: 'Synchronize Now',
      scanBarcode: 'Scan Barcode',
      markDelivered: 'Mark Delivered',
      markException: 'Record Exception',
      confirm: 'Confirm & Save'
    }
  },
  ta: {
    app: {
      name: 'போஸ்ட்மேட் மொபைல்',
      tagline: 'திறன்மிகு அஞ்சலக மொபைல் அமைப்பு'
    },
    tabs: {
      dashboard: 'முகப்பு',
      scan: 'ஸ்கேன்',
      tasks: 'விநியோகம்',
      sorting: 'பிரித்தல்',
      sync: 'ஒத்திசைவு',
      profile: 'சுயவிவரம்'
    },
    status: {
      online: 'இணைக்கப்பட்டுள்ளது (Online)',
      offline: 'இணையமற்ற நிலை (Offline - சேமிப்பில் உள்ளது)',
      pendingSync: 'ஒத்திசைவு நிலுவையில் உள்ள பதிவுகள்'
    },
    actions: {
      syncNow: 'இப்போதே ஒத்திசை',
      scanBarcode: 'பார்கோட் ஸ்கேன்',
      markDelivered: 'விநியோகிக்கப்பட்டது',
      markException: 'விதிவிலக்கு பதிவு',
      confirm: 'உறுதி செய்'
    }
  }
};
