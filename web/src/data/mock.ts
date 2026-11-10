// Données fictives : entreprises, contacts et actualités sont inventés.
import type { Prospect, SalesUser, SignalType } from '../types';

export const currentUser: SalesUser = {
  firstName: 'Anne-Marie',
  lastName: 'Lefèvre',
  revenue: 1_840_000,
  target: 2_500_000,
};

const s = (type: SignalType, label: string, date: string) => ({
  type,
  label,
  date,
});

export const prospects: Prospect[] = [
  {
    id: 'verdane',
    name: 'Verdane Boissons',
    sector: 'Boissons',
    country: 'France',
    website: 'https://example.com/verdane',
    arr: 420_000,
    contact: {
      name: 'Julien Morel',
      role: 'Directeur R&D',
      email: 'j.morel@verdane.example',
    },
    score: 91,
    evolution: 4,
    priority: true,
    signals: [
      s('lancement', 'Gamme de boissons fonctionnelles annoncée', '2026-11-06'),
      s('recrutement', '3 postes d’aromaticien ouverts', '2026-11-02'),
    ],
    aiOverview:
      'Verdane prépare une gamme de boissons fonctionnelles sans sucre pour le printemps 2027. Les offres d’emploi en R&D et la communication autour de la réduction du sucre laissent penser qu’un nouveau partenaire arômes sera choisi d’ici la fin du trimestre.',
    scoreFactors: [
      { label: 'Lancement produit annoncé', weight: 35 },
      { label: 'Recrutements R&D', weight: 25 },
      { label: 'Taille du compte', weight: 18 },
      { label: 'Historique d’achat du secteur', weight: 13 },
    ],
    news: [
      {
        date: '2026-11-06',
        title: 'Verdane annonce une gamme « zéro sucre » pour 2027',
        source: 'LSA',
      },
      {
        date: '2026-10-21',
        title: 'Le groupe ouvre un centre d’innovation à Lyon',
        source: 'Les Échos',
      },
      {
        date: '2026-09-30',
        title: 'Résultats du T3 : +12 % sur les boissons plates',
        source: 'Communiqué',
      },
    ],
  },
  {
    id: 'maison-alba',
    name: 'Maison Alba',
    sector: 'Parfumerie fine',
    country: 'France',
    website: 'https://example.com/alba',
    arr: 310_000,
    contact: {
      name: 'Clara Benoît',
      role: 'Responsable achats',
      email: 'c.benoit@alba.example',
    },
    score: 88,
    evolution: -2,
    priority: true,
    signals: [
      s('fournisseur', 'Appel d’offres fournisseurs en cours', '2026-11-04'),
    ],
    aiOverview:
      'Maison Alba a lancé un appel d’offres pour renouveler deux de ses fournisseurs de compositions. Le score baisse légèrement car un concurrent a été cité dans la presse spécialisée.',
    scoreFactors: [
      { label: 'Appel d’offres ouvert', weight: 40 },
      { label: 'Taille du compte', weight: 22 },
      { label: 'Concurrent cité', weight: -8 },
      { label: 'Historique d’achat du secteur', weight: 18 },
    ],
    news: [
      {
        date: '2026-11-04',
        title: 'Maison Alba revoit sa chaîne d’approvisionnement',
        source: 'Cosmétique Mag',
      },
      {
        date: '2026-10-12',
        title: 'Nouvelle collection de parfums d’intérieur',
        source: 'Communiqué',
      },
    ],
  },
  {
    id: 'nordlys',
    name: 'Nordlys Snacks',
    sector: 'Snacking',
    country: 'Danemark',
    website: 'https://example.com/nordlys',
    arr: 260_000,
    contact: {
      name: 'Mette Larsen',
      role: 'Head of Innovation',
      email: 'm.larsen@nordlys.example',
    },
    score: 84,
    evolution: 9,
    priority: true,
    signals: [
      s('levee', 'Levée de fonds de 40 M€', '2026-11-05'),
      s('usine', 'Nouvelle ligne de production en Pologne', '2026-10-28'),
    ],
    aiOverview:
      'Après une levée de 40 M€, Nordlys accélère son expansion en Europe de l’Est. Une nouvelle ligne de production suppose de nouvelles recettes adaptées aux goûts locaux.',
    scoreFactors: [
      { label: 'Levée de fonds', weight: 30 },
      { label: 'Nouvelle usine', weight: 28 },
      { label: 'Taille du compte', weight: 14 },
      { label: 'Historique d’achat du secteur', weight: 12 },
    ],
    news: [
      {
        date: '2026-11-05',
        title: 'Nordlys lève 40 M€ pour son expansion européenne',
        source: 'Food Navigator',
      },
      {
        date: '2026-10-28',
        title: 'Une ligne de production ouvre près de Poznań',
        source: 'Communiqué',
      },
    ],
  },
  {
    id: 'clairsoin',
    name: 'Clairsoin',
    sector: 'Cosmétique',
    country: 'Belgique',
    website: 'https://example.com/clairsoin',
    arr: 180_000,
    contact: {
      name: 'Sophie Dumont',
      role: 'Cheffe de produit',
      email: 's.dumont@clairsoin.example',
    },
    score: 82,
    evolution: 6,
    priority: false,
    signals: [s('salon', 'Exposant à In-Cosmetics 2027', '2026-11-03')],
    aiOverview:
      'Clairsoin développe une ligne de soins naturels et cherche des ingrédients d’origine végétale. Sa présence au prochain salon In-Cosmetics est une bonne occasion de premier contact.',
    scoreFactors: [
      { label: 'Salon professionnel', weight: 22 },
      { label: 'Positionnement naturel', weight: 30 },
      { label: 'Taille du compte', weight: 15 },
      { label: 'Historique d’achat du secteur', weight: 15 },
    ],
    news: [
      {
        date: '2026-11-03',
        title: 'Clairsoin confirmé à In-Cosmetics 2027',
        source: 'Salon',
      },
    ],
  },
  {
    id: 'brasserie-orme',
    name: 'Brasserie de l’Orme',
    sector: 'Boissons',
    country: 'France',
    website: 'https://example.com/orme',
    arr: 95_000,
    contact: {
      name: 'Thomas Girard',
      role: 'Fondateur',
      email: 't.girard@orme.example',
    },
    score: 79,
    evolution: 11,
    priority: true,
    signals: [
      s('lancement', 'Bières sans alcool aromatisées en test', '2026-11-07'),
    ],
    aiOverview:
      'La brasserie teste des bières sans alcool aromatisées aux fruits. Le volume reste modeste mais la progression du score est la plus forte du portefeuille ce mois-ci.',
    scoreFactors: [
      { label: 'Produit en test', weight: 32 },
      { label: 'Croissance du segment sans alcool', weight: 25 },
      { label: 'Taille du compte', weight: 8 },
      { label: 'Historique d’achat du secteur', weight: 14 },
    ],
    news: [
      {
        date: '2026-11-07',
        title: 'L’Orme se lance dans le sans alcool',
        source: 'Rayon Boissons',
      },
    ],
  },
  {
    id: 'lavandor',
    name: 'Lavandor',
    sector: 'Entretien maison',
    country: 'Espagne',
    website: 'https://example.com/lavandor',
    arr: 220_000,
    contact: {
      name: 'Lucía Romero',
      role: 'Directrice marketing',
      email: 'l.romero@lavandor.example',
    },
    score: 73,
    evolution: 11,
    priority: false,
    signals: [
      s('recrutement', 'Recrutement d’un responsable olfaction', '2026-10-30'),
    ],
    aiOverview:
      'Lavandor recrute un responsable olfaction, ce qui indique une volonté de retravailler les parfums de ses lessives. Aucun appel d’offres public pour le moment.',
    scoreFactors: [
      { label: 'Recrutement clé', weight: 28 },
      { label: 'Taille du compte', weight: 20 },
      { label: 'Historique d’achat du secteur', weight: 25 },
    ],
    news: [
      {
        date: '2026-10-30',
        title: 'Lavandor renforce son équipe produit',
        source: 'Expansión',
      },
    ],
  },
  {
    id: 'pettit',
    name: 'Pettit Pâtisserie',
    sector: 'Boulangerie industrielle',
    country: 'France',
    website: 'https://example.com/pettit',
    arr: 140_000,
    contact: {
      name: 'Hugo Lambert',
      role: 'Responsable qualité',
      email: 'h.lambert@pettit.example',
    },
    score: 68,
    evolution: 0,
    priority: false,
    signals: [],
    aiOverview:
      'Compte stable sans signal récent. Les volumes sont réguliers et le fournisseur actuel est en place depuis plusieurs années.',
    scoreFactors: [
      { label: 'Taille du compte', weight: 25 },
      { label: 'Historique d’achat du secteur', weight: 30 },
      { label: 'Aucun signal récent', weight: 13 },
    ],
    news: [
      {
        date: '2026-09-15',
        title: 'Pettit rachète un atelier en Bretagne',
        source: 'Ouest-France',
      },
    ],
  },
  {
    id: 'aurelia',
    name: 'Aurelia Pet Food',
    sector: 'Alimentation animale',
    country: 'Italie',
    website: 'https://example.com/aurelia',
    arr: 175_000,
    contact: {
      name: 'Marco Ferri',
      role: 'Directeur R&D',
      email: 'm.ferri@aurelia.example',
    },
    score: 64,
    evolution: -5,
    priority: false,
    signals: [
      s('fournisseur', 'Contrat signé avec un concurrent', '2026-10-18'),
    ],
    aiOverview:
      'Aurelia vient de signer avec un concurrent sur une partie de sa gamme. Le score baisse, mais la gamme premium reste ouverte.',
    scoreFactors: [
      { label: 'Gamme premium ouverte', weight: 24 },
      { label: 'Taille du compte', weight: 20 },
      { label: 'Contrat concurrent', weight: -12 },
      { label: 'Historique d’achat du secteur', weight: 32 },
    ],
    news: [
      {
        date: '2026-10-18',
        title: 'Aurelia réorganise ses achats',
        source: 'Petfood Industry',
      },
    ],
  },
  {
    id: 'sol-y-mar',
    name: 'Sol y Mar',
    sector: 'Plats cuisinés',
    country: 'Espagne',
    website: 'https://example.com/solymar',
    arr: 120_000,
    contact: {
      name: 'Pablo Ortega',
      role: 'Acheteur',
      email: 'p.ortega@solymar.example',
    },
    score: 60,
    evolution: 0,
    priority: false,
    signals: [],
    aiOverview:
      'Peu d’informations publiques récentes. À requalifier lors du prochain échange.',
    scoreFactors: [
      { label: 'Taille du compte', weight: 22 },
      { label: 'Historique d’achat du secteur', weight: 38 },
    ],
    news: [],
  },
  {
    id: 'hygea',
    name: 'Hygea Laboratoires',
    sector: 'Hygiène',
    country: 'Suisse',
    website: 'https://example.com/hygea',
    arr: 90_000,
    contact: {
      name: 'Nina Keller',
      role: 'Cheffe de projet',
      email: 'n.keller@hygea.example',
    },
    score: 52,
    evolution: -3,
    priority: false,
    signals: [],
    aiOverview:
      'Activité ralentie depuis six mois, aucun projet de lancement identifié.',
    scoreFactors: [
      { label: 'Taille du compte', weight: 18 },
      { label: 'Activité en baisse', weight: -6 },
      { label: 'Historique d’achat du secteur', weight: 40 },
    ],
    news: [
      {
        date: '2026-08-02',
        title: 'Hygea ferme une ligne de production',
        source: 'Le Temps',
      },
    ],
  },
  {
    id: 'cafe-ronce',
    name: 'Café Ronce',
    sector: 'Boissons',
    country: 'France',
    website: 'https://example.com/ronce',
    arr: 70_000,
    contact: {
      name: 'Léa Perrin',
      role: 'Fondatrice',
      email: 'l.perrin@ronce.example',
    },
    score: 47,
    evolution: 2,
    priority: false,
    signals: [s('salon', 'Présent au Salon du Chocolat', '2026-10-25')],
    aiOverview:
      'Petit torréfacteur en croissance. Potentiel limité à court terme.',
    scoreFactors: [
      { label: 'Salon professionnel', weight: 12 },
      { label: 'Taille du compte', weight: 6 },
      { label: 'Historique d’achat du secteur', weight: 29 },
    ],
    news: [],
  },
  {
    id: 'velours',
    name: 'Velours Cosmetics',
    sector: 'Cosmétique',
    country: 'France',
    website: 'https://example.com/velours',
    arr: 260_000,
    contact: {
      name: 'Inès Haddad',
      role: 'Directrice innovation',
      email: 'i.haddad@velours.example',
    },
    score: 81,
    evolution: 3,
    priority: false,
    signals: [
      s('lancement', 'Ligne capillaire prévue pour 2027', '2026-11-01'),
    ],
    aiOverview:
      'Velours prépare une ligne capillaire et communique sur des parfums signature. Bon timing pour présenter des compositions dédiées.',
    scoreFactors: [
      { label: 'Lancement produit annoncé', weight: 30 },
      { label: 'Taille du compte', weight: 20 },
      { label: 'Historique d’achat du secteur', weight: 31 },
    ],
    news: [
      {
        date: '2026-11-01',
        title: 'Velours étend sa gamme au capillaire',
        source: 'Premium Beauty News',
      },
    ],
  },
];
