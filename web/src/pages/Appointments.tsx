import { Link } from 'react-router';

// Rendez-vous : à brancher sur l'agenda. En attendant, un état vide explicite.
export default function Appointments() {
  return (
    <main className="page">
      <p className="eyebrow">Rendez-vous</p>
      <h1>Vos rendez-vous</h1>
      <div className="empty-state">
        <p>
          Aucun rendez-vous planifié pour l’instant. Depuis une fiche prospect,
          « Préparer l’appel » rassemble ce qu’il faut savoir avant l’échange.
        </p>
        <Link className="link link--accent" to="/prospects">
          Voir les prospects →
        </Link>
      </div>
    </main>
  );
}
