import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPassword from './ForgotPassword';
import { authService } from '../../services/authService';

vi.mock('../../services/authService', () => ({
  authService: { forgotPassword: vi.fn() },
}));

const mockedForgotPassword = vi.mocked(authService.forgotPassword);

const renderPage = () => render(
  <MemoryRouter>
    <ForgotPassword />
  </MemoryRouter>
);

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the confirmation screen and resend cooldown after a successful request', async () => {
    mockedForgotPassword.mockResolvedValue(new Response(JSON.stringify({ message: 'Solicitud recibida' }), { status: 201 }));
    renderPage();

    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'persona@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect(await screen.findByRole('heading', { name: 'Revisá tu correo' })).toBeTruthy();
    expect(screen.getByText('pe***@example.com')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reenviar enlace (60s)' })).toHaveProperty('disabled', true);
  });

  it('shows the backend error when the request fails', async () => {
    mockedForgotPassword.mockResolvedValue(new Response(JSON.stringify({ message: 'Servicio de correo no disponible' }), { status: 503 }));
    renderPage();

    fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'persona@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Servicio de correo no disponible');
  });
});