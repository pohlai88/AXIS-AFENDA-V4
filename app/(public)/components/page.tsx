import type { Metadata } from "next"

import { ComponentExample } from "@/components/component-example"

export const metadata: Metadata = {
  title: "Components",
  description: "UI component development playground",
}

export default function ComponentsPage() {
  return <ComponentExample />
}

