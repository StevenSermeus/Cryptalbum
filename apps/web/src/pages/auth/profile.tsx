import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/utils/api";
import {
  decrypt,
  encrypt,
  exportAsymmetricalKey,
  generateAsymmetricalKeyPair,
  loadKeyPair,
  storeKeyPair,
} from "@/utils/crypto";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  changeKey: z.boolean(),
});

function Profile() {
  const all = api.user.getAllPicturesAndAlbums.useQuery();
  const updateAll = api.user.updateKeys.useMutation();
  const updateMail = api.user.updateEmail.useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      changeKey: false,
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (data.email && data.changeKey) {
      console.log("update both");
      updateCryptoKeys(data.email);
    }
    if (data.email && !data.changeKey) {
      updateMail
        .mutateAsync(data.email)
        .then(() => {
          toast({
            title: "Email updated",
            description: "Email updated",
          });
        })
        .catch(() => {
          toast({
            title: "Failed to update email",
            description: "Failed to update email",
            variant: "destructive",
          });
        });
    }
    if (!data.email && data.changeKey) {
      updateCryptoKeys(undefined);
    }
  }

  async function updateCryptoKeys(email: string | undefined) {
    const baseKeyPair = await loadKeyPair();
    const newKeyPair = await generateAsymmetricalKeyPair();
    if (!baseKeyPair) {
      toast({
        title: "Failed to load crypto keys",
        description: "Please try again later",
        variant: "destructive",
      });
      return;
    }
    if (!newKeyPair) {
      toast({
        title: "Failed to generate new crypto keys",
        description: "Please try again later",
        variant: "destructive",
      });
      return;
    }
    const oldCypherPictures = all.data?.pictures;
    const oldCypherAlbums = all.data?.albums;
    if (!oldCypherPictures || !oldCypherAlbums) {
      toast({
        title: "Failed to get pictures and albums",
        description: "Please try again later",
        variant: "destructive",
      });
      return;
    }
    //buffer from hex
    try {
      const decyperedPictures = await Promise.all(
        oldCypherPictures.map(async (picture) => {
          const key = await decrypt(
            baseKeyPair.privateKey,
            Buffer.from(picture.key, "hex"),
          );
          if (!key) {
            throw new Error("Failed to decrypt picture key");
          }
          const newCypher = await encrypt(newKeyPair.publicKey, key);
          if (!newCypher) {
            throw new Error("Failed to encrypt picture key");
          }
          return {
            ...picture,
            key: newCypher,
          };
        }),
      );
      const decyperedAlbums = await Promise.all(
        oldCypherAlbums.map(async (album) => {
          const albumName = await decrypt(
            baseKeyPair.privateKey,
            Buffer.from(album.albumName, "hex"),
          );
          if (!albumName) {
            throw new Error("Failed to decrypt album key");
          }
          const newCypher = await encrypt(newKeyPair.publicKey, albumName);
          if (!newCypher) {
            throw new Error("Failed to encrypt album key");
          }
          return {
            ...album,
            albumName: newCypher,
          };
        }),
      );
      const new_key = await exportAsymmetricalKey(newKeyPair.publicKey);
      if (!new_key) {
        return;
      }
      if (
        decyperedPictures.length !== oldCypherPictures.length ||
        decyperedAlbums.length !== oldCypherAlbums.length
      ) {
        toast({
          title: "Failed to update crypto keys",
          description: "Failed to update crypto keys",
          variant: "destructive",
        });
        return;
      }

      await updateAll.mutateAsync({
        email,
        pictures: decyperedPictures,
        albums: decyperedAlbums,
        pubKey: new_key,
      });
      toast({
        title: "Crypto keys updated",
        description: "Crypto keys updated",
      });
      await storeKeyPair(newKeyPair);
    } catch (e) {
      toast({
        title: "Failed to update",
        description: "Failed to update",
        variant: "destructive",
      });
      await storeKeyPair(baseKeyPair);
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Register</CardTitle>
        <CardDescription>
          Enter your email and name below to register your account
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <Input
                {...field}
                type="email"
                placeholder="Email"
                className="input"
              />
            )}
          />
          <FormField
            control={form.control}
            name="changeKey"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Change crypto keys ?</FormLabel>
                </div>
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
    </Card>
  );
}

export default Profile;
