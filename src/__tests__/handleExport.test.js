import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleExport, validateWhatIfInput } from '../utils/handleExport';

// Mock the fetch API
global.fetch = vi.fn();

// Mock window.URL
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock document.createElement and related DOM methods
const mockLink = {
  click: vi.fn(),
  setAttribute: vi.fn(),
};
global.document.createElement = vi.fn(() => mockLink);
global.document.body.appendChild = vi.fn();
global.document.body.removeChild = vi.fn();

// Mock console.error once, keep it as a spy
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('handleExport', () => {
  const setError = vi.fn();
  const setIsExportLoading = vi.fn();
  const setExportType = vi.fn();
  const assumptions = { some: 'data' };
  const format = 'csv';
  const endpoint = '/api/calculate/';
  const param = 'BTC_treasury';
  const value = 100;

  beforeEach(() => {
    vi.clearAllMocks(); // reset calls, but keep spies
  });

  afterEach(() => {
    // no vi.restoreAllMocks() → keeps console.error spy alive
  });

  describe('validateWhatIfInput', () => {
    it('returns false and sets error for non-positive BTC_treasury', () => {
      const result = validateWhatIfInput('BTC_treasury', 0, setError);
      expect(result).toBe(false);
      expect(setError).toHaveBeenCalledWith('BTC_treasury must be positive');
    });

    it('returns false and sets error for non-positive BTC_current_market_price', () => {
      const result = validateWhatIfInput('BTC_current_market_price', -1, setError);
      expect(result).toBe(false);
      expect(setError).toHaveBeenCalledWith('BTC_current_market_price must be positive');
    });

    it('returns false and sets error for zero long_run_volatility', () => {
      const result = validateWhatIfInput('long_run_volatility', 0, setError);
      expect(result).toBe(false);
      expect(setError).toHaveBeenCalledWith('Long-run volatility cannot be zero');
    });

    it('returns false and sets error for negative BTC_purchased', () => {
      const result = validateWhatIfInput('BTC_purchased', -1, setError);
      expect(result).toBe(false);
      expect(setError).toHaveBeenCalledWith('BTC_purchased cannot be negative');
    });

    it('returns false and sets error for paths less than 1', () => {
      const result = validateWhatIfInput('paths', 0, setError);
      expect(result).toBe(false);
      expect(setError).toHaveBeenCalledWith('Paths must be at least 1');
    });

    it('returns true for valid input', () => {
      const result = validateWhatIfInput('BTC_treasury', 100, setError);
      expect(result).toBe(true);
      expect(setError).not.toHaveBeenCalled();
    });
  });

  describe('handleExport', () => {
    it('does not proceed if validation fails', async () => {
  const result = await handleExport(
    format,
    endpoint,
    'BTC_treasury',
    0,
    assumptions,
    setError,
    setIsExportLoading,
    setExportType
  );

  expect(result).toBeUndefined();
  expect(setError).toHaveBeenCalledWith('BTC_treasury must be positive');
  expect(fetch).not.toHaveBeenCalled();
  expect(setIsExportLoading).not.toHaveBeenCalled();
  expect(setExportType).not.toHaveBeenCalled();
});


    it('sets loading and export type correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: vi.fn().mockResolvedValueOnce(new Blob()),
      });

      await handleExport(format, endpoint, param, value, assumptions, setError, setIsExportLoading, setExportType);

      expect(setIsExportLoading).toHaveBeenCalledWith(true);
      expect(setExportType).toHaveBeenCalledWith('CSV');
      expect(setError).toHaveBeenCalledWith(null);
    });

    it('makes correct fetch request with param and value', async () => {
      const blob = new Blob();
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: vi.fn().mockResolvedValueOnce(blob),
      });

      await handleExport(format, endpoint, param, value, assumptions, setError, setIsExportLoading, setExportType);

      expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/calculate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assumptions, format, use_live: true, param, value }),
      });
    });

    it('makes correct fetch request without param and value', async () => {
      const blob = new Blob();
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: vi.fn().mockResolvedValueOnce(blob),
      });

      await handleExport(format, endpoint, null, null, assumptions, setError, setIsExportLoading, setExportType);

      expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:8000/api/calculate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assumptions, format, use_live: true }),
      });
    });

    it('triggers file download on successful response', async () => {
      const blob = new Blob();
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: vi.fn().mockResolvedValueOnce(blob),
      });
      const mockUrl = 'mock-url';
      mockCreateObjectURL.mockReturnValueOnce(mockUrl);

      await handleExport(format, endpoint, param, value, assumptions, setError, setIsExportLoading, setExportType);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', `metrics.${format}`);
      expect(mockLink.href).toBe(mockUrl);
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    it('handles fetch error and sets error message', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await handleExport(format, endpoint, param, value, assumptions, setError, setIsExportLoading, setExportType);

      expect(setError).toHaveBeenCalledWith('Failed to export CSV. Please try again.');
      expect(console.error).toHaveBeenCalledWith(
        `Export ${format} failed:`,
        expect.any(Error)
      );
    });

    it('handles HTTP error and sets error message', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        blob: vi.fn().mockResolvedValueOnce(new Blob()),
      });

      await handleExport(format, endpoint, param, value, assumptions, setError, setIsExportLoading, setExportType);

      expect(setError).toHaveBeenCalledWith('Failed to export CSV. Please try again.');
      expect(console.error).toHaveBeenCalledWith(
        `Export ${format} failed:`,
        expect.any(Error)
      );
    });

    it('resets loading and export type after completion', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        blob: vi.fn().mockResolvedValueOnce(new Blob()),
      });

      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
      await handleExport(format, endpoint, param, value, assumptions, setError, setIsExportLoading, setExportType);

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
      // Simulate setTimeout callback
      setTimeoutSpy.mock.calls[0][0]();
      expect(setIsExportLoading).toHaveBeenCalledWith(false);
      expect(setExportType).toHaveBeenCalledWith(null);
    });
  });
});
