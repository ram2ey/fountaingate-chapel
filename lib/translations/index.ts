export type Language = 'en' | 'tw' | 'ee' | 'ha' | 'fr';

export interface TranslationDictionary {
  welcomeHeader: string;
  subHeaderKiosk: string;
  phoneTab: string;
  nameTab: string;
  enterPhonePlaceholder: string;
  searchNamePlaceholder: string;
  matchingFound: string;
  tapToCheckIn: string;
  checkInConfirmed: string;
  welcomeToChurch: string;
  nextMember: string;
  firstTimeGuestPrompt: string;
  guestWelcomeHeader: string;
  guestSubtitle: string;
  firstName: string;
  lastName: string;
  phoneLabel: string;
  submitGuestCard: string;
  guestSuccessHeader: string;
  guestSuccessMsg: string;
}

export const TRANSLATIONS: Record<Language, TranslationDictionary> = {
  en: {
    welcomeHeader: "FOUNTAIN GATE CHAPEL",
    subHeaderKiosk: "ENTRANCE TABLET SELF CHECK-IN",
    phoneTab: "Phone Number Keypad",
    nameTab: "Search by Name",
    enterPhonePlaceholder: "Enter Phone Number...",
    searchNamePlaceholder: "Type member full name...",
    matchingFound: "Matching Members Found — Tap Your Name Below To Confirm Check-In:",
    tapToCheckIn: "Tap to Check In ✓",
    checkInConfirmed: "Check-In Confirmed",
    welcomeToChurch: "Welcome to Church",
    nextMember: "Next Member Check-In →",
    firstTimeGuestPrompt: "First Time Guest? Visit the Welcome Desk or scan QR for Guest Intake",
    guestWelcomeHeader: "Welcome Home!",
    guestSubtitle: "We are honored to have you worship with us today! Please connect with our pastoral team.",
    firstName: "First Name",
    lastName: "Last Name",
    phoneLabel: "WhatsApp / Phone Number",
    submitGuestCard: "Submit Welcome Card",
    guestSuccessHeader: "God Bless You",
    guestSuccessMsg: "Your welcome card has been received. A pastor will reach out to welcome you personally!"
  },
  tw: {
    welcomeHeader: "FOUNTAIN GATE CHAPEL",
    subHeaderKiosk: "ASƆREDAN ANO ANOMBA HYƐEƐ",
    phoneTab: "Fon Nɔmma Keypad",
    nameTab: "Pɛ wo Din",
    enterPhonePlaceholder: "Hyɛ Fon Nɔmma Ha...",
    searchNamePlaceholder: "Twerɛ mmafra no din nyinaa...",
    matchingFound: "Nnipa a Wɔn Din Fata — Mmia Wo Din So na Hyɛ Mu:",
    tapToCheckIn: "Mmia so na Kɔ Mu ✓",
    checkInConfirmed: "W'asɔre Kɔkɔɔ no Agye Tom",
    welcomeToChurch: "Akwaaba wo Asore",
    nextMember: "Nnipa a Di Hɔ Hyɛ Mu →",
    firstTimeGuestPrompt: "Woawha Akwaaba Foforɔ? Kɔ Akwaaba Pondano anaa Scan QR",
    guestWelcomeHeader: "Akwaaba Fie!",
    guestSubtitle: "Yɛda Nyame ase sɛ wo ne yɛn rebɔ afɔreɛ nnɛ! Mesrɛ wo, kyerɛ wo ho mma yɛn asɔfoɔ.",
    firstName: "Din a Ɛdi Kan",
    lastName: "Agyadin / Abusuadin",
    phoneLabel: "WhatsApp / Fon Nɔmma",
    submitGuestCard: "Mane Akwaaba Krataa",
    guestSuccessHeader: "Nyame Nhyira Wo",
    guestSuccessMsg: "Yɛagye wo akwaaba krataa no. Ɔsɔfoɔ bi bɛfrɛ wo na w'agye wo kɔkɔɔ!"
  },
  ee: {
    welcomeHeader: "FOUNTAIN GATE CHAPEL",
    subHeaderKiosk: "SƆLEME GEGE ƉE EME TEƑE",
    phoneTab: "Kaƒomo Xexeme",
    nameTab: "Dii le Ŋkɔ me",
    enterPhonePlaceholder: "Ŋlɔ Kaƒomo Xexeme...",
    searchNamePlaceholder: "Ŋlɔ sɔlemela ƒe ŋkɔ blibo...",
    matchingFound: "Ame siwo ŋkɔ sɔ — Zi wò ŋkɔ dzi be nàge ɖe eme:",
    tapToCheckIn: "Zi edzi be nàge ɖe eme ✓",
    checkInConfirmed: "Sɔleme Gege Ɖe Eme Li",
    welcomeToChurch: "Woezɔ ɖe Sɔleme",
    nextMember: "Sɔlemela Kpɔea Gege Ɖe Eme →",
    firstTimeGuestPrompt: "Wòe nye Amedzro Yeye? Yi Woezɔ kplɔ̃ gbo alo scan QR",
    guestWelcomeHeader: "Woezɔ ɖe Afe!",
    guestSubtitle: "Yewó kpɔ dzidzɔ be èva subɔ kpli mí gbeagbe! Ŋlɔ wò ŋkɔ be nunɔlawo nakpɔ wò.",
    firstName: "Ŋkɔ Gbətɔ",
    lastName: "Ƒomeŋkɔ",
    phoneLabel: "WhatsApp / Kaƒomo Xexeme",
    submitGuestCard: "Ɖo Woezɔ Agbalã",
    guestSuccessHeader: "Mawu Nayra Wò",
    guestSuccessMsg: "Míexɔ wò woezɔ agbalãa. Nunɔla aɖe ayɔ wò kpuie be yayra wò!"
  },
  ha: {
    welcomeHeader: "FOUNTAIN GATE CHAPEL",
    subHeaderKiosk: "KOFAR SHIGA COCI DA KANSA",
    phoneTab: "Maballan Lambar Tarho",
    nameTab: "Bincika ta Suna",
    enterPhonePlaceholder: "Shigar da Lambar Tarho...",
    searchNamePlaceholder: "Rubuta cikakken sunan mamba...",
    matchingFound: "An Samu Mambobi — Danna Sunanka don Shiga:",
    tapToCheckIn: "Danna don Shiga ✓",
    checkInConfirmed: "An Tabbatar da Shiga",
    welcomeToChurch: "Sannu da zuwa Coci",
    nextMember: "Mamba na Gaba →",
    firstTimeGuestPrompt: "Bako ne na Farko? Jeka Teburin Maraba ko scan QR",
    guestWelcomeHeader: "Sannu da Zuwa Gida!",
    guestSubtitle: "Mu samu albarka da ka bauta tare da mu a yau! Da fatan za ka sadu da pastoci.",
    firstName: "Sunan Farko",
    lastName: "Sunan Iyali",
    phoneLabel: "WhatsApp / Lambar Tarho",
    submitGuestCard: "Aika Katin Maraba",
    guestSuccessHeader: "Allah Ya Yi Muku Albarka",
    guestSuccessMsg: "Mun karbi katin marabarku. Pastor zai tuntube ku don yi muku maraba!"
  },
  fr: {
    welcomeHeader: "FOUNTAIN GATE CHAPEL",
    subHeaderKiosk: "ENREGISTREMENT ENTRÉE TABLETTE",
    phoneTab: "Clavier Numéro Téléphone",
    nameTab: "Rechercher par Nom",
    enterPhonePlaceholder: "Entrez le Numéro de Téléphone...",
    searchNamePlaceholder: "Tapez le nom complet du membre...",
    matchingFound: "Membres Correspondants Trouvés — Appuyez sur Votre Nom :",
    tapToCheckIn: "Appuyez pour Valider ✓",
    checkInConfirmed: "Enregistrement Confirmé",
    welcomeToChurch: "Bienvenue à l'Église",
    nextMember: "Membre Suivant →",
    firstTimeGuestPrompt: "Nouveau Visiteur ? Visitez le Bureau d'Accueil ou scannez le QR",
    guestWelcomeHeader: "Bienvenue à la Maison !",
    guestSubtitle: "Nous sommes honorés de prier avec vous aujourd'hui ! Connectez-vous avec nos pasteurs.",
    firstName: "Prénom",
    lastName: "Nom de Famille",
    phoneLabel: "WhatsApp / Numéro Téléphone",
    submitGuestCard: "Soumettre la Carte d'Accueil",
    guestSuccessHeader: "Que Dieu vous Bénisse",
    guestSuccessMsg: "Votre carte d'accueil a été reçue. Un pasteur vous contactera personnellement !"
  }
};

export const LANGUAGE_LABELS: Record<Language, { label: string; code: string }> = {
  en: { label: 'English', code: 'EN' },
  tw: { label: 'Twi (Akan)', code: 'TW' },
  ee: { label: 'Ewe (Eʋegbe)', code: 'EE' },
  ha: { label: 'Hausa', code: 'HA' },
  fr: { label: 'Français', code: 'FR' }
};
