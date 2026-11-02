import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

// components
import SkeletonLoader from '@app/components/SkeletonLoader';

describe('SkeletonLoader Detail layout', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // React dedupes DOM-nesting warnings per process, so this must run first
  it('renders without React DOM-nesting warnings', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<SkeletonLoader layout="Detail" />);

    const nestingWarnings = errorSpy.mock.calls.filter(([message]) =>
      /validateDOMNesting|cannot be a descendant|cannot contain/.test(
        String(message),
      ),
    );

    expect(nestingWarnings).toHaveLength(0);
  });

  it('does not nest block elements inside paragraphs', () => {
    const { container } = render(<SkeletonLoader layout="Detail" />);

    expect(container.querySelectorAll('p')).toHaveLength(0);
  });
});
