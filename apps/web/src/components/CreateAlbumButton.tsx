import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateAlbumDialog from "./CreateAlbumDialog";

export function CreateAlbumButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">New Album</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a New Album</DialogTitle>
        </DialogHeader>
        <CreateAlbumDialog />
      </DialogContent>
    </Dialog>
  );
}
