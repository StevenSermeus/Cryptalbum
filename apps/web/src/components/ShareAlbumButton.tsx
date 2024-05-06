import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ShareAlbumDialog from "./ShareAlbumDialog";

export function ShareAlbumButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Share Album</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Album With Someone</DialogTitle>
        </DialogHeader>
        <ShareAlbumDialog />
      </DialogContent>
    </Dialog>
  );
}
