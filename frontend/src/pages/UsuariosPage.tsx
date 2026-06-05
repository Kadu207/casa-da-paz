import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Usuario {
  id: number;
  email: string;
  setorAcesso: string;
  pessoa: { nomeCompleto: string };
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  useEffect(() => {
    api<Usuario[]>('/auth/usuarios').then(setUsuarios).catch(console.error);
  }, []);

  return (
    <div>
      <h2 className="text-xl font-serif text-[var(--color-accent)] mb-4">Usuários</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-white/20">
            <th className="p-2">Nome</th>
            <th className="p-2">E-mail</th>
            <th className="p-2">Setor</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id} className="border-b border-white/10">
              <td className="p-2">{u.pessoa.nomeCompleto}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.setorAcesso}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
