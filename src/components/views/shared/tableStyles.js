export const analysisTableShellClass = "overflow-hidden rounded-2xl border border-white/10 bg-[#232428]";
export const analysisTableScrollClass = "overflow-auto custom-scrollbar";
export const analysisTableClass = "w-full";
export const analysisTableHeadClass = "sticky top-0 z-10";
export const analysisHeaderRowClass = "bg-[#2f3136]";
export const analysisSubHeaderRowClass = "bg-[#292b30]";
export const analysisHeaderCellClass =
  "border-r border-white/8 px-3 py-3 align-middle text-[11px] font-black uppercase leading-tight tracking-[0.16em] text-[#f5f5f5] last:border-r-0";
export const analysisSubHeaderCellClass =
  "border-r border-white/8 px-3 py-2.5 align-middle text-[10px] font-bold uppercase leading-tight tracking-[0.14em] text-gray-300 last:border-r-0";
export const analysisGroupedHeaderCellClass =
  "border-r border-white/8 bg-[#35383d] px-4 py-2.5 text-center align-middle text-[10px] font-black uppercase tracking-[0.16em] text-[#d8dadd] last:border-r-0";
export const analysisBodyClass = "divide-y divide-white/6";
export const analysisBodyCellClass =
  "border-r border-white/6 px-3 py-3 align-middle text-sm leading-5 text-gray-200 last:border-r-0";
export const analysisRowClass = "transition-colors duration-150 hover:bg-white/[0.04]";

export const getStripedRowStyle = (rowIndex) => ({
  backgroundColor: rowIndex % 2 === 0 ? "#2a2b30" : "#303136",
});

export const getTableAlignClass = (align = "left") => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};
