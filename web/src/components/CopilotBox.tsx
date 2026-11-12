import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import type { Prospect } from '../types';
import { useToast } from './ui';

// Zone « Demandez au copilote » de l'accueil. Pas encore de conversation avec
// l'IA : les suggestions et les questions qui citent un prospect ouvrent la
// bonne fiche, au bon endroit ; le reste annonce la fonction à venir.
export default function CopilotBox({ prospects }: { prospects: Prospect[] }) {
  const [text, setText] = useState('');
  const navigate = useNavigate();
  const notify = useToast();
  const [first, second] = prospects;

  const suggestions = [
    first && `Préparer mon RDV avec ${first.name}`,
    second && `Qui contacter chez ${second.name} ?`,
    first && second && `Comparer ${first.name} et ${second.name}`,
  ].filter(Boolean) as string[];

  const ask = (question: string) => {
    const q = question.toLowerCase();
    const cited = prospects.filter((p) => q.includes(p.name.toLowerCase()));
    if (cited.length === 1) {
      const anchor = /contacter|interlocuteur|qui /.test(q)
        ? '#interlocuteurs'
        : '#recap';
      navigate(`/prospects/${cited[0].id}${anchor}`);
      return;
    }
    notify(
      cited.length > 1
        ? 'La comparaison de prospects arrive bientôt'
        : 'Citez un prospect, par exemple : « Préparer mon RDV avec … »',
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) ask(text);
  };

  return (
    <form className="copilot" onSubmit={submit}>
      <div className="copilot__chips">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            className="chip"
            onClick={() => {
              setText(s);
              ask(s);
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <label className="sr" htmlFor="copilot-input">
        Demandez au copilote
      </label>
      <input
        id="copilot-input"
        className="copilot__input"
        placeholder="Demandez au copilote…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoComplete="off"
      />
      <div className="copilot__foot">
        <span className="copilot__brand">
          <span aria-hidden="true">✦</span> Copilote Givaudan
        </span>
        <button
          type="submit"
          className="copilot__send"
          aria-label="Envoyer la question"
          disabled={!text.trim()}
        >
          →
        </button>
      </div>
    </form>
  );
}
