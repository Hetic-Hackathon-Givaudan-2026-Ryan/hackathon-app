import { Link } from 'react-router';

export default function NotFound() {
  return (
    <main className="page">
      <h1>Page introuvable</h1>
      <p>
        Cette adresse ne correspond à aucune page.{' '}
        <Link className="link" to="/">
          Retour au tableau de bord
        </Link>
      </p>
    </main>
  );
}
