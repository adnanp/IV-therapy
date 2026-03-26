import React from "react";

type IconProps = { className?: string; size?: number | string; [key: string]: unknown };

function makeIcon(name: string) {
  return React.forwardRef<SVGSVGElement, IconProps>(({ className, ...rest }, ref) =>
    React.createElement("svg", {
      ref,
      className,
      "data-testid": `icon-${name.toLowerCase()}`,
      ...rest,
    })
  );
}

export const Star = makeIcon("Star");
export const MapPin = makeIcon("MapPin");
export const Phone = makeIcon("Phone");
export const Globe = makeIcon("Globe");
export const Clock = makeIcon("Clock");
export const Search = makeIcon("Search");
export const ChevronRight = makeIcon("ChevronRight");
export const ChevronDown = makeIcon("ChevronDown");
export const ChevronUp = makeIcon("ChevronUp");
export const X = makeIcon("X");
export const Menu = makeIcon("Menu");
export const Filter = makeIcon("Filter");
export const SortAsc = makeIcon("SortAsc");
export const SortDesc = makeIcon("SortDesc");
export const ExternalLink = makeIcon("ExternalLink");
export const Heart = makeIcon("Heart");
export const Share = makeIcon("Share");
export const Info = makeIcon("Info");
export const CheckCircle = makeIcon("CheckCircle");
export const AlertCircle = makeIcon("AlertCircle");
