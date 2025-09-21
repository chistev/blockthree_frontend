const processLTVPaths = (ltvPaths) => {
  if (!ltvPaths || !Array.isArray(ltvPaths)) return [];
  return ltvPaths.map((value, index) => ({
    time: index / (ltvPaths.length - 1),
    value,
  }));
};

const processNavPaths = (navPaths) => {
  if (!navPaths || !Array.isArray(navPaths)) return [];
  return navPaths.map((value, index) => ({
    time: index / (navPaths.length - 1),
    value,
  }));
};

const mapResults = (backendResults, btc_treasury, btc_current_market_price) => {
  if (!backendResults.metrics || !backendResults.candidates) {
    console.error("Backend results missing metrics or candidates:", backendResults);
    throw new Error("Invalid backend response: missing metrics or candidates");
  }

  const metrics = backendResults.metrics;

  // Map candidates to structure-specific metrics
  const structureMetrics = {
    btc_loan: { nav_paths: [] },
    convertible: { nav_paths: [] },
    hybrid: { nav_paths: [] },
  };

  backendResults.candidates.forEach((candidate) => {
    const structure = candidate.params.structure.toLowerCase();
    const metrics = candidate.metrics;

    // Map structure-specific metrics
    const mappedMetrics = {
      avg_dilution: metrics.dilution_p50 || 0,
      ltv_breach_prob: metrics.ltv_breach_prob || 0,
      avg_roe: metrics.nav_dist.mean || 0,
      runway_months: metrics.runway_dist.mean || 0,
      nav_mean: metrics.nav_dist.mean || 0,
      nav_ci_lower: metrics.nav_dist.ci_lower || 0,
      nav_ci_upper: metrics.nav_dist.ci_upper || 0,
      btc_net_added: metrics.btc_net_added || 0,
      oas: metrics.oas || 0,
      cvar: metrics.cvar || null,
      breach_depth: metrics.breach_depth || 0,
      // Use candidate-specific NAV paths if available, else fallback to global
      nav_paths: metrics.nav_dist.paths
        ? metrics.nav_dist.paths.map((value, index) => ({
            time: index / (metrics.nav_dist.paths.length - 1),
            value,
          }))
        : processNavPaths(metrics.nav_paths || []),
    };

    if (structure === "loan") {
      structureMetrics.btc_loan = mappedMetrics;
    } else if (structure === "convertible") {
      structureMetrics.convertible = mappedMetrics;
    } else if (structure === "hybrid") {
      structureMetrics.hybrid = mappedMetrics;
    }
  });

  return {
    nav: {
      avg_nav: metrics.nav.avg_nav || 0,
      ci_lower: metrics.nav.ci_lower || 0,
      ci_upper: metrics.nav.ci_upper || 0,
      erosion_prob: metrics.nav.erosion_prob || 0,
      cvar: metrics.nav.cvar || null,
      nav_paths: processNavPaths(metrics.nav.nav_paths || []),
    },
    dilution: {
      base_dilution: metrics.dilution.base_dilution || 0,
      avg_dilution: metrics.dilution.avg_dilution || 0,
      avg_btc_loan_dilution: structureMetrics.btc_loan.avg_dilution || 0,
      avg_convertible_dilution: structureMetrics.convertible.avg_dilution || 0,
      avg_hybrid_dilution: structureMetrics.hybrid.avg_dilution || 0,
    },
    ltv: {
      avg_ltv: metrics.ltv.avg_ltv || 0,
      exceed_prob: metrics.ltv.exceed_prob || 0,
      exceed_prob_btc_loan: structureMetrics.btc_loan.ltv_breach_prob || 0,
      exceed_prob_convertible: structureMetrics.convertible.ltv_breach_prob || 0,
      exceed_prob_hybrid: structureMetrics.hybrid.ltv_breach_prob || 0,
      ltv_distribution: processLTVPaths(metrics.ltv.ltv_paths || []),
    },
    roe: {
      avg_roe: metrics.roe.avg_roe || 0,
      avg_roe_btc_loan: structureMetrics.btc_loan.avg_roe || 0,
      avg_roe_convertible: structureMetrics.convertible.avg_roe || 0,
      avg_roe_hybrid: structureMetrics.hybrid.avg_roe || 0,
      ci_lower: metrics.roe.ci_lower || 0,
      ci_upper: metrics.roe.ci_upper || 0,
      sharpe: metrics.roe.sharpe || 0,
    },
    runway: {
      annual_burn_rate: metrics.runway.annual_burn_rate || 0,
      runway_months: metrics.runway.dist_mean || 0,
      btc_loan_runway_months: structureMetrics.btc_loan.runway_months || 0,
      convertible_runway_months: structureMetrics.convertible.runway_months || 0,
      hybrid_runway_months: structureMetrics.hybrid.runway_months || 0,
    },
    btc_holdings: {
      total_value: metrics.btc_holdings.total_value || btc_treasury * btc_current_market_price,
      total_btc: metrics.btc_holdings.total_btc || btc_treasury,
    },
    term_sheet: metrics.term_sheet || {},
    business_impact: metrics.business_impact || {},
    scenario_metrics: metrics.scenario_metrics || {},
    distribution_metrics: metrics.distribution_metrics || {},
    snapshot_id: backendResults.snapshot_id || null,
    mc_warning: backendResults.mc_warning || null,
  };
};

export { mapResults, processLTVPaths, processNavPaths };