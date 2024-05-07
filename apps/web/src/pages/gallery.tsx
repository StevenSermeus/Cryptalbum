import { Images, Menu, Package2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UploadFileDialog } from "@/components/UploadFileDialog";
import { useEffect, useState } from "react";
import { api } from "@/utils/api";
import { hexToArrayBuffer } from "@/utils/file";
import { ToastAction } from "@/components/ui/toast";

import {
  decrypt,
  decryptFileSymmetrical,
  importSymmetricalKey,
  loadKeyPair,
} from "@/utils/crypto";
import { CreateAlbumButton } from "@/components/CreateAlbumButton";
import { ShareAlbumButton } from "@/components/ShareAlbumButton";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { toast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";

export interface IAlbum {
  sharedAlbumId: string;
  albumName: string;
  userId: string;
}

export default function Dashboard() {
  const [albums, setAlbums] = useState<IAlbum[]>([]);
  const [currentAlbum, setCurrentAlbum] = useState("gallery");
  const utils_trpc = api.useUtils();
  const session = useSession();
  const files = api.picture.getAll.useQuery(currentAlbum);
  const sharedAlbums = api.album.getAll.useQuery();
  const addToAlbumMutation = api.picture.addPictureToAlbum.useMutation();
  const [pictures_preview, setPictures] = useState<
    { idPicture: string; symKey: string; idsAlbum: string[]; url: string }[]
  >([]);

  async function decypherPictures() {
    const pictures: {
      idPicture: string;
      symKey: string;
      idsAlbum: string[];
      url: string;
    }[] = [];
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
      pictures.push({
        idPicture: picture.id,
        symKey: sym_key_string,
        idsAlbum: picture.albums,
        url: url,
      });
    }
    setPictures(pictures);
  }

  async function decipherAlbums() {
    const decryptedAlbums: IAlbum[] = [];
    const keyPair = await loadKeyPair();
    if (!keyPair) {
      return;
    }

    for (const sharedAlbum of sharedAlbums.data || []) {
      const encryptedAlbumName = sharedAlbum.albumName;
      const albumName = await decrypt(
        keyPair.privateKey,
        hexToArrayBuffer(encryptedAlbumName),
      );
      if (albumName) {
        decryptedAlbums.push({ userId: sharedAlbum.album.userId , sharedAlbumId: sharedAlbum.albumId, albumName: albumName });
      }
    }
    setAlbums(decryptedAlbums);
  }

  async function addPictureToAlbum(pictureId: string, albumId: string) {
    try {
      await addToAlbumMutation.mutateAsync(
        {
          pictureId,
          albumId,
        },
        {
          onSuccess: () => {
            utils_trpc.invalidate(undefined, {
              refetchType: "all",
              queryKey: ["albums.getAll"],
            });
            toast({
              title: "Picture added to album",
              action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
            });
          },
        },
      );
    } catch (error) {
      toast({
        title: "Failed to add photo into album",
        description: "No key pair found",
        variant: "destructive",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    }
  }

  useEffect(() => {
    decypherPictures();
  }, [files.data]);

  useEffect(() => {
    decipherAlbums();
    console.log(`albums: ${sharedAlbums.data}`);
  }, [sharedAlbums.data]);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[200px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <div className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="" onClick={() => setCurrentAlbum("gallery")}>
                Pictures
              </span>
            </div>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {albums.map((album) => (
                <Album
                  key={album.sharedAlbumId}
                  setCurrentAlbum={() => {
                    setCurrentAlbum(album.sharedAlbumId);
                  }}
                  albumName={album.albumName}
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
                    key={album.sharedAlbumId}
                    setCurrentAlbum={() => {
                      setCurrentAlbum(album.sharedAlbumId);
                    }}
                    albumName={album.albumName}
                  />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex w-full flex-1 items-center justify-between">
            <div className="flex justify-between gap-2">
              <CreateAlbumButton />
              <UploadFileDialog />
            </div>
            <div className="flex items-center gap-2">
              {currentAlbum !== "gallerie" &&
                albums.some((val) => val.sharedAlbumId === currentAlbum && session.data?.user.userId === val.userId) && (
                  <ShareAlbumButton
                    album={albums.find((val) => val.sharedAlbumId === currentAlbum)!}
                    pictures={pictures_preview}
                  />
                )}
              <span className="font-semibold">
                {currentAlbum === "gallery"
                  ? "Gallery"
                  : albums.find((val) => val.sharedAlbumId === currentAlbum)?.albumName}
              </span>
              <Badge>Nb pictures</Badge>
            </div>
          </div>
        </header>
        <main className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pictures_preview.map((picture) => (
            <Card key={picture.idPicture}>
              <CardContent>
                <img
                  src={picture.url}
                  alt="Picture"
                  className="h-96 w-full rounded-lg object-cover"
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Add in album</Button>
                  </PopoverTrigger>
                  <PopoverContent className="flex flex-col gap-2">
                    {albums.map((album) => {
                      if (!picture.idsAlbum.includes(album.sharedAlbumId)) {
                        return (
                          <Button
                            key={`${picture.idPicture}-${album.sharedAlbumId}`} // Unique key for each button
                            onClick={() =>
                              addPictureToAlbum(picture.idPicture, album.sharedAlbumId)
                            }
                          >
                            {album.albumName}
                          </Button>
                        );
                      }
                      return null; // Ensure that nothing is rendered if condition fails
                    })}
                  </PopoverContent>
                </Popover>
                <Button>Share</Button>
              </CardFooter>
            </Card>
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
