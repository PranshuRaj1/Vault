import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

// The API URL from your Go backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type Visibility = "private" | "public" | "specific";

// Pass the file's ID and current info into the modal
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  currentVisibility: Visibility;
  currentPublicLink: string | null;
}

export function ShareModal({ isOpen, onClose, fileId }: ShareModalProps) {
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [sharedWith, setSharedWith] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- This is the core API call ---
  const handleSaveSettings = async () => {
    setIsLoading(true);
    setError(null);

    const body = {
      visibility: visibility,
      shareWith: visibility === "specific" ? sharedWith : [],
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/share/file/${fileId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Send the auth cookie
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      // If we made it public, save the link to display it
      if (data.publicLink) {
        setPublicLink(data.publicLink);
      }
      onClose(); // Close modal on success
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share File</DialogTitle>
          <DialogDescription>
            Choose who can access this file.
          </DialogDescription>
        </DialogHeader>
        
        <RadioGroup
          value={visibility}
          onValueChange={(v: Visibility) => setVisibility(v)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="private" id="r1" />
            <Label htmlFor="r1">Private (Only you)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="public" id="r2" />
            <Label htmlFor="r2">Public (Anyone with the link)</Label>
          </div>
          {/* (Bonus)
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="specific" id="r3" />
            <Label htmlFor="r3">Specific Users (By email)</Label>
          </div>
          */}
        </RadioGroup>

        {/* Show this section if "Public" is selected */}
        {visibility === "public" && (
          <div className="space-y-2 pt-4">
            <Label>Public Link</Label>
            <Input
              readOnly
              value={publicLink || "Saving to get link..."}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigator.clipboard.writeText(publicLink || "")}
            >
              Copy Link
            </Button>
          </div>
        )}

        {/* (Bonus) Show this section if "Specific Users" is selected
        {visibility === "specific" && (
          // ... UI to add/remove emails ...
        )}
        */}

        {error && <p className="text-sm text-destructive">{error}</p>}
        
        <Button onClick={handleSaveSettings} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}