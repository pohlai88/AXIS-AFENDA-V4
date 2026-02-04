"use client";

import type { ComponentPropsWithoutRef } from "react";
import { AfendaButton as ShadcnButton } from "@afenda/shadcn";

export type AfendaButtonProps = ComponentPropsWithoutRef<typeof ShadcnButton>;

export function AfendaButton(props: AfendaButtonProps) {
  return <ShadcnButton {...props} />;
}
