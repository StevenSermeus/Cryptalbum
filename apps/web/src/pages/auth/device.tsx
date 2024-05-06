import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import {
  importRsaPublicKey,
  encrypt,
  loadKeyPair,
  decrypt,
} from "@/utils/crypto";
import { hexToArrayBuffer } from "@/utils/file";

export default function Device() {
  const session = useSession();
  const { data, refetch } = api.device.listDevices.useQuery(undefined, {
    enabled: !!session.data,
  });
  const devicesKeys = api.picture.getSharedKeys.useQuery(undefined, {
    enabled: !!session.data,
  });

  const sharedAlbums = api.album.getSharedAlbums.useQuery(undefined, {
    enabled: !!session.data,
  });

  const trustMutation = api.device.trustDevice.useMutation();
  const revokeMutation = api.device.revokeDevice.useMutation();

  async function encryptPictureKeysForNewDevice(
    keys: { key: string; id: string }[],
    publicKey: string,
  ) {
    const keyPair = await loadKeyPair();
    if (!keyPair) {
      console.error("Failed to load key pair");
      return;
    }
    const newKeyPublicKey = await importRsaPublicKey(publicKey);
    if (!newKeyPublicKey) {
      console.error("Failed to import public key");
      return;
    }
    const data = await Promise.all(
      keys.map(async (key) => {
        const decryptedKey = await decrypt(
          keyPair.privateKey,
          hexToArrayBuffer(key.key),
        );
        if (!decryptedKey) {
          throw new Error("Failed to decrypt key");
        }
        const encryptedKey = await encrypt(newKeyPublicKey, decryptedKey);
        if (!encryptedKey) {
          throw new Error("Failed to encrypt key");
        }
        return {
          id: key.id,
          key: encryptedKey,
        };
      }),
    );
    return data;
  }

  async function encryptAlbumNamesForNewDevice(
    sharedAlbums: { albumName: string; albumId: string }[],
    publicKey: string,
  ) {
    const keyPair = await loadKeyPair();
    if (!keyPair) {
      console.error("Failed to load key pair");
      return;
    }
    const newKeyPublicKey = await importRsaPublicKey(publicKey);
    if (!newKeyPublicKey) {
      console.error("Failed to import public key");
      return;
    }
    const data = await Promise.all(
      sharedAlbums.map(async (sharedAlbum) => {
        const decryptedAlbumName = await decrypt(
          keyPair.privateKey,
          hexToArrayBuffer(sharedAlbum.albumName),
        );
        if (!decryptedAlbumName) {
          throw new Error("Failed to decrypt albumName");
        }
        const encryptedAlbumNameForNewDevice = await encrypt(
          newKeyPublicKey,
          decryptedAlbumName,
        );
        if (!encryptedAlbumNameForNewDevice) {
          throw new Error("Failed to encrypt key");
        }
        return {
          albumName: encryptedAlbumNameForNewDevice,
          albumId: sharedAlbum.albumId,
        };
      }),
    );
    return data;
  }

  async function trustDevice(deviceId: string, publicKey: string) {
    try {
      const keys = await encryptPictureKeysForNewDevice(devicesKeys.data ?? [], publicKey);
      const albumsForDevice = await encryptAlbumNamesForNewDevice(sharedAlbums.data ?? [], publicKey);

      if (!keys) {
        console.error("Failed to encrypt keys");
        return;
      }
      if (!albumsForDevice) {
        console.error("Failed to encrypt album names");
        return;
      }
      trustMutation.mutate(
        { deviceId, keys, albumsForDevice },
        {
          onSuccess: () => {
            refetch();
          },
        },
      );
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Table>
      <TableCaption>List of your devices</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Public key</TableHead>
          <TableHead>Last login</TableHead>
          <TableHead>Is trusted</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data?.map((device) => (
          <TableRow key={device.id}>
            <TableCell className="font-medium">
              {device.name} {session.data?.user.id === device.id ? "👈" : null}
            </TableCell>
            <TableCell>
              <Dialog>
                <DialogTrigger>Public key</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Public key</DialogTitle>
                    <DialogDescription className="max-w-md overflow-hidden text-ellipsis">
                      {device.publicKey}
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </TableCell>
            <TableCell className="font-medium">
              {device.lastLogin
                ? new Date(device.lastLogin).toLocaleString()
                : "Never"}
            </TableCell>
            <TableCell className="font-medium">
              {device.isTrusted ? "🔥" : "❌"}
            </TableCell>
            <TableCell className="font-medium">
              {device.isTrusted ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    revokeMutation.mutate(
                      { deviceId: device.id },
                      {
                        onSuccess: () => {
                          refetch();
                        },
                      },
                    );
                  }}
                >
                  Revoke trust
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    trustDevice(device.id, device.publicKey);
                  }}
                >
                  Trust this device
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
