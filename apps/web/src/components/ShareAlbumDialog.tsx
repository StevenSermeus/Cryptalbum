"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { encrypt, importRsaPublicKey } from "@/utils/crypto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/utils/api";
import { useToast } from "./ui/use-toast";
import { ToastAction } from "./ui/toast";
import { TRPCClientError } from "@trpc/client";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
});

interface AlbumProps {
  albumId: string;
  albumName: string;
  pictures: { idPicture: string; symKey: string; }[];
}

interface SharedPicture {
  deviceId: string;
  pictureId: string;
  key: string;
};


export default function ShareAlbumDialog({
  albumId,
  albumName,
  pictures,
}: AlbumProps) {
  const { toast } = useToast();

  const friendDevices = api.user.getFriendWithDevices.useMutation();
  const shareAlbumMutation = api.album.share.useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      const friendWithDevices = await friendDevices.mutateAsync(data.email);
      if (!friendWithDevices) {
        toast({
          title: "Failed to find friend",
          description: "Are you sure the Email is correct?",
          variant: "destructive",
          action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
        });
        return;
      }

      const sharedAlbum: {
        deviceId: string;
        encryptedAlbumName: string;
      }[] = [];

      const sharedPictures: SharedPicture[][] = []
      for (const device of friendWithDevices.devices) {
        const publicKey = await importRsaPublicKey(device.publicKey);
        const encryptedAlbumName = await encrypt(publicKey, albumName);
        sharedAlbum.push({
          deviceId: device.id,
          encryptedAlbumName: encryptedAlbumName,
        });

        const sharedPicturesPerDevice: SharedPicture[] = [];

        for (const picture of pictures) {
          const encryptedKey = await encrypt(publicKey, picture.symKey)
          if (!encryptedKey) {
            throw new Error("Failed to encrypt key");
          }

          sharedPicturesPerDevice.push({
            deviceId: device.id,
            pictureId: picture.idPicture,
            key: encryptedKey,
          })
        }

        sharedPictures.push(sharedPicturesPerDevice)
      }

      console.log(`albumId: ${albumId}`)
      console.log(...sharedAlbum)

      await shareAlbumMutation.mutateAsync({
        albumId: albumId,
        sharedAlbumWithDevice: sharedAlbum,
        sharedPictures: sharedPictures, 
      });

    } catch (e) {
      console.error(e);
      const errorMessage =
        e instanceof TRPCClientError ? e.message : "The server trolled us";
      toast({
        title: "Failed to create album",
        description: errorMessage,
        variant: "destructive",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto p-10">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Email of your friend" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex pt-4">
          <Button type="submit" className="mx-auto">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
}
