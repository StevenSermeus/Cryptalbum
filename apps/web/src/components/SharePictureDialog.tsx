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

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
});

interface PictureProps {
  pictureId: string;
  symKey: string;
}

export default function SharePictureDialog({
  pictureId,
  symKey,
}: PictureProps) {
  const { toast } = useToast();

  const friendDevices = api.user.getFriendWithDevices.useMutation();
  const sharePictureMutation = api.picture.shareWithDevices.useMutation();

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

      const sharedPicture: {
        deviceId: string;
        key: string;
      }[] = [];

      for (const device of friendWithDevices.devices || []) {
        const publicKey = await importRsaPublicKey(device.publicKey);
        const encryptedKey = await encrypt(publicKey, symKey);
        if (!encryptedKey) {
          throw new Error("Failed to encrypt key");
        }
        sharedPicture.push({
          deviceId: device.id,
          key: encryptedKey,
        });
      }

      sharePictureMutation.mutate(
        {
          pictureId: pictureId,
          sharedPictures: sharedPicture,
        },
        {
          onSuccess: () => {
            toast({
              title: "Image shared successfully",
              description: "Image shared successfully",
              action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
            });
          },
          onError: (error) => {
            console.error(error);
            toast({
              title: "Failed to share image",
              description: "Failed to share image",
              variant: "destructive",
              action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
            });
          },
        },
      );
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to share image into album",
        description: "Failed to share image into album",
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
