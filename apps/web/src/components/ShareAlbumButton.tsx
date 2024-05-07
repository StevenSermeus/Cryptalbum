import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ShareAlbumDialog from "./ShareAlbumDialog";
import { IAlbum } from "@/pages/gallery";

interface AlbumProps {
  album: IAlbum;
}

export function ShareAlbumButton({ album }: AlbumProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Share Album</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Album With Someone</DialogTitle>
        </DialogHeader>
        <ShareAlbumDialog albumId={album.id} albumName={album.albumName} />
      </DialogContent>
    </Dialog>
  );
}
