"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Root() {
  const router = useRouter();
  useEffect(() => {
    // Session lives in an httpOnly cookie we can't read from JS. Ask the API
    // whether the cookie is still valid and route accordingly.
    api.getMe()
      .then(() => router.replace("/dashboard"))
      .catch(() => router.replace("/login"));
  }, [router]);
  return null;
}
