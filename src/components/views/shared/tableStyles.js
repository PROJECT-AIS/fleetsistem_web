export const analysisTableShellClass = "overflow-hidden rounded-xl border border-[#4a4b4d]";
export const analysisTableScrollClass = "overflow-x-auto scrollbar-hide";
export const analysisTableClass = "w-full";
export const analysisTableHeadClass = "sticky top-0 z-10";
export const analysisHeaderRowClass = "bg-gradient-to-r from-[#4A8516] to-[#5FA81E]";
export const analysisSubHeaderRowClass = "bg-[#3d6d12]";
export const analysisHeaderCellClass =
  "border-r border-white/10 px-3 py-3 align-middle text-xs font-bold uppercase leading-tight tracking-wider text-white last:border-r-0";
export const analysisSubHeaderCellClass =
  "border-r border-white/10 px-3 py-2 align-middle text-xs font-semibold uppercase leading-tight text-white/90 last:border-r-0";
export const analysisGroupedHeaderCellClass =
  "border-r border-white/10 bg-[#6BB82E]/80 px-4 py-2 text-center align-middle text-xs font-bold uppercase tracking-wider text-white last:border-r-0";
export const analysisBodyClass = "divide-y divide-[#4a4b4d]";
export const analysisBodyCellClass =
  "border-r border-[#4a4b4d] px-3 py-3 align-middle text-sm leading-5 text-gray-300 last:border-r-0";
export const analysisRowClass = "transition-colors duration-150 hover:bg-[#3d3e42]";

export const getStripedRowStyle = (rowIndex) => ({
  backgroundColor: rowIndex % 2 === 0 ? "#2d2e32" : "#343538",
});

export const getTableAlignClass = (align = "left") => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};
