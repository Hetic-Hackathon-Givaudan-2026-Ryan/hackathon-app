import { useRef, useState } from 'react';
import { getDataset, SOURCE, uploadDataset } from '../data/api';
import { useData } from '../lib/useData';
import { useToast } from './ui';

// Mode « ia » seulement : nom du jeu de données et import d'un autre fichier
export default function DatasetBar() {
  const { data: info } = useData('dataset', getDataset);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const notify = useToast();

  if (SOURCE !== 'ia') return null;

  const send = async (file: File) => {
    setBusy(true);
    try {
      const res = await uploadDataset(file);
      notify(`${res.name} : ${res.prospects} prospects chargés`);
      // Recharger la page vide les données gardées par les écrans
      setTimeout(() => window.location.reload(), 600);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Import impossible');
      setBusy(false);
    }
  };

  return (
    <div className="dataset">
      <span className="tag tag--soft">Données IA locale</span>
      {info && (
        <span className="muted">
          {info.name} · {info.rows} lignes · {info.prospects} prospects
        </span>
      )}
      <button
        type="button"
        className="link"
        disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? 'Import en cours…' : 'Importer un jeu de données'}
      </button>
      <input
        ref={input}
        type="file"
        accept=".csv,.xlsx,.xlsm,.tsv,.txt"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) send(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
