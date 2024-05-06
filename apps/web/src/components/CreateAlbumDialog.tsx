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
import { encrypt, importRsaPublicKey, loadKeyPair } from "@/utils/crypto";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/utils/api";
import { useToast } from "./ui/use-toast";
import { ToastAction } from "./ui/toast";
import { useSession } from "next-auth/react";

const formSchema = z.object({
  albumName: z.string().min(3, "Album name is too short"),
});

export default function FileUploadForm() {
  const { toast } = useToast();
  const { data } = useSession();

  const utils_trpc = api.useUtils();
  const createMutation = api.album.create.useMutation();
  const userDevicesQuery = api.user.userDevice.useQuery(undefined, {
    //Disable query if user is not logged in
    enabled: !!data,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      albumName: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (!userDevicesQuery.data) {
        toast({
          title: "Failed to upload file",
          description: "No devices found",
          variant: "destructive",
          action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
        });
        return;
      }
      const keyPair = await loadKeyPair();
      if (!keyPair) {
        toast({
          title: "Failed to upload file",
          description: "No key pair found",
          variant: "destructive",
          action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
        });
        return;
      }

      const userDeviceKey: { deviceId: string; encryptedAlbumName: string }[] = [];

      for (const userDevice of userDevicesQuery.data) {
        const publicKey = await importRsaPublicKey(userDevice.publicKey);
        const encryptedKey = await encrypt(publicKey, data.albumName);
        userDeviceKey.push({
          deviceId: userDevice.id,
          encryptedAlbumName: encryptedKey,
        });
      }

      await createMutation.mutateAsync(
        {
          albumName: data.albumName,
          keys_user_device: userDeviceKey,
        },
        {
          onSuccess: () => {
            utils_trpc.invalidate(undefined, {
              refetchType: "all",
              queryKey: ["albums.getAll"],
            });
          },
        },
      );
      form.reset();
      toast({
        title: "Album created",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Failed to create album",
        description: "The server trolled us",
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
          name="albumName"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Give your Album a name" {...field} />
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
