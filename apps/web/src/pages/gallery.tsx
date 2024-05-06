import { Menu, Package2, Images } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UploadFileDialog } from "@/components/UploadFileDialog";
import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { hexToArrayBuffer } from "@/utils/file";
import {
  decrypt,
  decryptFileSymmetrical,
  importSymmetricalKey,
  loadKeyPair,
} from "@/utils/crypto";
import { CreateAlbumButton } from "@/components/CreateAlbumButton";

export default function Dashboard() {
  const [albums] = useState([
    { id: "1", name: "Album 1" },
    { id: "2", name: "Album 2" },
    { id: "3", name: "Album 3" },
  ]);
  const [currentAlbum, setCurrentAlbum] = useState("gallerie");
  const files = api.picture.getAll.useQuery();
  const [pictures_preview, setPictures] = useState<string[]>([]);

  async function decypherPictures() {
    const preview_url: string[] = [];
    for (const picture of files.data || []) {
      const keyPair = await loadKeyPair();
      if (!keyPair) {
        return;
      }
      const array_buff = hexToArrayBuffer(picture.file);
      const key_array_buff = hexToArrayBuffer(picture.key);
      const sym_key_string = await decrypt(keyPair.privateKey, key_array_buff);
      if (!sym_key_string) {
        return;
      }
      const sym_key = await importSymmetricalKey(sym_key_string);
      if (!sym_key) {
        return;
      }
      const file = await decryptFileSymmetrical(array_buff, sym_key);
      if (!file) {
        return;
      }
      const url = URL.createObjectURL(new Blob([file]));
      preview_url.push(url);
    }
    setPictures(preview_url);
  }

  useEffect(() => {
    decypherPictures();
    console.log(files.data);
  }, [files.data]);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[200px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <div className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="" onClick={() => setCurrentAlbum("gallerie")}>
                Pictures
              </span>
            </div>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {albums.map((album) => (
                <Album
                  key={album.id}
                  setCurrentAlbum={() => {
                    setCurrentAlbum(album.id);
                  }}
                  albumName={album.name}
                />
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                {albums.map((album) => (
                  <Album
                    key={album.id}
                    setCurrentAlbum={() => {
                      setCurrentAlbum(album.id);
                    }}
                    albumName={album.name}
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex w-full flex-1 items-center justify-between">
            <div className="flex gap-2 justify-between">
              <CreateAlbumButton />
              <UploadFileDialog />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {currentAlbum === "gallerie"
                  ? "Gallerie"
                  : albums.find((val) => val.id === currentAlbum)?.name}
              </span>
              <Badge>Nb pictures</Badge>
            </div>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {pictures_preview.map((picture, index) => (
            <img
              key={index}
              src={picture}
              alt="Picture"
              className="h-96 w-full rounded-lg object-cover"
            />
          ))}
        </main>
      </div>
    </div>
  );
}

interface AlbumProps {
  setCurrentAlbum: () => void;
  albumName: string;
}

function Album({ setCurrentAlbum, albumName }: AlbumProps) {
  return (
    <div
      className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground"
      onClick={() => setCurrentAlbum()}
    >
      <Images className="h-5 w-5" />
      <span>{albumName}</span>
    </div>
  );
}
