import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

// constants
import STATUS_CODE from '@app/constants/statusCode';

// components
import SkeletonLoader from '@app/components/SkeletonLoader';

describe('test infrastructure', () => {
  it('resolves the @app alias', () => {
    expect(STATUS_CODE.OK).toBe(200);
  });

  it('renders a component in jsdom with jest-dom matchers', () => {
    const { container } = render(<SkeletonLoader layout="Categories" />);

    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});
