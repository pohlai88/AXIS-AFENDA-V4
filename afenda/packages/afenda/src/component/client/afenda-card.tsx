"use client";

import { AfendaButton, AfendaCard, AfendaCardHeader, AfendaCardText, AfendaCardTitle } from "@afenda/shadcn";

export function AfendaCardExample() {
  return (
    <AfendaCard aria-label="Afenda Card">
      <AfendaCardHeader>
        <AfendaCardTitle>Afenda</AfendaCardTitle>
        <AfendaCardText>Prefix-first domain component.</AfendaCardText>
      </AfendaCardHeader>
      <AfendaButton type="button">Open</AfendaButton>
    </AfendaCard>
  );
}
