import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FaqAccordion from './FaqAccordion';

const items = [
  { question: 'Question one?', answer: 'Answer one.' },
  { question: 'Question two?', answer: 'Answer two.' },
];

describe('FaqAccordion', () => {
  it('shows the first answer expanded by default', () => {
    render(<FaqAccordion items={items} />);
    expect(screen.getByText('Answer one.')).toBeInTheDocument();
    expect(screen.queryByText('Answer two.')).not.toBeInTheDocument();
  });

  it('expands a different item when its question is clicked', async () => {
    const user = userEvent.setup();
    render(<FaqAccordion items={items} />);

    await user.click(screen.getByText('Question two?'));

    expect(screen.getByText('Answer two.')).toBeInTheDocument();
    expect(screen.queryByText('Answer one.')).not.toBeInTheDocument();
  });

  it('collapses the open item when its question is clicked again', async () => {
    const user = userEvent.setup();
    render(<FaqAccordion items={items} />);

    await user.click(screen.getByText('Question one?'));

    expect(screen.queryByText('Answer one.')).not.toBeInTheDocument();
  });
});
