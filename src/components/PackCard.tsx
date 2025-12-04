"use client";

import { MoreVerticalIcon } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pack } from "@/lib/apiActions";

export type { Pack };

interface PackCardProps {
  pack: Pack;
  // eslint-disable-next-line no-unused-vars
  onSubscribe?: (pack: Pack) => void;
  // eslint-disable-next-line no-unused-vars
  onEdit?: (pack: Pack) => void;
  // eslint-disable-next-line no-unused-vars
  onDelete?: (pack: Pack) => void;
  // eslint-disable-next-line no-unused-vars
  onToggleActive?: (pack: Pack) => void;
  showActions?: boolean;
}

export function PackCard({
  pack,
  onSubscribe,
  onEdit,
  onDelete,
  onToggleActive,
  showActions = true,
}: PackCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg dark:bg-card dark:border-border pt-0">
      <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden bg-muted">
        <Image
          src={pack.image || "/logo.png"}
          alt={pack.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
        {showActions && (
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                >
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(pack)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onToggleActive?.(pack)}
                  className={pack.active ? "text-orange-600" : "text-green-600"}
                >
                  {pack.active ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(pack)}
                  variant="destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {!pack.active && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-muted-foreground/80">
              Inactive
            </Badge>
          </div>
        )}
      </div>
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
            {pack.title}
          </CardTitle>
        </div>
        <CardDescription className="text-sm sm:text-base text-muted-foreground mt-2">
          {pack.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-foreground">
            €{parseFloat(pack.price).toFixed(2)}
          </span>
          {/* <span className="text-sm text-muted-foreground">/session</span> */}
        </div>
        {pack.total_hours !== undefined && (
          <div className="mt-2 text-sm text-muted-foreground">
            Credit Hours:{" "}
            <span className="font-semibold text-foreground">
              {pack.total_hours}
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2 pt-0">
        <Button
          onClick={() => onSubscribe?.(pack)}
          className="w-full sm:w-auto flex-1"
          disabled={!pack.active}
        >
          Subscribe
        </Button>
      </CardFooter>
    </Card>
  );
}
