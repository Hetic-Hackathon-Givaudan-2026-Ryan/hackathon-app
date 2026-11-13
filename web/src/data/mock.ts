// Données fictives pour la démo : entreprises, personnes et sources sont inventées.
import type {
  Contact,
  Prospect,
  Question,
  Reach,
  ScoreDetail,
  Segment,
  Signal,
  SignalKind,
  Size,
  Takeaway,
} from '../types';

export const currentUser = {
  firstName: 'Anne Marie',
  lastName: 'Lefèvre',
  role: 'KAM · Europe',
};

const sig = (
  kind: SignalKind,
  summary: string,
  source: string,
  date: string,
): Signal => ({ kind, summary, source, date });

// Répartit un score : Potentiel /60 (adéquation /35, taille /15, dynamique /10),
// Opportunité /30, Accessibilité /10.
function score(
  [fit, size, dyn]: [number, number, number],
  opp: number,
  acc: number,
  oppNotes: string[] = [],
  accNotes: string[] = [],
  sources = 4,
): ScoreDetail {
  const potential = fit + size + dyn;
  const total = potential + opp + acc;
  return {
    total,
    rank: 0, // calculé plus bas, une fois la liste triée
    reliability: sources >= 5 ? 'élevée' : sources >= 3 ? 'moyenne' : 'faible',
    sources,
    axes: [
      {
        label: 'Potentiel',
        value: potential,
        max: 60,
        items: [
          { label: 'Adéquation avec l’offre Givaudan', value: fit, max: 35 },
          { label: 'Taille & solidité', value: size, max: 15 },
          { label: 'Dynamique d’innovation', value: dyn, max: 10 },
        ],
      },
      {
        label: 'Opportunité',
        value: opp,
        max: 30,
        items: [{ label: 'Signaux (type × fraîcheur)', value: opp, max: 30 }],
        notes: oppNotes,
      },
      {
        label: 'Accessibilité',
        value: acc,
        max: 10,
        items: [
          { label: 'Interlocuteur et lien Givaudan', value: acc, max: 10 },
        ],
        notes: accNotes,
      },
    ],
  };
}

interface Seed {
  id: string;
  name: string;
  segment: Segment;
  activity: string;
  country: string;
  city: string;
  size: Size;
  revenue?: string;
  reach: Reach;
  why: string;
  score: ScoreDetail;
  signals?: Signal[];
  takeaways?: Takeaway[];
  questions?: Question[];
  contacts?: Contact[];
  history?: string;
}

const make = (s: Seed): Prospect => ({
  website: `${s.id.replace(/-/g, '')}.example`,
  signals: [],
  takeaways: [],
  questions: [],
  contacts: [],
  history: 'Aucun échange connu avec Givaudan.',
  ...s,
});

const seeds: Seed[] = [
  {
    id: 'nordika-foods',
    name: 'Nordika Foods',
    segment: 'Taste & Wellbeing',
    activity: 'Produits laitiers végétaux',
    country: 'Danemark',
    city: 'Copenhague',
    size: 'ETI',
    revenue: '~420 M€',
    reach: 'Régionale',
    why: 'lancement d’une gamme sans sucres ajoutés en France au T1 2027.',
    score: score(
      [33, 14, 9],
      25,
      10,
      [
        'Lancement de gamme · il y a 15 jours · 10 pts',
        'Recrutement Flavour Development Manager · il y a 8 jours · 8 pts',
        'Objectif RSE -30 % de sucre · il y a 60 jours · 4 pts',
        'Convergence : 3 sources indépendantes · +3 pts',
      ],
      [
        'Head of R&D identifiée · email pro vérifié · échantillons Givaudan Nordics en 2024',
      ],
      6,
    ),
    signals: [
      sig(
        'Lancement produit',
        'Annonce une gamme de yaourts végétaux sans sucres ajoutés en France au T1 2027.',
        'Communiqué de presse',
        '2026-10-28',
      ),
      sig(
        'Offre d’emploi',
        'Recrute un·e Flavour Development Manager à Copenhague.',
        'LinkedIn',
        '2026-11-04',
      ),
    ],
    takeaways: [
      {
        text: 'Nordika lance une gamme de yaourts végétaux **sans sucres ajoutés** en France au T1 2027.',
        source: 'Communiqué de presse · 28 oct. 2026',
      },
      {
        text: 'Ils recrutent un·e **Flavour Development Manager** à Copenhague : le développement aromatique de la gamme n’est pas encore pourvu.',
        source: 'Offre d’emploi LinkedIn · 4 nov. 2026',
      },
      {
        text: 'Leur rapport RSE fixe **-30 % de sucre d’ici 2028** sur toute la gamme, sans perte de goût.',
        source: 'Rapport RSE 2025, p. 34',
      },
    ],
    questions: [
      {
        text: 'Quel profil de goût visez-vous pour compenser la baisse de sucre sans perdre en gourmandise ?',
        links: [1, 3],
      },
      {
        text: 'Le développement aromatique sera-t-il fait en interne ou confié à un partenaire ?',
        links: [2],
      },
      {
        text: 'Quelles contraintes clean label ou bio s’appliquent au lancement en France ?',
        links: [1],
      },
      {
        text: 'Qui valide le choix du fournisseur : R&D, achats ou marketing ?',
        links: 'contacts',
      },
    ],
    contacts: [
      {
        name: 'Sofie Jensen',
        role: 'Head of R&D',
        since: 'en poste depuis 3 mois',
        buyingRole: 'Décision technique',
        why: 'pilote la nouvelle gamme sans sucres ajoutés.',
        email: 'sofie.jensen@nordikafoods.example',
        recommended: true,
      },
      {
        name: 'Mads Larsen',
        role: 'Category Buyer, ingrédients',
        buyingRole: 'Achats',
        email: 'mads.larsen@nordikafoods.example',
      },
      {
        name: 'Ida Holm',
        role: 'Brand Manager France',
        buyingRole: 'Marketing',
        email: 'ida.holm@nordikafoods.example',
      },
    ],
    history:
      'Givaudan Nordics a envoyé des échantillons en 2024 (contact interne : Thomas K.). Aucun échange depuis.',
  },
  {
    id: 'maison-lumen',
    name: 'Maison Lumen',
    segment: 'Fragrance & Beauty',
    activity: 'Soins du corps',
    country: 'France',
    city: 'Auvergne-Rhône-Alpes',
    size: 'PME',
    revenue: '~38 M€',
    reach: 'Locale',
    why: 'recrute pour une nouvelle ligne soin corps.',
    score: score(
      [32, 10, 9],
      28,
      9,
      [
        'Recrutement Fragrance Development Manager · il y a 8 jours · 12 pts',
        'Nouvelle ligne soin corps annoncée · il y a 20 jours · 10 pts',
        'Convergence : 2 sources · +6 pts',
      ],
      ['Directrice marketing identifiée · email pro vérifié'],
      5,
    ),
    signals: [
      sig(
        'Offre d’emploi',
        'Recrute un·e Fragrance Development Manager à Lyon pour sa ligne soin corps.',
        'LinkedIn',
        '2026-11-04',
      ),
    ],
    takeaways: [
      {
        text: 'Maison Lumen prépare une **ligne soin corps** pour le printemps 2027.',
        source: 'Interview du fondateur · Cosmétique Mag · 22 oct. 2026',
      },
      {
        text: 'Le poste de **Fragrance Development Manager** est ouvert à Lyon : le choix du parfumeur n’est pas fait.',
        source: 'Offre d’emploi LinkedIn · 4 nov. 2026',
      },
    ],
    questions: [
      {
        text: 'Quelle signature olfactive voulez-vous pour la ligne soin corps ?',
        links: [1],
      },
      {
        text: 'Le futur Fragrance Development Manager choisira-t-il le parfumeur ?',
        links: [2],
      },
    ],
    contacts: [
      {
        name: 'Claire Dumas',
        role: 'Directrice marketing',
        buyingRole: 'Décision',
        email: 'claire.dumas@maisonlumen.example',
        recommended: true,
      },
    ],
  },
  {
    id: 'velia-beverages',
    name: 'Vélia Beverages',
    segment: 'Taste & Wellbeing',
    activity: 'Boissons fonctionnelles',
    country: 'Italie',
    city: 'Lombardie',
    size: 'ETI',
    revenue: '~260 M€',
    reach: 'Régionale',
    why: 'ouvre une usine à Milan en 2027.',
    score: score(
      [30, 13, 8],
      24,
      9,
      ['Nouvelle usine à Milan · il y a 28 jours · 14 pts'],
      [],
      5,
    ),
    signals: [
      sig(
        'Expansion',
        'Ouvre une usine à Milan en 2027 pour doubler sa production de boissons.',
        'Il Sole 24 Ore',
        '2026-10-15',
      ),
    ],
  },
  {
    id: 'brava-snacks',
    name: 'Brava Snacks',
    segment: 'Taste & Wellbeing',
    activity: 'Chips et biscuits apéritifs',
    country: 'Espagne',
    city: 'Catalogne',
    size: 'ETI',
    revenue: '~190 M€',
    reach: 'Régionale',
    why: 'obligation de réduire le sel de 20 %.',
    score: score(
      [29, 12, 7],
      23,
      8,
      ['Accord filière sel -20 % · il y a 6 jours · 15 pts'],
      [],
      4,
    ),
    signals: [
      sig(
        'Réglementation',
        'Doit réduire le sel de 20 % sur sa gamme chips d’ici 2027 (accord filière).',
        'Ministère de l’Agriculture',
        '2026-11-06',
      ),
    ],
  },
  {
    id: 'atelier-seve',
    name: 'Atelier Sève',
    segment: 'Fragrance & Beauty',
    activity: 'Cosmétique naturelle',
    country: 'Belgique',
    city: 'Bruxelles',
    size: 'PME',
    reach: 'Locale',
    why: 'levée de fonds de 12 M€ en octobre.',
    score: score(
      [28, 9, 9],
      22,
      8,
      ['Levée de 12 M€ · il y a 21 jours'],
      [],
      4,
    ),
    signals: [
      sig(
        'Levée de fonds',
        'Lève 12 M€ pour élargir sa gamme de soins naturels.',
        'L’Echo',
        '2026-10-22',
      ),
    ],
  },
  {
    id: 'kora-dairy',
    name: 'Kora Dairy',
    segment: 'Taste & Wellbeing',
    activity: 'Produits laitiers',
    country: 'Pays-Bas',
    city: 'Frise',
    size: 'ETI',
    reach: 'Régionale',
    why: 'bonne adéquation, pas de signal récent.',
    score: score([30, 13, 7], 14, 8, [], [], 3),
  },
  {
    id: 'lys-co',
    name: 'Lys & Co',
    segment: 'Fragrance & Beauty',
    activity: 'Parfums d’intérieur',
    country: 'France',
    city: 'PACA',
    size: 'PME',
    reach: 'Locale',
    why: 'nouvelle directrice générale depuis septembre.',
    score: score(
      [26, 8, 8],
      18,
      8,
      ['Changement de direction · il y a 2 mois'],
      [],
      3,
    ),
    signals: [
      sig(
        'Changement de direction',
        'Nomme une nouvelle directrice générale, venue d’un grand groupe de cosmétique.',
        'Les Échos',
        '2026-09-18',
      ),
    ],
  },
  {
    id: 'hestia-bakery',
    name: 'Hestia Bakery',
    segment: 'Taste & Wellbeing',
    activity: 'Boulangerie industrielle',
    country: 'Allemagne',
    city: 'Bavière',
    size: 'ETI',
    reach: 'Régionale',
    why: 'taille et adéquation, sans signal récent.',
    score: score([26, 13, 6], 10, 6, [], [], 2),
  },
  {
    id: 'solenne-cosmetiques',
    name: 'Solenne Cosmétiques',
    segment: 'Fragrance & Beauty',
    activity: 'Maquillage',
    country: 'France',
    city: 'Île-de-France',
    size: 'PME',
    reach: 'Locale',
    why: 'lance une gamme parfumée pour 2027.',
    score: score(
      [22, 8, 7],
      16,
      5,
      ['Lancement annoncé · il y a 40 jours'],
      [],
      3,
    ),
    signals: [
      sig(
        'Lancement produit',
        'Prépare une gamme de baumes à lèvres parfumés pour 2027.',
        'Cosmétique Mag',
        '2026-10-02',
      ),
    ],
  },
  {
    id: 'ostra-nutrition',
    name: 'Ostra Nutrition',
    segment: 'Taste & Wellbeing',
    activity: 'Nutrition sportive',
    country: 'Pologne',
    city: 'Mazovie',
    size: 'PME',
    reach: 'Régionale',
    why: 'recrute un chef de produit arômes.',
    score: score([22, 8, 8], 12, 5, [], [], 2),
    signals: [
      sig(
        'Offre d’emploi',
        'Recrute un chef de produit arômes pour sa gamme protéinée.',
        'LinkedIn',
        '2026-10-20',
      ),
    ],
  },
  {
    id: 'aurel-parfums',
    name: 'Aurel Parfums',
    segment: 'Fragrance & Beauty',
    activity: 'Parfumerie de niche',
    country: 'Suisse',
    city: 'Genève',
    size: 'PME',
    reach: 'Internationale',
    why: 'adéquation forte, peu de signaux.',
    score: score([24, 7, 6], 8, 7, [], [], 2),
  },
  {
    id: 'fjord-kitchen',
    name: 'Fjord Kitchen',
    segment: 'Taste & Wellbeing',
    activity: 'Plats cuisinés',
    country: 'Norvège',
    city: 'Oslo',
    size: 'ETI',
    reach: 'Régionale',
    why: 'expansion vers la Suède.',
    score: score([18, 11, 5], 10, 5, [], [], 2),
    signals: [
      sig(
        'Expansion',
        'Ouvre un entrepôt en Suède pour couvrir la Scandinavie.',
        'E24',
        '2026-09-30',
      ),
    ],
  },
  {
    id: 'melo-drinks',
    name: 'Melo Drinks',
    segment: 'Taste & Wellbeing',
    activity: 'Sodas artisanaux',
    country: 'Portugal',
    city: 'Lisbonne',
    size: 'PME',
    reach: 'Locale',
    why: 'petite structure en croissance.',
    score: score([20, 6, 7], 9, 5, [], [], 2),
  },
  {
    id: 'terrae-bio',
    name: 'Terrae Bio',
    segment: 'Taste & Wellbeing',
    activity: 'Épicerie bio',
    country: 'France',
    city: 'Occitanie',
    size: 'PME',
    reach: 'Locale',
    why: 'nouvelle réglementation bio en 2027.',
    score: score([17, 6, 5], 11, 5, [], [], 2),
    signals: [
      sig(
        'Réglementation',
        'Concernée par le nouveau cahier des charges bio européen de 2027.',
        'Agence Bio',
        '2026-10-10',
      ),
    ],
  },
  {
    id: 'camille-fils',
    name: 'Camille & Fils',
    segment: 'Fragrance & Beauty',
    activity: 'Savonnerie',
    country: 'Belgique',
    city: 'Liège',
    size: 'PME',
    reach: 'Locale',
    why: 'adéquation moyenne, pas de signal.',
    score: score([18, 6, 4], 8, 5, [], [], 1),
  },
];

// Évolution récente du score, en points, pour la démo
const trends: Record<string, number> = {
  'nordika-foods': 6,
  'maison-lumen': 4,
  'velia-beverages': 2,
  'brava-snacks': -3,
  'atelier-seve': 1,
  'kora-dairy': -2,
  'lys-co': 3,
  'hestia-bakery': -5,
  'solenne-cosmetiques': 0,
  'ostra-nutrition': 2,
  'aurel-parfums': -1,
  'fjord-kitchen': -4,
  'melo-drinks': 1,
  'terrae-bio': 0,
  'camille-fils': -2,
};

export const prospects: Prospect[] = seeds
  .map(make)
  .map((p) => ({ ...p, score: { ...p.score, trend: trends[p.id] ?? 0 } }))
  .sort((a, b) => b.score.total - a.score.total)
  .map((p, i) => ({ ...p, score: { ...p.score, rank: i + 1 } }));
