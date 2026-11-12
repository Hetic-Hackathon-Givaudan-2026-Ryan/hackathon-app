// Reprise en React de l'ancienne page de démonstration questions-réponses
// (tickets #9 et #10). Accessible à /questions, hors du menu principal.
import { useEffect, useState, type FormEvent } from 'react';

type Question = { id: number; question: string; answer: string };

export default function Questions() {
  const [health, setHealth] = useState('Connexion à l’API…');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/health').then((r) => r.json()),
      fetch('/api/questions').then((r) => r.json() as Promise<Question[]>),
    ])
      .then(([status, list]) => {
        if (!active) return;
        setHealth(`API OK · ${status.db}`);
        setQuestions(list);
      })
      .catch(() => active && setHealth('API injoignable'));
    return () => {
      active = false;
    };
  }, [version]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const question = new FormData(form).get('question');
    await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    form.reset();
    setVersion((v) => v + 1);
  }

  return (
    <main className="page">
      <h1>Questions à l’IA</h1>
      <p className="muted">{health}</p>
      <form className="tools" onSubmit={submit}>
        <label className="search">
          <span className="sr">Question</span>
          <input
            id="question"
            name="question"
            placeholder="Posez une question à l'IA"
            required
          />
        </label>
        <button className="btn">Envoyer</button>
      </form>
      <ul>
        {questions.map((q) => (
          <li key={q.id}>
            {q.question} → {q.answer}
          </li>
        ))}
      </ul>
    </main>
  );
}
