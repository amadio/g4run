import {interpolateRdGn} from "./interpolateRdGn.js"
/* CPU Metrics */

export function is_applicable(metric, columns) {
  for (let e of metric.required_events)
    if (!columns.includes(e))
      return false;
  return true;
}

const interpolator = d3.interpolateRgb.gamma(2.0);

export var metrics = {

  cpi: {
    name: "CPI",
    description: "Cycles per Instruction",
    required_events: [ "cycles", "instructions" ],
    format: d => d3.format(".3f")(d),
    color: x => d3.scaleLinear()
                  .domain([0.25, 0.50, 1.2, 5.0])
                  .range(["darkgreen", "green", "white", "red"])
                  .interpolate(interpolator)(x),
    apply: data => data.filter(d => {
      if(d.instructions == 0) return;
      d.cpi = d.cycles / d.instructions
    })
  },

  bpi: {
    name: "BPI",
    description: "Branches per Instruction",
    required_events: [ "branches", "instructions" ],
    format: d => d3.format(".3f")(d),
    color: x => d3.scaleLinear()
                  .domain([0.0, 0.05, 0.15, 0.25, 0.5, 1.0])
                  .range(["darkgreen", "green", "white", "red", "darkred", "black" ])
                  .interpolate(interpolator)(x),
    apply: data => data.filter(d => {
      if(d.instructions == 0) return;
      d.bpi = d.branches / d.instructions
    })
  },

  branch_miss_rate: {
    name: "Branch Miss Rate",
    description: "Missed branches as a percentage of the total number of branches",
    required_events: [ "branches", "branch_misses" ],
    format: d => d3.format(".2%")(d),
    color: x => d3.scaleLinear()
                  .domain([0.0, 0.005, 0.02, 0.05, 0.25])
                  .range(["darkgreen", "green", "white", "red", "darkred" ])
                  .interpolate(interpolator)(x),
    apply: data => data.filter(d => {
      if(d.branches == 0) return;
      d.branch_miss_rate = d.branch_misses / d.branches
    })
  },

  /* Cache Metrics */

  dcache_hit_rate: {
    name: "Data Cache Hit Rate",
    description: "Overall Data Cache Hit Rate",
    required_events: [ "cache_references", "cache_misses" ],
    format: d => d3.format(".2%")(d),
    color: x => d3.scaleLinear()
                  .domain([0.0, 0.1, 0.25, 0.5, 1.0])
                  .range(["darkred", "red", "white", "green", "darkgreen" ])
                  .interpolate(interpolator)(x),
    apply: data => data.filter(d => {
      if(d.cache_references == 0) return;
      d.dcache_hit_rate = 1.0 - d.cache_misses / d.cache_references
    })
  },

  L1_dcache_hit_rate: {
    name: "L1 Data Cache Hit Rate",
    description: "L1 Data Cache Hit Rate",
    required_events: [ "L1_dcache_loads", "L1_dcache_load_misses" ],
    format: d => d3.format(".2%")(d),
    color: x => d3.scaleLinear()
                  .domain([0.0, 0.1, 0.25, 0.5, 1.0])
                  .range(["darkred", "red", "white", "green", "darkgreen" ])
                  .interpolate(interpolator)(x),
    apply: data => data.filter(d => {
      if(d.cache_references == 0) return;
      d.L1_dcache_hit_rate = 1.0 - d.L1_dcache_load_misses / d.L1_dcache_loads
    })
  },

  L1_icache_hit_rate: {
    name: "L1 Instruction Cache Hit Rate",
    description: "L1 Instruction Cache Hit Rate",
    required_events: [ "L1_icache_loads", "L1_icache_load_misses" ],
    format: d => d3.format(".2%")(d),
    color: x => d3.scaleLinear()
                  .domain([0.0, 0.1, 0.25, 0.5, 1.0])
                  .range(["darkred", "red", "white", "green", "darkgreen" ])
                  .interpolate(interpolator)(x),
    apply: data => data.filter(d => {
      if(d.cache_references == 0) return;
      d.L1_icache_hit_rate = 1.0 - d.L1_icache_load_misses / d.L1_icache_loads
    })
  }
};
