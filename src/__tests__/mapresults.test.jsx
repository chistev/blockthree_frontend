import { describe, it, expect } from "vitest";
import { mapResults, processLTVPaths } from "../components/mapResults";

describe("mapResults", () => {
  const mockBackendResults = {
    nav: {
      avg_nav: 1000,
      ci_lower: 900,
      ci_upper: 1100,
      erosion_prob: 0.05,
      nav_paths: [1000, 1010, 1020],
    },
    dilution: {
      base_dilution: 0.1,
      avg_dilution: 0.15,
      structure_threshold_breached: false,
    },
    ltv: {
      avg_ltv: 0.6,
      exceed_prob: 0.2,
      ltv_paths: [0.5, 0.6, 0.7, 0.8],
    },
    roe: {
      avg_roe: 0.12,
    },
    preferred_bundle: {
      bundle_value: 500,
    },
    target_metrics: {
      target_nav: 1050,
      target_ltv: 0.65,
      target_convertible_value: 200,
      target_roe: 0.1,
      target_bundle_value: 550,
    },
    scenario_metrics: { scenario1: 100 },
    distribution_metrics: { dist1: 50 },
    optimized_param: { param1: 10 },
  };

  const btc_treasury = 100;
  const btc_current_market_price = 50000;

  it("maps backend results to frontend format correctly", () => {
    const result = mapResults(mockBackendResults, btc_treasury, btc_current_market_price);

    expect(result).toEqual({
      nav: {
        avg_nav: 1000,
        ci_lower: 900,
        ci_upper: 1100,
        erosion_prob: 0.05,
        nav_paths: [
          { time: 0, value: 1000 },
          { time: 0.01, value: 1010 },
          { time: 0.02, value: 1020 },
        ],
      },
      dilution: {
        base_dilution: 0.1,
        avg_dilution: 0.15,
        structure_threshold_breached: false,
      },
      ltv: {
        avg_ltv: 0.6,
        exceed_prob: 0.2,
        ltv_distribution: expect.any(Array), // Tested separately in processLTVPaths
      },
      roe: {
        avg_roe: 0.12,
      },
      preferred_bundle: {
        bundle_value: 500,
      },
      btc_portfolio_value: 100 * 50000, // 5,000,000
      target_metrics: {
        target_nav: 1050,
        target_ltv: 0.65,
        target_convertible_value: 200,
        target_roe: 0.1,
        target_bundle_value: 550,
      },
      scenario_metrics: { scenario1: 100 },
      distribution_metrics: { dist1: 50 },
      optimized_param: { param1: 10 },
    });
  });

  it("calculates btc_portfolio_value correctly", () => {
    const result = mapResults(mockBackendResults, btc_treasury, btc_current_market_price);
    expect(result.btc_portfolio_value).toBe(5000000);
  });

  it("handles missing optimized_param correctly", () => {
    const modifiedBackendResults = { ...mockBackendResults, optimized_param: undefined };
    const result = mapResults(modifiedBackendResults, btc_treasury, btc_current_market_price);
    expect(result.optimized_param).toBe(null);
  });
});

describe("processLTVPaths", () => {
  it("handles single value LTV paths", () => {
    const ltv_paths = [0.5];
    const result = processLTVPaths(ltv_paths);

    // Single value should fall into the last bin (edge case handling)
    expect(result).toHaveLength(20);
    expect(result[19]).toEqual({ ltv: "0.50", frequency: 1 });
    expect(result[0].frequency).toBe(0);
  });

  it("handles empty LTV paths", () => {
    const ltv_paths = [];
    const result = processLTVPaths(ltv_paths);

    // Should return 20 bins with zero frequencies
    expect(result).toHaveLength(20);
    expect(result.every((bin) => bin.frequency === 0)).toBe(true);
  });
});