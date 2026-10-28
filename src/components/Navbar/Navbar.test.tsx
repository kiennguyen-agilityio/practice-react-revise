import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// components
import Navbar from '@app/components/Navbar';

// Replace the asset with a sentinel URL so the test only passes when the
// component renders the imported value rather than a hardcoded path
vi.mock('@app/assets/images/avatar.jpg', () => ({
  default: 'https://assets.test/imported-avatar.jpg',
}));

describe('Navbar', () => {
  it('renders the avatar from the imported asset', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: 'Admin' })).toHaveAttribute(
      'src',
      'https://assets.test/imported-avatar.jpg',
    );
  });

  it('keeps the brand link and user details', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Tasty' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByText('Marvin McKinney')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
  });
});
