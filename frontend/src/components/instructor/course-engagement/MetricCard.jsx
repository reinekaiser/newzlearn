import React from 'react'
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const MetricCard = ({ title, value, description, tooltip, unit }) => {
    return (
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                {tooltip && (
                    <TooltipProvider>
                        <Tooltip className="flex items-center">
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="max-w-xs">{tooltip}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{value} {" "} {unit}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    )
}

export default MetricCard