// mapResults.jsx

// Process LTV paths into chart-friendly format
const processLTVPaths = (ltvPaths) => {
  if (!ltvPaths || !Array.isArray(ltvPaths)) return [];

  return ltvPaths.map((value, index) => ({
    time: index / 100,   // adjust scale as needed
    value,
  }));
};

const mapResults = (backendResults, btc_treasury, btc_current_market_price) => {
  if (!backendResults.metrics) {
    console.error("Backend results missing metrics:", backendResults);
    throw new Error("Invalid backend response: missing metrics");
  }

  const metrics = backendResults.metrics;

  // Map candidates to structure-specific metrics
  const structureMetrics = {
    btc_loan: {},
    convertible: {},
    hybrid: {},
  };

  // Process candidates to extract structure-specific metrics
  backendResults.candidates?.forEach((candidate) => {
    const structure = candidate.params.structure.toLowerCase();
    if (structure === "loan") {
      structureMetrics.btc_loan = {
        avg_dilution: candidate.metrics.dilution_p50 || 0,
        exceed_prob: candidate.metrics.ltv_breach_prob || 0,
        avg_roe: candidate.metrics.nav_dist.mean || 0, // ROE approximation
        runway_months: candidate.metrics.runway_dist.mean || 0,
      };
    } else if (structure === "convertible") {
      structureMetrics.convertible = {
        avg_dilution: candidate.metrics.dilution_p50 || 0,
        exceed_prob: candidate.metrics.ltv_breach_prob || 0,
        avg_roe: candidate.metrics.nav_dist.mean || 0,
        runway_months: candidate.metrics.runway_dist.mean || 0,
      };
    } else if (structure === "hybrid") {
      structureMetrics.hybrid = {
        avg_dilution: candidate.metrics.dilution_p50 || 0,
        exceed_prob: candidate.metrics.ltv_breach_prob || 0,
        avg_roe: candidate.metrics.nav_dist.mean || 0,
        runway_months: candidate.metrics.runway_dist.mean || 0,
      };
    }
  });

  return {
    nav: {
      avg_nav: metrics.nav.avg_nav,
      ci_lower: metrics.nav.ci_lower,
      ci_upper: metrics.nav.ci_upper,
      erosion_prob: metrics.nav.erosion_prob,
      nav_paths: metrics.nav.nav_paths.map((value, index) => ({
        time: index / 100,
        value,
      })),
    },
    dilution: {
      base_dilution: metrics.dilution.base_dilution,
      avg_dilution: metrics.dilution.avg_dilution,
      avg_btc_loan_dilution: structureMetrics.btc_loan.avg_dilution || 0,
      avg_convertible_dilution: structureMetrics.convertible.avg_dilution || 0,
      avg_hybrid_dilution: structureMetrics.hybrid.avg_dilution || 0,
      structure_threshold_breached:
        metrics.dilution.structure_threshold_breached || false,
    },
    ltv: {
      avg_ltv: metrics.ltv.avg_ltv,
      exceed_prob: metrics.ltv.exceed_prob,
      exceed_prob_btc_loan: structureMetrics.btc_loan.exceed_prob || 0,
      exceed_prob_convertible: structureMetrics.convertible.exceed_prob || 0,
      exceed_prob_hybrid: structureMetrics.hybrid.exceed_prob || 0,
      ltv_distribution: processLTVPaths(metrics.ltv.ltv_paths),
    },
    roe: {
      avg_roe: metrics.roe.avg_roe,
      avg_roe_btc_loan: structureMetrics.btc_loan.avg_roe || 0,
      avg_roe_convertible: structureMetrics.convertible.avg_roe || 0,
      avg_roe_hybrid: structureMetrics.hybrid.avg_roe || 0,
      ci_lower: metrics.roe.ci_lower,
      ci_upper: metrics.roe.ci_upper,
      ci_lower_btc_loan: structureMetrics.btc_loan.avg_roe
        ? metrics.roe.ci_lower
        : 0,
      ci_upper_btc_loan: structureMetrics.btc_loan.avg_roe
        ? metrics.roe.ci_upper
        : 0,
      ci_lower_convertible: structureMetrics.convertible.avg_roe
        ? metrics.roe.ci_lower
        : 0,
      ci_upper_convertible: structureMetrics.convertible.avg_roe
        ? metrics.roe.ci_upper
        : 0,
      ci_lower_hybrid: structureMetrics.hybrid.avg_roe
        ? metrics.roe.ci_lower
        : 0,
      ci_upper_hybrid: structureMetrics.hybrid.avg_roe
        ? metrics.roe.ci_upper
        : 0,
      sharpe: metrics.roe.sharpe,
    },
    preferred_bundle: {
      bundle_value: metrics.preferred_bundle?.bundle_value || 0,
    },
    btc_portfolio_value:
      metrics.btc_holdings?.total_value ||
      btc_treasury * btc_current_market_price,
    target_metrics: {
      target_nav: metrics.target_metrics?.target_nav || 0,
      target_ltv: metrics.target_metrics?.target_ltv || 0,
      target_convertible_value:
        metrics.target_metrics?.target_convertible_value || 0,
      target_roe: metrics.target_metrics?.target_roe || 0,
      target_bundle_value: metrics.target_metrics?.target_bundle_value || 0,
    },
    scenario_metrics: metrics.scenario_metrics,
    distribution_metrics: metrics.distribution_metrics,
    optimized_param: metrics.optimized_param || null,
    runway: {
      annual_burn_rate: metrics.runway.annual_burn_rate,
      runway_months: metrics.runway.dist_mean || 0,
      btc_loan_runway_months: structureMetrics.btc_loan.runway_months || 0,
      convertible_runway_months:
        structureMetrics.convertible.runway_months || 0,
      hybrid_runway_months: structureMetrics.hybrid.runway_months || 0,
    },
  };
};

export { mapResults, processLTVPaths };
