// Process LTV paths into histogram bins
const processLTVPaths = (ltv_paths) => {
  const num_bins = 20;

  // Case: no LTV paths
  if (ltv_paths.length === 0) {
    return Array(num_bins).fill(0).map((_, i) => ({
      ltv: (i / num_bins).toFixed(2),
      frequency: 0,
    }));
  }

  const min_ltv = Math.min(...ltv_paths);
  const max_ltv = Math.max(...ltv_paths);

  // Case: all values are the same
  if (min_ltv === max_ltv) {
    const bins = Array(num_bins).fill(0);
    bins[num_bins - 1] = ltv_paths.length; // put all in last bin
    return bins.map((frequency, index) => ({
      ltv: (min_ltv + (index + 0.5) * (max_ltv - min_ltv) / num_bins).toFixed(2),
      frequency,
    }));
  }

  const bin_width = (max_ltv - min_ltv) / num_bins;
  const bins = Array(num_bins).fill(0);

  // Assign each LTV value to the correct bin
  ltv_paths.forEach((ltv) => {
    const bin_index = Math.min(
      Math.floor((ltv - min_ltv) / bin_width),
      num_bins - 1
    );
    bins[bin_index]++;
  });

  // Convert bins to array of objects with midpoint labels
  return bins.map((frequency, index) => ({
    // Fix: Use toFixed(2) to handle floating-point precision issues
    ltv: (min_ltv + (index + 0.5) * bin_width).toFixed(2),
    frequency,
  }));
};

// Map backend results to frontend format
const mapResults = (backendResults, btc_treasury, btc_current_market_price) => ({
  nav: {
    avg_nav: backendResults.nav.avg_nav,
    ci_lower: backendResults.nav.ci_lower,
    ci_upper: backendResults.nav.ci_upper,
    erosion_prob: backendResults.nav.erosion_prob,
    nav_paths: backendResults.nav.nav_paths.map((value, index) => ({
      time: index / 100,
      value,
    })),
  },
  dilution: {
    base_dilution: backendResults.dilution.base_dilution,
    avg_dilution: backendResults.dilution.avg_dilution,
    structure_threshold_breached:
      backendResults.dilution.structure_threshold_breached,
  },
  ltv: {
    avg_ltv: backendResults.ltv.avg_ltv,
    exceed_prob: backendResults.ltv.exceed_prob,
    ltv_distribution: processLTVPaths(backendResults.ltv.ltv_paths),
  },
  roe: {
    avg_roe: backendResults.roe.avg_roe,
  },
  preferred_bundle: {
    bundle_value: backendResults.preferred_bundle.bundle_value,
  },
  btc_portfolio_value: btc_treasury * btc_current_market_price,
  target_metrics: {
    target_nav: backendResults.target_metrics.target_nav,
    target_ltv: backendResults.target_metrics.target_ltv,
    target_convertible_value:
      backendResults.target_metrics.target_convertible_value,
    target_roe: backendResults.target_metrics.target_roe,
    target_bundle_value: backendResults.target_metrics.target_bundle_value,
  },
  scenario_metrics: backendResults.scenario_metrics,
  distribution_metrics: backendResults.distribution_metrics,
  optimized_param: backendResults.optimized_param || null,
});

export { mapResults, processLTVPaths };
