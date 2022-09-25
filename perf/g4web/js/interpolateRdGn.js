const schemeRdGn = [ "#67001f",
                     "#b2182b", 
                     "#d6604d",
                     "#f4a582",
                     "#fddbc7",
                     "#f7f7f7",
                     "#d9f0d3",
                     "#a6dba0",
                     "#5aae61",
                     "#1b7837",
                     "#00441b" ];

export function interpolateRdGn(x) {
  return d3.interpolateRgbBasis(schemeRdGn)(0.50 * (1.0 - x));
}
