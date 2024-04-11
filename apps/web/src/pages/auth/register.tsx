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
  exportAsymmetricalKey,
  generateAsymmetricalKeyPair,
  loadKeyPair,
} from "@/utils/crypto";
import { useEffect } from "react";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  deviceName: z.string().min(3, "Device name is too short"),
  name: z.string().min(3, "Name is too short"),
});
export default function Register() {
  const registerMutation = api.auth.createAccount.useMutation();
  const router = useRouter();

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
      name: "",
      deviceName: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const keyPair = await generateAsymmetricalKeyPair();
    const publicKey = await exportAsymmetricalKey(keyPair.publicKey);
    try {
      await registerMutation.mutateAsync({
        email: values.email,
        name: values.name,
        deviceName: values.deviceName,
        publicKey,
      });
      toast.success("Account created successfully");
      router.push("/auth/signin");
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  }

  useEffect(() => {
    checkKeyPair();
  }, []);

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Register</CardTitle>
        <CardDescription>
          Enter your email and name below to register your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
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
  );
}
