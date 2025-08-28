import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DocumentationModal from '../components/DocumentationModal';

describe('DocumentationModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    darkMode: false,
  };

  it('does not render when isOpen is false', () => {
    render(<DocumentationModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Calculation Methodology')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(<DocumentationModal {...defaultProps} />);
    expect(screen.getByText('Calculation Methodology')).toBeInTheDocument();
    expect(screen.getByText(/Total BTC Portfolio Value/)).toBeInTheDocument();
    expect(screen.getByText(/Structured Product Bundle Value/)).toBeInTheDocument();
    expect(screen.getByText(/NAV Erosion Risk/)).toBeInTheDocument();
    expect(screen.getByText(/LTV Exceedance/)).toBeInTheDocument();
    expect(screen.getByText(/Expected ROE/)).toBeInTheDocument();
    expect(screen.getByText(/Dilution Risk/)).toBeInTheDocument();
    expect(screen.getByText(/Price Distribution Analysis/)).toBeInTheDocument();
    expect(screen.getByText(/Scenario Analysis/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Close/i })).toBeInTheDocument();
  });

  it('applies light mode classes when darkMode is false', () => {
    render(<DocumentationModal {...defaultProps} />);
    const modal = screen.getByText('Calculation Methodology').closest('div');
    expect(modal).toHaveClass('bg-white', 'text-gray-900', 'border-gray-200');
    expect(modal).not.toHaveClass('bg-slate-800', 'text-white', 'border-slate-700');
  });

  it('applies dark mode classes when darkMode is true', () => {
    render(<DocumentationModal {...defaultProps} darkMode />);
    const modal = screen.getByText('Calculation Methodology').closest('div');
    expect(modal).toHaveClass('bg-slate-800', 'text-white', 'border-slate-700');
    expect(modal).not.toHaveClass('bg-white', 'text-gray-900', 'border-gray-200');
  });

  it('calls onClose when the Close button is clicked', () => {
    const onClose = vi.fn();
    render(<DocumentationModal {...defaultProps} onClose={onClose} />);
    const closeButton = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has correct modal structure and styling', () => {
    render(<DocumentationModal {...defaultProps} />);
    const modalOverlay = screen.getByText('Calculation Methodology').closest('div').parentElement;
    expect(modalOverlay).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'flex', 'items-center', 'justify-center', 'z-50');
    const modalContent = modalOverlay.querySelector('div');
    expect(modalContent).toHaveClass('p-6', 'rounded-xl', 'max-w-lg', 'w-full');
  });
});