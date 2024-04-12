import Link from "next/link";
import { getCsrfToken } from "next-auth/react";
import type { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/utils/api";
import { useEffect, useState } from "react";
import { decrypt, exportAsymmetricalKey, loadKeyPair } from "@/utils/crypto";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
interface Props {
  csrfToken: string | undefined;
}

export default function Login({ csrfToken }: Props) {
  const [challengId, setChallengeId] = useState<string>("");
  const [decriptedChallenge, setDecriptedChallenge] = useState<string>("");

  const challengeMutation = api.auth.challenge.useMutation();
  const router = useRouter();
  async function validChallenge() {
    const keyPair = await loadKeyPair();
    if (!keyPair) {
      toast.error("You need to register first.");
      router.push("/auth/register");
      return;
    }
    const publicKey = await exportAsymmetricalKey(keyPair.publicKey);
    try {
      const challenge = await challengeMutation.mutateAsync(
        { publicKey },
        {
          onError: (error) => {
            toast.error(error.message);
          },
        },
      );
      const buffer = Buffer.from(challenge.challenge, "hex");
      const decryptedChallenge = await decrypt(
        keyPair.privateKey,
        buffer.buffer,
      );
      setChallengeId(challenge.challengerId);
      setDecriptedChallenge(decryptedChallenge);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    validChallenge();
  }, []);

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form method="post" action="/api/auth/callback/credentials">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
            <input name="challengeId" type="hidden" defaultValue={challengId} />
            <input
              name="challenge"
              type="hidden"
              defaultValue={decriptedChallenge}
            />
            <Button type="submit" className="w-full">
              Login
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="underline">
              Sign up
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  };
};
