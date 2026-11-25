'use client';
import { useState } from 'react';
import ActionForm from './ActionForm';
import { PasswordField } from './ui';
import { changePassword } from '@/app/admin/actions';

/** Palavra-passe actual → nova → confirmar nova. */
export default function PasswordChangeForm({ hasPassword }: { hasPassword: boolean }) {
  const [key, setKey] = useState(0); // remonta o formulário depois de guardar (limpa campos e medidor)
  if (!hasPassword) {
    return (
      <div className="alert alert-light border small mb-0">
        Esta conta entra com o Google e não tem palavra-passe própria. Para definir uma, use &ldquo;Esqueceu a senha?&rdquo; no ecrã de login.
      </div>
    );
  }
  return (
    <ActionForm key={key} action={changePassword} submitLabel="Alterar palavra-passe" onSuccess={() => setKey((k) => k + 1)}>
      <PasswordField name="current_password" label="Palavra-passe actual" autoComplete="current-password" />
      <PasswordField name="new_password" label="Nova palavra-passe (mín. 8 caracteres)" minLength={8} meter />
      <PasswordField name="confirm_password" label="Confirmar nova palavra-passe" minLength={8} />
    </ActionForm>
  );
}
