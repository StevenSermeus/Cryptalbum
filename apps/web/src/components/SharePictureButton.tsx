import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SharePictureDialog from "./SharePictureDialog";

interface PictureProps {
  pictureId: string;
  symKey: string;
}

export function SharePictureButton({ pictureId, symKey }: PictureProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Share Picture</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Picture With Someone</DialogTitle>
        </DialogHeader>
        <SharePictureDialog symKey={symKey} pictureId={pictureId} />
      </DialogContent>
    </Dialog>
  );
}
