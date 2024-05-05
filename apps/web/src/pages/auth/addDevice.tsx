import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/utils/api";
import { useRouter } from "next/router";
import {
  clearKeyPair,
  exportAsymmetricalKey,
  generateAsymmetricalKeyPair,
  loadKeyPair,
} from "@/utils/crypto";
import { useEffect, useState } from "react";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  deviceName: z.string().min(3, "Device name is too short"),
});

export default function Register() {
  const addDeviceMutation = api.auth.addDevice.useMutation();
  const router = useRouter();
  const [pubKey, setPubKey] = useState<string | undefined>(undefined);

  async function checkKeyPair() {
    const keyPair = await loadKeyPair();
    if (keyPair) {
      toast.info("You already have a key pair stored. Please sign in.");
      router.push("/auth/signin");
    }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      deviceName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const keyPair = await generateAsymmetricalKeyPair();
    const publicKey = await exportAsymmetricalKey(keyPair.publicKey);
    try {
      await addDeviceMutation.mutateAsync({
        email: values.email,
        deviceName: values.deviceName,
        publicKey,
      });
      toast.success("Device added successfully. Valid it to continue.");
      setPubKey(publicKey);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      clearKeyPair();
    } finally {
      form.reset();
    }
  }

  useEffect(() => {
    checkKeyPair();
  }, []);

  return (
    <>
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            Add a new device to your account
          </CardTitle>
          <CardDescription>
            Enter your email and name below to register your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your public display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deviceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Device name</FormLabel>
                    <FormControl>
                      <Input placeholder="Macbook 2024" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is for your convenience to identify your device.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      {pubKey && (
        <Card className="mx-auto max-w-xl overflow-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Key pair generated</CardTitle>
            <CardDescription>
              Your private key is stored securely. Do not share it with anyone.
              When you validate this device, check the public key to ensure it
              matches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CardDescription className="overflow-hidden text-ellipsis">
              Your public key is: <code>{pubKey}</code>
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </>
  );
}
