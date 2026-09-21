import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import ResetPassword from './ResetPassword';

const renderPage = (token?: string) => render(
  <MemoryRouter initialEntries={[token ? `/reset-password/${token}` : '/reset-password/']}>
    <Routes>
      <Route path="/reset-password/:token?" element={<ResetPassword />} />
    </Routes>
  </MemoryRouter>
);

describe('ResetPassword', () => {
  it('rejects mismatched passwords before calling the API', () => {
    renderPage('token-valido');
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'Nueva123!' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Otra123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }));

    expect(screen.getByRole('alert').textContent).toContain('Las contraseñas no coinciden.');
  });

  it('rejects a missing token', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: 'Nueva123!' } });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), { target: { value: 'Nueva123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar contraseña' }));

    expect(screen.getByRole('alert').textContent).toContain('El enlace de recuperación no es válido.');
  });
});