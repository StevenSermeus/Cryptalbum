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
  encrypt,
  importRsaPublicKey,
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
import { SharePictureButton } from "@/components/SharePictureButton";

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
  const sharePictureWithDevicesMutation =
    api.picture.shareWithDevices.useMutation();
  const userDevicesOfAlbumWithoutAccessToPicture =
    api.album.userDevicesOfAlbumWithoutAccessToPicture.useMutation();

  const [pictures_preview, setPictures] = useState<
    {
      userId: string;
      idPicture: string;
      symKey: string;
      idsAlbum: string[];
      url: string;
    }[]
  >([]);

  async function decypherPictures() {
    const pictures: {
      userId: string;
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
        userId: picture.userId,
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
        decryptedAlbums.push({
          userId: sharedAlbum.album.userId,
          sharedAlbumId: sharedAlbum.albumId,
          albumName: albumName,
        });
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

      const sharedPictures: {
        deviceId: string;
        key: string;
      }[] = [];
      const p = pictures_preview.find((p) => p.idPicture === pictureId);
      if (!p) {
        return;
      }
      const devices =
        await userDevicesOfAlbumWithoutAccessToPicture.mutateAsync({
          albumId: albumId,
          pictureId: pictureId,
        });
      for (const device of devices || []) {
        console.log(`the p key is ${p?.symKey}`);

        const publicKey = await importRsaPublicKey(device.publicKey);
        const encryptedKey = await encrypt(publicKey, p.symKey);
        if (!encryptedKey) {
          throw new Error("Failed to encrypt key");
        }
        sharedPictures.push({
          deviceId: device.deviceId,
          key: encryptedKey,
        });
      }

      sharePictureWithDevicesMutation.mutate(
        {
          pictureId: pictureId,
          sharedPictures: sharedPictures,
        },
        {
          onSuccess: () => {
            toast({
              title: "Picture shared with devices",
              action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
            });
          },
          onError: () => {
            toast({
              title: "Failed to share picture with devices",
              variant: "destructive",
              action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
            });
          },
        },
      );
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to add photo into album",
        description: `${error}`,
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
  }, [sharedAlbums.data]);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[200px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <div className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="cursor-pointer" onClick={() => setCurrentAlbum("gallery")}>
                Gallery
              </span>
            </div>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <div className="mb-5">
                <span
                  className="cursor-pointer"
                  onClick={() => setCurrentAlbum("gallery")}
                >
                  My Gallery 
                </span>
              </div>
              <div className="mb-5">
                <span
                  className="cursor-pointer"
                  onClick={() => setCurrentAlbum("sharedPictures")}
                >
                  Shared With Me
                </span>
              </div>
              {albums.some(
                (album) => album.userId === session.data?.user.userId,
              ) && (
                <div className="mb-5">
                  <span>Your albums</span>
                  {albums.map(
                    (album) =>
                      album.userId === session.data?.user.userId && (
                        <Album
                          key={album.sharedAlbumId}
                          setCurrentAlbum={() => {
                            setCurrentAlbum(album.sharedAlbumId);
                          }}
                          albumName={album.albumName}
                        />
                      ),
                  )}
                </div>
              )}
              {albums.some(
                (album) => album.userId !== session.data?.user.userId,
              ) && (
                <div className="mb-5">
                  <span>Shared albums</span>
                  {albums.map(
                    (album) =>
                      album.userId !== session.data?.user.userId && (
                        <Album
                          key={album.sharedAlbumId}
                          setCurrentAlbum={() => {
                            setCurrentAlbum(album.sharedAlbumId);
                          }}
                          albumName={album.albumName}
                        />
                      ),
                  )}
                </div>
              )}
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
              {currentAlbum === "gallery" && <UploadFileDialog />}
            </div>
            <div className="flex items-center gap-2">
              {currentAlbum !== "gallerie" &&
                albums.some(
                  (val) =>
                    val.sharedAlbumId === currentAlbum &&
                    session.data?.user.userId === val.userId,
                ) && (
                  <ShareAlbumButton
                    album={
                      albums.find((val) => val.sharedAlbumId === currentAlbum)!
                    }
                    pictures={pictures_preview}
                  />
                )}
              <span className="font-semibold">
                {currentAlbum === "gallery"
                  ? "Gallery"
                  : albums.find((val) => val.sharedAlbumId === currentAlbum)
                      ?.albumName}
              </span>
              <Badge>Nb pictures</Badge>
            </div>
          </div>
        </header>
        <main className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {pictures_preview.map((picture) => (
            <Card key={picture.idPicture}>
              <CardContent>
                <img
                  src={picture.url}
                  alt="Picture"
                  className="h-96 max-w-full  rounded-lg object-cover"
                />
              </CardContent>
              {currentAlbum === "gallery" &&
                picture.userId === session.data?.user.userId && (
                  <CardFooter className="flex justify-between">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">Add in album</Button>
                      </PopoverTrigger>
                      <PopoverContent className="flex flex-col gap-1">
                        {albums
                          .filter((e) => e.userId === session.data?.user.userId)
                          .map((album) => {
                            if (
                              !picture.idsAlbum.includes(album.sharedAlbumId)
                            ) {
                              return (
                                <Button
                                  key={`${picture.idPicture}-${album.sharedAlbumId}`} // Unique key for each button
                                  onClick={() =>
                                    addPictureToAlbum(
                                      picture.idPicture,
                                      album.sharedAlbumId,
                                    )
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
                    <SharePictureButton
                      pictureId={picture.idPicture}
                      symKey={picture.symKey}
                    />
                  </CardFooter>
                )}
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
