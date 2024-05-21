"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  encryptFileSymmetrical,
  generateSymmetricalKey,
  importRsaPublicKey,
  loadKeyPair,
  encrypt,
  exportSymmetricalKey,
} from "@/utils/crypto";
import { arrayBufferToHex, fileSchemaFront } from "@/utils/file";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/utils/api";
import { useEffect, useState } from "react";
import FileSkeleton from "./FileSkeleton";
import { useToast } from "./ui/use-toast";
import { ToastAction } from "./ui/toast";
import { useSession } from "next-auth/react";
import { TRPCClientError } from "@trpc/client";

const formSchema = z.object({
  file: fileSchemaFront,
});

export default function FileUploadForm() {
  const { toast } = useToast();
  const { data } = useSession();

  const uploadMutation = api.picture.upload.useMutation();
  const userDevicesQuery = api.user.userDevice.useQuery(undefined, {
    //Disable query if user is not logged in
    enabled: !!data,
  });

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });
  const utils_trpc = api.useUtils();
  const fileRef = form.register("file");

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!data.file) {
      form.setError("file", {
        type: "manual",
        message: "File is required",
      });
      toast({
        title: "Failed to upload file",
        description: "File is required",
        variant: "destructive",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
      return;
    }
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
      const cryptoKey = await generateSymmetricalKey();
      const encrypted = await encryptFileSymmetrical(data.file, cryptoKey);
      const fileData = await arrayBufferToHex(encrypted);
      const exportedKey = await exportSymmetricalKey(cryptoKey);
      const userDeviceKey: { device_id: string; key: string }[] = [];
      for (const userDevice of userDevicesQuery.data) {
        const publicKey = await importRsaPublicKey(userDevice.publicKey);
        const encryptedKey = await encrypt(publicKey, exportedKey);
        userDeviceKey.push({
          device_id: userDevice.id,
          key: encryptedKey,
        });
      }
      await uploadMutation.mutateAsync(
        {
          file: fileData,
          keys_user_device: userDeviceKey,
        },
        {
          onSuccess: () => {
            utils_trpc.invalidate(undefined, {
              refetchType: "all",
              queryKey: ["pictures.getAll"],
            });
          },
        },
      );
      setFile(null);
      form.reset();
      toast({
        title: "File uploaded",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    } catch (e) {
      console.error(e);
      e instanceof TRPCClientError? e.message : "The server trolled us";
      toast({
        title: "Failed to upload file",
        description: `${e}`,
        variant: "destructive",
        action: <ToastAction altText="Dismiss">Dismiss</ToastAction>,
      });
    }
  };

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    setPreview(URL.createObjectURL(file));
  }, [file]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto p-10">
        <FormField
          control={form.control}
          name="file"
          render={() => {
            return (
              <FormItem>
                <FormLabel>File</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    placeholder="shadcn"
                    {...fileRef}
                    onChange={(e) => setFile(e.target.files?.item(0) || null)}
                  />
                </FormControl>
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    height={240}
                    width={360}
                    className="mx-auto rounded-xl"
                  />
                ) : (
                  <FileSkeleton />
                )}
                <FormMessage />
              </FormItem>
            );
          }}
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
