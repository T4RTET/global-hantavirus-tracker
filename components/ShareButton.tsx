"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareButton({ title }: { title: string }) {
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <Button onClick={share} size="sm" variant="outline">
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );
}
